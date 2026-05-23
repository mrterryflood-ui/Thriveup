// RFP Fidelity Engine — HTTP routes
// Auth-gated, org-scoped. The full lifecycle:
//   POST   /api/me/rfp-fidelity/:grantId/extract     → run extractor on doc stack
//   GET    /api/me/rfp-fidelity/:grantId             → list matrix + audit
//   GET    /api/me/rfp-fidelity/:grantId/audit       → run fidelity audit pass
//   PATCH  /api/me/rfp-fidelity/items/:itemId        → manual edit (status, evidence, workaround, section, confidence)
//   POST   /api/me/rfp-fidelity/items/:itemId/workaround → AI-propose hybrid workaround
//   DELETE /api/me/rfp-fidelity/items/:itemId        → delete a manual item

import type { Express, Request, Response } from "express";
import { db } from "./storage";
import { complianceMatrixItems, rfpDocuments, grantOpportunities, type ComplianceMatrixItem } from "@shared/schema";
import { and, eq } from "drizzle-orm";
import { requireAuth, requireOrg, getCallerOrg, rateLimitAi } from "./tenant-middleware";
import { extractComplianceMatrix, saveComplianceMatrix, loadComplianceMatrix, proposeWorkaround, runFidelityAudit, buildExtractorInputFromStack } from "./rfp-fidelity-engine";
import { loadRfpDocumentStack } from "./rfp-rubric";

