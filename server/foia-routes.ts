import express from "express";
import { z } from "zod";
import { db } from "./storage";
import {
  foiaRequests, foiaResponses, justiceIndicators,
} from "../shared/justice-schema";
import {
  generateFoiaLetter, COUNTY_CLERK_CONTACTS,
  HOUSING_COURT_REQUESTS, ingestFoiaResponse,
} from "./foia-tracker";
import { runBjsIngestion } from "./bjs-ingestion";
import { desc, eq, and } from "drizzle-orm";

const foiaRouter = express.Router();

foiaRouter.get("/requests", async (_req, res) => {
  try {
    const requests = await db.select().from(foiaRequests)
      .orderBy(desc(foiaRequests.createdAt));
    res.json(requests);
  } catch { res.status(500).json({ error: "Failed to load FOIA requests" }); }
});

foiaRouter.post("/requests", async (req, res) => {
  try {
    const schema = z.object({
      agency: z.enum([
        "travis_county_clerk", "williamson_county_clerk",
        "hays_county_clerk", "bastrop_county_clerk",
        "texas_hhsc", "texas_doc", "bjs_federal", "other",
      ]),
      requestedRecords: z.string().min(10),
      purposeStatement: z.string().optional(),
      submittedBy: z.string().optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const contact = COUNTY_CLERK_CONTACTS[parsed.data.agency];
    const letter = contact || parsed.data.agency !== "bjs_federal"
      ? generateFoiaLetter({
          agency: parsed.data.agency,
          requestedRecords: parsed.data.requestedRecords,
        })
      : null;

    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 14);

    const [request] = await db.insert(foiaRequests).values({
      agency: parsed.data.agency,
      agencyName: contact?.agencyName ?? parsed.data.agency.replace(/_/g, " "),
      agencyEmail: contact?.email,
      agencyAddress: contact?.address,
      requestedRecords: parsed.data.requestedRecords,
      purposeStatement: parsed.data.purposeStatement,
      generatedLetter: letter ?? undefined,
      responseDeadline: deadline,
      submittedBy: parsed.data.submittedBy,
    }).returning();

    res.json({ request, letter });
  } catch (err) {
    console.error("[foia-routes] POST /requests:", err);
    res.status(500).json({ error: "Failed to create FOIA request" });
  }
});

foiaRouter.patch("/requests/:id/status", async (req, res) => {
  try {
    const schema = z.object({
      status: z.enum(["draft","submitted","acknowledged","processing",
                       "response_received","appealed","closed","denied"]),
      trackingNumber: z.string().optional(),
      notes: z.string().optional(),
      submittedAt: z.string().optional(),
      acknowledgedAt: z.string().optional(),
      responseReceivedAt: z.string().optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const updates: Record<string, any> = { status: parsed.data.status };
    if (parsed.data.trackingNumber) updates.trackingNumber = parsed.data.trackingNumber;
    if (parsed.data.notes) updates.notes = parsed.data.notes;
    if (parsed.data.submittedAt) updates.submittedAt = new Date(parsed.data.submittedAt);
    if (parsed.data.acknowledgedAt) updates.acknowledgedAt = new Date(parsed.data.acknowledgedAt);
    if (parsed.data.responseReceivedAt) updates.responseReceivedAt = new Date(parsed.data.responseReceivedAt);

    const [updated] = await db.update(foiaRequests)
      .set(updates)
      .where(eq(foiaRequests.id, req.params.id))
      .returning();

    res.json(updated);
  } catch { res.status(500).json({ error: "Failed to update status" }); }
});

foiaRouter.post("/requests/:id/response", async (req, res) => {
  try {
    const schema = z.object({
      responseType: z.enum(["full_grant","partial","denial","no_records"]),
      rawText: z.string(),
      documentCount: z.number().optional(),
      parsedRecords: z.array(z.object({
        dataType: z.enum(["housing_court_filing","eviction_filing","court_disposition"]),
        geography: z.string(),
        countyFips: z.string(),
        reportingYear: z.number(),
        value: z.number(),
        unit: z.string(),
        demographicGroup: z.string().optional(),
        notes: z.string().optional(),
      })).optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const [response] = await db.insert(foiaResponses).values({
      foiaRequestId: req.params.id,
      responseType: parsed.data.responseType,
      rawText: parsed.data.rawText,
      documentCount: parsed.data.documentCount,
      parsedData: parsed.data.parsedRecords as any,
    }).returning();

    await db.update(foiaRequests)
      .set({ status: "response_received", responseReceivedAt: new Date() })
      .where(eq(foiaRequests.id, req.params.id));

    let ingestedCount = 0;
    if (parsed.data.parsedRecords?.length) {
      ingestedCount = await ingestFoiaResponse(response.id, parsed.data.parsedRecords);
    }

    res.json({ response, ingestedCount });
  } catch (err) {
    console.error("[foia-routes] POST response:", err);
    res.status(500).json({ error: "Failed to log response" });
  }
});

foiaRouter.get("/templates", (_req, res) => {
  res.json({ contacts: COUNTY_CLERK_CONTACTS, templates: HOUSING_COURT_REQUESTS });
});

foiaRouter.get("/justice-indicators", async (req, res) => {
  try {
    const countyFips = req.query.countyFips as string | undefined;
    const dataType = req.query.dataType as string | undefined;

    const conditions: any[] = [];
    if (countyFips) conditions.push(eq(justiceIndicators.countyFips, countyFips));
    if (dataType) conditions.push(eq(justiceIndicators.dataType, dataType as any));

    const results = conditions.length
      ? await db.select().from(justiceIndicators)
          .where(conditions.length === 1 ? conditions[0] : and(...conditions))
          .orderBy(desc(justiceIndicators.reportingYear))
      : await db.select().from(justiceIndicators)
          .orderBy(desc(justiceIndicators.reportingYear));

    res.json(results);
  } catch { res.status(500).json({ error: "Failed to load justice indicators" }); }
});

foiaRouter.post("/ingest/bjs", async (_req, res) => {
  try {
    const result = await runBjsIngestion();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export { foiaRouter };
