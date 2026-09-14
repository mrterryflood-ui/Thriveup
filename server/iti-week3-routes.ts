// Week 3 ITI routes: convening rail (named co-authorship), stipend ledger,
// credentialing referrals, public "Seen Work" feed, compliance-matrix helper.
// Admin endpoints require true admin (Iron Rule #8); public seen-work is
// gated by per-invitee nameMePublicly consent.

import type { Express, Request, Response, NextFunction } from "express";
import { db } from "./storage";
import {
  integrationInvitations,
  invitationConsents,
  recognitionEvents,
  conveningInvitations,
  stipendPayouts,
  complianceMatrixItems,
  insertConveningInvitationSchema,
  insertStipendPayoutSchema,
} from "@shared/schema";
import { and, desc, eq, sql, inArray } from "drizzle-orm";
import { z } from "zod";

function getUser(req: Request): any { return (req as any).user; }
function isAdmin(req: Request): boolean {
  const u = getUser(req);
  return !!u && u.role === "admin";
}
function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!getUser(req)) return res.status(401).json({ error: "Unauthorized" });
  if (isAdmin(req)) return next();
  return res.status(403).json({ error: "Admin access required" });
}
function actorId(req: Request): string | undefined {
  const u = getUser(req);
  return u?.claims?.sub || u?.id;
}

// Credentialing referrals — pathways must be REAL, not aspirational (Iron Rule #8).
// Per-surface registry of credentials shadow-workers can pursue with our help.
// Keeping static for Week 3; admin UI to mutate is Week 4.
const CREDENTIALING_REFERRALS: Record<string, Array<{
  credential: string;
  body: string;
  url: string;
  costNote: string;
  timeNote: string;
  weHelpWith: string;
}>> = {
  "voice-project": [
    { credential: "Community Health Worker (CHW) Texas Certification", body: "Texas DSHS",
      url: "https://www.dshs.texas.gov/chw", costNote: "$0 application fee; $35 cert fee",
      timeNote: "160 hr training + exam (10 weeks part-time)", weHelpWith: "Training stipend, exam fee, recognition of prior promotora work toward 160 hrs" },
    { credential: "Texas Registered Family Home Daycare", body: "Texas HHSC Child Care Licensing",
      url: "https://www.hhs.texas.gov/regulations/forms/family-home-registration",
      costNote: "$35 application fee", timeNote: "4–8 weeks to register",
      weHelpWith: "Fee + paperwork + 8-hr pre-service training cost-share; bilingual application help" },
  ],
  "foster-intake": [
    { credential: "Texas Foster Parent Verification (kin/fictive-kin)", body: "Texas DFPS",
      url: "https://www.dfps.texas.gov/Adoption_and_Foster_Care/Get_Started/foster_apply.asp",
      costNote: "Free", timeNote: "Home study + 35 hr training (3–6 mo)",
      weHelpWith: "Training stipend, transportation, document gathering" },
  ],
  "lifebridge": [
    { credential: "Community Health Worker (CHW)", body: "Texas DSHS",
      url: "https://www.dshs.texas.gov/chw", costNote: "$35", timeNote: "160 hr + exam",
      weHelpWith: "Training stipend, recognition of prior promotora hours" },
  ],
  "justice-hub": [
    { credential: "Texas Peer Recovery Support Specialist (PRSS)", body: "Texas Certification Board",
      url: "https://www.tcbap.org/page/PeerCertification", costNote: "$50–$200",
      timeNote: "46 hr training + 250 hr supervised practice + exam",
      weHelpWith: "Training stipend, exam fee, supervised-practice placement" },
  ],
  "trade-sims": [
    { credential: "Registered Apprenticeship (DOL)", body: "US DOL / TWC",
      url: "https://www.apprenticeship.gov", costNote: "Earn-while-learning, $0 to start",
      timeNote: "1–6 year program", weHelpWith: "Sponsor matching, prior-learning credit, tool stipend" },
  ],
  "wph": [
    { credential: "Community Health Worker (CHW)", body: "Texas DSHS",
      url: "https://www.dshs.texas.gov/chw", costNote: "$35", timeNote: "160 hr + exam",
      weHelpWith: "Training stipend, recognition of informal caregiving hours" },
  ],
};

