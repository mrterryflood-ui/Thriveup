import type { Express, Request, Response } from "express";
import { db } from "./storage";
import { orgDocuments, insertOrgDocumentSchema } from "@shared/schema";
import { and, desc, eq } from "drizzle-orm";
import { requireAuth, requireOrg, getCallerOrg } from "./tenant-middleware";
import { z } from "zod";

// Only allow paths served by GET /objects/* — rejects raw signed URLs (which expire)
// and external URLs (which would silently break later or be used to point at attacker-controlled storage).
const objectPathSchema = z.string().min(1).max(1000).refine(
  v => v.startsWith("/objects/") && !v.includes(".."),
  { message: "fileUrl must be an /objects/... path returned by /api/uploads/request-url" },
);

const bulkSchema = z.object({
  affiliateName: z.string().min(1).max(200),
  kind: z.string().min(1).max(40),
  notes: z.string().max(2000).optional(),
  files: z.array(z.object({
    title: z.string().min(1).max(500),
    fileUrl: objectPathSchema,
    fileName: z.string().max(500).optional(),
    fileSize: z.number().int().nonnegative().optional(),
    contentType: z.string().max(100).optional(),
  })).min(1).max(50),
});

export function registerOrgDocumentsRoutes(app: Express) {
  // List the caller org's documents, optionally filtered by affiliate or kind.
  app.get("/api/me/org-documents", requireAuth, requireOrg, async (req: Request, res: Response) => {
    const org = getCallerOrg(req)!;
    const affiliateName = typeof req.query.affiliateName === "string" ? req.query.affiliateName : undefined;
    const kind = typeof req.query.kind === "string" ? req.query.kind : undefined;
    const conds = [eq(orgDocuments.orgId, org.id)];
    if (affiliateName) conds.push(eq(orgDocuments.affiliateName, affiliateName));
    if (kind) conds.push(eq(orgDocuments.kind, kind));
    const rows = await db.select().from(orgDocuments).where(and(...conds)).orderBy(desc(orgDocuments.uploadedAt));
    res.json({ documents: rows });
  });

  // Bulk register uploaded files (object paths come from /api/uploads/request-url).
  app.post("/api/me/org-documents/bulk", requireAuth, requireOrg, async (req: Request, res: Response) => {
    const org = getCallerOrg(req)!;
    try {
      const parsed = bulkSchema.parse(req.body);
      const rows = parsed.files.map(f => ({
        orgId: org.id,
        affiliateName: parsed.affiliateName,
        kind: parsed.kind,
        title: f.title,
        fileUrl: f.fileUrl,
        fileName: f.fileName ?? null,
        fileSize: f.fileSize ?? null,
        contentType: f.contentType ?? null,
        notes: parsed.notes ?? null,
      }));
      const inserted = await db.insert(orgDocuments).values(rows).returning();
      res.status(201).json({ documents: inserted });
    } catch (err) {
      console.error("[org-documents] bulk insert failed:", err);
      res.status(400).json({ error: err instanceof Error ? err.message : "Invalid payload" });
    }
  });

  // Single insert (parity with the bulk shape, used for one-off uploads).
  app.post("/api/me/org-documents", requireAuth, requireOrg, async (req: Request, res: Response) => {
    const org = getCallerOrg(req)!;
    try {
      const parsed = insertOrgDocumentSchema.parse({ ...req.body, orgId: org.id });
      // Same object-path guard as the bulk endpoint.
      objectPathSchema.parse(parsed.fileUrl);
      const [row] = await db.insert(orgDocuments).values(parsed).returning();
      res.status(201).json({ document: row });
    } catch (err) {
      console.error("[org-documents] insert failed:", err);
      res.status(400).json({ error: err instanceof Error ? err.message : "Invalid payload" });
    }
  });

  app.delete("/api/me/org-documents/:id", requireAuth, requireOrg, async (req: Request, res: Response) => {
    const org = getCallerOrg(req)!;
    const id = String(req.params.id);
    await db.delete(orgDocuments).where(and(eq(orgDocuments.id, id), eq(orgDocuments.orgId, org.id)));
    res.json({ ok: true });
  });
}
