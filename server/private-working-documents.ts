import { createHash } from "node:crypto";
import path from "node:path";
import { ObjectStorageService, objectStorageClient } from "./replit_integrations/object_storage/objectStorage";

export const sedgwickDocuments = {
  strategicMd: "docs/grants/sedgwick-rfp-26-0028/strategic-analysis.md",
  proposalV3Md: "docs/grants/sedgwick-rfp-26-0028/vitality-proposal-v3.md",
  proposalMd: "docs/grants/sedgwick-rfp-26-0028/vitality-proposal-v2.md",
  proposalV1Md: "docs/grants/sedgwick-rfp-26-0028/vitality-proposal.md",
  checklistMd: "docs/grants/sedgwick-rfp-26-0028/pre-submission-checklist.md",
  crosswalkMd: "docs/grants/sedgwick-rfp-26-0028/compliance-crosswalk.md",
  baseRfpMd: "docs/grants/sedgwick-rfp-26-0028/base-rfp.md",
  addendum2Md: "docs/grants/sedgwick-rfp-26-0028/addendum-2.md",
} as const;

export const privateDownloads: Record<string, string> = {
  "sedgwick-strategy": "attached_assets/RFP-26-0028-Addendum2-Strategic-Analysis_1779560701300.docx",
  "sedgwick-proposal": "attached_assets/RFP-26-0028-Vitality-Proposal_1779560701306.docx",
  "wab-loi": "attached_assets/WAB2-LOI-RequestSummary-v7-FINAL.md",
  "operating-budget": "attached_assets/TCAF-Organizational-Budget-FY2025-2026.doc",
  "professional-development-rfp": "attached_assets/PROFESSIONAL_DEVELOPMENT,_TRAINING,_CONSULTANT,_AND_BROKERAGE_1776128483319.docx",
  "corridor-slides": "attached_assets/decks/Corridor-Intelligence-Brief-v1.pptx",
  "corridor-brief": "attached_assets/decks/Corridor-Intelligence-Brief-v1.docx",
  "stdavids-final-loi": "docs/grants/St-Davids-WAB2-LOI-FINAL-DRAFT.md",
  "stdavids-strategy": "docs/grants/St-Davids-WAB2-LOI-Package.md",
  "stdavids-alignment": "docs/grants/St-Davids-Strategic-Alignment.md",
  "stdavids-community-loi": "docs/grants/St-Davids-Community-Led-Change-LOI-Package.md",
};

// Preserve existing staff-tool links without exposing the uploads directory.
export function privateSourceFileFromUrl(url: string): string | null {
  let relative: string;
  try { relative = decodeURIComponent(url.split("?")[0]).replace(/^\//, ""); }
  catch { return null; }
  if (relative.includes("\\") || /[\x00-\x1f]/.test(relative) ||
      path.posix.normalize(relative) !== relative || relative.split("/").some(segment => segment === "..")) return null;
  if (relative.startsWith("docs/grants/") && relative.length > "docs/grants/".length) return relative;
  return Object.values(privateDownloads).includes(relative) ? relative : null;
}

// Private storage keys contain no personal filenames. Never produce signed/public URLs.
export function privateDocumentObject(relativePath: string) {
  const root = new ObjectStorageService().getPrivateObjectDir().replace(/^\/+|\/+$/g, "");
  const [bucket, ...prefix] = root.split("/");
  if (!bucket || prefix.length === 0) throw new Error("Private document storage is not configured");
  const id = createHash("sha256").update(relativePath).digest("hex");
  return objectStorageClient.bucket(bucket).file(`${prefix.join("/")}/working-documents/${id}`);
}

export async function readPrivateWorkingDocument(relativePath: string): Promise<Buffer> {
  const file = privateDocumentObject(relativePath);
  const [metadata] = await file.getMetadata();
  const policy = JSON.parse(metadata.metadata?.["custom:aclPolicy"] as string || "{}");
  if (policy.visibility !== "private" || policy.owner !== "platform-private-documents")
    throw new Error("Private document access policy is missing");
  const [bytes] = await file.download();
  const digest = createHash("sha256").update(bytes).digest("hex");
  if (metadata.metadata?.sha256 !== digest) throw new Error("Private document integrity check failed");
  return bytes;
}
