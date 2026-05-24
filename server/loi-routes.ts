// NSF 26-508 LOI generation routes — exposes Hub Workbench data to the UI.

import type { Express, Request, Response, NextFunction } from "express";
import { getJurisdiction, JURISDICTIONS } from "@shared/nationwide/jurisdictions";
import { getFederalPartners } from "@shared/nationwide/federal-partners";
import { STATE_PROGRAMS } from "@shared/nationwide/state-programs";
import { generateHubLoi, type LoiPartner } from "@shared/nationwide/loi-generator";
import { intelligenceBundle, budgetStatus, research } from "./hub-intelligence";
import { db } from "./storage";
import { hubMous } from "@shared/schema";
import { eq, and, inArray } from "drizzle-orm";

// Per-IP rate limit for paid-AI / research-calling endpoints. Mirrors the
// pattern used by translate-routes, college-access-ai-routes, and rag-engine.
// Trust-proxy is set in replitAuth.ts so req.ip reflects the trusted reverse
// proxy's client address, not a caller-supplied header.
const NSF_RATE_WINDOW_MS = 60 * 1000;
const NSF_RATE_LIMIT = 8; // requests per minute per IP per endpoint bucket
const nsfRateMap = new Map<string, { count: number; resetAt: number }>();
function nsfRateLimit(bucket: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    const key = `${bucket}:${ip}`;
    const now = Date.now();
    const entry = nsfRateMap.get(key);
    if (!entry || now > entry.resetAt) {
      nsfRateMap.set(key, { count: 1, resetAt: now + NSF_RATE_WINDOW_MS });
      return next();
    }
    if (entry.count >= NSF_RATE_LIMIT) {
      return res.status(429).json({ error: "Rate limit exceeded. Try again in a minute." });
    }
    entry.count++;
    next();
  };
}

export function registerLoiRoutes(app: Express): void {
  // List all jurisdictions for the workbench dropdown.
  app.get("/api/nsf/jurisdictions", (_req, res) => {
    res.json(JURISDICTIONS);
  });

  // Snapshot for a given state: jurisdiction + federal partners + state programs.
  app.get("/api/nsf/state/:code", (req, res) => {
    const code = String(req.params.code || "").toUpperCase();
    const j = getJurisdiction(code);
    if (!j) return res.status(404).json({ error: "Unknown jurisdiction" });
    const fp = getFederalPartners(code);
    const programs = STATE_PROGRAMS.filter(p => p.state === code);
    res.json({ jurisdiction: j, federalPartners: fp, programs });
  });

  // Live intelligence (Perplexity-grounded). Cached 24h.
  app.get("/api/nsf/intelligence/:code", async (req, res) => {
    const code = String(req.params.code || "").toUpperCase();
    if (!getJurisdiction(code)) return res.status(404).json({ error: "Unknown jurisdiction" });
    const bundle = await intelligenceBundle(code);
    res.json({ stateCode: code, ...bundle, budget: budgetStatus() });
  });

  // Lead-org enrichment (separate, optional).
  app.post("/api/nsf/intelligence/:code/lead-org", nsfRateLimit("lead-org"), async (req, res) => {
    const code = String(req.params.code || "").toUpperCase();
    const orgName = String(req.body?.orgName ?? "").trim();
    if (!orgName) return res.status(400).json({ error: "orgName required" });
    const finding = await research(code, "lead_org_context", { orgName });
    res.json({ finding, budget: budgetStatus() });
  });

  // Generate the LOI markdown.
  app.post("/api/nsf/generate-loi", nsfRateLimit("generate-loi"), async (req, res) => {
    const code = String(req.body?.stateCode ?? "").toUpperCase();
    const j = getJurisdiction(code);
    if (!j) return res.status(400).json({ error: "Unknown jurisdiction" });
    const leadOrg = String(req.body?.leadOrg ?? "").trim();
    if (!leadOrg) return res.status(400).json({ error: "leadOrg required" });
    const includeLive = Boolean(req.body?.includeLive ?? true);

    let partners: LoiPartner[] = Array.isArray(req.body?.partners) ? req.body.partners : [];
    // Auto-pull MOU partners (outreached / committed / signed) from DB if none provided.
    if (partners.length === 0) {
      const dbMous = await db.select().from(hubMous).where(and(
        eq(hubMous.hubStateCode, code),
        inArray(hubMous.status, ["outreached", "letter_sent", "committed", "signed"]),
      ));
      partners = dbMous.map(m => ({
        org: m.partnerOrg,
        role: `${m.partnerRole} (${m.status})`,
        contact: m.contactEmail || m.contactName || undefined,
      }));
    }
    let live;
    if (includeLive) {
      const b = await intelligenceBundle(code);
      live = {
        aiInitiatives: { text: b.aiInitiatives.text, citations: b.aiInitiatives.citations },
        recentFederalAwards: { text: b.recentFederalAwards.text, citations: b.recentFederalAwards.citations },
        workforcePrograms: { text: b.workforcePrograms.text, citations: b.workforcePrograms.citations },
        retrievedAt: b.aiInitiatives.retrievedAt,
      };
    }

    const result = generateHubLoi({
      stateCode: code,
      leadOrg,
      leadOrgUei: req.body?.leadOrgUei,
      leadOrgPi: req.body?.leadOrgPi,
      partners,
      live,
    });
    res.json(result);
  });
}
