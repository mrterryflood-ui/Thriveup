import test from "node:test";
import assert from "node:assert/strict";
import { privateSourceFileFromUrl, readPrivateWorkingDocument, privateDocumentObject, sedgwickDocuments } from "../private-working-documents";

test("legacy staff paths reject traversal and arbitrary uploads", () => {
  for (const p of [
    "/attached_assets/private-resume.docx",
    "/docs/grants/../../.env",
    "/docs/grants/%2e%2e/%2e%2e/.env",
    "/docs/grants/../secret.md",
    "/docs/grants/%5csecret.md",
    "/docs/grants/%00secret.md",
    "/docs/grants/%E0",
    "/other/file.md",
  ]) assert.equal(privateSourceFileFromUrl(p), null);
});

test("legacy staff grant links resolve only within their private namespace", () => {
  assert.equal(privateSourceFileFromUrl("/docs/grants/RARE-IMPACT-FUND-LOI.md"), "docs/grants/RARE-IMPACT-FUND-LOI.md");
  assert.equal(privateSourceFileFromUrl("/docs/grants/RARE-IMPACT-FUND-LOI.md?download=1"), "docs/grants/RARE-IMPACT-FUND-LOI.md");
});

test("preserved Sedgwick documents are retrieved from private storage intact", async () => {
  for (const file of Object.values(sedgwickDocuments)) {
    const bytes = await readPrivateWorkingDocument(file);
    assert.ok(bytes.length > 0);
  }
});

test("anonymous provider requests cannot read a preserved private document", async () => {
  const file = privateDocumentObject(sedgwickDocuments.proposalV3Md);
  const url = `https://storage.googleapis.com/${encodeURIComponent(file.bucket.name)}/${file.name.split("/").map(encodeURIComponent).join("/")}`;
  const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
  await response.body?.cancel();
  assert.ok([401, 403, 404].includes(response.status), `Anonymous storage access must be denied; HTTP ${response.status}`);
});
