import test from "node:test";
import assert from "node:assert/strict";
import { isPrivateRepositoryPath } from "./repository-privacy-policy.mjs";
import { verifyRepositoryPrivacy } from "./verify-repository-privacy.mjs";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

for (const p of [
  "Dr_Terry_Flood_TNTP_Application_Answers.md",
  "TCAF_WeAllBenefit_LOI_Draft.md",
  "docs/grants/arbitrary-name.md",
  "attached_assets/new-upload.png",
  "attached_assets/proposal.docx",
  "grant-materials/report.pdf",
  ".agents/outputs/private-page.png",
  "New_Application.md",
  "docs/Someone_Resume.pdf",
  "public/unreviewed-budget.xlsx",
  "client/public/new-report.pdf",
  "cookies.txt",
  ".env.production",
  "docs/private.pem",
]) test(`blocks private path ${p}`, () => assert.equal(isPrivateRepositoryPath(p), true));

for (const p of [
  "replit.md", ".env.example",
  "client/src/pages/resume-builder.tsx",
  "client/src/assets/generated_images/outcome-get-help.jpg",
  "shared/hutto-ready.ts",
  "public/platform-overview.pdf",
  "client/public/capability-statement.html",
]) test(`preserves application path ${p}`, () => assert.equal(isPrivateRepositoryPath(p), false));

test("source-only publish contexts work without Git but fail closed on private files", () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "privacy-context-"));
  try {
    mkdirSync(path.join(root, "client/src"), { recursive: true });
    writeFileSync(path.join(root, "client/src/app.ts"), "export const app = true;");
    assert.equal(verifyRepositoryPrivacy(root), 1);
    mkdirSync(path.join(root, "attached_assets"));
    writeFileSync(path.join(root, "attached_assets/private-personal-document.txt"), "test fixture only");
    assert.throws(() => verifyRepositoryPrivacy(root), error =>
      error.message.includes("privacy gate failed") && !error.message.includes("private-personal-document"));
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("preview server preserves the configured filesystem privacy exclusions", () => {
  const source = readFileSync(new URL("../server/vite.ts", import.meta.url), "utf8");
  assert.match(source, /const serverOptions = \{\s*\.\.\.viteConfig\.server,/);
  assert.doesNotMatch(source, /process\.exit\s*\(/, "A denied preview request must not terminate the application");
});
