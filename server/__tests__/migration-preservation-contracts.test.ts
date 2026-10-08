import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = new URL("../../", import.meta.url);

const manifestPath = fileURLToPath(new URL("docs/platform-migration/migration-manifest.json", root));
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));

function read(relativePath: string): string {
  return readFileSync(fileURLToPath(new URL(relativePath, root)), "utf8");
}

function isRetired(depId: string): boolean {
  const dep = (manifest.dependencies as any[]).find((entry) => entry.id === depId);
  const r = dep?.formalRetirement;
  return Boolean(
    r
    && r.decision === "retire"
    && r.approvedBy
    && r.approvedReference
    && r.effectiveDate,
  );
}

test("authentication behavior contract remains staged (not unconditionally disabled)", () => {
  if (isRetired("replit-auth-oidc")) return;
  const auth = read("server/replit_integrations/auth/replitAuth.ts");
  assert.match(auth, /if \(!process\.env\.REPL_ID\?\.trim\(\)\)/);
  assert.match(auth, /app\.get\("\/api\/login", signInUnavailable\)/);
  assert.match(auth, /passport\.authenticate\(`replitauth:\$\{req\.hostname\}`/);
});

test("protected-route availability contract remains intact", () => {
  const routes = read("server/routes.ts");
  assert.match(routes, /app\.get\("\/api\/progress", requireAuth, async \(req, res\)/);
});

test("document upload route remains available and non-placeholder", () => {
  if (isRetired("replit-object-storage-uploads")) return;
  const uploads = read("server/replit_integrations/object_storage/routes.ts");
  assert.match(uploads, /app\.post\("\/api\/uploads\/request-url", requireAuthForUpload, async \(req, res\)/);
  assert.match(uploads, /getObjectEntityUploadURL\(/);
  assert.doesNotMatch(uploads, /temporarily unavailable while sign-in is being configured/i);
  assert.doesNotMatch(uploads, /Uploads require configured sign-in/i);
});

test("evidence synthesis route/module contract remains available", () => {
  if (isRetired("replit-openai-evidence-synthesis")) return;
  const aiProvider = read("server/ai-provider.ts");
  assert.match(aiProvider, /export async function synthesizeRetrievedEvidence/);
  assert.match(aiProvider, /AI_INTEGRATIONS_OPENAI_API_KEY/);
  assert.match(aiProvider, /AI_INTEGRATIONS_OPENAI_BASE_URL/);
  assert.match(aiProvider, /provider: "replit-ai-integrations"/);
});

test("voice/chat/image route and module contracts remain present", () => {
  if (!isRetired("replit-voice-module")) {
    const voiceRoutes = read("server/voice-routes.ts");
    assert.match(voiceRoutes, /app\.get\("\/api\/voice\/projects"/);
  }

  if (!isRetired("replit-chat-module")) {
    const chatRoutes = read("server/replit_integrations/chat/routes.ts");
    assert.match(chatRoutes, /app\.post\("\/api\/conversations\/:id\/messages"/);
  }

  if (!isRetired("replit-image-generation-module")) {
    const imageRoutes = read("server/replit_integrations/image/routes.ts");
    assert.match(imageRoutes, /app\.post\("\/api\/generate-image"/);
  }
});

test("scheduled-source hostname contract blocks .invalid regression without retirement", () => {
  const index = read("server/index.ts");
  if (!isRetired("scheduled-gun-violence-source-hostname")) {
    assert.match(index, /gun-violence-registry\.replit\.app/);
    assert.doesNotMatch(index, /gun-violence-registry\.legacy\.invalid/);
  }

  for (const file of [
    "server/index.ts",
    "server/replit_integrations/auth/replitAuth.ts",
    "server/replit_integrations/object_storage/routes.ts",
    "server/foster-youth-intake-routes.ts",
  ]) {
    const content = read(file);
    assert.doesNotMatch(content, /\.invalid\b/, `${file} includes a .invalid hostname without explicit retirement`);
  }
});
