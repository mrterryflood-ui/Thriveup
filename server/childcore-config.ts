import { eq } from "drizzle-orm";
import {
  CHILDCORE_DEFAULT_CONFIG,
  childcoreIntegrationConfigSchema,
  normalizeChildCOREIntegrationConfig,
  type ChildCOREIntegrationConfig,
} from "@shared/childcore-config";
import { childcoreIntegrationSettings, childcoreIntegrationSettingsAudit } from "@shared/schema";
import { db } from "./storage";

export const CHILDCORE_SETTINGS_ID = "default";

function trustedApiOrigins(): Set<string> {
  const configured = (process.env.CHILDCORE_TRUSTED_API_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  configured.push(new URL(CHILDCORE_DEFAULT_CONFIG.baseUrl).origin);
  return new Set(configured);
}

export function isTrustedChildCOREApiBaseUrl(baseUrl: string): boolean {
  try {
    return trustedApiOrigins().has(new URL(baseUrl).origin);
  } catch {
    return false;
  }
}

function defaults(): ChildCOREIntegrationConfig {
  return {
    baseUrl: CHILDCORE_DEFAULT_CONFIG.baseUrl,
    docsUrl: CHILDCORE_DEFAULT_CONFIG.docsUrl,
  };
}

function parsePersistedConfig(baseUrl: string, docsUrl: string): ChildCOREIntegrationConfig {
  const parsed = childcoreIntegrationConfigSchema.safeParse({ baseUrl, docsUrl });
  if (!parsed.success) {
    throw new Error(`Stored ChildCORE integration destinations are invalid: ${parsed.error.message}`);
  }
  const config = normalizeChildCOREIntegrationConfig(parsed.data);
  if (!isTrustedChildCOREApiBaseUrl(config.baseUrl)) {
    throw new Error("Stored ChildCORE API destination is not in the trusted origin allowlist");
  }
  return config;
}

/**
 * Read the singleton settings row. The first read materializes the validated
 * defaults, which keeps fresh environments deterministic without a release
 * step. Database failures are surfaced rather than silently switching an
 * already-configured integration back to stale defaults.
 */
export async function getChildCOREIntegrationConfig(): Promise<ChildCOREIntegrationConfig> {
  const [row] = await db
    .select({
      baseUrl: childcoreIntegrationSettings.baseUrl,
      docsUrl: childcoreIntegrationSettings.docsUrl,
    })
    .from(childcoreIntegrationSettings)
    .where(eq(childcoreIntegrationSettings.id, CHILDCORE_SETTINGS_ID))
    .limit(1);

  if (row) return parsePersistedConfig(row.baseUrl, row.docsUrl);

  const config = defaults();
  await db
    .insert(childcoreIntegrationSettings)
    .values({
      id: CHILDCORE_SETTINGS_ID,
      baseUrl: config.baseUrl,
      docsUrl: config.docsUrl,
    })
    .onConflictDoNothing();
  const [materialized] = await db
    .select({
      baseUrl: childcoreIntegrationSettings.baseUrl,
      docsUrl: childcoreIntegrationSettings.docsUrl,
    })
    .from(childcoreIntegrationSettings)
    .where(eq(childcoreIntegrationSettings.id, CHILDCORE_SETTINGS_ID))
    .limit(1);
  return materialized
    ? parsePersistedConfig(materialized.baseUrl, materialized.docsUrl)
    : config;
}

export async function updateChildCOREIntegrationConfig(
  nextConfig: ChildCOREIntegrationConfig,
  actorUserId: string,
): Promise<ChildCOREIntegrationConfig> {
  const config = normalizeChildCOREIntegrationConfig(
    childcoreIntegrationConfigSchema.parse(nextConfig),
  );
  if (!isTrustedChildCOREApiBaseUrl(config.baseUrl)) {
    throw new Error("ChildCORE API destination is not in the trusted origin allowlist");
  }

  // Materialize the singleton before taking the row lock. This makes the
  // first concurrent update serialize on the same existing row as later ones.
  await db
    .insert(childcoreIntegrationSettings)
    .values({
      id: CHILDCORE_SETTINGS_ID,
      baseUrl: CHILDCORE_DEFAULT_CONFIG.baseUrl,
      docsUrl: CHILDCORE_DEFAULT_CONFIG.docsUrl,
    })
    .onConflictDoNothing();

  return db.transaction(async (tx) => {
    const [existing] = await tx
      .select()
      .from(childcoreIntegrationSettings)
      .where(eq(childcoreIntegrationSettings.id, CHILDCORE_SETTINGS_ID))
      .limit(1)
      .for("update");

    if (!existing) {
      throw new Error("ChildCORE settings singleton could not be initialized");
    }

    await tx
      .insert(childcoreIntegrationSettings)
      .values({
        id: CHILDCORE_SETTINGS_ID,
        baseUrl: config.baseUrl,
        docsUrl: config.docsUrl,
        updatedByUserId: actorUserId,
      })
      .onConflictDoUpdate({
        target: childcoreIntegrationSettings.id,
        set: {
          baseUrl: config.baseUrl,
          docsUrl: config.docsUrl,
          updatedByUserId: actorUserId,
          updatedAt: new Date(),
        },
      });

    const changed = existing.baseUrl !== config.baseUrl
      || existing.docsUrl !== config.docsUrl;
    if (changed) {
      await tx.insert(childcoreIntegrationSettingsAudit).values({
        settingId: CHILDCORE_SETTINGS_ID,
        actorUserId,
        previousBaseUrl: existing?.baseUrl ?? null,
        previousDocsUrl: existing?.docsUrl ?? null,
        nextBaseUrl: config.baseUrl,
        nextDocsUrl: config.docsUrl,
      });
    }

    return config;
  });
}