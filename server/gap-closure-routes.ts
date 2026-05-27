// Proposal Studio v2 — L3 gap-closure workflow (added 2026-05-27)
//
// Replaces the {{ACTION REQUIRED}} string convention with an assignable task
// surface: owner + deadline + primary-source-verification gate. Iron Rules
// #2 + #10 enforced server-side (cannot mark resolved without both a
// verificationSource AND a verificationVerbatim quote).
//
//   GET    /api/me/gaps/:grantId             → list gaps for grant
//   POST   /api/me/gaps                       → create
//   PATCH  /api/me/gaps/:id                   → edit (status / owner / deadline / verification)
//   POST   /api/me/gaps/:id/resolve           → resolve (REQUIRES source + verbatim)
//   DELETE /api/me/gaps/:id                   → delete
//
// Fork-ready.

import type { Express, Request, Response } from "express";
import { db } from "./storage";
import { gapClosureItems, insertGapClosureItemSchema } from "@shared/schema";
import { and, desc, eq } from "drizzle-orm";
import { requireAuth, requireOrg, getCallerOrg } from "./tenant-middleware";
import { z } from "zod";

export function registerGapClosureRoutes(app: Express) {
  app.get("/api/me/gaps/:grantId", requireAuth, requireOrg, async (req: Request, res: Response) => {
    const org = getCallerOrg(req)!;
    try {
      const gaps = await db.select().from(gapClosureItems)
        .where(and(eq(gapClosureItems.orgId, org.id), eq(gapClosureItems.grantId, String(req.params.grantId))))
        .orderBy(desc(gapClosureItems.createdAt));
      res.json({ gaps });
    } catch (err: any) {
      res.status(500).json({ error: String(err?.message ?? err) });
    }
  });

  app.post("/api/me/gaps", requireAuth, requireOrg, async (req: Request, res: Response) => {
    const org = getCallerOrg(req)!;
    const parse = insertGapClosureItemSchema.safeParse({ ...req.body, orgId: org.id });
    if (!parse.success) {
      return res.status(400).json({ error: "validation failed", details: parse.error.flatten() });
    }
    try {
      const [gap] = await db.insert(gapClosureItems).values(parse.data).returning();
      res.status(201).json({ gap });
    } catch (err: any) {
      res.status(500).json({ error: String(err?.message ?? err) });
    }
  });

  const patchSchema = z.object({
    title: z.string().min(1).max(500).optional(),
    description: z.string().optional(),
    assignedOwner: z.string().max(200).optional(),
    assignedEmail: z.string().email().optional().or(z.literal("")),
    deadline: z.coerce.date().nullable().optional(),
    status: z.enum(["open", "in-progress", "resolved", "wontfix", "escalated"]).optional(),
    verificationSource: z.string().optional(),
    verificationVerbatim: z.string().optional(),
    resolvedBy: z.string().optional(),
  }).strict();

  app.patch("/api/me/gaps/:id", requireAuth, requireOrg, async (req: Request, res: Response) => {
    const org = getCallerOrg(req)!;
    const parse = patchSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: "validation failed", details: parse.error.flatten() });
    }
    try {
      const [updated] = await db.update(gapClosureItems)
        .set({ ...parse.data, updatedAt: new Date() })
        .where(and(eq(gapClosureItems.id, String(req.params.id)), eq(gapClosureItems.orgId, org.id)))
        .returning();
      if (!updated) return res.status(404).json({ error: "not found" });
      res.json({ gap: updated });
    } catch (err: any) {
      res.status(500).json({ error: String(err?.message ?? err) });
    }
  });

  // Server-side enforcement of the primary-source-verification gate.
  // Iron Rules #2 + #10: cannot resolve without source + verbatim.
  app.post("/api/me/gaps/:id/resolve", requireAuth, requireOrg, async (req: Request, res: Response) => {
    const org = getCallerOrg(req)!;
    const body = z.object({
      verificationSource: z.string().min(1, "verificationSource is required to resolve a gap (Iron Rules #2/#10)"),
      verificationVerbatim: z.string().min(12, "verificationVerbatim must be at least 12 chars — copy the verbatim quote from the source"),
      resolvedBy: z.string().min(1),
    }).safeParse(req.body);
    if (!body.success) {
      return res.status(400).json({ error: "verification incomplete", details: body.error.flatten() });
    }
    try {
      const [updated] = await db.update(gapClosureItems)
        .set({
          status: "resolved",
          verificationSource: body.data.verificationSource,
          verificationVerbatim: body.data.verificationVerbatim,
          resolvedBy: body.data.resolvedBy,
          resolvedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(and(eq(gapClosureItems.id, String(req.params.id)), eq(gapClosureItems.orgId, org.id)))
        .returning();
      if (!updated) return res.status(404).json({ error: "not found" });
      res.json({ gap: updated });
    } catch (err: any) {
      res.status(500).json({ error: String(err?.message ?? err) });
    }
  });

  app.delete("/api/me/gaps/:id", requireAuth, requireOrg, async (req: Request, res: Response) => {
    const org = getCallerOrg(req)!;
    try {
      const deleted = await db.delete(gapClosureItems)
        .where(and(eq(gapClosureItems.id, String(req.params.id)), eq(gapClosureItems.orgId, org.id)))
        .returning();
      if (deleted.length === 0) return res.status(404).json({ error: "not found" });
      res.json({ ok: true });
    } catch (err: any) {
      res.status(500).json({ error: String(err?.message ?? err) });
    }
  });
}
