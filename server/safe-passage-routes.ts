import type { Express } from "express";
import { isAuthenticated } from "./replit_integrations/auth/replitAuth";

interface HousingListing {
  id: string; partnerOrgId: string; partnerOrgName: string;
  name: string; address: string; county: string; zipCode: string;
  type: "scattered-site" | "site-based"; beds: number;
  childrenAllowed: boolean; maxChildAge: number | null;
  petsAllowed: boolean; wheelchairAccessible: boolean; deafAccessible: boolean;
  languages: string[]; maxMonths: number; onSiteServices: string[];
  available: boolean; availableDate: string | null;
  phone: string; applyUrl: string | null; notes: string; createdAt: string;
}

interface ServiceLogEntry {
  id: string;
  serviceType: "safety-plan" | "housing-assessment" | "benefits-bridge" | "legal-navigation" | "employment" | "housing-placement" | "voucher-request" | "peer-mentor" | "housing-finder";
  partnerOrgId: string | null; county: string | null; language: string | null;
  anonymous: true; timestamp: string;
}

interface PartnerOrg {
  id: string; userId: string; orgName: string; orgType: string;
  contactName: string; contactEmail: string; phone: string;
  county: string; mission: string; yearsServingDvSa: number;
  approved: boolean; createdAt: string;
}

interface VoucherRequest {
  id: string; partnerOrgId: string; caseRef: string;
  expenseType: "security-deposit" | "first-month-rent" | "utility-deposit" | "furniture" | "application-fee" | "other";
  amountRequested: number; vendorName: string; notes: string;
  status: "pending" | "approved" | "denied"; createdAt: string;
}

const listings: HousingListing[] = [];
const serviceLogs: ServiceLogEntry[] = [];
const partnerOrgs: PartnerOrg[] = [];
const voucherRequests: VoucherRequest[] = [];
let listingId = 1, logId = 1, partnerId = 1, voucherId = 1;

