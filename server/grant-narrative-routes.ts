import type { Express, Request, Response } from "express";
import { db } from "./storage";
import { rfpDocuments, rfpRubrics, grantOpportunities, insertRfpDocumentSchema } from "@shared/schema";
import { and, desc, eq } from "drizzle-orm";
import { requireAuth, requireOrg, getCallerOrg, rateLimitAi } from "./tenant-middleware";
import { extractRubric, getOrExtractRubric, loadRfpDocumentStack, generateDraftFromRubric, scoreDraftAgainstRubric, type GeneratedDraft } from "./rfp-rubric";
import { getAgencyIntel } from "./agency-intelligence";

export function registerGrantNarrativeRoutes(app: Express) {
  // Upload an RFP doc (base / amendment / qa). Caller provides parsed text (PDF parsing client-side or via separate ingest).
  app.post("/api/me/rfp-documents", requireAuth, requireOrg, async (req: Request, res: Response) => {
    const org = getCallerOrg(req)!;
    try {
      const parsed = insertRfpDocumentSchema.parse({ ...req.body, orgId: org.id });
      const [doc] = await db.insert(rfpDocuments).values(parsed).returning();
      res.status(201).json({ document: doc });
    } catch (err) {
      console.error("[rfp-docs] upload failed:", err);
      res.status(400).json({ error: err instanceof Error ? err.message : "Invalid payload" });
    }
  });

  // List my RFP docs (optionally for a single grant).
  app.get("/api/me/rfp-documents", requireAuth, requireOrg, async (req: Request, res: Response) => {
    const org = getCallerOrg(req)!;
    const grantId = typeof req.query.grantId === "string" ? req.query.grantId : null;
    const conds = [eq(rfpDocuments.orgId, org.id)];
    if (grantId) conds.push(eq(rfpDocuments.grantId, grantId));
    const docs = await db.select().from(rfpDocuments).where(and(...conds)).orderBy(desc(rfpDocuments.uploadedAt));
    res.json({ documents: docs });
  });

  // Delete an RFP doc.
  app.delete("/api/me/rfp-documents/:id", requireAuth, requireOrg, async (req: Request, res: Response) => {
    const org = getCallerOrg(req)!;
    const id = String(req.params.id);
    await db.delete(rfpDocuments).where(and(eq(rfpDocuments.id, id), eq(rfpDocuments.orgId, org.id)));
    res.json({ ok: true });
  });

  // Extract / fetch rubric for a doc.
  app.get("/api/me/rfp-documents/:id/rubric", requireAuth, requireOrg, async (req: Request, res: Response) => {
    const org = getCallerOrg(req)!;
    const id = String(req.params.id);
    try {
      const [doc] = await db.select().from(rfpDocuments).where(and(eq(rfpDocuments.id, id), eq(rfpDocuments.orgId, org.id)));
      if (!doc) return res.status(404).json({ error: "Document not found" });
      const rubric = await getOrExtractRubric(doc.id, doc.parsedText);
      res.json({ rubric });
    } catch (err) {
      console.error("[rfp-docs] rubric extraction failed:", err);
      res.status(500).json({ error: err instanceof Error ? err.message : "Extraction failed" });
    }
  });

  // Re-extract (force refresh).
  app.post("/api/me/rfp-documents/:id/rubric/refresh", requireAuth, requireOrg, rateLimitAi(), async (req: Request, res: Response) => {
    const org = getCallerOrg(req)!;
    const id = String(req.params.id);
    try {
      const [doc] = await db.select().from(rfpDocuments).where(and(eq(rfpDocuments.id, id), eq(rfpDocuments.orgId, org.id)));
      if (!doc) return res.status(404).json({ error: "Document not found" });
      const rubric = await extractRubric(doc.parsedText);
      await db.insert(rfpRubrics).values({ documentId: doc.id, rubric }).onConflictDoUpdate({
        target: rfpRubrics.documentId, set: { rubric, extractedAt: new Date() },
      });
      res.json({ rubric });
    } catch (err) {
      console.error("[rfp-docs] rubric refresh failed:", err);
      res.status(500).json({ error: err instanceof Error ? err.message : "Refresh failed" });
    }
  });

  // Agency intelligence (USASpending + AI summary).
  app.get("/api/agency-intel", requireAuth, async (req: Request, res: Response) => {
    const agency = typeof req.query.agency === "string" ? req.query.agency : "";
    const cfda = typeof req.query.cfda === "string" ? req.query.cfda : null;
    const opp = typeof req.query.opportunityNumber === "string" ? req.query.opportunityNumber : null;
    if (!agency) return res.status(400).json({ error: "agency parameter required" });
    try {
      const intel = await getAgencyIntel(agency, cfda, opp);
      res.json({ intel });
    } catch (err) {
      console.error("[agency-intel] fetch failed:", err);
      res.status(500).json({ error: err instanceof Error ? err.message : "Intel fetch failed" });
    }
  });

  // Generate a draft from rubric + org profile + (optional) grant + agency intel.
  // Body: { documentId, grantId? }
  app.post("/api/me/grant-narratives/generate", requireAuth, requireOrg, rateLimitAi({ perMinute: 3, perHour: 20 }), async (req: Request, res: Response) => {
    const org = getCallerOrg(req)!;
    const documentId = typeof req.body?.documentId === "string" ? req.body.documentId : null;
    const grantId = typeof req.body?.grantId === "string" ? req.body.grantId : null;
    if (!documentId) return res.status(400).json({ error: "documentId required" });
    try {
      const [doc] = await db.select().from(rfpDocuments).where(and(eq(rfpDocuments.id, documentId), eq(rfpDocuments.orgId, org.id)));
      if (!doc) return res.status(404).json({ error: "RFP document not found" });

      const rubric = await getOrExtractRubric(doc.id, doc.parsedText);
      const docStack = await loadRfpDocumentStack(org.id, grantId ?? doc.grantId);
      const [grant] = grantId ? await db.select().from(grantOpportunities).where(eq(grantOpportunities.id, grantId)) : [null];

      let agencyIntel = null;
      if (grant?.agency) {
        try { agencyIntel = await getAgencyIntel(grant.agency, null, null); }
        catch (e) { console.error("[grant-narrative] agency intel failed (non-fatal):", e); }
      }

      const draft = await generateDraftFromRubric({
        rubric,
        org: org as any,
        grant: grant ?? null,
        agencyIntel,
        docStack,
      });

      res.json({ draft, rubric, agencyIntel });
    } catch (err) {
      console.error("[grant-narrative] generation failed:", err);
      res.status(500).json({ error: err instanceof Error ? err.message : "Generation failed" });
    }
  });

  // Score a draft against a rubric (compliance check).
  app.post("/api/me/grant-narratives/score", requireAuth, requireOrg, rateLimitAi({ perMinute: 4, perHour: 30 }), async (req: Request, res: Response) => {
    const documentId = typeof req.body?.documentId === "string" ? req.body.documentId : null;
    const draft = req.body?.draft as GeneratedDraft | undefined;
    if (!documentId || !draft) return res.status(400).json({ error: "documentId and draft required" });
    const org = getCallerOrg(req)!;
    try {
      const [doc] = await db.select().from(rfpDocuments).where(and(eq(rfpDocuments.id, documentId), eq(rfpDocuments.orgId, org.id)));
      if (!doc) return res.status(404).json({ error: "RFP document not found" });
      const rubric = await getOrExtractRubric(doc.id, doc.parsedText);
      const coverage = await scoreDraftAgainstRubric(draft, rubric);
      res.json({ coverage });
    } catch (err) {
      console.error("[grant-narrative] scoring failed:", err);
      res.status(500).json({ error: err instanceof Error ? err.message : "Scoring failed" });
    }
  });
}
