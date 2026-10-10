import { readFileSync } from "node:fs";
export const privacyPolicy = JSON.parse(readFileSync(new URL("../security/repository-privacy-policy.json", import.meta.url), "utf8"));

export function isPrivateRepositoryPath(raw) {
  const p = raw.replaceAll("\\", "/").replace(/^\.\//, "");
  if (privacyPolicy.privatePrefixes.some(prefix => p.startsWith(prefix))) return true;
  if (privacyPolicy.privateRootFiles.includes(p)) return true;
  if (!p.includes("/") && p.endsWith(".md") && !privacyPolicy.approvedRootMarkdown.includes(p)) return true;
  if (/(?:^|\/)(?:cookies\.txt|\.env(?:\..+)?|[^/]+\.(?:pem|key|p12|pfx))$/i.test(p) && p !== ".env.example") return true;
  const basename = p.split("/").at(-1);
  if (/\.(?:md|txt|docx?|pdf|xlsx?|pptx?|html)$/i.test(p) && /(?:resume|(?:^|[-_])cv(?:[-_.]|$)|loi[-_]draft|application[-_]answers)/i.test(basename)) return true;
  if (/^(?:public|client\/public)\//.test(p) && /\.(?:md|docx?|pdf|xlsx?|pptx?|html)$/i.test(p) && !privacyPolicy.approvedPublicDocuments.includes(p)) return true;
  return false;
}
