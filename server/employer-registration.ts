import express from "express";
import { z } from "zod";
import { db } from "./storage";
import { employerRegistrations } from "../shared/justice-schema";
import { employerPartners } from "../shared/schema";
import { eq, desc } from "drizzle-orm";

const employerRegRouter = express.Router();

function ensureAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (!(req as any).user) return res.status(401).json({ error: "Authentication required" });
  next();
}

employerRegRouter.post("/register", async (req, res) => {
  try {
    const schema = z.object({
      companyName: z.string().min(2),
      industry: z.string().optional(),
      contactName: z.string().min(2),
      contactEmail: z.string().email(),
      contactPhone: z.string().optional(),
      website: z.string().url().optional().or(z.literal("")),
      location: z.string().optional(),
      banTheBox: z.boolean().default(false),
      fairChanceHiring: z.boolean().default(false),
      barrierFriendly: z.boolean().default(false),
      hiringCommitments: z.string().optional(),
      description: z.string().optional(),
      credentialTags: z.array(z.string()).optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const [registration] = await db.insert(employerRegistrations)
      .values({
        ...parsed.data,
        website: parsed.data.website || undefined,
      }).returning();

    res.json({
      registration,
      message: "Application received. Our team will review your application within 3 business days.",
    });
  } catch (err) {
    console.error("[employer-reg] POST /register:", err);
    res.status(500).json({ error: "Registration failed" });
  }
});

employerRegRouter.get("/registrations", ensureAuth, async (req, res) => {
  try {
    const status = (req.query.status as string) ?? "pending";
    const regs = await db.select().from(employerRegistrations)
      .where(eq(employerRegistrations.status, status))
      .orderBy(desc(employerRegistrations.submittedAt));
    res.json(regs);
  } catch { res.status(500).json({ error: "Failed to load registrations" }); }
});

employerRegRouter.patch("/registrations/:id/review", ensureAuth, async (req, res) => {
  try {
    const schema = z.object({
      decision: z.enum(["approved", "rejected"]),
      reviewedBy: z.string(),
      reviewNotes: z.string().optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const [reg] = await db.select().from(employerRegistrations)
      .where(eq(employerRegistrations.id, req.params.id));

    if (!reg) return res.status(404).json({ error: "Registration not found" });

    let employerId: string | undefined;
    if (parsed.data.decision === "approved") {
      const [employer] = await db.insert(employerPartners).values({
        companyName: reg.companyName,
        industry: reg.industry ?? "General",
        contactName: reg.contactName,
        contactEmail: reg.contactEmail,
        contactPhone: reg.contactPhone ?? undefined,
        website: reg.website ?? undefined,
        location: reg.location ?? undefined,
        banTheBox: reg.banTheBox,
        fairChanceHiring: reg.fairChanceHiring,
        barrierFriendly: reg.barrierFriendly,
        hiringCommitments: reg.hiringCommitments ?? undefined,
        description: reg.description ?? undefined,
        partnershipStatus: "active",
      }).returning();
      employerId = employer.id;
    }

    const [updated] = await db.update(employerRegistrations).set({
      status: parsed.data.decision,
      reviewedAt: new Date(),
      reviewedBy: parsed.data.reviewedBy,
      reviewNotes: parsed.data.reviewNotes,
      approvedEmployerId: employerId,
    }).where(eq(employerRegistrations.id, req.params.id)).returning();

    res.json({ registration: updated, employerId });
  } catch (err) {
    console.error("[employer-reg] PATCH /review:", err);
    res.status(500).json({ error: "Review failed" });
  }
});

export { employerRegRouter };
