// Proposal Studio v2 — L1 RFP ingestion HTTP routes (added 2026-05-27)
//
//   POST /api/me/rfp-ingestion/text  → ingest already-extracted text
//   POST /api/me/rfp-ingestion/pdf   → upload PDF, run pdftotext, then ingest
//   GET  /api/me/rfp-ingestion       → list this org's ingestion jobs
//   GET  /api/me/rfp-ingestion/:id   → fetch one job
//
// Fork-ready: depends only on rfp-ingestion + tenant-middleware + schema.

import type { Express, Request, Response } from "express";
import { db } from "./storage";
import { rfpIngestionJobs } from "@shared/schema";
import { and, desc, eq } from "drizzle-orm";
import { requireAuth, requireOrg, getCallerOrg, rateLimitAi } from "./tenant-middleware";
import { ingestRfpText, pdfBufferToText } from "./rfp-ingestion";

export function registerRfpIngestionRoutes(app: Express) {
  app.get("/api/me/rfp-ingestion", requireAuth, requireOrg, async (req: Request, res: Response) => {
    const org = getCallerOrg(req)!;
    try {
      const jobs = await db
        .select({
          id: rfpIngestionJobs.id, grantId: rfpIngestionJobs.grantId,
          documentKind: rfpIngestionJobs.documentKind, filename: rfpIngestionJobs.filename,
          status: rfpIngestionJobs.status, itemsExtracted: rfpIngestionJobs.itemsExtracted,
          createdAt: rfpIngestionJobs.createdAt, parsedAt: rfpIngestionJobs.parsedAt,
        })
        .from(rfpIngestionJobs)
        .where(eq(rfpIngestionJobs.orgId, org.id))
        .orderBy(desc(rfpIngestionJobs.createdAt))
        .limit(200);
      res.json({ jobs });
    } catch (err: any) {
      res.status(500).json({ error: String(err?.message ?? err) });
    }
  });

  app.get("/api/me/rfp-ingestion/:id", requireAuth, requireOrg, async (req: Request, res: Response) => {
    const org = getCallerOrg(req)!;
    try {
      const [job] = await db.select().from(rfpIngestionJobs)
        .where(and(eq(rfpIngestionJobs.id, String(req.params.id)), eq(rfpIngestionJobs.orgId, org.id)));
      if (!job) return res.status(404).json({ error: "not found" });
      res.json({ job });
    } catch (err: any) {
      res.status(500).json({ error: String(err?.message ?? err) });
    }
  });

  app.post("/api/me/rfp-ingestion/text", requireAuth, requireOrg, rateLimitAi, async (req: Request, res: Response) => {
    const org = getCallerOrg(req)!;
    const { grantId, documentKind, filename, rawText, useAi } = req.body ?? {};
    if (typeof rawText !== "string" || rawText.trim().length < 100) {
      return res.status(400).json({ error: "rawText required, >= 100 chars" });
    }
    if (typeof filename !== "string" || filename.length === 0) {
      return res.status(400).json({ error: "filename required" });
    }
    try {
      const result = await ingestRfpText({
        orgId: org.id,
        grantId: typeof grantId === "string" ? grantId : undefined,
        documentKind: documentKind === "amendment" || documentKind === "qa" ? documentKind : "base",
        filename,
        rawText,
        useAi: useAi !== false,
      });
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: String(err?.message ?? err) });
    }
  });

  app.post("/api/me/rfp-ingestion/pdf", requireAuth, requireOrg, rateLimitAi, async (req: Request, res: Response) => {
    const org = getCallerOrg(req)!;
    // Accepts base64-encoded PDF in body.pdfBase64 (keeps fork simple — no multer dep)
    const { grantId, documentKind, filename, pdfBase64, useAi } = req.body ?? {};
    if (typeof pdfBase64 !== "string" || pdfBase64.length === 0) {
      return res.status(400).json({ error: "pdfBase64 required (base64-encoded PDF bytes)" });
    }
    if (typeof filename !== "string" || filename.length === 0) {
      return res.status(400).json({ error: "filename required" });
    }
    try {
      const buf = Buffer.from(pdfBase64, "base64");
      if (buf.length === 0) return res.status(400).json({ error: "decoded PDF is empty" });
      if (buf.length > 25 * 1024 * 1024) return res.status(413).json({ error: "PDF too large (>25MB)" });
      const rawText = pdfBufferToText(buf);
      if (rawText.trim().length < 100) {
        return res.status(422).json({ error: "pdftotext returned <100 chars; PDF may be scanned image — run OCR separately." });
      }
      const result = await ingestRfpText({
        orgId: org.id,
        grantId: typeof grantId === "string" ? grantId : undefined,
        documentKind: documentKind === "amendment" || documentKind === "qa" ? documentKind : "base",
        filename,
        rawText,
        useAi: useAi !== false,
      });
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: String(err?.message ?? err) });
    }
  });
}
