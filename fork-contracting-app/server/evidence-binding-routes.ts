// Proposal Studio v2 — L5 inline evidence binding (added 2026-05-27)
//
// Every claim in a proposal paragraph cites a primary source. Pre-submit gate
// refuses export if any in-scope paragraph has unbound claims OR has any
// binding marked inWindow=false (e.g. for Wellcome ≤5yr rules).
//
//   GET    /api/me/evidence/:grantId                 → list bindings
//   POST   /api/me/evidence                          → create
//   PATCH  /api/me/evidence/:id                      → edit
//   DELETE /api/me/evidence/:id                      → delete
//   GET    /api/me/evidence/:grantId/pre-submit-gate → pass/fail summary
//
// Fork-ready.

import type { Express, Request, Response } from "express";
import { db } from "./storage";
import { evidenceBindings, insertEvidenceBindingSchema } from "@shared/schema";
import { and, desc, eq } from "drizzle-orm";
import { requireAuth, requireOrg, getCallerOrg } from "./tenant-middleware";
import { z } from "zod";

export type PreSubmitGateResult = {
  pass: boolean;
  totalBindings: number;
  outOfWindowCount: number;
  unverifiedCount: number;
  missingVerbatimCount: number;
  paragraphsCovered: number;
  blockingIssues: Array<{ bindingId: string; paragraphRef: string; issue: string }>;
};

export async function runPreSubmitGate(orgId: string, grantId: string): Promise<PreSubmitGateResult> {
  const rows = await db.select().from(evidenceBindings)
    .where(and(eq(evidenceBindings.orgId, orgId), eq(evidenceBindings.grantId, grantId)));

  const blocking: PreSubmitGateResult["blockingIssues"] = [];
  let outOfWindow = 0;
  let unverified = 0;
  let missingVerbatim = 0;
  const paragraphs = new Set<string>();

  for (const r of rows) {
    paragraphs.add(r.paragraphRef);
    if (!r.inWindow) {
      outOfWindow++;
      blocking.push({ bindingId: r.id, paragraphRef: r.paragraphRef, issue: "evidence is out-of-window for this funder's date restriction" });
    }
    if (!r.verifiedAt) {
      unverified++;
      blocking.push({ bindingId: r.id, paragraphRef: r.paragraphRef, issue: "binding has no verifiedAt timestamp — has not been human-confirmed" });
    }
    if (!r.verbatimQuote || r.verbatimQuote.trim().length < 12) {
      missingVerbatim++;
      blocking.push({ bindingId: r.id, paragraphRef: r.paragraphRef, issue: "verbatimQuote missing or <12 chars — Iron Rule #2 requires a primary-source quote" });
    }
  }

  return {
    pass: blocking.length === 0 && rows.length > 0,
    totalBindings: rows.length,
    outOfWindowCount: outOfWindow,
    unverifiedCount: unverified,
    missingVerbatimCount: missingVerbatim,
    paragraphsCovered: paragraphs.size,
    blockingIssues: blocking,
  };
}

export function registerEvidenceBindingRoutes(app: Express) {
  app.get("/api/me/evidence/:grantId", requireAuth, requireOrg, async (req: Request, res: Response) => {
    const org = getCallerOrg(req)!;
    try {
      const rows = await db.select().from(evidenceBindings)
        .where(and(eq(evidenceBindings.orgId, org.id), eq(evidenceBindings.grantId, String(req.params.grantId))))
        .orderBy(desc(evidenceBindings.createdAt));
      res.json({ bindings: rows });
    } catch (err: any) {
      res.status(500).json({ error: String(err?.message ?? err) });
    }
  });

  app.post("/api/me/evidence", requireAuth, requireOrg, async (req: Request, res: Response) => {
    const org = getCallerOrg(req)!;
    const parse = insertEvidenceBindingSchema.safeParse({ ...req.body, orgId: org.id });
    if (!parse.success) {
      return res.status(400).json({ error: "validation failed", details: parse.error.flatten() });
    }
    try {
      const [created] = await db.insert(evidenceBindings).values(parse.data).returning();
      res.status(201).json({ binding: created });
    } catch (err: any) {
      res.status(500).json({ error: String(err?.message ?? err) });
    }
  });

  const patchSchema = z.object({
    claimText: z.string().min(1).optional(),
    sourceKind: z.enum(["rplice", "url", "file", "won-proposal", "partner-los", "primary-doc"]).optional(),
    sourceRef: z.string().min(1).optional(),
    verbatimQuote: z.string().optional(),
    inWindow: z.boolean().optional(),
    verifiedBy: z.string().optional(),
    markVerified: z.boolean().optional(),
  }).strict();

  app.patch("/api/me/evidence/:id", requireAuth, requireOrg, async (req: Request, res: Response) => {
    const org = getCallerOrg(req)!;
    const parse = patchSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: "validation failed", details: parse.error.flatten() });
    }
    const { markVerified, ...rest } = parse.data;
    const update: Record<string, unknown> = { ...rest };
    if (markVerified) update.verifiedAt = new Date();
    try {
      const [updated] = await db.update(evidenceBindings).set(update)
        .where(and(eq(evidenceBindings.id, String(req.params.id)), eq(evidenceBindings.orgId, org.id)))
        .returning();
      if (!updated) return res.status(404).json({ error: "not found" });
      res.json({ binding: updated });
    } catch (err: any) {
      res.status(500).json({ error: String(err?.message ?? err) });
    }
  });

  app.delete("/api/me/evidence/:id", requireAuth, requireOrg, async (req: Request, res: Response) => {
    const org = getCallerOrg(req)!;
    try {
      const deleted = await db.delete(evidenceBindings)
        .where(and(eq(evidenceBindings.id, String(req.params.id)), eq(evidenceBindings.orgId, org.id)))
        .returning();
      if (deleted.length === 0) return res.status(404).json({ error: "not found" });
      res.json({ ok: true });
    } catch (err: any) {
      res.status(500).json({ error: String(err?.message ?? err) });
    }
  });

  app.get("/api/me/evidence/:grantId/pre-submit-gate", requireAuth, requireOrg, async (req: Request, res: Response) => {
    const org = getCallerOrg(req)!;
    try {
      const result = await runPreSubmitGate(org.id, String(req.params.grantId));
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: String(err?.message ?? err) });
    }
  });
}