export function registerRfpFidelityRoutes(app: Express) {
  // Hub index: every grant this org has uploaded at least one RFP doc for.
  // Used by /rfp-fidelity (the picker page) so users can land in the engine
  // from the sidebar without already knowing a grantId.
  app.get("/api/me/rfp-fidelity/grants", requireAuth, requireOrg, async (req: Request, res: Response) => {
    const org = getCallerOrg(req)!;
    try {
      const docs = await db.select({ id: rfpDocuments.id, grantId: rfpDocuments.grantId, kind: rfpDocuments.kind, title: rfpDocuments.title, uploadedAt: rfpDocuments.uploadedAt })
        .from(rfpDocuments).where(eq(rfpDocuments.orgId, org.id));
      const byGrant = new Map<string, { grantId: string; docCounts: { base: number; amendment: number; qa: number }; docTitle: string | null; lastUploadedAt: Date | null }>();
      for (const d of docs) {
        if (!d.grantId) continue;
        const cur = byGrant.get(d.grantId) ?? { grantId: d.grantId, docCounts: { base: 0, amendment: 0, qa: 0 }, docTitle: null, lastUploadedAt: null };
        if (d.kind === "base") { cur.docCounts.base++; cur.docTitle = cur.docTitle ?? d.title; }
        else if (d.kind === "amendment") cur.docCounts.amendment++;
        else if (d.kind === "qa") cur.docCounts.qa++;
        if (!cur.lastUploadedAt || (d.uploadedAt && d.uploadedAt > cur.lastUploadedAt)) cur.lastUploadedAt = d.uploadedAt;
        byGrant.set(d.grantId, cur);
      }
      const grantIds = Array.from(byGrant.keys());
      const grants = grantIds.length > 0
        ? await db.select({ id: grantOpportunities.id, title: grantOpportunities.title, agency: grantOpportunities.agency, deadline: grantOpportunities.deadline }).from(grantOpportunities)
        : [];
      const grantMap = new Map(grants.map(g => [g.id, g]));
      const matrixCounts = grantIds.length > 0
        ? await db.select({ grantId: complianceMatrixItems.grantId, sectionType: complianceMatrixItems.sectionType, status: complianceMatrixItems.status }).from(complianceMatrixItems).where(eq(complianceMatrixItems.orgId, org.id))
        : [];
      const countMap = new Map<string, { total: number; L: number; M: number; gaps: number }>();
      for (const m of matrixCounts) {
        const c = countMap.get(m.grantId) ?? { total: 0, L: 0, M: 0, gaps: 0 };
        c.total++;
        if (m.sectionType === "L") c.L++;
        if (m.sectionType === "M") c.M++;
        if (m.status === "gap" || m.status === "open") c.gaps++;
        countMap.set(m.grantId, c);
      }
      const rows = Array.from(byGrant.values()).map(r => ({
        grantId: r.grantId,
        title: grantMap.get(r.grantId)?.title ?? r.docTitle ?? `Grant ${r.grantId.slice(0, 8)}…`,
        agency: grantMap.get(r.grantId)?.agency ?? null,
        deadline: grantMap.get(r.grantId)?.deadline ?? null,
        docCounts: r.docCounts,
        matrixCounts: countMap.get(r.grantId) ?? { total: 0, L: 0, M: 0, gaps: 0 },
        lastUploadedAt: r.lastUploadedAt,
      })).sort((a, b) => (b.lastUploadedAt?.getTime() ?? 0) - (a.lastUploadedAt?.getTime() ?? 0));
      res.json({ grants: rows });
    } catch (err) {
      console.error("[rfp-fidelity] grants index failed:", err);
      res.status(500).json({ error: err instanceof Error ? err.message : "Failed" });
    }
  });

  app.post("/api/me/rfp-fidelity/:grantId/extract", requireAuth, requireOrg, rateLimitAi({ perMinute: 2, perHour: 12 }), async (req: Request, res: Response) => {
    const org = getCallerOrg(req)!;
    const grantId = String(req.params.grantId);
    const meetingNotes = typeof req.body?.meetingNotes === "string" ? req.body.meetingNotes : undefined;
    try {
      const stack = await loadRfpDocumentStack(org.id, grantId);
      const input = buildExtractorInputFromStack(stack, meetingNotes);
      if (!input) return res.status(400).json({ error: "No base RFP document on file for this grant. Upload via POST /api/me/rfp-documents first." });
      const items = await extractComplianceMatrix(input);
      const documentId = stack.base!.id;
      const saved = await saveComplianceMatrix({ orgId: org.id, grantId, documentId, items });
      res.json({ items: saved, counts: { total: saved.length, L: saved.filter(i => i.sectionType === "L").length, M: saved.filter(i => i.sectionType === "M").length, C: saved.filter(i => i.sectionType === "C").length } });
    } catch (err) {
      console.error("[rfp-fidelity] extract failed:", err);
      res.status(500).json({ error: err instanceof Error ? err.message : "Extract failed" });
    }
  });

  app.get("/api/me/rfp-fidelity/:grantId", requireAuth, requireOrg, async (req: Request, res: Response) => {
    const org = getCallerOrg(req)!;
    const grantId = String(req.params.grantId);
    try {
      const items = await loadComplianceMatrix(org.id, grantId);
      res.json({ items });
    } catch (err) {
      console.error("[rfp-fidelity] load failed:", err);
      res.status(500).json({ error: err instanceof Error ? err.message : "Load failed" });
    }
  });

  app.get("/api/me/rfp-fidelity/:grantId/audit", requireAuth, requireOrg, async (req: Request, res: Response) => {
    const org = getCallerOrg(req)!;
    const grantId = String(req.params.grantId);
    const draftSectionsRaw = typeof req.query.draftSections === "string" ? req.query.draftSections : "";
    const draftSectionNames = draftSectionsRaw ? draftSectionsRaw.split("||").map(s => s.trim()).filter(Boolean) : [];
    try {
      const items = await loadComplianceMatrix(org.id, grantId);
      const audit = runFidelityAudit(items, draftSectionNames);
      res.json({ audit, itemsAnalyzed: items.length });
    } catch (err) {
      console.error("[rfp-fidelity] audit failed:", err);
      res.status(500).json({ error: err instanceof Error ? err.message : "Audit failed" });
    }
  });

  app.patch("/api/me/rfp-fidelity/items/:itemId", requireAuth, requireOrg, async (req: Request, res: Response) => {
    const org = getCallerOrg(req)!;
    const itemId = String(req.params.itemId);
    const allowed: (keyof ComplianceMatrixItem)[] = ["evidenceRef", "workaroundProposed", "answeringSectionName", "status", "confidence", "requirementVerbatim", "rfpSection", "sectionType", "requirementType", "scoringWeight"];
    const patch: Record<string, unknown> = { updatedAt: new Date() };
    for (const k of allowed) {
      if (k in (req.body ?? {})) patch[k] = (req.body as Record<string, unknown>)[k];
    }
    try {
      const [updated] = await db.update(complianceMatrixItems)
        .set(patch as any)
        .where(and(eq(complianceMatrixItems.id, itemId), eq(complianceMatrixItems.orgId, org.id)))
        .returning();
      if (!updated) return res.status(404).json({ error: "Item not found" });
      res.json({ item: updated });
    } catch (err) {
      console.error("[rfp-fidelity] patch failed:", err);
      res.status(500).json({ error: err instanceof Error ? err.message : "Patch failed" });
    }
  });

  app.post("/api/me/rfp-fidelity/items/:itemId/workaround", requireAuth, requireOrg, rateLimitAi({ perMinute: 6, perHour: 60 }), async (req: Request, res: Response) => {
    const org = getCallerOrg(req)!;
    const itemId = String(req.params.itemId);
    const rfpAllowsTeamingRaw = req.body?.rfpAllowsTeaming;
    const rfpAllowsTeaming = typeof rfpAllowsTeamingRaw === "boolean" ? rfpAllowsTeamingRaw : null;
    try {
      const [item] = await db.select().from(complianceMatrixItems).where(and(eq(complianceMatrixItems.id, itemId), eq(complianceMatrixItems.orgId, org.id)));
      if (!item) return res.status(404).json({ error: "Item not found" });
      const capabilitiesSummary = String(req.body?.orgCapabilitiesSummary ?? "TCAF — see org profile for full capability statement.");
      const proposal = await proposeWorkaround({ item, orgCapabilitiesSummary: capabilitiesSummary, rfpAllowsTeaming });
      res.json(proposal);
    } catch (err) {
      console.error("[rfp-fidelity] workaround failed:", err);
      res.status(500).json({ error: err instanceof Error ? err.message : "Workaround failed" });
    }
  });

  app.delete("/api/me/rfp-fidelity/items/:itemId", requireAuth, requireOrg, async (req: Request, res: Response) => {
    const org = getCallerOrg(req)!;
    const itemId = String(req.params.itemId);
    try {
      await db.delete(complianceMatrixItems).where(and(eq(complianceMatrixItems.id, itemId), eq(complianceMatrixItems.orgId, org.id)));
      res.json({ ok: true });
    } catch (err) {
      console.error("[rfp-fidelity] delete failed:", err);
      res.status(500).json({ error: err instanceof Error ? err.message : "Delete failed" });
    }
  });

  // Convenience: confirm a grant exists AND this org has touched it (uploaded
  // at least one RFP document for it) before showing the matrix UI. Tenant
  // scoping: we only return the grant meta when the org has standing on this
  // grant. grantOpportunities itself is the shared discovery feed (not
  // org-owned), so we use rfp_documents ownership as the proxy for "this org
  // is working on this RFP".
  app.get("/api/me/rfp-fidelity/:grantId/grant-meta", requireAuth, requireOrg, async (req: Request, res: Response) => {
    const grantId = String(req.params.grantId);
    const org = getCallerOrg(req)!;
    try {
      const stack = await loadRfpDocumentStack(org.id, grantId);
      if (!stack.base && stack.amendments.length === 0 && stack.qa.length === 0) {
        return res.status(404).json({ error: "Your organization has no RFP documents uploaded for this grant. Upload via POST /api/me/rfp-documents first." });
      }
      const [g] = await db.select({ id: grantOpportunities.id, title: grantOpportunities.title, agency: grantOpportunities.agency, deadline: grantOpportunities.deadline }).from(grantOpportunities).where(eq(grantOpportunities.id, grantId));
      if (!g) return res.status(404).json({ error: "Grant not found" });
      res.json({
        grant: g,
        docs: { base: !!stack.base, amendments: stack.amendments.length, qa: stack.qa.length },
      });
    } catch (err) {
      console.error("[rfp-fidelity] grant-meta failed:", err);
      res.status(500).json({ error: err instanceof Error ? err.message : "Failed" });
    }
  });
}
