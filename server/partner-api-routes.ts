import type { Express, Request, Response, NextFunction } from "express";
import { getLastBriefProbeResult } from "./community-brief-probe";
import { hasValidCommunityEvidence } from "./community-evidence";
import { db, storage } from "./storage";
import {
  partnerApiKeys, partnerApiAuditLog, partnerInboundData, ecosystemPlatforms,
  programs, partnerOutcomeSubmissions,
  studentProgress, academyPantherPower, pathwayPlans,
  attendanceLogs, earlyWarningFlags,
  partnerWebhooks, fosterYouthIntakes,
  certificates, briefSubscriptions,
  tradeSimsLessonProgress, tradeSimsLessons, tradeSimsTrades,
  inboundVerificationLog,
  chainwebScenarios, chainwebNodes, chainwebEdges, chainwebCalculations, chainwebNarratives,
  insertChainwebScenarioSchema,
  yhsiYouthParticipants, yhsiOutcomeSnapshots, yhsiReferrals,
} from "@shared/schema";
import {
  buildChainwebScenario, calculateChainwebROI, generateChainwebNarrative,
} from "./chainweb-engine";
import { CHAINWEB_COEFFICIENTS, CHAINWEB_TEMPLATES } from "./chainweb-coefficients";
import { eq, desc, and, sql, gte } from "drizzle-orm";
import { AI_TRANSLATION_LANGUAGE_COUNT, GEOGRAPHIC_REACH } from "@shared/canonical-claims";
import { SUPPRESSION_FLOOR, suppress } from "./yhsi-routes";
import { fireWebhook } from "./webhook-dispatcher";
import crypto, { randomUUID, randomBytes } from "crypto";
import { verifyInboundPayload, hasBlockingRejection, recordInboundVerification, rejectionsToCorrectionNote, type InboundSchema } from "./inbound-verification";

// Schema for POST /api/partner/v1/heartbeat.
// message: optional free-text status note (max 500 chars)
// status:  optional machine-readable status flag
// meta:    optional object — we don't validate its internals (opaque partner content)
//          but the field must be absent or a non-null object.
// version: optional semver / build-tag string (max 100 chars)
const HEARTBEAT_SCHEMA: InboundSchema = {
  message: { type: "string", maxLength: 500 },
  status:  { type: "enum",   enum: ["ok", "degraded", "error", "maintenance"] },
  version: { type: "string", maxLength: 100 },
};

// Per-dataType field schemas for POST /api/partner/v1/push. Only dataTypes
// with well-known shapes are checked here; unlisted types are stored as-is
// (their payload is opaque partner content, not something this endpoint
// interprets or feeds into AI/community-brief context) but every dataType
// is still logged to the raw audit trail below regardless of schema
// coverage.
const PARTNER_PUSH_SCHEMAS: Record<string, InboundSchema> = {
  grant_outcome: {
    grantId:     { type: "string", maxLength: 200 },
    grantTitle:  { type: "string", maxLength: 500 },
    status:      { type: "enum", enum: ["awarded", "submitted", "declined", "pending", "withdrawn"], required: true },
    awardAmount: { type: "number", min: 0, max: 1_000_000_000 },
  },
  metric: {
    name:  { type: "string", maxLength: 200 },
    value: { type: "number", min: -1_000_000_000, max: 1_000_000_000 },
  },
  intervention: {
    name:           { type: "string", maxLength: 300 },
    roiImplication: { type: "string", maxLength: 500 },
  },
};

// Minimum cell floor for aggregate suppression (mirrors conductor MIN_AGGREGATE_CELL)
const MIN_AGGREGATE_CELL = 5;

function hashKey(plaintext: string): string {
  return crypto.createHash("sha256").update(plaintext).digest("hex");
}

function generateKey(): { plaintext: string; prefix: string; hash: string } {
  const raw = crypto.randomBytes(32).toString("hex");
  const plaintext = `tcaf_${raw}`;
  const prefix = plaintext.slice(0, 14);
  return { plaintext, prefix, hash: hashKey(plaintext) };
}

export async function requirePartnerAuth(req: Request, res: Response, next: NextFunction) {
  const ecosystemKey = req.headers["x-ecosystem-key"] as string;
  const partnerKeyRaw = (req.headers["x-partner-key"] as string) || (req.headers["authorization"] || "").replace("Bearer ", "");

  // ── Path A: Ecosystem sibling platform (your own platforms) ─────────────
  if (ecosystemKey) {
    const [platform] = await db.select({
      id: ecosystemPlatforms.id,
      name: ecosystemPlatforms.name,
      domain: ecosystemPlatforms.domain,
      role: ecosystemPlatforms.role,
    }).from(ecosystemPlatforms).where(eq(ecosystemPlatforms.apiKey, ecosystemKey));

    if (!platform) {
      return res.status(401).json({ error: "Invalid ecosystem key." });
    }

    // Ecosystem platforms get all scopes — they are trusted siblings
    (req as any).partnerKey = {
      partnerName: platform.name,
      scopes: ["content:read","platforms:read","community:read","benefits:read","impact:read","student:read","inbound:write"],
      isEcosystemPlatform: true,
      platformId: platform.id,
    };

    await db.insert(partnerApiAuditLog).values({
      keyId: platform.id,
      keyPrefix: `eco_${platform.id.slice(0, 10)}`,
      partnerName: platform.name,
      endpoint: req.path,
      method: req.method,
      statusCode: 200,
      ip: (req.headers["x-forwarded-for"] as string) || req.ip || "unknown",
      userAgent: (req.headers["user-agent"] || "").slice(0, 299),
    }).catch(() => {});

    return next();
  }

  // ── Path B: External partner key ─────────────────────────────────────────
  // Most external keys are generated by ThriveUp and use the tcaf_ prefix.
  // A pinned inbound credential may be generated by the partner platform
  // instead (for example ChildCORE's key), so exact hash lookup is the
  // authority. The key must still be active and present in our DB.
  if (!partnerKeyRaw) {
    return res.status(401).json({
      error: "Authentication required. Include x-ecosystem-key or x-partner-key.",
    });
  }

  const hash = hashKey(partnerKeyRaw);
  const [key] = await db.select().from(partnerApiKeys).where(and(eq(partnerApiKeys.keyHash, hash), eq(partnerApiKeys.active, true)));
  if (!key) {
    return res.status(401).json({ error: "Invalid or revoked partner key." });
  }

  (req as any).partnerKey = key;

  await db.insert(partnerApiAuditLog).values({
    keyId: key.id,
    keyPrefix: key.keyPrefix,
    partnerName: key.partnerName,
    endpoint: req.path,
    method: req.method,
    statusCode: 200,
    ip: (req.headers["x-forwarded-for"] as string) || req.ip || "unknown",
    userAgent: (req.headers["user-agent"] || "").slice(0, 299),
  }).catch(() => {});

  await db.update(partnerApiKeys)
    .set({ usageCount: key.usageCount + 1, lastUsedAt: new Date() })
    .where(eq(partnerApiKeys.id, key.id))
    .catch(() => {});

  next();
}

export function requireScope(scope: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key: any = (req as any).partnerKey;
    // Ecosystem platforms already have all scopes granted in requirePartnerAuth
    if (key?.isEcosystemPlatform) return next();
    if (!key?.scopes?.includes(scope)) {
      return res.status(403).json({ error: `This key does not have the '${scope}' scope.` });
    }
    next();
  };
}

// Admin auth. Roles live in the users table and are NEVER trusted from
// req.user/session — we resolve the id and hit the DB, matching the YHSI
// requireStaff pattern in server/yhsi-routes.ts. Session presence alone is
// insufficient; any authenticated non-admin must be rejected with 403.
const ADMIN_ROLES = new Set(["admin", "teacher"]);

async function requireAdminKey(req: Request, res: Response, next: NextFunction) {
  // Resolve the caller's user id from the passport session / req.user.
  const user = (req as any).user;
  const session = (req as any).session;
  const userId: string | undefined =
    user?.claims?.sub || user?.id || session?.passport?.user?.claims?.sub || session?.passport?.user;

  if (!userId || typeof userId !== "string") {
    return res.status(401).json({ error: "Admin authentication required." });
  }

  try {
    const dbUser = await storage.getUser(userId);
    if (!dbUser || !ADMIN_ROLES.has(dbUser.role)) {
      return res.status(403).json({ error: "Admin access required." });
    }
    return next();
  } catch (err) {
    console.error("[PartnerAPI] admin role lookup failed:", err);
    return res.status(500).json({ error: "Admin authorization check failed." });
  }
}

