import type { Express } from "express";
import { db } from "./storage";
import { mceContracts, mceContractDeliverables, mceVendors, insertMceContractSchema, insertMceContractDeliverableSchema, insertMceVendorSchema } from "@shared/schema";
import { eq, desc, gte, lte, and } from "drizzle-orm";

export function registerMceContractRoutes(app: Express) {
  app.get("/api/mce/contracts", async (_req, res) => {
    try {
      const contracts = await db.select().from(mceContracts).orderBy(desc(mceContracts.createdAt));
      res.json(contracts);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/mce/contracts", async (req, res) => {
    try {
      const parsed = insertMceContractSchema.parse(req.body);
      const [contract] = await db.insert(mceContracts).values(parsed).returning();
      res.json(contract);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.patch("/api/mce/contracts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const [updated] = await db.update(mceContracts).set({ ...req.body, updatedAt: new Date() }).where(eq(mceContracts.id, id)).returning();
      if (!updated) return res.status(404).json({ error: "Not found" });
      res.json(updated);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.get("/api/mce/contracts/:id/deliverables", async (req, res) => {
    try {
      const contractId = parseInt(req.params.id);
      const deliverables = await db.select().from(mceContractDeliverables).where(eq(mceContractDeliverables.contractId, contractId)).orderBy(desc(mceContractDeliverables.createdAt));
      res.json(deliverables);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/mce/contracts/:id/deliverables", async (req, res) => {
    try {
      const contractId = parseInt(req.params.id);
      const parsed = insertMceContractDeliverableSchema.parse({ ...req.body, contractId });
      const [deliverable] = await db.insert(mceContractDeliverables).values(parsed).returning();
      res.json(deliverable);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.patch("/api/mce/deliverables/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const [updated] = await db.update(mceContractDeliverables).set({ ...req.body, updatedAt: new Date() }).where(eq(mceContractDeliverables.id, id)).returning();
      if (!updated) return res.status(404).json({ error: "Not found" });
      res.json(updated);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.get("/api/mce/vendors", async (_req, res) => {
    try {
      const vendors = await db.select().from(mceVendors).orderBy(desc(mceVendors.createdAt));
      res.json(vendors);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/mce/vendors", async (req, res) => {
    try {
      const parsed = insertMceVendorSchema.parse(req.body);
      const [vendor] = await db.insert(mceVendors).values(parsed).returning();
      res.json(vendor);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.get("/api/mce/compliance-calendar", async (_req, res) => {
    try {
      const contracts = await db.select().from(mceContracts).orderBy(desc(mceContracts.createdAt));
      const deliverables = await db.select().from(mceContractDeliverables).orderBy(mceContractDeliverables.dueDate);
      const now = new Date();
      const events: any[] = [];

      for (const c of contracts) {
        if (c.endDate) {
          const daysUntil = Math.ceil((new Date(c.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          events.push({
            id: `contract-end-${c.id}`,
            type: "contract_end",
            title: `${c.title} - Contract End`,
            date: c.endDate,
            daysUntil,
            urgency: daysUntil < 7 ? "red" : daysUntil < 30 ? "yellow" : "green",
            contractId: c.id,
          });
        }
        const keyDates = (c.keyDates || {}) as Record<string, string>;
        for (const [label, date] of Object.entries(keyDates)) {
          if (date) {
            const daysUntil = Math.ceil((new Date(date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            events.push({
              id: `key-${c.id}-${label}`,
              type: "key_date",
              title: `${c.title} - ${label}`,
              date,
              daysUntil,
              urgency: daysUntil < 7 ? "red" : daysUntil < 30 ? "yellow" : "green",
              contractId: c.id,
            });
          }
        }
      }

      for (const d of deliverables) {
        if (d.dueDate && d.status !== "accepted") {
          const daysUntil = Math.ceil((new Date(d.dueDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          events.push({
            id: `deliverable-${d.id}`,
            type: "deliverable",
            title: `Deliverable: ${d.title}`,
            date: d.dueDate,
            daysUntil,
            urgency: daysUntil < 7 ? "red" : daysUntil < 30 ? "yellow" : "green",
            contractId: d.contractId,
            deliverableId: d.id,
            status: d.status,
          });
        }
      }

      events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      res.json(events);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });
}
