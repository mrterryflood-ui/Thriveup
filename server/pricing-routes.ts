import type { Express } from "express";
import { db } from "./storage";
import { serviceOrders, consultationRequests, insertServiceOrderSchema, insertConsultationRequestSchema } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export function registerPricingRoutes(app: Express) {
  app.get("/api/pricing/tiers", (_req, res) => {
    res.json({
      tiers: [
        {
          slug: "try-it",
          name: "Try It",
          tagline: "Test the ecosystem with zero long-term commitment",
          price: 200,
          priceLabel: "$200",
          billingType: "one-time",
          billingLabel: "One-Time",
          features: [
            "2 contract reviews (3 rounds each)",
            "2 consultations included",
            "Contract writing & grant support",
            "Contract search assistance",
            "SAM.gov & statewide registration help",
            "5% success fee on contract wins",
          ],
          executionAddon: {
            label: "Contract Execution Add-On",
            price: 500,
            billingLabel: "$500/year",
            description: "We manage the awarded contract for you",
          },
          highlight: false,
        },
        {
          slug: "group-entity",
          name: "Group / Entity",
          tagline: "Built for organizations ready to scale",
          price: 15,
          priceLabel: "$15",
          billingType: "per-member-monthly",
          billingLabel: "per member / month",
          minimumMembers: 50,
          features: [
            "Minimum 50 members",
            "Same review logic (3 rounds per contract)",
            "2 consultations included",
            "Contract writing & grant support",
            "Contract search assistance",
            "SAM.gov & statewide registration help",
            "5% success fee on contract wins",
            "Per-member contract execution included",
          ],
          highlight: true,
        },
        {
          slug: "professional",
          name: "Professional",
          tagline: "Full-service contract and grant powerhouse",
          price: 600,
          priceLabel: "$600",
          billingType: "monthly",
          billingLabel: "per month",
          features: [
            "10 individual contracts per month",
            "2 consultations included",
            "Contract writing & grant support",
            "Contract search assistance",
            "SAM.gov & statewide registration help",
            "5% success fee on contract wins",
          ],
          executionAddon: {
            label: "Contract Execution",
            price: 1000,
            billingLabel: "$1,000 for up to 2 contracts",
            additionalRate: "$250/month per additional contract",
            description: "We manage awarded contracts end-to-end",
          },
          highlight: false,
        },
        {
          slug: "city-partnership",
          name: "City Partnership",
          tagline: "Municipal-grade ecosystem for entire city departments",
          price: 3500,
          priceLabel: "$3,500",
          billingType: "monthly",
          billingLabel: "per month ($42K/year)",
          features: [
            "Unlimited contracts & grant applications",
            "Full 23-platform ecosystem access",
            "Dedicated account management",
            "Quarterly strategy reviews & priority response",
            "Multi-department onboarding (up to 5 departments)",
            "SAM.gov, statewide & federal registration",
            "Custom outcome dashboards & compliance reporting",
            "3% success fee on contract wins",
          ],
          executionAddon: {
            label: "Contract Execution",
            price: 0,
            billingLabel: "Up to 5 contracts included",
            additionalRate: "$500/month per additional contract",
            description: "Full end-to-end contract management across departments",
          },
          annualDiscount: {
            price: 36000,
            label: "$36,000/year if paid upfront (save $6,000)",
          },
          highlight: false,
        },
      ],
      customOption: {
        tagline: "Every organization is different. Let's talk and build a plan that works for you.",
        cta: "Schedule a Consultation",
      },
      allTiersInclude: [
        "2 consultations",
        "Contract writing & grant support",
        "Assistance with contract searching",
        "SAM.gov registration support",
        "Statewide registration assistance",
        "Access to the full 23-platform ecosystem",
      ],
    });
  });

  app.post("/api/pricing/order", async (req, res) => {
    try {
      const parsed = insertServiceOrderSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid order data", details: parsed.error.issues });
      }
      const [order] = await db.insert(serviceOrders).values(parsed.data).returning();
      res.json({ success: true, order });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to create order" });
    }
  });

  app.post("/api/pricing/consultation", async (req, res) => {
    try {
      const parsed = insertConsultationRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request data", details: parsed.error.issues });
      }
      const [request] = await db.insert(consultationRequests).values(parsed.data).returning();
      res.json({ success: true, request });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to submit consultation request" });
    }
  });

  app.get("/api/pricing/orders", async (_req, res) => {
    try {
      const orders = await db.select().from(serviceOrders).orderBy(desc(serviceOrders.createdAt));
      res.json(orders);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
}