export function registerSafePassageRoutes(app: Express) {
  app.post("/api/safe-passage/log", async (req, res) => {
    try {
      const { serviceType, county, language } = req.body;
      const valid = ["safety-plan","housing-assessment","benefits-bridge","legal-navigation","employment","housing-placement","voucher-request","peer-mentor","housing-finder"];
      if (!valid.includes(serviceType)) return res.status(400).json({ error: "Invalid service type" });
      serviceLogs.push({ id: `log-${logId++}`, serviceType, partnerOrgId: null, county: county || null, language: language || null, anonymous: true, timestamp: new Date().toISOString() });
      res.json({ ok: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.get("/api/safe-passage/impact", async (_req, res) => {
    try {
      const byType: Record<string, number> = {};
      for (const log of serviceLogs) byType[log.serviceType] = (byType[log.serviceType] || 0) + 1;
      const monthly: Record<string, number> = {};
      const now = new Date();
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        monthly[`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`] = 0;
      }
      for (const log of serviceLogs) { const k = log.timestamp.slice(0,7); if (k in monthly) monthly[k]++; }
      res.json({ totalSessions: serviceLogs.length, byType, monthly, partnerOrgsCount: partnerOrgs.filter(o => o.approved).length, activeListings: listings.filter(l => l.available).length, vouchersRequested: voucherRequests.length, vouchersApproved: voucherRequests.filter(v => v.status === "approved").length });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.get("/api/safe-passage/listings", async (req, res) => {
    try {
      let results = listings.filter(l => l.available);
      const { county, children, pets, accessible, language, maxMonths } = req.query;
      if (county) results = results.filter(l => l.county.toLowerCase().includes((county as string).toLowerCase()));
      if (children === "true") results = results.filter(l => l.childrenAllowed);
      if (pets === "true") results = results.filter(l => l.petsAllowed);
      if (accessible === "true") results = results.filter(l => l.wheelchairAccessible);
      if (language) results = results.filter(l => l.languages.some(lang => lang.toLowerCase().includes((language as string).toLowerCase())));
      if (maxMonths) results = results.filter(l => l.maxMonths >= parseInt(maxMonths as string));
      res.json(results);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.post("/api/safe-passage/listings", isAuthenticated, async (req, res) => {
    try {
      const org = partnerOrgs.find(o => o.userId === (req as any).user?.id && o.approved);
      if (!org) return res.status(403).json({ error: "Approved partner account required" });
      const listing: HousingListing = { id: `listing-${listingId++}`, partnerOrgId: org.id, partnerOrgName: org.orgName, available: true, createdAt: new Date().toISOString(), ...req.body };
      listings.push(listing);
      res.json(listing);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.patch("/api/safe-passage/listings/:id", isAuthenticated, async (req, res) => {
    try {
      const idx = listings.findIndex(l => l.id === req.params.id);
      if (idx === -1) return res.status(404).json({ error: "Not found" });
      listings[idx] = { ...listings[idx], ...req.body };
      res.json(listings[idx]);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.get("/api/safe-passage/partner/me", isAuthenticated, async (req, res) => {
    try { res.json(partnerOrgs.find(o => o.userId === (req as any).user?.id) || null); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.post("/api/safe-passage/partner/register", isAuthenticated, async (req, res) => {
    try {
      const existing = partnerOrgs.find(o => o.userId === (req as any).user?.id);
      if (existing) return res.json(existing);
      const org: PartnerOrg = { id: `org-${partnerId++}`, userId: (req as any).user?.id || "unknown", approved: false, createdAt: new Date().toISOString(), ...req.body };
      partnerOrgs.push(org);
      res.json(org);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.get("/api/safe-passage/vouchers", isAuthenticated, async (req, res) => {
    try {
      const org = partnerOrgs.find(o => o.userId === (req as any).user?.id);
      res.json(org ? voucherRequests.filter(v => v.partnerOrgId === org.id) : []);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.post("/api/safe-passage/vouchers", isAuthenticated, async (req, res) => {
    try {
      const org = partnerOrgs.find(o => o.userId === (req as any).user?.id && o.approved);
      if (!org) return res.status(403).json({ error: "Approved partner account required" });
      const voucher: VoucherRequest = { id: `voucher-${voucherId++}`, partnerOrgId: org.id, status: "pending", createdAt: new Date().toISOString(), ...req.body };
      voucherRequests.push(voucher);
      serviceLogs.push({ id: `log-${logId++}`, serviceType: "voucher-request", partnerOrgId: org.id, county: org.county, language: null, anonymous: true, timestamp: new Date().toISOString() });
      res.json(voucher);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.patch("/api/safe-passage/vouchers/:id/status", isAuthenticated, async (req, res) => {
    try {
      const idx = voucherRequests.findIndex(v => v.id === req.params.id);
      if (idx === -1) return res.status(404).json({ error: "Not found" });
      voucherRequests[idx].status = req.body.status;
      res.json(voucherRequests[idx]);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.post("/api/safe-passage/partner/log", isAuthenticated, async (req, res) => {
    try {
      const org = partnerOrgs.find(o => o.userId === (req as any).user?.id);
      serviceLogs.push({ id: `log-${logId++}`, serviceType: req.body.serviceType, partnerOrgId: org?.id || null, county: req.body.county || org?.county || null, language: req.body.language || null, anonymous: true, timestamp: new Date().toISOString() });
      res.json({ ok: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.get("/api/safe-passage/admin/partners", isAuthenticated, async (_req, res) => { res.json(partnerOrgs); });

  app.patch("/api/safe-passage/admin/partners/:id/approve", isAuthenticated, async (req, res) => {
    const idx = partnerOrgs.findIndex(o => o.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: "Not found" });
    partnerOrgs[idx].approved = true;
    res.json(partnerOrgs[idx]);
  });
}
