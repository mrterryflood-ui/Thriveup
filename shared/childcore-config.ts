/**
 * Public ChildCORE integration metadata.
 *
 * Keep these destinations in one place so the connector, operator dashboard,
 * and public integration docs cannot drift independently.
 */
export const CHILDCORE_INTEGRATION_CONFIG = Object.freeze({
  baseUrl: "https://useful-viper-536.convex.site/api/v1",
  docsUrl: "https://childcore.app/docs/partner-api",
});

export type ChildCOREIntegrationConfig = typeof CHILDCORE_INTEGRATION_CONFIG;