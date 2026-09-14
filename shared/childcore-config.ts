/**
 * Public ChildCORE integration metadata.
 *
 * These values are the first-boot defaults. Runtime consumers on the server
 * resolve the persisted settings through server/childcore-config.ts; clients
 * read the public destination route instead of importing these defaults.
 */
import { z } from "zod";

export const CHILDCORE_DEFAULT_CONFIG = Object.freeze({
  baseUrl: "https://useful-viper-536.convex.site/api/v1",
  docsUrl: "https://childcore.app/docs/partner-api",
});

// Kept as a compatibility alias for scripts and older imports. New runtime
// consumers must use the persisted server accessor.
export const CHILDCORE_INTEGRATION_CONFIG = CHILDCORE_DEFAULT_CONFIG;

const httpsUrlSchema = z.string().trim().url()
  .refine(
    (value) => new URL(value).protocol === "https:",
    { message: "URL must use HTTPS" },
  )
  .refine(
    (value) => {
      const parsed = new URL(value);
      return !parsed.username && !parsed.password && !parsed.search && !parsed.hash;
    },
    { message: "URL must not contain credentials, query parameters, or fragments" },
  );

export const childcoreIntegrationConfigSchema = z.object({
  baseUrl: httpsUrlSchema,
  docsUrl: httpsUrlSchema,
});

export type ChildCOREIntegrationConfig = z.infer<typeof childcoreIntegrationConfigSchema>;

export function normalizeChildCOREIntegrationConfig(
  config: ChildCOREIntegrationConfig,
): ChildCOREIntegrationConfig {
  return {
    baseUrl: config.baseUrl.replace(/\/+$/, ""),
    docsUrl: config.docsUrl,
  };
}