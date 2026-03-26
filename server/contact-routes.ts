import type { Express, Request, Response } from "express";
import { db } from "./storage";
import { contactInquiries, insertContactInquirySchema } from "@shared/schema";
import { eq, desc, sql } from "drizzle-orm";
import { sendContactInquiry } from "./email-service";

function getUserId(req: Request): string | undefined {
  const u = (req as unknown as Record<string, unknown>).user as
    | { claims?: { sub?: string }; id?: string }
    | undefined;
  return u?.claims?.sub || u?.id;
}

function requireAuth(req: Request, res: Response, next: Function) {
  if (!getUserId(req)) return res.status(401).json({ error: "Unauthorized" });
  next();
}

function requireAdmin(req: Request, res: Response, next: Function) {
  if (!getUserId(req)) return res.status(401).json({ error: "Unauthorized" });
  const u = (req as unknown as Record<string, unknown>).user as
    | { role?: string; claims?: { email?: string } }
    | undefined;
  if (u?.role === "admin" || u?.role === "teacher" || u?.role === "case_manager") return next();
  return res.status(403).json({ error: "Admin access required" });
}

export function registerContactRoutes(app: Express) {
  app.post("/api/contact", async (req, res) => {
    try {
      const parsed = insertContactInquirySchema.parse(req.body);
      const [inquiry] = await db
        .insert(contactInquiries)
        .values(parsed)
        .returning();

      try {
        await sendContactInquiry(
          parsed.name,
          parsed.email,
          parsed.message,
          parsed.inquiryType ?? "general"
        );
      } catch (emailErr) {
        console.error("Email send failed (inquiry still saved):", emailErr);
      }

      res.json(inquiry);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Invalid request" });
    }
  });

  app.post("/api/contact/partner-inquiry", async (req, res) => {
    try {
      const parsed = insertContactInquirySchema.parse({
        ...req.body,
        inquiryType: "partnership",
      });
      const [inquiry] = await db
        .insert(contactInquiries)
        .values(parsed)
        .returning();

      try {
        await sendContactInquiry(
          parsed.name,
          parsed.email,
          parsed.message,
          "partnership"
        );
      } catch (emailErr) {
        console.error("Email send failed (inquiry still saved):", emailErr);
      }

      res.json(inquiry);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Invalid request" });
    }
  });

  app.get("/api/contact/inquiries", requireAdmin, async (_req, res) => {
    try {
      const inquiries = await db
        .select()
        .from(contactInquiries)
        .orderBy(desc(contactInquiries.createdAt));
      res.json(inquiries);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch inquiries" });
    }
  });

  app.patch("/api/contact/inquiries/:id", requireAdmin, async (req, res) => {
    try {
      const { status, notes } = req.body;
      const updates: Record<string, unknown> = {};
      if (status) updates.status = status;
      if (notes !== undefined) updates.notes = notes;

      const [updated] = await db
        .update(contactInquiries)
        .set(updates)
        .where(sql`${contactInquiries.id} = ${req.params.id}`)
        .returning();

      if (!updated) return res.status(404).json({ error: "Inquiry not found" });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update inquiry" });
    }
  });
}