export function registerItiWeek3Routes(app: Express) {
  // === Convening rail (admin) ===
  app.post("/api/iti/admin/convenings", requireAdmin, async (req: Request, res: Response) => {
    try {
      const parsed = insertConveningInvitationSchema.parse({ ...req.body, invitedByActorId: actorId(req) });
      const [row] = await db.insert(conveningInvitations).values(parsed).returning();
      await db.insert(recognitionEvents).values({
        invitationId: row.invitationId,
        eventType: "invited",
        description: `Invited to ${row.conveningType}: ${row.title}`,
        actorRole: "admin", actorId: actorId(req),
        surfaceRef: row.id,
        payloadJson: { proposedRole: row.proposedRole, proposedStipendCents: row.proposedStipendCents },
      });
      res.json({ convening: row });
    } catch (e: any) { res.status(400).json({ error: e.message ?? "Invalid convening" }); }
  });
  app.get("/api/iti/admin/convenings", requireAdmin, async (req: Request, res: Response) => {
    const rows = await db.select().from(conveningInvitations).orderBy(desc(conveningInvitations.createdAt)).limit(200);
    res.json({ convenings: rows });
  });
  app.patch("/api/iti/admin/convenings/:id", requireAdmin, async (req: Request, res: Response) => {
    const { id } = req.params;
    const allowedStatus = new Set(["invited", "accepted", "declined", "completed"]);
    const status = req.body?.status;
    if (status && !allowedStatus.has(status)) return res.status(400).json({ error: "Invalid status" });
    const patch: any = { updatedAt: new Date() };
    if (status) patch.status = status;
    if (typeof req.body?.inviteeResponse === "string") patch.inviteeResponse = req.body.inviteeResponse;
    if (status === "accepted" || status === "declined" || status === "completed") patch.respondedAt = new Date();
    const [row] = await db.update(conveningInvitations).set(patch).where(eq(conveningInvitations.id, id as string)).returning() as any[];
    if (!row) return res.status(404).json({ error: "Not found" });
    if (status === "completed") {
      await db.insert(recognitionEvents).values({
        invitationId: row.invitationId, eventType: "co-authored",
        description: `Completed ${row.conveningType}: ${row.title}`,
        actorRole: "admin", actorId: actorId(req), surfaceRef: row.id,
      });
    }
    res.json({ convening: row });
  });

  // === Stipend ledger (admin) ===
  app.post("/api/iti/admin/stipends", requireAdmin, async (req: Request, res: Response) => {
    try {
      const parsed = insertStipendPayoutSchema.parse({ ...req.body, loggedByActorId: actorId(req) });
      const [row] = await db.insert(stipendPayouts).values(parsed).returning();
      await db.insert(recognitionEvents).values({
        invitationId: row.invitationId, eventType: "paid",
        description: `${row.paymentMethod} payout $${(row.amountCents / 100).toFixed(2)} — ${row.rationale.slice(0, 200)}`,
        actorRole: "admin", actorId: actorId(req), surfaceRef: row.id,
        payloadJson: { amountCents: row.amountCents, externalRef: row.externalRef ?? null },
      });
      res.json({ stipend: row });
    } catch (e: any) { res.status(400).json({ error: e.message ?? "Invalid stipend" }); }
  });
  app.get("/api/iti/admin/stipends", requireAdmin, async (req: Request, res: Response) => {
    const rows = await db.select().from(stipendPayouts).orderBy(desc(stipendPayouts.createdAt)).limit(500);
    const total = rows.reduce((s, r) => s + (r.amountCents ?? 0), 0);
    res.json({ stipends: rows, totalCents: total });
  });

  // === Credentialing referrals (public, read-only) ===
  app.get("/api/iti/credentialing/:surface", (req: Request, res: Response) => {
    const surface = String(req.params.surface ?? "");
    const list = CREDENTIALING_REFERRALS[surface] ?? [];
    res.json({ surface, referrals: list });
  });

  // === Public Seen Work feed ===
  // ONLY surfaces invitees who have toggled nameMePublicly=true. No emails, no phones,
  // no work descriptions unless quoteMe=true. Surface filter is required.
  app.get("/api/iti/seen", async (req: Request, res: Response) => {
    const surface = String(req.query.surface ?? "").trim();
    if (!surface) return res.status(400).json({ error: "surface required" });
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? "20"), 10) || 20));
    const rows = await db
      .select({
        id: integrationInvitations.id,
        displayName: integrationInvitations.displayName,
        roles: integrationInvitations.workRolesSelfIdentified,
        region: integrationInvitations.region,
        zipCode: integrationInvitations.zipCode,
        communityContext: integrationInvitations.communityContext,
        workDescription: integrationInvitations.workDescription,
        createdAt: integrationInvitations.createdAt,
        nameMePublicly: invitationConsents.nameMePublicly,
        quoteMe: invitationConsents.quoteMe,
      })
      .from(integrationInvitations)
      .innerJoin(invitationConsents, eq(invitationConsents.invitationId, integrationInvitations.id))
      .where(and(
        eq(integrationInvitations.surface, surface),
        eq(integrationInvitations.status, "invited"),
        eq(invitationConsents.nameMePublicly, true),
      ))
      .orderBy(desc(integrationInvitations.createdAt))
      .limit(limit);

    const cleaned = rows.map((r) => ({
      id: r.id,
      displayName: r.displayName || "A community member who asked to be named",
      roles: r.roles ?? [],
      region: r.region || null,
      zipCode: r.zipCode ? r.zipCode.slice(0, 3) + "**" : null,
      quote: r.quoteMe ? (r.workDescription || null) : null,
      seenSince: r.createdAt,
    }));
    res.json({ surface, members: cleaned });
  });

  // === Compliance matrix helper: "Lived Experts Compensated & Named" ===
  // Auto-insert the standard section into a grant's complianceMatrixItems.
  app.post("/api/iti/admin/grants/:grantId/lived-experts-section", requireAdmin, async (req: Request, res: Response) => {
    const grantId = String(req.params.grantId);
    const orgId = String(req.body?.orgId ?? "").trim();
    if (!orgId) return res.status(400).json({ error: "orgId required" });

    // Count actual evidence backing this section.
    const [{ inviteesCount } = { inviteesCount: 0 }] = await db.execute<{ inviteesCount: number }>(
      sql`SELECT COUNT(*)::int AS "inviteesCount" FROM ${integrationInvitations} WHERE status = 'invited'`
    ) as any;
    const [{ paidCount, paidCents } = { paidCount: 0, paidCents: 0 }] = await db.execute<{ paidCount: number; paidCents: number }>(
      sql`SELECT COUNT(*)::int AS "paidCount", COALESCE(SUM(amount_cents),0)::int AS "paidCents" FROM ${stipendPayouts} WHERE status IN ('sent','received-confirmed')`
    ) as any;
    const [{ namedCount } = { namedCount: 0 }] = await db.execute<{ namedCount: number }>(
      sql`SELECT COUNT(*)::int AS "namedCount" FROM ${invitationConsents} WHERE name_me_publicly = true`
    ) as any;

    const evidence = `As of this submission, ${inviteesCount} community members have self-identified as informal/uncredentialed workers through our Integration through Invitation (ITI) primitive; ${namedCount} have consented to be publicly named; ${paidCount} stipend payouts totaling $${(paidCents/100).toFixed(2)} have been disbursed for their contributions to date.`;

    const sectionText = `In response to reviewer expectations that proposers center lived expertise and avoid extractive engagement, TCAF maintains an Integration through Invitation (ITI) primitive across every community-issue-solving surface in the platform. ITI guarantees: (a) self-identification with no credential check, (b) eight separately-toggled consents all defaulting OFF (anti-extraction posture), (c) an always-on witness loop recording how each contribution is acknowledged, credited, compensated, and routed, (d) a real stipend and credentialing-referral pathway (CHW, Family Home Daycare, Peer Recovery Support Specialist, Registered Apprenticeship), and (e) named co-authorship on deliverables where the contribution materially shapes the work. AI is prohibited by codified rule (Iron Rule #8) from summarizing any ITI-invitee text without that invitee's explicit aggregate-data consent. ${evidence} [Evidence: docs/agent-memory/topics/integration-through-invitation.md; server/integration-invitation-routes.ts assertItiConsent gate; live counts via /api/iti/admin endpoints.]`;

    const [item] = await db.insert(complianceMatrixItems).values({
      orgId,
      grantId,
      reqNumber: "ITI-LE-1",
      rfpSection: "Community engagement / shared power — Lived Experts Compensated & Named",
      sectionType: "M",
      requirementVerbatim: "Demonstrate non-extractive engagement of community members with lived/practitioner expertise, including real compensation and credit pathways.",
      requirementType: "shall",
      sourceKind: "base",
      evidenceRef: "docs/agent-memory/topics/integration-through-invitation.md; server/integration-invitation-routes.ts (assertItiConsent gate); server/iti-week3-routes.ts (convening + stipend ledger); live counts via /api/iti/admin endpoints",
      workaroundProposed: "",
      answeringSectionName: "Lived Experts Compensated & Named",
      status: "covered",
      confidence: 90,
    } as any).returning();
    // Attach the doctrine paragraph + live evidence as a structured payload for downstream renderers
    res.json({ item, sectionText, evidence: { inviteesCount, namedCount, paidCount, paidCents } });
  });
}
