import { strict as assert } from "node:assert";
import { childcoreIntegrationConfigSchema, CHILDCORE_DEFAULT_CONFIG } from "../shared/childcore-config";
import { isTrustedChildCOREApiBaseUrl } from "../server/childcore-config";

const valid = {
  baseUrl: CHILDCORE_DEFAULT_CONFIG.baseUrl,
  docsUrl: CHILDCORE_DEFAULT_CONFIG.docsUrl,
};

assert.equal(childcoreIntegrationConfigSchema.safeParse(valid).success, true);
for (const baseUrl of [
  "http://trusted.example/api/v1",
  "https://user:password@trusted.example/api/v1",
  "https://trusted.example/api/v1?redirect=https://attacker.example",
  "https://trusted.example/api/v1#fragment",
]) {
  assert.equal(
    childcoreIntegrationConfigSchema.safeParse({ ...valid, baseUrl }).success,
    false,
    `unsafe API base URL should be rejected: ${baseUrl}`,
  );
}

assert.equal(isTrustedChildCOREApiBaseUrl(CHILDCORE_DEFAULT_CONFIG.baseUrl), true);
const originalAllowlist = process.env.CHILDCORE_TRUSTED_API_ORIGINS;
process.env.CHILDCORE_TRUSTED_API_ORIGINS = "https://migration.childcore.example";
assert.equal(isTrustedChildCOREApiBaseUrl("https://migration.childcore.example/api/v1"), true);
assert.equal(isTrustedChildCOREApiBaseUrl("https://attacker.example/api/v1"), false);
if (originalAllowlist === undefined) delete process.env.CHILDCORE_TRUSTED_API_ORIGINS;
else process.env.CHILDCORE_TRUSTED_API_ORIGINS = originalAllowlist;

console.log("PASS ChildCORE destination security validation");