export function registerPartnerApiRoutes(app: Express) {

  // ── Startup: auto-provision pinned partner keys from env secrets ───────────
  // Runs once on boot. Safe to re-run — skips if key already present.
  // This ensures keys provisioned in dev are automatically present in production
  // after deploy without requiring a manual DB insert on the prod replica.
  ;(async () => {
    try {
      const PINNED: Array<{
        envVar: string;
        partnerName: string;
        partnerEmail: string;
        scopes: string[];
        notes: string;
        requireTcafPrefix?: boolean;
      }> = [
        {
          envVar: "THRIVEUP_PARTNER_KEY",
          partnerName: "GrantPathPro",
          partnerEmail: "terryflood@thrivingcommunitiesforall.com",
          scopes: ["community:read", "impact:read", "benefits:read", "inbound:write"],
          notes: "Pinned key — auto-provisioned from THRIVEUP_PARTNER_KEY secret",
          requireTcafPrefix: true,
        },
        {
          // This is the key ChildCORE sends when calling ThriveUp inbound.
          // ThriveUp issues this key (or accepts whatever ChildCORE generates)
          // and stores it here so ChildCORE can authenticate against the Partner API.
          envVar: "THRIVEUP_API_KEY",
          partnerName: "ChildCORE",
          partnerEmail: "terryflood@thrivingcommunitiesforall.com",
          scopes: ["community:read", "impact:read", "inbound:write", "student:read", "chainweb:read", "yhsi:read"],
          notes: "ChildCORE bidirectional key — auto-provisioned from THRIVEUP_API_KEY secret",
          requireTcafPrefix: false,
        },
      ];

      for (const pin of PINNED) {
        const plaintext = process.env[pin.envVar];
        if (!plaintext || (pin.requireTcafPrefix && !plaintext.startsWith("tcaf_"))) continue;

        const hash = hashKey(plaintext);
        const existing = await db.select({
          id: partnerApiKeys.id,
          scopes: partnerApiKeys.scopes,
        })
          .from(partnerApiKeys)
          .where(eq(partnerApiKeys.keyHash, hash));

        if (existing.length === 0) {
          const prefix = plaintext.slice(0, 14);
          await db.insert(partnerApiKeys).values({
            partnerName: pin.partnerName,
            partnerEmail: pin.partnerEmail,
            keyHash: hash,
            keyPrefix: prefix,
            scopes: pin.scopes,
            active: true,
            notes: pin.notes,
          });
          console.log(`[PartnerAPI] Auto-provisioned pinned key for ${pin.partnerName} (${prefix}...)`);
        } else {
          const currentScopes = Array.isArray(existing[0].scopes) ? existing[0].scopes : [];
          const scopesChanged =
            currentScopes.length !== pin.scopes.length ||
            pin.scopes.some((scope) => !currentScopes.includes(scope));
          if (scopesChanged) {
            await db.update(partnerApiKeys)
              .set({
                scopes: pin.scopes,
                active: true,
                notes: pin.notes,
              })
              .where(eq(partnerApiKeys.id, existing[0].id));
            console.log(`[PartnerAPI] Reconciled scopes for pinned key ${pin.partnerName}`);
          } else {
            console.log(`[PartnerAPI] Pinned key for ${pin.partnerName} already present — skipping.`);
          }
        }
      }
    } catch (err) {
      console.error("[PartnerAPI] Startup key provisioning error:", err);
    }
  })();

  // ── Public schema docs (no auth — external devs can self-onboard) ─────────

  app.get("/api/partner/v1/docs", (_req, res) => {
    res.json({
      gateway: "ThriveUp Academy Partner API",
      version: "1.0",
      baseUrl: "/api/partner/v1",
      auth: {
        option_A_ecosystem_platforms: {
          header: "x-ecosystem-key",
          value: "<your platform's ecosystem API key from the DB>",
          who: "The Collaborative Advocate Foundation's own sibling platforms (WPH, Sankofa, LifeBridge, etc.)",
          scopes: "all — no restrictions",
          setup: "Zero setup. Your ecosystem key is already provisioned. Pass it in x-ecosystem-key.",
        },
        option_B_external_partners: {
          header: "x-partner-key",
          format: "tcaf_<hex>",
          who: "External organizations, third-party sites",
          setup: "Email terryflood@thrivingcommunitiesforall.com to request a scoped key.",
        },
      },
      scopes: [
        { scope: "content:read",    description: "Ecosystem platform list and content export" },
        { scope: "platforms:read",  description: "Live platform health status and metadata" },
        { scope: "community:read",  description: "Community impact metrics, service-platform summary, and community brief generation" },
        { scope: "benefits:read",   description: "Public benefits program catalog" },
        { scope: "impact:read",     description: "Community intervention impact scores and outcome data" },
        { scope: "student:read",    description: "AGGREGATE, suppression-floored youth metrics only — no per-student PII. See students/* endpoints." },
        { scope: "chainweb:read",    description: "Chainweb ROI coefficients, templates, scenarios, calculations, and narratives" },
        { scope: "yhsi:read",        description: "AGGREGATE, floor-5-suppressed YHSI metrics and outcome summaries" },
        { scope: "inbound:write",   description: "POST referrals, events, metrics, or alerts into ThriveUp" },
        { scope: "outcomes:read",   description: "Read aggregated outcome data — trade sim completion counts, employer-ready metrics (no PII, aggregate only)" },
        { scope: "certs:read",      description: "Verify and read certificate records — check whether a cert ID is valid and retrieve holder/trade/issued info" },
      ],
      endpoints: [
        "GET  /api/partner/v1/docs              — this schema (public)",
        "GET  /api/partner/v1/health            — auth check + key info (any scope)",
        "GET  /api/partner/v1/platforms         — live platform list (platforms:read)",
        "GET  /api/partner/v1/export            — content export (content:read)",
        "GET  /api/partner/v1/community         — community service summary (community:read)",
        "GET  /api/partner/v1/community-brief   — on-demand community brief for any geography (community:read); query: location (required), populationSize?, timeHorizon?",
        "GET  /api/partner/v1/community-story   — aggregate community story pack for a geography (community:read)",
        "POST /api/partner/v1/community-brief/subscribe — subscribe to scheduled community briefs (community:read); body: {location, webhookUrl, frequency: 'daily'|'weekly'|'on-change'}",
        "GET  /api/partner/v1/benefits          — benefits program catalog (benefits:read)",
        "GET  /api/partner/v1/impact            — community impact metrics (impact:read)",
        "GET  /api/partner/v1/students/overview — AGGREGATE cohort metrics, suppression-floored (student:read)",
        "GET  /api/partner/v1/attendance/summary      — AGGREGATE attendance metrics, suppression-floored (student:read)",
        "GET  /api/partner/v1/early-warnings          — AGGREGATE early-warning counts, suppression-floored (student:read)",
        "GET  /api/partner/v1/pathways/overview       — AGGREGATE pathway distribution, suppression-floored (student:read)",
        "GET  /api/partner/v1/chainweb/coefficients   — evidence coefficients for ROI scenarios (chainweb:read)",
        "GET  /api/partner/v1/chainweb/templates      — quick-start ROI scenario templates (chainweb:read)",
        "POST /api/partner/v1/chainweb/scenarios      — create a partner-owned ROI scenario (chainweb:read)",
        "GET  /api/partner/v1/chainweb/scenarios/:id  — read a partner-owned ROI scenario (chainweb:read)",
        "POST /api/partner/v1/chainweb/scenarios/:id/calculate — calculate ROI scenario (chainweb:read)",
        "POST /api/partner/v1/chainweb/calculations/:id/narratives — generate scenario narrative (chainweb:read)",
        "GET  /api/partner/v1/yhsi/metrics            — aggregate YHSI metrics, floor-5 suppressed (yhsi:read)",
        "GET  /api/partner/v1/yhsi/outcomes-summary   — aggregate YHSI outcome milestones (yhsi:read)",
        "GET  /api/partner/v1/outcomes/trade-completions — AGGREGATE trade sim completion counts by trade slug, past 30/60/90 days (outcomes:read)",
        "GET  /api/partner/v1/certificates/verify/:certId — verify a trade certificate by ID (certs:read)",
        "POST /api/partner/v1/push              — push data to ThriveUp (inbound:write)",
        "POST /api/partner/v1/heartbeat         — platform keepalive (any scope)",
        "GET  /api/partner/v1/webhooks          — list your registered webhooks (any scope)",
        "POST /api/partner/v1/webhooks          — register a webhook; secret shown ONCE (any scope)",
        "DELETE /api/partner/v1/webhooks/:id    — deactivate a webhook (any scope)",
        "GET  /api/partner/v1/subscriptions     — list brief subscriptions for your key (community:read)",
        "DELETE /api/partner/v1/subscriptions/:id — deactivate a brief subscription (community:read)",
        "POST /api/partner/v1/foster-youth/refer — create foster youth intake on behalf of a youth (inbound:write)",
        "PATCH /api/referrals/:id/outcome — confirm enrollment for a referral your org received; requires inbound:write scope; org-name on key must match referral's target org",
      ],
      exampleRequests: {
        communityBrief: {
          description: "A county health dept queries a community brief for their service area",
          request: "GET /api/partner/v1/community-brief?location=78741&populationSize=50000&timeHorizon=10",
          headers: { "x-partner-key": "tcaf_..." },
          noteOnRPLICE: "RPLICE internal intelligence block is NOT included for partner keys — aggregate public data only.",
        },
        certVerify: {
          description: "A WIB case manager verifies a learner's trade cert without logging in",
          request: "GET /api/partner/v1/certificates/verify/cert-uuid-here",
          headers: { "x-partner-key": "tcaf_..." },
          response: { valid: true, certId: "...", holderName: "Jane Smith", trade: "trade-sim:electrical", issuedAt: "2024-01-15T10:00:00Z", verificationUrl: "/verify/cert-uuid-here" },
        },
        tradeCompletions: {
          description: "A workforce board tracks regional trade training volume over the past 30 days",
          request: "GET /api/partner/v1/outcomes/trade-completions?days=30",
          headers: { "x-partner-key": "tcaf_..." },
          response: { days: 30, suppressionNote: "Counts below 5 are suppressed (null)", completions: [{ tradeSlug: "electrical", count: 12 }] },
        },
        briefSubscribe: {
          description: "Subscribe to weekly community briefs for a location delivered to your webhook",
          request: "POST /api/partner/v1/community-brief/subscribe",
          body: { location: "Austin, TX", webhookUrl: "https://your-org.example.com/hooks/tcaf-brief", frequency: "weekly" },
          response: { subscriptionId: 1, message: "You will receive community briefs for Austin, TX weekly. Briefs will begin dispatching within 24 hours of activation." },
        },
        referralOrgConfirm_noKey: {
          description: "Your org received a referral. The CHW shared the orgConfirmUrl with you. POST to it — no API key needed.",
          request: "POST /api/referrals/org-confirm/<orgConfirmToken>",
          body: { status: "enrolled", benefitValueEstimate: 1500, notes: "Client enrolled in 12-month housing assistance program" },
          response: { id: "<referralId>", status: "enrolled", benefitValueEstimate: 1500, valueSource: "reported" },
          validStatuses: ["enrolled", "ineligible", "withdrew", "accepted"],
          valueSources: { reported: "you supplied benefitValueEstimate", default: "program default applied (enrolled, no estimate provided)", null: "non-enrolled outcome (ineligible / withdrew / accepted)" },
          note: "orgConfirmUrl is returned in the HTTP response when a staff user creates a referral: { referral: {...}, statusUrl, orgConfirmUrl }. It is NOT broadcast in the referral.created webhook (one-time capability token — staff must share it with your org securely).",
        },
        referralOrgConfirm_withKey: {
          description: "Your org has a tcaf_ partner key with inbound:write scope. Use PATCH to confirm programmatically. The partner name on the key must exactly match the referral's target org name.",
          request: "PATCH /api/referrals/<referralId>/outcome",
          headers: { "x-partner-key": "tcaf_..." },
          body: { status: "enrolled", benefitValueEstimate: 1500, notes: "Client enrolled" },
          response: { id: "<referralId>", status: "enrolled", benefitValueEstimate: 1500, valueSource: "reported" },
          acceptedFields: {
            status: "REQUIRED — enrolled | ineligible | withdrew | accepted",
            benefitValueEstimate: "OPTIONAL number — estimated dollar value of benefit delivered; used in funder impact reports",
            notes: "OPTIONAL string — free-text notes visible to the referring CHW",
          },
        },
      },
      webhookEvents: [
        {
          event: "referral.created",
          description: "Fired when a CHW creates a new referral and your org is the target. Delivery is org-scoped: only hooks registered by a tcaf_ key whose partner name matches the referral's orgName receive this event — your key will never receive events for referrals sent to a different org. NOTE: orgConfirmUrl is NOT included in this payload — it is a one-time capability token returned only in the HTTP response to the creating staff user and must be shared with your org directly (e.g. via secure message or email).",
          payloadShape: {
            event: "referral.created",
            timestamp: "<ISO 8601>",
            tcaf_version: "1.0",
            referralId: "<string>",
            programCode: "<string|null>",
            orgName: "<string|null>",
            status: "pending",
            funderId: "<string|null>",
          },
          orgConfirmUrlNote: "When your org receives a referral, the creating CHW holds an orgConfirmUrl of the form /org-confirm/<token>. They should share it with you. POST to that URL (no auth required) or PATCH /api/referrals/:id/outcome (requires your tcaf_ key with inbound:write scope) to confirm the outcome.",
          confirmationMethods: {
            option1_postToOrgConfirmUrl: {
              description: "No API key needed — use the capability URL the CHW shares with you",
              method: "POST",
              url: "https://thriveup.app/api/referrals/org-confirm/<orgConfirmToken>",
              body: { status: "enrolled", benefitValueEstimate: 1500, notes: "Client enrolled in housing assistance program" },
              validStatuses: ["enrolled", "ineligible", "withdrew", "accepted"],
              note: "Once resolved, the referral is immutable — a 409 is returned if you attempt to update it again.",
            },
            option2_patchWithPartnerKey: {
              description: "Programmatic — use your tcaf_ key; org name on key must match the referral's target org",
              method: "PATCH",
              url: "https://thriveup.app/api/referrals/<referralId>/outcome",
              headers: { "x-partner-key": "tcaf_..." },
              body: { status: "enrolled", benefitValueEstimate: 1500, notes: "Client enrolled" },
              validStatuses: ["enrolled", "ineligible", "withdrew", "accepted"],
              acceptedFields: {
                status: "REQUIRED — one of: enrolled | ineligible | withdrew | accepted",
                benefitValueEstimate: "OPTIONAL — estimated dollar value of the benefit delivered (e.g. 1500 for a $1,500 housing grant); used in funder impact reports",
                notes: "OPTIONAL — free-text notes visible to the CHW",
              },
            },
          },
        },
        {
          event: "referral.outcome",
          description: "Fired when an org confirms a referral outcome — either via POST /api/referrals/org-confirm/:token or PATCH /api/referrals/:id/outcome. Delivery is org-scoped: only hooks registered by a tcaf_ key whose partner name matches the referral's orgName receive this event.",
          payloadShape: {
            event: "referral.outcome",
            timestamp: "<ISO 8601>",
            tcaf_version: "1.0",
            referralId: "<string>",
            status: "enrolled | ineligible | withdrew | accepted",
            benefitValueEstimate: "<number|null — dollar value of benefit delivered>",
            valueSource: "\"reported\" (org supplied a value) | \"default\" (program default applied) | null (no estimate — non-enrolled outcome)",
            via: "\"org-confirm\" (present only when confirmed via the orgConfirmUrl POST path; absent for staff/partner-key PATCH updates)",
          },
        },
        {
          event: "foster_youth.outcome",
          description: "Fired when a foster youth intake outcome is reported via POST /api/foster-youth/intake/:id/report-outcome",
          payloadShape: {
            event: "foster_youth.outcome",
            timestamp: "<ISO 8601>",
            tcaf_version: "1.0",
            intakeId: "<string>",
            referredBy: "<string|null>",
            location: "<2-letter state code|null>",
            completedPlans: { has30Day: "<boolean>", has60Day: "<boolean>" },
            immediateNeedsAddressed: ["<need_id>", "..."],
            reportedAt: "<ISO 8601>",
          },
        },
        {
          event: "trade_cert.issued",
          description: "Fired when a trade certificate is issued to a learner",
          payloadShape: {
            event: "trade_cert.issued",
            timestamp: "<ISO 8601>",
            tcaf_version: "1.0",
            certId: "<string>",
            trade: "<string>",
            issuedAt: "<ISO 8601>",
          },
        },
        {
          event: "community_brief.completed",
          description: "Fired when a community brief is generated",
          payloadShape: {
            event: "community_brief.completed",
            timestamp: "<ISO 8601>",
            tcaf_version: "1.0",
            zip: "<string>",
            overallScore: "<number>",
            completedAt: "<ISO 8601>",
          },
        },
      ],
      webhookSecurity: "All outbound webhook POSTs include X-TCAF-Signature: sha256=<hmac> — verify with your secret using HMAC-SHA256 over the raw JSON body.",
      deprecatedEndpoints: {
        note: "The /api/external/* endpoints are deprecated. Migrate to /api/partner/v1/* with a scoped tcaf_ key. Per-student detail endpoints (thrive/assessments/pathway by id) are REMOVED — see students/* aggregate note below.",
        studentDataNote: "Per-student youth records are no longer served over the partner API. Partner keys have no tenant/audience binding in the schema, so honoring an arbitrary :userId would expose any child's records to any keyholder. All student:read endpoints now return AGGREGATE, suppression-floored data only.",
        mapping: {
          "GET /api/external/students/overview"         : "GET /api/partner/v1/students/overview (now AGGREGATE only)",
          "GET /api/external/students/:id/thrive"       : "REMOVED (410) — no per-student PII over partner API",
          "GET /api/external/students/:id/assessments"  : "REMOVED (410) — no per-student PII over partner API",
          "GET /api/external/students/:id/pathway"      : "REMOVED (410) — no per-student PII over partner API",
          "GET /api/external/attendance/summary"        : "GET /api/partner/v1/attendance/summary (now AGGREGATE only)",
          "GET /api/external/early-warnings"            : "GET /api/partner/v1/early-warnings (now AGGREGATE counts only)",
          "GET /api/external/reflections/recent"        : "REMOVED (410) — no per-student reflections over partner API",
          "GET /api/external/pathways/overview"         : "GET /api/partner/v1/pathways/overview (scope: student:read)",
          "POST /api/external/interventions/receive"    : "POST /api/partner/v1/push with dataType=intervention (scope: inbound:write)",
        },
      },
      rateLimit: "No hard rate limit currently. Please be respectful — bulk imports should be batched.",
      contact: "terryflood@thrivingcommunitiesforall.com",
    });
  });

  // ── Authenticated partner endpoints ───────────────────────────────────────

  app.get("/api/partner/v1/health", requirePartnerAuth, (req, res) => {
    const key: any = (req as any).partnerKey;
    res.json({
      status: "ok",
      partner: key.partnerName,
      scopes: key.scopes,
      timestamp: new Date().toISOString(),
      message: "ThriveUp Partner API is live. You are authenticated.",
    });
  });

  app.get("/api/partner/v1/export", requirePartnerAuth, requireScope("content:read"), async (req, res) => {
    try {
      const platforms = await db.select({
        id: ecosystemPlatforms.id,
        name: ecosystemPlatforms.name,
        description: ecosystemPlatforms.description,
        domain: ecosystemPlatforms.domain,
        role: ecosystemPlatforms.role,
        url: ecosystemPlatforms.url,
      }).from(ecosystemPlatforms).where(eq(ecosystemPlatforms.publicVisible, true));

      const records = platforms
        .filter(p => p.description)
        .map(p => ({
          id: `platform:${p.id}`,
          content: `${p.name}: ${p.description}`,
          metadata: {
            source: "thriveup-academy",
            type: "platform",
            domain: p.domain,
            role: p.role,
            url: p.url,
            exportedAt: new Date().toISOString(),
          },
        }));

      res.json({
        version: "1.0",
        exportedAt: new Date().toISOString(),
        count: records.length,
        records,
      });
    } catch (err) {
      res.status(500).json({ error: "Export failed." });
    }
  });

  app.get("/api/partner/v1/platforms", requirePartnerAuth, requireScope("platforms:read"), async (req, res) => {
    try {
      const platforms = await db.select({
        id: ecosystemPlatforms.id,
        name: ecosystemPlatforms.name,
        url: ecosystemPlatforms.url,
        domain: ecosystemPlatforms.domain,
        role: ecosystemPlatforms.role,
        healthStatus: ecosystemPlatforms.healthStatus,
      }).from(ecosystemPlatforms).where(eq(ecosystemPlatforms.publicVisible, true));

      res.json({ count: platforms.length, platforms });
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch platforms." });
    }
  });

  // ── Community data (community:read) ──────────────────────────────────────

  app.get("/api/partner/v1/community", requirePartnerAuth, requireScope("community:read"), async (_req, res) => {
    try {
      const platforms = await db.select({
        id: ecosystemPlatforms.id,
        name: ecosystemPlatforms.name,
        role: ecosystemPlatforms.role,
        domain: ecosystemPlatforms.domain,
        healthStatus: ecosystemPlatforms.healthStatus,
        description: ecosystemPlatforms.description,
      }).from(ecosystemPlatforms).where(eq(ecosystemPlatforms.publicVisible, true));

      const byDomain: Record<string, number> = {};
      const byRole: Record<string, number> = {};
      for (const p of platforms) {
        if (p.domain) byDomain[p.domain] = (byDomain[p.domain] || 0) + 1;
        if (p.role) byRole[p.role] = (byRole[p.role] || 0) + 1;
      }
      const online = platforms.filter(p => p.healthStatus === "healthy" || p.healthStatus === "ok").length;

      res.json({
        summary: {
          totalPlatforms: platforms.length,
          platformsOnline: online,
          platformsByDomain: byDomain,
          platformsByRole: byRole,
          languagesSupported: AI_TRANSLATION_LANGUAGE_COUNT,
          languagesNote: "Machine translation via the AI layer — not human-verified translations.",
          geographicReach: GEOGRAPHIC_REACH,
          exportedAt: new Date().toISOString(),
        },
        platforms,
      });
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch community summary." });
    }
  });

  // ── Benefits program catalog (benefits:read) ──────────────────────────────

  app.get("/api/partner/v1/benefits", requirePartnerAuth, requireScope("benefits:read"), async (req, res) => {
    try {
      const limit = Math.min(parseInt((req.query.limit as string) || "100", 10), 500);
      const catalog = await db.select({
        id: programs.id,
        title: programs.title,
        description: programs.description,
        methodology: programs.methodology,
        status: programs.status,
        targetPopulation: programs.targetPopulation,
        geographicFocus: programs.geographicFocus,
      }).from(programs).limit(limit);
      res.json({ count: catalog.length, programs: catalog, exportedAt: new Date().toISOString() });
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch benefits catalog." });
    }
  });

  // ── Community impact metrics (impact:read) ────────────────────────────────

  app.get("/api/partner/v1/impact", requirePartnerAuth, requireScope("impact:read"), async (req, res) => {
    try {
      const limit = Math.min(parseInt((req.query.limit as string) || "50", 10), 200);
      const outcomes = await db.select({
        orgName: partnerOutcomeSubmissions.orgName,
        programName: partnerOutcomeSubmissions.programName,
        programType: partnerOutcomeSubmissions.programType,
        reportingPeriod: partnerOutcomeSubmissions.reportingPeriod,
        participantsServed: partnerOutcomeSubmissions.participantsServed,
        participantsCompleted: partnerOutcomeSubmissions.participantsCompleted,
        enteredEmployment: partnerOutcomeSubmissions.enteredEmployment,
        retainedEmployment6mo: partnerOutcomeSubmissions.retainedEmployment6mo,
        credentialsAttained: partnerOutcomeSubmissions.credentialsAttained,
        cfirFidelityScore: partnerOutcomeSubmissions.cfirFidelityScore,
        countyFips: partnerOutcomeSubmissions.countyFips,
      }).from(partnerOutcomeSubmissions).orderBy(desc(partnerOutcomeSubmissions.id)).limit(limit);

      const totals = outcomes.reduce((acc, o) => ({
        participantsServed: acc.participantsServed + (o.participantsServed || 0),
        enteredEmployment: acc.enteredEmployment + (o.enteredEmployment || 0),
        credentialsAttained: acc.credentialsAttained + (o.credentialsAttained || 0),
      }), { participantsServed: 0, enteredEmployment: 0, credentialsAttained: 0 });

      res.json({ totals, count: outcomes.length, outcomes, exportedAt: new Date().toISOString() });
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch impact metrics." });
    }
  });

  // ── Student data (student:read) — AGGREGATE, SUPPRESSION-FLOORED ONLY ──────
  //
  // DECISION (adversarial re-audit remediation): The partner_api_keys table has
  // NO org/tenant/audience column (see shared/schema.ts ~6374). A partner key is
  // therefore an UNBOUNDED credential — it cannot be scoped to a subset of youth.
  // Honoring an arbitrary :userId or returning per-student rows would let ANY
  // keyholder pull ANY child's thrive scores, early-warning flags, self-
  // assessments, pathway plans, attendance, and reflections. That is a cross-
  // tenant youth-PII exposure and inventing a tenant model here would require a
  // schema change (out of scope / no db:push allowed).
  //
  // Least-breaking honest fix (option a): all student:read endpoints now return
  // ONLY aggregate, small-cell-suppressed metrics (floor 5, mirroring the YHSI
  // suppress() doctrine). Per-student detail routes are REMOVED and answer 410.
  // No names, no user ids, no per-row PII ever leave these handlers.
  // Every access is already recorded by requirePartnerAuth's audit-log insert.

  const suppressMap = (m: Record<string, number>): Record<string, number | null> =>
    Object.fromEntries(Object.entries(m).map(([k, v]) => [k, suppress(v)]));

  // Per-student detail routes are permanently removed — they cannot be served
  // safely without a tenant binding. Answer 410 Gone (still auth+scope gated so
  // the audit log captures the attempt) rather than silently 404.
  const removedStudentDetail = (req: Request, res: Response) => {
    res.status(410).json({
      error: "Per-student detail is no longer served over the partner API.",
      reason: "Partner keys are not bound to a data boundary; serving arbitrary :userId would expose any youth's records to any keyholder.",
      alternative: "Use the aggregate, suppression-floored endpoints: /students/overview, /attendance/summary, /early-warnings, /pathways/overview.",
    });
  };
  app.get("/api/partner/v1/students/:userId/thrive", requirePartnerAuth, requireScope("student:read"), removedStudentDetail);
  app.get("/api/partner/v1/students/:userId/assessments", requirePartnerAuth, requireScope("student:read"), removedStudentDetail);
  app.get("/api/partner/v1/students/:userId/pathway", requirePartnerAuth, requireScope("student:read"), removedStudentDetail);
  app.get("/api/partner/v1/students/reflections", requirePartnerAuth, requireScope("student:read"), removedStudentDetail);

  app.get("/api/partner/v1/students/overview", requirePartnerAuth, requireScope("student:read"), async (req, res) => {
    try {
      const gradeFilter = req.query.grade ? parseInt(req.query.grade as string, 10) : null;
      const progress = await db.select().from(studentProgress);
      const power = await db.select().from(academyPantherPower);
      const pathways = await db.select().from(pathwayPlans);
      const powerMap = new Map(power.map(p => [p.userId, p]));
      const pathwayMap = new Map(pathways.map(pw => [pw.userId, pw]));

      // Build a per-student view internally, but ONLY emit suppressed aggregates.
      let students = progress.map(p => {
        const uid = p.userId ?? "";
        const pp = uid ? powerMap.get(uid) : undefined;
        const pw = uid ? pathwayMap.get(uid) : undefined;
        return {
          totalPoints: p.totalPoints ?? 0,
          lessonsCompleted: p.lessonsCompleted ?? 0,
          streakDays: p.streakDays ?? 0,
          pantherLevel: pp?.level ?? null,
          currentGrade: pw?.currentGrade ?? null,
          status: pw?.status ?? null,
        };
      });
      if (gradeFilter !== null && !isNaN(gradeFilter)) {
        students = students.filter(s => s.currentGrade === gradeFilter);
      }

      const n = students.length;
      const gradeDistribution: Record<string, number> = {};
      const statusDistribution: Record<string, number> = {};
      const levelDistribution: Record<string, number> = {};
      let sumPoints = 0, sumLessons = 0, sumStreak = 0;
      for (const s of students) {
        sumPoints += s.totalPoints; sumLessons += s.lessonsCompleted; sumStreak += s.streakDays;
        if (s.currentGrade != null) gradeDistribution[String(s.currentGrade)] = (gradeDistribution[String(s.currentGrade)] || 0) + 1;
        if (s.status) statusDistribution[s.status] = (statusDistribution[s.status] || 0) + 1;
        if (s.pantherLevel != null) levelDistribution[String(s.pantherLevel)] = (levelDistribution[String(s.pantherLevel)] || 0) + 1;
      }

      res.json({
        aggregateOnly: true,
        suppressionNote: `Cohort counts below ${SUPPRESSION_FLOOR} are suppressed (null); averages require a cohort of at least ${SUPPRESSION_FLOOR}.`,
        totalStudents: suppress(n),
        averages: n >= SUPPRESSION_FLOOR ? {
          avgTotalPoints: Math.round(sumPoints / n),
          avgLessonsCompleted: Math.round((sumLessons / n) * 10) / 10,
          avgStreakDays: Math.round((sumStreak / n) * 10) / 10,
        } : null,
        gradeDistribution: suppressMap(gradeDistribution),
        statusDistribution: suppressMap(statusDistribution),
        pantherLevelDistribution: suppressMap(levelDistribution),
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch student overview." });
    }
  });

  app.get("/api/partner/v1/attendance/summary", requirePartnerAuth, requireScope("student:read"), async (_req, res) => {
    try {
      const logs = await db.select().from(attendanceLogs).orderBy(desc(attendanceLogs.loginTime));
      const perStudent = new Map<string, { logins: number; dates: Set<string> }>();
      for (const log of logs) {
        const existing = perStudent.get(log.userId);
        if (existing) { existing.logins++; existing.dates.add(log.loginDate); }
        else { perStudent.set(log.userId, { logins: 1, dates: new Set([log.loginDate]) }); }
      }
      const n = perStudent.size;
      let totalLogins = 0, totalUniqueDays = 0;
      for (const data of perStudent.values()) { totalLogins += data.logins; totalUniqueDays += data.dates.size; }

      res.json({
        aggregateOnly: true,
        suppressionNote: `Counts below ${SUPPRESSION_FLOOR} are suppressed; averages require at least ${SUPPRESSION_FLOOR} students.`,
        totalStudents: suppress(n),
        totalLogins: suppress(totalLogins),
        averages: n >= SUPPRESSION_FLOOR ? {
          avgLoginsPerStudent: Math.round((totalLogins / n) * 10) / 10,
          avgActiveDaysPerStudent: Math.round((totalUniqueDays / n) * 10) / 10,
        } : null,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch attendance summary." });
    }
  });

  app.get("/api/partner/v1/early-warnings", requirePartnerAuth, requireScope("student:read"), async (_req, res) => {
    try {
      const flags = await db.select({
        flagLevel: earlyWarningFlags.flagLevel,
        triggerClass: earlyWarningFlags.triggerClass,
        resolvedAt: earlyWarningFlags.resolvedAt,
      }).from(earlyWarningFlags);

      const byLevel: Record<string, number> = {};
      const byTrigger: Record<string, number> = {};
      let resolved = 0, open = 0;
      for (const f of flags) {
        if (f.flagLevel) byLevel[f.flagLevel] = (byLevel[f.flagLevel] || 0) + 1;
        if (f.triggerClass) byTrigger[f.triggerClass] = (byTrigger[f.triggerClass] || 0) + 1;
        if (f.resolvedAt) resolved++; else open++;
      }

      res.json({
        aggregateOnly: true,
        suppressionNote: `Counts below ${SUPPRESSION_FLOOR} are suppressed (null).`,
        total: suppress(flags.length),
        open: suppress(open),
        resolved: suppress(resolved),
        byLevel: suppressMap(byLevel),
        byTrigger: suppressMap(byTrigger),
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch early warnings." });
    }
  });

  app.get("/api/partner/v1/pathways/overview", requirePartnerAuth, requireScope("student:read"), async (_req, res) => {
    try {
      const allPlans = await db.select().from(pathwayPlans);
      const gradeDistribution: Record<string, number> = {};
      const educationPathCounts: Record<string, number> = {};
      let activeCount = 0;
      for (const plan of allPlans) {
        const g = plan.currentGrade;
        if (g >= 6 && g <= 12) gradeDistribution[String(g)] = (gradeDistribution[String(g)] || 0) + 1;
        const pt = plan.educationPathType || "unspecified";
        educationPathCounts[pt] = (educationPathCounts[pt] || 0) + 1;
        if (plan.status === "active") activeCount++;
      }
      res.json({
        aggregateOnly: true,
        suppressionNote: `Counts below ${SUPPRESSION_FLOOR} are suppressed (null).`,
        total: suppress(allPlans.length),
        totalActive: suppress(activeCount),
        gradeDistribution: suppressMap(gradeDistribution),
        educationPathCounts: suppressMap(educationPathCounts),
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch pathways overview." });
    }
  });

  // ── Inbound — partners push data TO ThriveUp ─────────────────────────────

  app.post("/api/partner/v1/heartbeat", requirePartnerAuth, async (req, res) => {
    const key: any = (req as any).partnerKey;
    const partnerName: string = key.partnerName ?? "unknown";
    const endpoint = "/api/partner/v1/heartbeat";

    // ── Schema validation (same discipline as /push) ─────────────────────────
    // req.body may be empty for bare keepalive pings — that is valid.
    // We validate declared fields; unknown fields in req.body are ignored
    // (heartbeat meta is opaque partner content).
    const raw: Record<string, unknown> = req.body && typeof req.body === "object" ? req.body : {};

    const { clean, rejections } = verifyInboundPayload<{
      message?: string;
      status?: string;
      version?: string;
    }>(raw, HEARTBEAT_SCHEMA);

    if (rejections.length > 0) {
      // Persist every rejection to the inbound verification audit log so
      // staff can see malformed heartbeats in the same admin listing used
      // for rejected push data.
      await recordInboundVerification(`partner-api-heartbeat:${partnerName}`, endpoint, rejections);
    }

    if (hasBlockingRejection(rejections)) {
      // A required field was invalid (none are required in HEARTBEAT_SCHEMA
      // currently, so this path is future-proof — if a required field is
      // added later it automatically gates here).
      return res.status(400).json({
        error: "Heartbeat payload contains invalid required fields.",
        corrections: rejectionsToCorrectionNote(rejections),
      });
    }

    // ── Validate and cap the `meta` object before storage ────────────────────
    // meta is opaque partner content (we don't validate internals), but we cap
    // each string leaf at 2000 chars and limit the total number of keys to 50
    // so an oversized blob cannot be stored unmodified.  Non-string, non-number,
    // non-boolean, non-null leaf values are dropped.  Any violation is recorded
    // to inboundVerificationLog and surfaced in the response corrections block.
    let cleanMeta: Record<string, unknown> | undefined;
    const metaRejections: import("./inbound-verification").FieldRejection[] = [];
    if (raw.meta && typeof raw.meta === "object" && !Array.isArray(raw.meta)) {
      const metaRaw = raw.meta as Record<string, unknown>;
      const keys = Object.keys(metaRaw).slice(0, 50); // hard cap: 50 keys
      if (Object.keys(metaRaw).length > 50) {
        metaRejections.push({
          field: "meta",
          reason: "too_long",
          receivedValue: `${Object.keys(metaRaw).length} keys`,
          expected: "an object with at most 50 keys",
          blocking: false,
        });
      }
      const cleaned: Record<string, unknown> = {};
      for (const k of keys) {
        const v = metaRaw[k];
        if (typeof v === "string") {
          if (v.length > 2000) {
            metaRejections.push({
              field: `meta.${k}`,
              reason: "too_long",
              receivedValue: v.slice(0, 100) + "…",
              expected: "a string up to 2000 chars",
              blocking: false,
            });
            cleaned[k] = v.slice(0, 2000);
          } else {
            cleaned[k] = v;
          }
        } else if (typeof v === "number" || typeof v === "boolean" || v === null) {
          cleaned[k] = v;
        }
        // arrays/nested objects: silently drop (opaque; not validated further)
      }
      cleanMeta = cleaned;
    }
    if (metaRejections.length > 0) {
      await recordInboundVerification(`partner-api-heartbeat:${partnerName}`, endpoint, metaRejections);
    }

    // ── Persist the clean heartbeat ───────────────────────────────────────────
    const metaCorrections = rejectionsToCorrectionNote(metaRejections);
    const allCorrections = [...rejectionsToCorrectionNote(rejections), ...metaCorrections];
    const payload = {
      message: clean.message ?? "alive",
      status:  clean.status,
      version: clean.version,
      ...(cleanMeta !== undefined ? { meta: cleanMeta } : {}),
    };

    try {
      await db.insert(partnerInboundData).values({
        keyId: key.id,
        partnerName,
        dataType: "heartbeat",
        payload,
      });
    } catch (persistErr) {
      // A DB persistence failure is logged and surfaced (not swallowed).
      // The inbound verification log entry we wrote above (if any) already
      // persisted; this is an independent write for the raw row.
      console.error(`[PartnerAPI] heartbeat persistence failure for ${partnerName}:`, persistErr);
      return res.status(500).json({
        error: "Heartbeat received but could not be persisted. Please retry — this has been logged for staff review.",
      });
    }

    if (allCorrections.length > 0) {
      return res.status(422).json({
        received: true,
        partner: partnerName,
        timestamp: new Date().toISOString(),
        warning: "Heartbeat accepted but some fields were invalid or oversized and have been corrected.",
        corrections: allCorrections,
      });
    }

    res.json({ received: true, partner: partnerName, timestamp: new Date().toISOString() });
  });

  app.post("/api/partner/v1/push", requirePartnerAuth, requireScope("inbound:write"), async (req, res) => {
    const key: any = (req as any).partnerKey;
    const { dataType, payload } = req.body;
    if (!dataType || !payload) {
      return res.status(400).json({ error: "dataType and payload are required." });
    }
    const ALLOWED_TYPES = ["content", "event", "insight", "update", "metric", "referral", "alert", "grant_outcome", "intervention"];
    if (!ALLOWED_TYPES.includes(dataType)) {
      return res.status(400).json({ error: `dataType must be one of: ${ALLOWED_TYPES.join(", ")}` });
    }

    // grant_outcome: validate required fields before storing
    if (dataType === "grant_outcome") {
      const { grantId, grantTitle } = payload as any;
      if (!grantId && !grantTitle) {
        return res.status(400).json({ error: "grant_outcome payload must include at least grantId or grantTitle." });
      }
    }

    // Schema-validate the fields this endpoint actually knows the shape of.
    // A partner-declared dataType with no known schema is still stored (its
    // payload is opaque partner content we don't interpret), but a known
    // dataType with a bad enum/out-of-range field is corrected, not stored
    // as-is and trusted downstream (grant_outcome status/awardAmount feed
    // the compliance matrix; metric values can feed dashboards).
    const schema = PARTNER_PUSH_SCHEMAS[dataType];
    let cleanedPayload = payload;
    let corrections: ReturnType<typeof rejectionsToCorrectionNote> = [];
    if (schema) {
      const { clean, rejections } = verifyInboundPayload<any>(payload, schema);
      if (rejections.length) {
        await recordInboundVerification("partner-api-push", `/api/partner/v1/push (${key.partnerName})`, rejections);
        corrections = rejectionsToCorrectionNote(rejections);
      }
      if (dataType === "grant_outcome" && !clean.status) {
        return res.status(400).json({
          error: "grant_outcome payload must include a valid status field (awarded, submitted, declined, pending, withdrawn).",
          corrections,
        });
      }
      // Merge validated fields back over the raw payload — invalid fields
      // (nulled by verifyInboundPayload) are dropped, everything else the
      // partner sent that isn't in our schema passes through untouched.
      cleanedPayload = { ...payload, ...clean };
    }

    const [row] = await db.insert(partnerInboundData).values({
      keyId: key.id,
      partnerName: key.partnerName,
      dataType,
      payload: cleanedPayload,
    }).returning({ id: partnerInboundData.id, receivedAt: partnerInboundData.receivedAt });

    const response: Record<string, unknown> = {
      received: true,
      id: row.id,
      partner: key.partnerName,
      dataType,
      receivedAt: row.receivedAt,
      ...(corrections.length ? { corrections } : {}),
    };

    // Echo a grant_outcome acknowledgement so the caller knows what was captured
    if (dataType === "grant_outcome") {
      const p = cleanedPayload as any;
      response.grantOutcomeAck = {
        grantId: p.grantId ?? null,
        grantTitle: p.grantTitle ?? null,
        status: p.status,
        awardAmount: p.awardAmount ?? null,
        nextStep: "Outcome stored. ThriveUp team will log this in the grant compliance matrix.",
      };
      console.log(`[PartnerAPI] Grant outcome received from ${key.partnerName}: ${p.grantTitle || p.grantId} — ${p.status}`);
    }

    res.json(response);
  });

  // ── Partner webhook management (any scope) ───────────────────────────────

  // GET /api/partner/v1/webhooks — list caller's own webhooks
  app.get("/api/partner/v1/webhooks", requirePartnerAuth, async (req, res) => {
    try {
      const key: any = (req as any).partnerKey;
      const keyId = key.id as string;
      if (!keyId) return res.status(400).json({ error: "Cannot resolve partner key id." });
      const hooks = await db
        .select({
          id: partnerWebhooks.id,
          event: partnerWebhooks.event,
          webhookUrl: partnerWebhooks.webhookUrl,
          active: partnerWebhooks.active,
          lastFiredAt: partnerWebhooks.lastFiredAt,
          createdAt: partnerWebhooks.createdAt,
        })
        .from(partnerWebhooks)
        .where(eq(partnerWebhooks.partnerKeyId, keyId));
      res.json({ count: hooks.length, webhooks: hooks });
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch webhooks." });
    }
  });

  const VALID_WEBHOOK_EVENTS = new Set([
    "referral.created",
    "referral.outcome",
    "foster_youth.outcome",
    "trade_cert.issued",
    "community_brief.completed",
  ]);

  // POST /api/partner/v1/webhooks — register a new webhook
  app.post("/api/partner/v1/webhooks", requirePartnerAuth, async (req, res) => {
    try {
      const key: any = (req as any).partnerKey;
      const keyId = key.id as string;
      if (!keyId) return res.status(400).json({ error: "Cannot resolve partner key id." });

      const { event, webhookUrl } = (req.body ?? {}) as { event?: string; webhookUrl?: string };
      if (!event || !webhookUrl) {
        return res.status(400).json({ error: "event and webhookUrl are required." });
      }
      if (!VALID_WEBHOOK_EVENTS.has(event)) {
        return res.status(400).json({
          error: `event must be one of: ${[...VALID_WEBHOOK_EVENTS].join(", ")}`,
        });
      }
      // Basic URL validation
      try { new URL(webhookUrl); } catch {
        return res.status(400).json({ error: "webhookUrl must be a valid URL." });
      }

      const secret = randomBytes(32).toString("hex");
      const [created] = await db
        .insert(partnerWebhooks)
        .values({ partnerKeyId: keyId, event, webhookUrl, secret, active: true })
        .returning({
          id: partnerWebhooks.id,
          event: partnerWebhooks.event,
          webhookUrl: partnerWebhooks.webhookUrl,
          createdAt: partnerWebhooks.createdAt,
        });

      res.json({
        id: created.id,
        event: created.event,
        webhookUrl: created.webhookUrl,
        secret,  // shown ONCE — caller must store this
        secretNote: "Copy this secret now — it will never be shown again. Use it to verify X-TCAF-Signature headers (HMAC-SHA256).",
        createdAt: created.createdAt,
      });
    } catch (err) {
      res.status(500).json({ error: "Failed to register webhook." });
    }
  });

  // DELETE /api/partner/v1/webhooks/:id — deactivate a webhook
  app.delete("/api/partner/v1/webhooks/:id", requirePartnerAuth, async (req, res) => {
    try {
      const key: any = (req as any).partnerKey;
      const keyId = key.id as string;
      if (!keyId) return res.status(400).json({ error: "Cannot resolve partner key id." });

      const hookId = parseInt(req.params.id as string, 10);
      if (isNaN(hookId)) return res.status(400).json({ error: "Invalid webhook id." });

      // Verify ownership before deactivating.
      const [hook] = await db
        .select({ id: partnerWebhooks.id, partnerKeyId: partnerWebhooks.partnerKeyId })
        .from(partnerWebhooks)
        .where(eq(partnerWebhooks.id, hookId));
      if (!hook) return res.status(404).json({ error: "Webhook not found." });
      if (hook.partnerKeyId !== keyId) return res.status(403).json({ error: "Forbidden." });

      await db
        .update(partnerWebhooks)
        .set({ active: false })
        .where(eq(partnerWebhooks.id, hookId));

      res.json({ deactivated: true, id: hookId });
    } catch (err) {
      res.status(500).json({ error: "Failed to deactivate webhook." });
    }
  });

  // ── Inbound: partner-referred foster youth intake (inbound:write) ─────────

  // POST /api/partner/v1/foster-youth/refer
  // Partners create a foster youth intake on behalf of a youth.
  // Sets referralOrgId to the calling partner key's id.
  // Returns { intakeId, intakeUrl, accessToken } so the partner can give the youth a direct link.
  app.post(
    "/api/partner/v1/foster-youth/refer",
    requirePartnerAuth,
    requireScope("inbound:write"),
    async (req, res) => {
      try {
        const key: any = (req as any).partnerKey;
        const keyId = key.id as string;

        const body = (req.body ?? {}) as Record<string, unknown>;
        const { firstName, stateCode, immediateNeeds, caseworkerEmail, partnerReference } = body as {
          firstName?: string;
          stateCode?: string;
          immediateNeeds?: string[];
          caseworkerEmail?: string;
          partnerReference?: string;
        };

        if (!stateCode || typeof stateCode !== "string") {
          return res.status(400).json({ error: "stateCode is required." });
        }

        // Validate immediateNeeds if provided
        const cleanNeeds = Array.isArray(immediateNeeds)
          ? immediateNeeds.filter((x): x is string => typeof x === "string").slice(0, 20)
          : [];

        // Validate caseworkerEmail if provided
        let cleanEmail: string | null = null;
        if (caseworkerEmail && typeof caseworkerEmail === "string") {
          const trimmed = caseworkerEmail.trim();
          if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed) && trimmed.length <= 254) {
            cleanEmail = trimmed;
          }
        }

        const id = randomUUID();
        const accessToken = randomBytes(24).toString("base64url");

        const [row] = await db
          .insert(fosterYouthIntakes)
          .values({
            id,
            cohort: "foster-youth",
            accessToken,
            firstName: typeof firstName === "string" ? firstName.slice(0, 120) : null,
            stateCode: stateCode.slice(0, 2).toUpperCase(),
            immediateNeeds: cleanNeeds.length > 0 ? cleanNeeds : null,
            caseworkerEmail: cleanEmail,
            referredBy: key.partnerName as string,
            referralOrgId: keyId,
            createdBy: `partner:${key.partnerName}`,
          })
          .returning({ id: fosterYouthIntakes.id });

        const intakeId = row.id;
        const protocol = req.headers["x-forwarded-proto"] || "https";
        const host = req.headers.host || "thrivingcommunitiesforall.com";
        const intakeUrl = `${protocol}://${host}/foster-youth/intake?id=${intakeId}&ref=${encodeURIComponent(partnerReference ?? "")}`;

        console.log(
          `[PartnerAPI] Partner-referred intake created: partner=${key.partnerName} intakeId=${intakeId} partnerRef=${partnerReference ?? "(none)"}`,
        );

        res.status(201).json({
          intakeId,
          intakeUrl,
          accessToken,
          warning: "Share accessToken securely with the youth — it is their only credential to access this intake.",
          partnerReference: partnerReference ?? null,
        });
      } catch (err: any) {
        console.error("[PartnerAPI] foster-youth/refer failed:", err);
        res.status(500).json({ error: err.message ?? "Failed to create referred intake." });
      }
    },
  );

  // ── Community brief (community:read) — partners call TCAF's conductor logic ─

  // Per-partner rate limit: 20/hour per key (tracked in partnerApiAuditLog).
  // The audit log already records every call via requirePartnerAuth above.
  // We enforce 20/hour in-memory per keyId using a simple sliding window.
  const communityBriefHits = new Map<string, number[]>();
  const BRIEF_RATE_LIMIT = 20;
  const BRIEF_RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour

  function checkBriefRateLimit(keyId: string): boolean {
    const now = Date.now();
    const cutoff = now - BRIEF_RATE_WINDOW_MS;
    const hits = (communityBriefHits.get(keyId) || []).filter((t) => t > cutoff);
    if (hits.length >= BRIEF_RATE_LIMIT) {
      communityBriefHits.set(keyId, hits);
      return false;
    }
    hits.push(now);
    communityBriefHits.set(keyId, hits);
    return true;
  }

  app.get("/api/partner/v1/community-brief", requirePartnerAuth, requireScope("community:read"), async (req, res) => {
    try {
      const key: any = (req as any).partnerKey;
      const keyId: string = String(key.id ?? "");
      if (!checkBriefRateLimit(keyId)) {
        return res.status(429).json({ error: "Rate limit exceeded: 20 community briefs per hour per partner key. Please retry after an hour." });
      }

      const location = (typeof req.query.location === "string" ? req.query.location : "").trim();
      if (!location) {
        return res.status(400).json({ error: "location query param is required (ZIP/ZCTA, city/state, county, or multi-county service area)" });
      }
      const populationSize = Math.min(5_000_000, Math.max(100, parseInt((req.query.populationSize as string) || "10000", 10) || 10000));
      const timeHorizon = Math.min(50, Math.max(1, parseInt((req.query.timeHorizon as string) || "25", 10) || 25));

      // Proxy to the conductor endpoint internally — this reuses all its
      // Census fetch, domain scoring, narrative generation, and caching logic.
      // Partner keys are NEVER authenticated callers of the first-party session;
      // we do NOT pass a cookie or auth header so the conductor treats this as
      // an anonymous request (public brief, NO RPLICE block — aggregate only).
      const protocol = req.protocol || "http";
      const host = req.hostname || "localhost";
      const port = process.env.PORT || "5000";
      const conductorUrl = `http://localhost:${port}/api/conductor/community-brief`;

      const conductorRes = await fetch(conductorUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location, populationSize, timeHorizon }),
      });

      if (!conductorRes.ok) {
        const errBody = await conductorRes.text().catch(() => "");
        const status = conductorRes.status;
        if (status === 404) return res.status(404).json({ error: `Location not found: "${location}". Try a ZIP code or city name.` });
        if (status === 429) return res.status(429).json({ error: "Upstream rate limit — try again shortly." });
        return res.status(502).json({ error: `Community brief generation failed (upstream ${status}): ${errBody.slice(0, 200)}` });
      }

      const brief = await conductorRes.json();
      // Strip the rplice block if somehow returned (partner keys are aggregate-only)
      const { rplice: _rplice, ...publicBrief } = brief as any;
      if (!hasValidCommunityEvidence(publicBrief)) {
        return res.status(502).json({ error: "Community brief generation did not return a valid evidence contract." });
      }
      res.json({
        ...publicBrief,
        partnerNote: "RPLICE internal intelligence is not included for partner keys. The included evidence contract identifies the resolved geography, observed public-data estimates, TCAF-derived calculations, scenario output, and AI synthesis.",
      });
    } catch (err) {
      console.error("[PartnerAPI] community-brief failed:", err);
      res.status(500).json({ error: "Community brief request failed." });
    }
  });

  // ── Community story pack (community:read) — full packaged story ──────────
  // GET /api/partner/v1/community-story?location=28472&orgName=ECS
  // Returns combined community brief + grant intelligence in one call.
  // Rate limit: 10/hour per key (heavier than brief alone due to grant conduit call).
  const storyHits = new Map<string, number[]>();
  function checkStoryRateLimit(keyId: string): boolean {
    const now = Date.now();
    const cutoff = now - 60 * 60 * 1000;
    const hits = (storyHits.get(keyId) || []).filter((t) => t > cutoff);
    if (hits.length >= 10) { storyHits.set(keyId, hits); return false; }
    hits.push(now); storyHits.set(keyId, hits); return true;
  }

  app.get("/api/partner/v1/community-story", requirePartnerAuth, requireScope("community:read"), async (req, res) => {
    try {
      const key: any = (req as any).partnerKey;
      const keyId: string = String(key.id ?? "");
      if (!checkStoryRateLimit(keyId)) {
        return res.status(429).json({ error: "Rate limit exceeded: 10 community story packs per hour per partner key." });
      }
      const location = (typeof req.query.location === "string" ? req.query.location : "").trim();
      if (!location) return res.status(400).json({ error: "location query param is required" });

      const port = process.env.PORT || "5000";
      const packRes = await fetch(`http://localhost:${port}/api/community-story/pack`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location,
          orgName: req.query.orgName ? String(req.query.orgName) : undefined,
          orgType: req.query.orgType ? String(req.query.orgType) : "nonprofit",
          includeGrantData: req.query.includeGrantData !== "false",
        }),
      });
      if (!packRes.ok) {
        const errBody = await packRes.text().catch(() => "");
        return res.status(packRes.status === 404 ? 404 : 502).json({ error: `Story pack failed: ${errBody.slice(0, 200)}` });
      }
      const story = await packRes.json() as Record<string, unknown>;
      // Strip any rplice block — partner keys get aggregate data only. Strip
      // both the nested brief.rplice AND a top-level story.rplice: the spread
      // below (`...story`) would otherwise let a top-level key survive even
      // though the nested one was removed.
      const { rplice: _topRplice, ...publicStory } = story as any;
      const brief = (publicStory.brief as Record<string, unknown>) ?? {};
      const { rplice: _r, ...publicBrief } = brief as any;
      if (!hasValidCommunityEvidence(publicBrief)) {
        return res.status(502).json({ error: "Community story generation did not return a valid evidence contract." });
      }
      res.json({
        ...publicStory,
        brief: publicBrief,
        partnerNote: "Community Story Pack via TCAF Partner API. RPLICE internal block excluded. The evidence contract identifies resolved geography and claim types. Embed at /community-story/{shareId} after calling POST /api/community-story/share.",
        embedInstructions: {
          step1: `POST /api/community-story/share with body { location: '${location}' } to get a shareId and embedCode`,
          step2: "Paste the embedCode <iframe> on your website or grant portal",
          step3: "The embed shows live community data for 30 days",
        },
      });
    } catch (err) {
      console.error("[PartnerAPI] community-story failed:", err);
      res.status(500).json({ error: "Community story pack request failed." });
    }
  });

  // ── Community brief subscriptions (community:read) ───────────────────────

  app.post("/api/partner/v1/community-brief/subscribe", requirePartnerAuth, requireScope("community:read"), async (req, res) => {
    try {
      const key: any = (req as any).partnerKey;
      const keyId = key.id as string;
      if (!keyId) return res.status(400).json({ error: "Cannot resolve partner key id." });

      const { location, webhookUrl, frequency } = (req.body ?? {}) as {
        location?: string; webhookUrl?: string; frequency?: string;
      };
      if (!location || typeof location !== "string" || !location.trim()) {
        return res.status(400).json({ error: "location is required." });
      }
      if (!webhookUrl || typeof webhookUrl !== "string") {
        return res.status(400).json({ error: "webhookUrl is required." });
      }
      try { new URL(webhookUrl); } catch {
        return res.status(400).json({ error: "webhookUrl must be a valid URL." });
      }
      const VALID_FREQUENCIES = new Set(["daily", "weekly", "on-change"]);
      const freq = (typeof frequency === "string" && VALID_FREQUENCIES.has(frequency)) ? frequency : "weekly";

      const [created] = await db
        .insert(briefSubscriptions)
        .values({
          partnerKeyId: keyId,
          location: location.trim(),
          webhookUrl,
          frequency: freq,
          active: true,
        })
        .returning({ id: briefSubscriptions.id });

      res.json({
        subscriptionId: created.id,
        location: location.trim(),
        frequency: freq,
        webhookUrl,
        message: `You will receive community briefs for ${location.trim()} ${freq}. Briefs will begin dispatching within 24 hours of activation.`,
      });
    } catch (err) {
      console.error("[PartnerAPI] community-brief/subscribe failed:", err);
      res.status(500).json({ error: "Failed to create brief subscription." });
    }
  });

  // GET /api/partner/v1/subscriptions — list caller's brief subscriptions
  app.get("/api/partner/v1/subscriptions", requirePartnerAuth, requireScope("community:read"), async (req, res) => {
    try {
      const key: any = (req as any).partnerKey;
      const keyId = key.id as string;
      if (!keyId) return res.status(400).json({ error: "Cannot resolve partner key id." });

      const subs = await db
        .select({
          id: briefSubscriptions.id,
          location: briefSubscriptions.location,
          webhookUrl: briefSubscriptions.webhookUrl,
          frequency: briefSubscriptions.frequency,
          active: briefSubscriptions.active,
          lastSentAt: briefSubscriptions.lastSentAt,
          createdAt: briefSubscriptions.createdAt,
        })
        .from(briefSubscriptions)
        .where(eq(briefSubscriptions.partnerKeyId, keyId));

      res.json({ count: subs.length, subscriptions: subs });
    } catch (err) {
      console.error("[PartnerAPI] subscriptions list failed:", err);
      res.status(500).json({ error: "Failed to fetch subscriptions." });
    }
  });

  // DELETE /api/partner/v1/subscriptions/:id — deactivate a brief subscription
  app.delete("/api/partner/v1/subscriptions/:id", requirePartnerAuth, requireScope("community:read"), async (req, res) => {
    try {
      const key: any = (req as any).partnerKey;
      const keyId = key.id as string;
      if (!keyId) return res.status(400).json({ error: "Cannot resolve partner key id." });

      const subId = parseInt(req.params.id as string, 10);
      if (isNaN(subId)) return res.status(400).json({ error: "Invalid subscription id." });

      const [sub] = await db
        .select({ id: briefSubscriptions.id, partnerKeyId: briefSubscriptions.partnerKeyId })
        .from(briefSubscriptions)
        .where(eq(briefSubscriptions.id, subId));
      if (!sub) return res.status(404).json({ error: "Subscription not found." });
      if (sub.partnerKeyId !== keyId) return res.status(403).json({ error: "Forbidden." });

      await db
        .update(briefSubscriptions)
        .set({ active: false })
        .where(eq(briefSubscriptions.id, subId));

      res.json({ deactivated: true, id: subId });
    } catch (err) {
      console.error("[PartnerAPI] subscription deactivate failed:", err);
      res.status(500).json({ error: "Failed to deactivate subscription." });
    }
  });

  // ── Certificate verification (certs:read — also callable without auth for public verification) ─

  app.get("/api/partner/v1/certificates/verify/:certId", requirePartnerAuth, requireScope("certs:read"), async (req, res) => {
    try {
      const certId = String(req.params.certId ?? "").trim();
      if (!certId) return res.status(400).json({ error: "certId is required." });

      const [cert] = await db
        .select({
          id: certificates.id,
          userName: certificates.userName,
          sourceKey: certificates.sourceKey,
          levelTitle: certificates.levelTitle,
          issuedAt: certificates.issuedAt,
        })
        .from(certificates)
        .where(eq(certificates.id, certId))
        .limit(1);

      if (!cert) {
        return res.json({ valid: false, certId, reason: "Certificate not found." });
      }

      const protocol = req.protocol || "https";
      const host = req.hostname || "localhost";
      const verificationUrl = `${protocol}://${host}/api/trade-sims/verify/${certId}`;

      res.json({
        valid: true,
        certId: cert.id,
        holderName: cert.userName,
        trade: cert.sourceKey ?? null,
        issuedAt: cert.issuedAt,
        verificationUrl,
        disclaimer: "This certificate documents simulation-based training completed in ThriveUp Trade Sims. It is NOT an industry certification or license.",
      });
    } catch (err) {
      console.error("[PartnerAPI] certificates/verify failed:", err);
      res.status(500).json({ error: "Certificate verification failed." });
    }
  });

  // ── Trade sim completion outcomes (outcomes:read) ─────────────────────────

  app.get("/api/partner/v1/outcomes/trade-completions", requirePartnerAuth, requireScope("outcomes:read"), async (req, res) => {
    try {
      const rawDays = parseInt((req.query.days as string) || "30", 10);
      const days = [30, 60, 90].includes(rawDays) ? rawDays : 30;
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      // COUNT completed lessons grouped by trade slug.
      // We join tradeSimsLessons → tradeSimsTrades to get the trade slug.
      // No user PII is selected — only trade slug and count.
      const rows = await db
        .select({
          tradeSlug: tradeSimsTrades.slug,
          completionCount: sql<number>`cast(count(*) as int)`,
        })
        .from(tradeSimsLessonProgress)
        .leftJoin(tradeSimsLessons, eq(tradeSimsLessonProgress.lessonId, tradeSimsLessons.id))
        .leftJoin(tradeSimsTrades, eq(tradeSimsLessons.tradeId, tradeSimsTrades.id))
        .where(
          and(
            eq(tradeSimsLessonProgress.status, "completed"),
            gte(tradeSimsLessonProgress.updatedAt, since),
          )
        )
        .groupBy(tradeSimsTrades.slug);

      // Suppress cells below MIN_AGGREGATE_CELL
      const completions = rows.map((r) => ({
        tradeSlug: r.tradeSlug ?? "unknown",
        count: r.completionCount < MIN_AGGREGATE_CELL ? null : r.completionCount,
        suppressed: r.completionCount < MIN_AGGREGATE_CELL,
      }));

      res.json({
        days,
        since: since.toISOString(),
        suppressionNote: `Counts below ${MIN_AGGREGATE_CELL} are suppressed (null) to prevent re-identification.`,
        aggregateOnly: true,
        completions,
        generatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error("[PartnerAPI] outcomes/trade-completions failed:", err);
      res.status(500).json({ error: "Failed to fetch trade completion outcomes." });
    }
  });

  // ── ChildCORE Partner Integration: Chainweb ROI + YHSI Aggregates ─────────
  // Chainweb: full ROI scenario lifecycle accessible to any partner with chainweb:read scope.
  // YHSI: aggregate-only, floor-5 suppressed — no individual records ever cross.

  app.get("/api/partner/v1/chainweb/coefficients", requirePartnerAuth, requireScope("chainweb:read"), (_req, res) => {
    res.json({
      note: "Peer-reviewed evidence coefficients powering ThriveUp's Chainweb ROI engine.",
      coefficients: CHAINWEB_COEFFICIENTS,
      timestamp: new Date().toISOString(),
    });
  });

  app.get("/api/partner/v1/chainweb/templates", requirePartnerAuth, requireScope("chainweb:read"), (_req, res) => {
    res.json({
      note: "Quick-start scenario templates. Pass templateId in POST /api/partner/v1/chainweb/scenarios.",
      templates: CHAINWEB_TEMPLATES,
      timestamp: new Date().toISOString(),
    });
  });

  // Partner-created scenarios use createdBy = "partner:<partnerName>" for ownership isolation.
  app.post("/api/partner/v1/chainweb/scenarios", requirePartnerAuth, requireScope("chainweb:read"), async (req, res) => {
    try {
      const key: any = (req as any).partnerKey;
      const partnerOwnerId = `partner:${key.partnerName ?? "unknown"}`;
      const parsed = insertChainwebScenarioSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
      const { createdBy: _c, status: _s, populationProfile: _p, ...scenarioInput } = parsed.data;
      const [scenario] = await db.insert(chainwebScenarios)
        .values({ ...scenarioInput, status: "draft", createdBy: partnerOwnerId })
        .returning();
      res.json(scenario);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/partner/v1/chainweb/scenarios/:id", requirePartnerAuth, requireScope("chainweb:read"), async (req, res) => {
    try {
      const key: any = (req as any).partnerKey;
      const partnerOwnerId = `partner:${key.partnerName ?? "unknown"}`;
      const id = parseInt(req.params.id as string, 10);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid scenario id." });

      const [scenario] = await db.select().from(chainwebScenarios).where(eq(chainwebScenarios.id, id));
      if (!scenario) return res.status(404).json({ error: "Scenario not found." });
      if (scenario.createdBy !== partnerOwnerId) {
        return res.status(403).json({ error: "You may only view scenarios your partner key created." });
      }

      const nodes = await db.select().from(chainwebNodes).where(eq(chainwebNodes.scenarioId, id));
      const edges = await db.select().from(chainwebEdges).where(eq(chainwebEdges.scenarioId, id));
      const calcs = await db.select().from(chainwebCalculations).where(eq(chainwebCalculations.scenarioId, id));
      const narratives = calcs[0]
        ? await db.select().from(chainwebNarratives).where(eq(chainwebNarratives.calculationId, calcs[0].id))
        : [];
      res.json({ scenario, nodes, edges, calculation: calcs[0] || null, narratives });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/partner/v1/chainweb/scenarios/:id/calculate", requirePartnerAuth, requireScope("chainweb:read"), async (req, res) => {
    try {
      const key: any = (req as any).partnerKey;
      const partnerOwnerId = `partner:${key.partnerName ?? "unknown"}`;
      const id = parseInt(req.params.id as string, 10);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid scenario id." });

      const [existing] = await db.select().from(chainwebScenarios).where(eq(chainwebScenarios.id, id));
      if (!existing) return res.status(404).json({ error: "Scenario not found." });
      if (existing.createdBy !== partnerOwnerId) {
        return res.status(403).json({ error: "You may only calculate scenarios your partner key created." });
      }

      const calculation = await db.transaction(async (tx) => {
        await tx.execute(sql`SELECT pg_advisory_xact_lock(${id})`);
        await buildChainwebScenario(id, tx);
        const calculated = await calculateChainwebROI(id, tx);
        await tx.update(chainwebScenarios)
          .set({ status: "calculated", updatedAt: new Date() })
          .where(eq(chainwebScenarios.id, id));
        return calculated;
      });
      res.json(calculation);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/partner/v1/chainweb/calculations/:id/narratives", requirePartnerAuth, requireScope("chainweb:read"), async (req, res) => {
    try {
      const key: any = (req as any).partnerKey;
      const partnerOwnerId = `partner:${key.partnerName ?? "unknown"}`;
      const id = parseInt(req.params.id as string, 10);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid calculation id." });

      const allowedAudiences = new Set(["grant_writer", "org_leader", "researcher", "council", "funder"]);
      const { audience } = req.body as { audience?: string };
      if (!audience || !allowedAudiences.has(audience)) {
        return res.status(400).json({ error: "audience must be one of: grant_writer, org_leader, researcher, council, funder" });
      }

      const [calc] = await db.select().from(chainwebCalculations).where(eq(chainwebCalculations.id, id));
      if (!calc) return res.status(404).json({ error: "Calculation not found." });
      const [scenario] = await db.select().from(chainwebScenarios).where(eq(chainwebScenarios.id, calc.scenarioId));
      if (!scenario || scenario.createdBy !== partnerOwnerId) {
        return res.status(403).json({ error: "You may only generate narratives for scenarios your partner key created." });
      }

      const [existing] = await db.select().from(chainwebNarratives)
        .where(and(eq(chainwebNarratives.calculationId, id), eq(chainwebNarratives.audienceType, audience)));
      if (existing) {
        return res.json({ headline: existing.headline, narrative: existing.narrativeText, keyStats: existing.keyStats, citations: existing.dataCitations });
      }

      const result = await generateChainwebNarrative(id, audience as any);
      await db.insert(chainwebNarratives).values({
        calculationId: id,
        audienceType: audience,
        headline: result.headline,
        narrativeText: result.narrative,
        keyStats: result.keyStats,
        dataCitations: result.citations,
      }).onConflictDoUpdate({
        target: [chainwebNarratives.calculationId, chainwebNarratives.audienceType],
        set: { headline: result.headline, narrativeText: result.narrative, keyStats: result.keyStats, dataCitations: result.citations, generatedAt: new Date() },
      });
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── YHSI Aggregate Partner Endpoints (yhsi:read) ──────────────────────────
  // Aggregate-only. Floor-5 suppression on every count. No individual records.

  app.get("/api/partner/v1/yhsi/metrics", requirePartnerAuth, requireScope("yhsi:read"), async (_req, res) => {
    try {
      const [pts] = await db.select({
        total:        sql<number>`count(*)::int`,
        consentCount: sql<number>`count(*) filter (where consent_on_file = true)::int`,
        chronicCount: sql<number>`count(*) filter (where chronic_pattern = true)::int`,
        fosterCount:  sql<number>`count(*) filter (where foster_care_history = true)::int`,
        justiceCount: sql<number>`count(*) filter (where justice_involvement = true)::int`,
        parentingCount: sql<number>`count(*) filter (where is_parenting = true)::int`,
      }).from(yhsiYouthParticipants);

      const [refs] = await db.select({
        total:    sql<number>`count(*)::int`,
        resolved: sql<number>`count(*) filter (where status = 'resolved')::int`,
        active:   sql<number>`count(*) filter (where status in ('in_service','enrolled'))::int`,
      }).from(yhsiReferrals);

      res.json({
        aggregateOnly: true,
        suppressionNote: `Counts below ${SUPPRESSION_FLOOR} are suppressed (null).`,
        participants: {
          total:              suppress(pts.total),
          consentOnFile:      suppress(pts.consentCount),
          chronicPattern:     suppress(pts.chronicCount),
          fosterCareHistory:  suppress(pts.fosterCount),
          justiceInvolvement: suppress(pts.justiceCount),
          isParenting:        suppress(pts.parentingCount),
        },
        referrals: {
          total:    suppress(refs.total),
          active:   suppress(refs.active),
          resolved: suppress(refs.resolved),
        },
        timestamp: new Date().toISOString(),
      });
    } catch {
      res.status(500).json({ error: "Failed to compute YHSI metrics." });
    }
  });

  app.get("/api/partner/v1/yhsi/outcomes-summary", requirePartnerAuth, requireScope("yhsi:read"), async (_req, res) => {
    try {
      const MILESTONES = ["at_contact","day_30","day_90","day_180","day_365","month_6","month_12","exit"];

      const rows = await db.select({
        snapshotType:     yhsiOutcomeSnapshots.snapshotType,
        total:            sql<number>`count(*)::int`,
        stableHoused:     sql<number>`count(*) filter (where housing_status like 'stable%')::int`,
        housingKnown:     sql<number>`count(*) filter (where housing_status is not null and housing_status <> 'unknown')::int`,
        employed:         sql<number>`count(*) filter (where employment_status in ('employed_ft','employed_pt'))::int`,
        employmentKnown:  sql<number>`count(*) filter (where employment_status is not null and employment_status <> 'unknown')::int`,
        hsDone:           sql<number>`count(*) filter (where hs_completion in ('completed','on_track','ged_track'))::int`,
        hsKnown:          sql<number>`count(*) filter (where hs_completion is not null and hs_completion not in ('na','unknown'))::int`,
      }).from(yhsiOutcomeSnapshots).groupBy(yhsiOutcomeSnapshots.snapshotType);

      const byMilestone: Record<string, unknown> = {};
      for (const row of rows) {
        byMilestone[row.snapshotType] = {
          total: suppress(row.total),
          housingStabilityRate: row.housingKnown >= SUPPRESSION_FLOOR ? Math.round(row.stableHoused / row.housingKnown * 100) : null,
          employmentRate:       row.employmentKnown >= SUPPRESSION_FLOOR ? Math.round(row.employed / row.employmentKnown * 100) : null,
          hsCompletionRate:     row.hsKnown >= SUPPRESSION_FLOOR ? Math.round(row.hsDone / row.hsKnown * 100) : null,
        };
      }
      const sorted: Record<string, unknown> = {};
      for (const m of MILESTONES) { if (byMilestone[m]) sorted[m] = byMilestone[m]; }

      res.json({
        aggregateOnly: true,
        suppressionNote: `Counts below ${SUPPRESSION_FLOOR} are suppressed (null). Rates require at least ${SUPPRESSION_FLOOR} known values.`,
        milestones: sorted,
        timestamp: new Date().toISOString(),
      });
    } catch {
      res.status(500).json({ error: "Failed to fetch YHSI outcomes summary." });
    }
  });

  // ── Admin: list/manage brief subscriptions ────────────────────────────────

  app.get("/api/admin/brief-subscriptions", requireAdminKey, async (_req, res) => {
    try {
      const subs = await db
        .select()
        .from(briefSubscriptions)
        .orderBy(desc(briefSubscriptions.createdAt))
        .limit(200);
      res.json({ count: subs.length, subscriptions: subs });
    } catch (err) {
      console.error("[PartnerAPI] admin brief-subscriptions failed:", err);
      res.status(500).json({ error: "Failed to fetch brief subscriptions." });
    }
  });

  app.patch("/api/admin/brief-subscriptions/:id/deactivate", requireAdminKey, async (req, res) => {
    try {
      const subId = parseInt(req.params.id as string, 10);
      if (isNaN(subId)) return res.status(400).json({ error: "Invalid subscription id." });
      await db.update(briefSubscriptions).set({ active: false }).where(eq(briefSubscriptions.id, subId));
      res.json({ deactivated: true, id: subId });
    } catch (err) {
      console.error("[PartnerAPI] admin brief-subscriptions deactivate failed:", err);
      res.status(500).json({ error: "Failed to deactivate subscription." });
    }
  });

  // ── Admin: list/manage partner webhooks ───────────────────────────────────

  app.get("/api/admin/partner-webhooks", requireAdminKey, async (_req, res) => {
    try {
      const hooks = await db
        .select({
          id: partnerWebhooks.id,
          partnerKeyId: partnerWebhooks.partnerKeyId,
          event: partnerWebhooks.event,
          webhookUrl: partnerWebhooks.webhookUrl,
          active: partnerWebhooks.active,
          lastFiredAt: partnerWebhooks.lastFiredAt,
          createdAt: partnerWebhooks.createdAt,
        })
        .from(partnerWebhooks)
        .orderBy(desc(partnerWebhooks.createdAt))
        .limit(200);
      res.json({ count: hooks.length, webhooks: hooks });
    } catch (err) {
      console.error("[PartnerAPI] admin partner-webhooks failed:", err);
      res.status(500).json({ error: "Failed to fetch webhooks." });
    }
  });

  app.post("/api/admin/partner-webhooks", requireAdminKey, async (req, res) => {
    try {
      const { partnerKeyId, event, webhookUrl } = (req.body ?? {}) as {
        partnerKeyId?: string | number; event?: string; webhookUrl?: string;
      };
      if (!partnerKeyId || !event || !webhookUrl) {
        return res.status(400).json({ error: "partnerKeyId, event, and webhookUrl are required." });
      }
      const VALID_WEBHOOK_EVENTS = new Set(["referral.created", "referral.outcome", "foster_youth.outcome", "trade_cert.issued", "community_brief.completed"]);
      if (!VALID_WEBHOOK_EVENTS.has(event)) {
        return res.status(400).json({ error: `event must be one of: ${[...VALID_WEBHOOK_EVENTS].join(", ")}` });
      }
      try { new URL(webhookUrl); } catch {
        return res.status(400).json({ error: "webhookUrl must be a valid URL." });
      }
      const secret = randomBytes(32).toString("hex");
      const [created] = await db
        .insert(partnerWebhooks)
        .values({ partnerKeyId: String(partnerKeyId), event, webhookUrl, secret, active: true })
        .returning({ id: partnerWebhooks.id, event: partnerWebhooks.event, webhookUrl: partnerWebhooks.webhookUrl, createdAt: partnerWebhooks.createdAt });
      res.json({ id: created.id, event: created.event, webhookUrl: created.webhookUrl, secret, secretNote: "Copy this secret now — it will never be shown again.", createdAt: created.createdAt });
    } catch (err) {
      console.error("[PartnerAPI] admin register webhook failed:", err);
      res.status(500).json({ error: "Failed to register webhook." });
    }
  });

  app.patch("/api/admin/partner-webhooks/:id/deactivate", requireAdminKey, async (req, res) => {
    try {
      const hookId = parseInt(req.params.id as string, 10);
      if (isNaN(hookId)) return res.status(400).json({ error: "Invalid webhook id." });
      await db.update(partnerWebhooks).set({ active: false }).where(eq(partnerWebhooks.id, hookId));
      res.json({ deactivated: true, id: hookId });
    } catch (err) {
      console.error("[PartnerAPI] admin webhook deactivate failed:", err);
      res.status(500).json({ error: "Failed to deactivate webhook." });
    }
  });

  // ── Admin — inbound verification log (rejected / corrected fields) ─────────
  // Returns the most-recent 200 entries from the append-only
  // `inbound_verification_log` table — the same table recordInboundVerification()
  // writes to for both /push and /heartbeat rejections. Staff can filter by
  // source to isolate heartbeat rejections (source prefix: "partner-api-heartbeat:").

  app.get("/api/admin/inbound-verification-log", requireAdminKey, async (req, res) => {
    try {
      // Pagination: max 200 rows per page; caller may pass ?limit= (1-200) and ?offset=
      const limit = Math.min(200, Math.max(1, parseInt((req.query.limit as string) || "100", 10) || 100));
      const offset = Math.max(0, parseInt((req.query.offset as string) || "0", 10) || 0);
      // Optional source filter (exact prefix match)
      const sourceFilter = (req.query.source as string || "").trim().slice(0, 100);
      // Optional date-range: from/to (ISO 8601). Max range capped at 90 days to
      // avoid full-table scans on a large append-only log.
      const fromStr = (req.query.from as string || "").trim();
      const toStr   = (req.query.to   as string || "").trim();
      let fromDate: Date | undefined;
      let toDate: Date | undefined;
      if (fromStr) { const d = new Date(fromStr); if (!isNaN(d.getTime())) fromDate = d; }
      if (toStr)   { const d = new Date(toStr);   if (!isNaN(d.getTime())) toDate = d; }
      // Clamp to a 90-day window
      if (fromDate && toDate && toDate.getTime() - fromDate.getTime() > 90 * 86400 * 1000) {
        toDate = new Date(fromDate.getTime() + 90 * 86400 * 1000);
      }

      const conditions: ReturnType<typeof eq>[] = [];
      if (sourceFilter) conditions.push(sql`${inboundVerificationLog.source} ilike ${sourceFilter + "%"}` as any);
      if (fromDate) conditions.push(gte(inboundVerificationLog.createdAt, fromDate) as any);
      if (toDate)   conditions.push(sql`${inboundVerificationLog.createdAt} <= ${toDate}` as any);

      const where = conditions.length > 0 ? and(...conditions) : undefined;

      const rows = await db.select().from(inboundVerificationLog)
        .where(where)
        .orderBy(desc(inboundVerificationLog.createdAt))
        .limit(limit)
        .offset(offset);
      res.json({ count: rows.length, log: rows, limit, offset });
    } catch (err) {
      console.error("[PartnerAPI] admin inbound-verification-log fetch failed:", err);
      res.status(500).json({ error: "Failed to fetch inbound verification log." });
    }
  });

  // ── Admin — inbound data viewer ───────────────────────────────────────────

  app.get("/api/admin/partner-inbound", requireAdminKey, async (req, res) => {
    try {
      const rows = await db.select().from(partnerInboundData)
        .orderBy(desc(partnerInboundData.receivedAt))
        .limit(100);
      res.json({ count: rows.length, data: rows });
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch inbound data." });
    }
  });

  app.patch("/api/admin/partner-inbound/:id/mark-processed", requireAdminKey, async (req, res) => {
    try {
      const [updated] = await db.update(partnerInboundData)
        .set({ processed: true, processedAt: new Date() })
        .where(eq(partnerInboundData.id, req.params.id as string))
        .returning({ id: partnerInboundData.id });
      if (!updated) return res.status(404).json({ error: "Record not found." });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to mark processed." });
    }
  });

  // ── Admin key management ──────────────────────────────────────────────────

  app.get("/api/admin/partner-keys", requireAdminKey, async (req, res) => {
    try {
      const keys = await db.select({
        id: partnerApiKeys.id,
        partnerName: partnerApiKeys.partnerName,
        partnerEmail: partnerApiKeys.partnerEmail,
        keyPrefix: partnerApiKeys.keyPrefix,
        scopes: partnerApiKeys.scopes,
        active: partnerApiKeys.active,
        usageCount: partnerApiKeys.usageCount,
        lastUsedAt: partnerApiKeys.lastUsedAt,
        notes: partnerApiKeys.notes,
        createdAt: partnerApiKeys.createdAt,
      }).from(partnerApiKeys).orderBy(desc(partnerApiKeys.createdAt));

      res.json({ keys });
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch partner keys." });
    }
  });

  app.post("/api/admin/partner-keys", requireAdminKey, async (req, res) => {
    try {
      const { partnerName, partnerEmail, scopes, notes } = req.body;
      if (!partnerName) return res.status(400).json({ error: "partnerName is required." });

      const { plaintext, prefix, hash } = generateKey();
      const [created] = await db.insert(partnerApiKeys).values({
        partnerName,
        partnerEmail: partnerEmail || null,
        keyHash: hash,
        keyPrefix: prefix,
        scopes: scopes && scopes.length ? scopes : ["content:read"],
        notes: notes || null,
      }).returning();

      res.json({
        success: true,
        key: created,
        plaintextKey: plaintext,
        warning: "Copy this key now — it will never be shown again.",
      });
    } catch (err) {
      res.status(500).json({ error: "Failed to create partner key." });
    }
  });

  app.patch("/api/admin/partner-keys/:id/revoke", requireAdminKey, async (req, res) => {
    try {
      const [updated] = await db.update(partnerApiKeys)
        .set({ active: false })
        .where(eq(partnerApiKeys.id, req.params.id as string))
        .returning({ id: partnerApiKeys.id, partnerName: partnerApiKeys.partnerName });
      if (!updated) return res.status(404).json({ error: "Key not found." });
      res.json({ success: true, revoked: updated });
    } catch (err) {
      res.status(500).json({ error: "Failed to revoke key." });
    }
  });

  app.patch("/api/admin/partner-keys/:id/restore", requireAdminKey, async (req, res) => {
    try {
      const [updated] = await db.update(partnerApiKeys)
        .set({ active: true })
        .where(eq(partnerApiKeys.id, req.params.id as string))
        .returning({ id: partnerApiKeys.id, partnerName: partnerApiKeys.partnerName });
      if (!updated) return res.status(404).json({ error: "Key not found." });
      res.json({ success: true, restored: updated });
    } catch (err) {
      res.status(500).json({ error: "Failed to restore key." });
    }
  });

  app.get("/api/admin/partner-keys/audit", requireAdminKey, async (req, res) => {
    try {
      const logs = await db.select().from(partnerApiAuditLog)
        .orderBy(desc(partnerApiAuditLog.calledAt))
        .limit(200);
      res.json({ logs });
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch audit log." });
    }
  });

  // ── Community-brief production probe status ──────────────────────────────
  // Returns the last result recorded by the 30-minute background probe so
  // the Ops Center can display a live health badge without waiting for email.
  app.get("/api/admin/brief-probe-status", requireAdminKey, (_req, res) => {
    const result = getLastBriefProbeResult();
    if (!result) {
      // Probe hasn't run yet (server just started, or probe disabled in this env)
      return res.json({ available: false, message: "No probe result yet — probe runs 60 s after boot, then every 30 min." });
    }
    return res.json({ available: true, ...result });
  });
}
