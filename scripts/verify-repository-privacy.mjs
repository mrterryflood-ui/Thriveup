import { execFileSync } from "node:child_process";
import { readFileSync, lstatSync, existsSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import path from "node:path";
import { isPrivateRepositoryPath, privacyPolicy } from "./repository-privacy-policy.mjs";

export function verifyRepositoryPrivacy(root = process.cwd()) {
  const safeId = p => createHash("sha256").update(p).digest("hex").slice(0, 12);
  const physicalPaths = dir => readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    if (["node_modules", "dist", ".git", ".local", ".cache", ".config", ".upm", ".pythonlibs"].includes(entry.name)) return [];
    const absolute = path.join(dir, entry.name);
    return entry.isDirectory() ? physicalPaths(absolute) : [path.relative(root, absolute).replaceAll("\\", "/")];
  });
  let tracked;
  let inGit = false;
  try { inGit = execFileSync("git", ["rev-parse", "--is-inside-work-tree"], { cwd: root, stdio: ["ignore", "pipe", "ignore"] }).toString().trim() === "true"; }
  catch { /* Source-only deployment contexts are verified from their actual file inventory below. */ }
  if (inGit) {
    // Errors reading an existing index are fatal, never interpreted as an empty repository.
    tracked = execFileSync("git", ["ls-files", "-z"], { cwd: root, maxBuffer: 16 * 1024 * 1024 }).toString().split("\0").filter(Boolean);
  } else tracked = physicalPaths(root);
  const failures = tracked.filter(isPrivateRepositoryPath).map(p => `Private file in source/index (id ${safeId(p)})`);
  const visit = dir => {
    if (!existsSync(dir)) return;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const absolute = path.join(dir, entry.name);
      const p = path.relative(root, absolute).replaceAll("\\", "/");
      if (entry.isDirectory()) visit(absolute);
      else {
        if (entry.isSymbolicLink()) failures.push(`Public symlink is forbidden (id ${safeId(p)})`);
        if (isPrivateRepositoryPath(p)) failures.push(`Private document in public static root (id ${safeId(p)})`);
      }
    }
  };
  visit(path.join(root, "public"));
  visit(path.join(root, "client/public"));
  for (const p of tracked.filter(p => /^(?:client|artifacts)\/.*\.(?:tsx?|jsx?|css)$/.test(p))) {
    if (!existsSync(path.join(root, p))) continue;
    if (lstatSync(path.join(root, p)).isSymbolicLink()) { failures.push(`Frontend symlink must be reviewed (id ${safeId(p)})`); continue; }
    const text = readFileSync(path.join(root, p), "utf8");
    for (const match of text.matchAll(/(?:from\s*|import\s*|url\(\s*)["']([^"']+)["']/g)) {
      const specifier = match[1].split("?")[0];
      const resolved = path.relative(root, path.resolve(root, path.dirname(p), specifier)).replaceAll("\\", "/");
      if (specifier.startsWith(".") && privacyPolicy.privatePrefixes.some(prefix => resolved.startsWith(prefix)))
        failures.push(`Frontend imports private working material (id ${safeId(p)})`);
      if (specifier.startsWith("@assets/") && /\.(?:md|txt|docx?|pdf|xlsx?|pptx?|html)$/i.test(specifier))
        failures.push(`Frontend bundles a working document (id ${safeId(p)})`);
    }
  }
  if (failures.length) throw new Error(`Repository privacy gate failed (${failures.length}):\n${failures.join("\n")}`);
  return tracked.length;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { console.log(`PASS repository privacy: ${verifyRepositoryPrivacy()} tracked paths checked; private folders and frontend document imports excluded.`); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
