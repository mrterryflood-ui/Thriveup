/**
 * Editor Drafts — polymorphic autosave backend.
 *
 * One row per (userId, editorKind, scopeKey). Used by long-form editors
 * (RFP writer, grant narrative, LOI writer, etc.) to debounce-save user
 * work so navigating away never loses a draft.
 *
 * Routes:
 *   GET  /api/me/editor-drafts/:editorKind/:scopeKey   → { content, updatedAt } | 404
 *   PUT  /api/me/editor-drafts/:editorKind/:scopeKey   body: { content }
 *   DELETE /api/me/editor-drafts/:editorKind/:scopeKey
 *
 * All routes require an authenticated Replit Auth session — drafts are
 * private per user. editorKind is restricted to a small allowlist to
 * prevent the table from being used as arbitrary client-side KV storage.
 */
import type { Express, Request, Response, NextFunction } from "express";
import { db } from "./storage";
import { editorDrafts } from "@shared/schema";
import { and, eq, sql } from "drizzle-orm";

const ALLOWED_KINDS = new Set([
  "rfp_writer",
  "grant_narrative",
  "loi_writer",
  "org_settings",
]);

function getUserId(req: Request): string | null {
  const u = (req as any).user;
  return u?.claims?.sub || u?.id || null;
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!(req as any).isAuthenticated || !(req as any).isAuthenticated()) {
    return res.status(401).json({ error: "Sign in to save drafts." });
  }
  if (!getUserId(req)) return res.status(401).json({ error: "Sign in to save drafts." });
  next();
}

function validateKindAndScope(req: Request, res: Response): { kind: string; scope: string } | null {
  const kind = String(req.params.editorKind || "");
  const scope = String(req.params.scopeKey || "default").slice(0, 200);
  if (!ALLOWED_KINDS.has(kind)) {
    res.status(400).json({ error: `Unknown editor kind: ${kind}` });
    return null;
  }
  return { kind, scope };
}

export function registerEditorDraftsRoutes(app: Express) {
  app.get("/api/me/editor-drafts/:editorKind/:scopeKey", requireAuth, async (req, res) => {
    try {
      const v = validateKindAndScope(req, res);
      if (!v) return;
      const userId = getUserId(req)!;
      const rows = await db
        .select({ content: editorDrafts.content, updatedAt: editorDrafts.updatedAt })
        .from(editorDrafts)
        .where(and(
          eq(editorDrafts.userId, userId),
          eq(editorDrafts.editorKind, v.kind),
          eq(editorDrafts.scopeKey, v.scope),
        ))
        .limit(1);
      if (rows.length === 0) return res.status(404).json({ error: "No draft." });
      res.json(rows[0]);
    } catch (err) {
      console.error("[EditorDrafts] GET failed:", err);
      res.status(500).json({ error: "Failed to load draft." });
    }
  });

  app.put("/api/me/editor-drafts/:editorKind/:scopeKey", requireAuth, async (req, res) => {
    try {
      const v = validateKindAndScope(req, res);
      if (!v) return;
      const userId = getUserId(req)!;
      const content = req.body?.content;
      if (content === undefined || content === null) {
        return res.status(400).json({ error: "Missing content." });
      }
      // Hard cap to prevent quota abuse. 5 MB covers even pasted full
      // RFP solicitations (typically 100–500 KB of text) with headroom
      // for generated narratives, while still bounding worst-case row
      // size. Express body-parser limit is configured larger upstream.
      const serialized = JSON.stringify(content);
      if (serialized.length > 5_000_000) {
        return res.status(413).json({
          error: "Draft too large to save (5 MB max). Trim attachments or split into sections.",
        });
      }
      await db
        .insert(editorDrafts)
        .values({ userId, editorKind: v.kind, scopeKey: v.scope, content })
        .onConflictDoUpdate({
          target: [editorDrafts.userId, editorDrafts.editorKind, editorDrafts.scopeKey],
          set: { content, updatedAt: sql`now()` },
        });
      res.json({ ok: true, updatedAt: new Date().toISOString() });
    } catch (err) {
      console.error("[EditorDrafts] PUT failed:", err);
      res.status(500).json({ error: "Failed to save draft." });
    }
  });

  app.delete("/api/me/editor-drafts/:editorKind/:scopeKey", requireAuth, async (req, res) => {
    try {
      const v = validateKindAndScope(req, res);
      if (!v) return;
      const userId = getUserId(req)!;
      await db
        .delete(editorDrafts)
        .where(and(
          eq(editorDrafts.userId, userId),
          eq(editorDrafts.editorKind, v.kind),
          eq(editorDrafts.scopeKey, v.scope),
        ));
      res.json({ ok: true });
    } catch (err) {
      console.error("[EditorDrafts] DELETE failed:", err);
      res.status(500).json({ error: "Failed to delete draft." });
    }
  });
}
