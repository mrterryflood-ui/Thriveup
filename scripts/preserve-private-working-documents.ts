import { readFileSync, existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { privateDocumentObject, privateDownloads } from "../server/private-working-documents";

// Run before untracking. No contents, storage credentials or private filenames are logged.
async function main() {
  const collect = (dir: string): string[] => existsSync(dir) ? readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(dir, entry.name);
    if (entry.isSymbolicLink()) throw new Error("Private document symlink is not permitted");
    return entry.isDirectory() ? collect(file) : [file];
  }) : [];
  const tracked = [...collect("docs/grants"), ...collect("grant-materials")];
  const policy = JSON.parse(readFileSync("security/repository-privacy-policy.json", "utf8")) as { privateRootFiles: string[] };
  const additionalFrameworks = [
    "attached_assets/Agency_Fund_EOI_Collaborative_Advocate.md",
    "attached_assets/NSF_SBIR_Phase1_Concept.md",
    "attached_assets/NIH_SBIR_Phase1_Concept.md",
  ];
  const files = [...new Set([...tracked, ...policy.privateRootFiles, ...Object.values(privateDownloads), ...additionalFrameworks])].filter(existsSync);
  let count = 0;
  for (const relative of files) {
    const bytes = readFileSync(relative);
    const sha256 = createHash("sha256").update(bytes).digest("hex");
    const file = privateDocumentObject(relative);
    await file.save(bytes, {
      resumable: false,
      metadata: {
        cacheControl: "private, no-store",
        metadata: {
          sha256,
          "custom:aclPolicy": JSON.stringify({ owner: "platform-private-documents", visibility: "private" }),
        },
      },
    });
    const [restored] = await file.download();
    if (createHash("sha256").update(restored).digest("hex") !== sha256)
      throw new Error("Private document backup integrity failure");
    count++;
  }
  console.log(`Verified private object-storage backups: ${count}; every uploaded document matches its original SHA-256.`);
}
main().catch(() => {
  console.error("Private document preservation failed. Original working files are unchanged; stop cleanup and investigate storage access.");
  process.exitCode = 1;
});
