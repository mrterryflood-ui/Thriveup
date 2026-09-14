/**
 * Authenticated cross-tool journey-spine contract gate.
 *
 * Run: npx tsx scripts/verify-journey-spine.ts
 *
 * This mounts the real Benefits, CHW referral, and YHSI handlers behind a
 * test-only session shim, then inspects the persisted journey row. ChildCORE
 * transport is stubbed at the connector boundary so this gate proves the
 * privacy envelope without contacting an upstream service.
 */
import express, { type NextFunction, type Request, type Response } from "express";
import { randomUUID } from "node:crypto";
import type { Server } from "node:http";
import { eq, like, or } from "drizzle-orm";
import { db } from "../server/storage";
import {
  academyAvatars,
  benefitsScreenings,
  childcoreCountyMetrics,
  referrals,
  userJourneys,
  yhsiYouthParticipants,
} from "@shared/schema";
import { users } from "@shared/models/auth";
import { registerBenefitsRoutes } from "../server/benefits-routes";
import { referralRouter } from "../server/referral-routes";
import { registerYhsiRoutes } from "../server/yhsi-routes";
import { getPersonalContext } from "../server/personal-context";
import { mergeJourneyNeeds } from "../server/journey-spine";

const PREFIX = "journey-spine-contract-";
const RUN_ID = randomUUID().replace(/-/g, "").slice(0, 12);
const TEST_MARKER = `${PREFIX}${RUN_ID}`;
const USER_ID = `${TEST_MARKER}-staff`;
const STUDENT_ID = `${TEST_MARKER}-student`;
const TEST_YHSI_COUNTY = String(90000 + (process.pid % 9999));
const PERSONAL_CONTEXT_COUNTY = "48453";
const TEST_CHILDCORE_KEY = "journey-spine-contract-test-key";
const originalChildcoreKey = process.env.CHILDCORE_API_KEY;
const originalFetch = globalThis.fetch;

type CapturedPush = {
  url: string;
  body: Record<string, any>;
};

let passed = 0;
let failed = 0;

function check(name: string, ok: boolean, detail?: string): void {
  if (ok) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    console.error(`  ✗ ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

async function waitFor(
  description: string,
  predicate: () => Promise<boolean>,
  timeoutMs = 5000,
): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await predicate()) return true;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  check(description, false, "timed out waiting for fire-and-forget persistence");
  return false;
}

async function main(): Promise<void> {
  const capturedPushes: CapturedPush[] = [];
  const screeningIds: string[] = [];
  const referralIds: string[] = [];
  let participantId: string | null = null;
  let metricId: string | null = null;
  let server: Server | null = null;

  process.env.CHILDCORE_API_KEY = TEST_CHILDCORE_KEY;
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const headers = new Headers(init?.headers);
    if (
      !url.endsWith("/push") ||
      init?.method !== "POST" ||
      headers.get("authorization") !== `Bearer ${TEST_CHILDCORE_KEY}` ||
      headers.get("x-childcore-key") !== TEST_CHILDCORE_KEY
    ) {
      throw new Error(`Unexpected outbound request in journey-spine gate: ${init?.method ?? "GET"} ${url}`);
    }
    const bodyText = typeof init?.body === "string" ? init.body : "{}";
    const body = JSON.parse(bodyText) as Record<string, any>;
    if (!["yhsi_enrollment", "yhsi_county_outcomes"].includes(body.event)) {
      throw new Error(`Unexpected ChildCORE event in journey-spine gate: ${String(body.event)}`);
    }
    capturedPushes.push({
      url,
      body,
    });
    return new Response(JSON.stringify({ accepted: true }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }) as typeof fetch;

  try {
    await db.insert(users).values({ id: USER_ID, email: `${USER_ID}@test.local` });
    await db.insert(academyAvatars).values({
      userId: USER_ID,
      displayName: USER_ID,
      role: "staff",
    });
    await db.insert(users).values({ id: STUDENT_ID, email: `${STUDENT_ID}@test.local` });
    await db.insert(academyAvatars).values({
      userId: STUDENT_ID,
      displayName: STUDENT_ID,
      role: "student",
    });
    await db.insert(userJourneys).values({
      userId: USER_ID,
      identifiedNeeds: ["housing"],
      screenerFlags: { "existing:flag": true },
      activeReferralIds: ["existing-referral"],
      yhsiStatus: "preexisting",
      lastKnownGeography: "county:48453",
      communityContextAt: new Date(),
    });
    const [metric] = await db.insert(childcoreCountyMetrics).values({
      fipsCode: PERSONAL_CONTEXT_COUNTY,
      countyName: "Travis County",
      stateFips: "48",
      desertRate: 42,
      prekEnrollmentRate: 61,
      childPovertyRate: 18,
      receivedAt: new Date(),
    }).returning({ id: childcoreCountyMetrics.id });
    metricId = metric.id;

    const app = express();
    app.use(express.json({ limit: "2mb" }));
    app.use((req: Request, _res: Response, next: NextFunction) => {
      const testUser = req.header("x-test-user");
      if (testUser) {
        (req as any).user = {
          claims: { sub: testUser },
          expires_at: Math.floor(Date.now() / 1000) + 3600,
        };
        (req as any).isAuthenticated = () => true;
      } else {
        (req as any).isAuthenticated = () => false;
      }
      next();
    });
    registerBenefitsRoutes(app);
    registerYhsiRoutes(app);
    app.use("/api/referrals", referralRouter);

    server = await new Promise<Server>((resolve) => {
      const listening = app.listen(0, "127.0.0.1", () => resolve(listening));
    });
    const address = server.address();
    const base = `http://127.0.0.1:${typeof address === "object" && address ? address.port : 0}`;

    const call = async (
      path: string,
      options: { method?: string; body?: unknown; user?: string } = {},
    ) => {
      const headers: Record<string, string> = {};
      if (options.user) headers["x-test-user"] = options.user;
      if (options.body !== undefined) headers["content-type"] = "application/json";
      const response = await originalFetch(`${base}${path}`, {
        method: options.method ?? "GET",
        headers,
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
      });
      let json: any = null;
      try {
        json = await response.json();
      } catch {
        // The status is enough for non-JSON error responses.
      }
      return { status: response.status, json };
    };

    const anonymousReferral = await call("/api/referrals", {
      method: "POST",
      body: { programCode: "SNAP", orgName: `${TEST_MARKER}-anonymous` },
    });
    check("Anonymous CHW referral is rejected", anonymousReferral.status === 401, `got ${anonymousReferral.status}`);
    const studentReferral = await call("/api/referrals", {
      method: "POST",
      user: STUDENT_ID,
      body: { programCode: "SNAP", orgName: `${TEST_MARKER}-student` },
    });
    check("Authenticated non-staff CHW referral is rejected", studentReferral.status === 403, `got ${studentReferral.status}`);
    const anonymousParticipant = await call("/api/yhsi/participants", {
      method: "POST",
      body: { countyFips: TEST_YHSI_COUNTY, livingSituation: "shelter" },
    });
    check("Anonymous YHSI participant write is rejected", anonymousParticipant.status === 401, `got ${anonymousParticipant.status}`);
    const studentParticipant = await call("/api/yhsi/participants", {
      method: "POST",
      user: STUDENT_ID,
      body: { countyFips: TEST_YHSI_COUNTY, livingSituation: "shelter" },
    });
    check("Authenticated non-staff YHSI write is rejected", studentParticipant.status === 403, `got ${studentParticipant.status}`);

    console.log("\nAuthenticated journey writes:");
    const benefitsPayload = {
      screeningType: TEST_MARKER,
      householdSize: 2,
      annualIncome: 1000,
      hasChildren: true,
      currentBenefits: ["SNAP"],
      zipCode: "78701",
    };
    const benefits = await call("/api/benefits/screenings", {
      method: "POST",
      user: USER_ID,
      body: benefitsPayload,
    });
    check("Benefits screening accepts the authenticated session", benefits.status === 200, `got ${benefits.status}`);
    if (typeof benefits.json?.screening?.id === "string") screeningIds.push(benefits.json.screening.id);
    check(
      "Benefits response contains both eligibility and gap candidates",
      benefits.json?.eligibleBenefits?.includes("SNAP") &&
        benefits.json?.gapBenefits?.includes("Medicaid"),
      JSON.stringify({
        eligible: benefits.json?.eligibleBenefits,
        gaps: benefits.json?.gapBenefits,
      }),
    );

    const referralBodies = [
      { programCode: "SNAP", orgName: `${TEST_MARKER}-org-a`, notes: TEST_MARKER },
      { programCode: "WIC", orgName: `${TEST_MARKER}-org-b`, notes: TEST_MARKER },
    ];
    const referralResponses = await Promise.all(
      referralBodies.map((body) => call("/api/referrals", {
        method: "POST",
        user: USER_ID,
        body,
      })),
    );
    for (const response of referralResponses) {
      check("CHW referral accepts the authenticated staff session", response.status === 201, `got ${response.status}`);
      if (typeof response.json?.referral?.id === "string") referralIds.push(response.json.referral.id);
    }
    check("Two distinct referral IDs were issued", referralIds.length === 2);

    const participant = await call("/api/yhsi/participants", {
      method: "POST",
      user: USER_ID,
      body: {
        firstName: "Test",
        lastNameInitial: "J",
        ageAtContact: 17,
        stateCode: "TX",
        countyFips: TEST_YHSI_COUNTY,
        livingSituation: "shelter",
        mckinneyVentoStatus: "identified",
        educationStatus: "enrolled",
        employmentStatus: "seeking",
        schoolDistrict: "TEST-DISTRICT",
        consentOnFile: false,
        notes: TEST_MARKER,
        yhsiStatus: "forged-client-status",
      },
    });
    check("YHSI participant accepts the authenticated staff session", participant.status === 201, `got ${participant.status}`);
    participantId = participant.json?.id ?? null;

    const journeyReady = await waitFor("All authenticated writes persist to the journey row", async () => {
      const [row] = await db.select().from(userJourneys).where(eq(userJourneys.userId, USER_ID)).limit(1);
      return Boolean(
        row?.screenerFlags?.["eligible:SNAP"] &&
        row.screenerFlags?.["gap:Medicaid"] &&
        row.activeReferralIds?.includes(referralIds[0]) &&
        row.activeReferralIds?.includes(referralIds[1]) &&
        row.yhsiStatus === "shelter",
      );
    });
    const [journey] = await db.select().from(userJourneys).where(eq(userJourneys.userId, USER_ID)).limit(1);
    check("Benefits flags merge without dropping prior needs", journeyReady && journey?.identifiedNeeds?.includes("housing"));
    check("Benefits geography persists as the submitted ZIP", journey?.lastKnownGeography === "zip:78701");
    check("Prior screener and referral state survives later writes",
      journey?.screenerFlags?.["existing:flag"] === true &&
        journey?.activeReferralIds?.includes("existing-referral"),
    );
    check("Referral IDs append without losing either concurrent write",
      referralIds.every((id) => journey?.activeReferralIds?.includes(id)),
    );
    check("YHSI status is derived from the persisted participant, not client input",
      journey?.yhsiStatus === "shelter" && journey.yhsiStatus !== "forged-client-status",
    );

    const context = await getPersonalContext(USER_ID, "I need childcare help");
    check("Personal context resolves the stored ZIP to the expected county",
      context.contextBlock.includes("Geography: zip:78701") &&
        context.contextBlock.includes("ChildCORE county context for Travis County"),
    );
    check("Personal context labels ChildCORE metrics as partner-reported",
      context.contextBlock.includes("partner-reported, not independently verified"),
    );

    const longNavigatorGeography = "New Orleans, Louisiana";
    await mergeJourneyNeeds(USER_ID, ["childcare"], longNavigatorGeography);
    const [longGeographyJourney] = await db
      .select()
      .from(userJourneys)
      .where(eq(userJourneys.userId, USER_ID))
      .limit(1);
    check(
      "Navigator city/state geography and needs persist beyond the legacy 20-character limit",
      longGeographyJourney?.lastKnownGeography === longNavigatorGeography &&
        longGeographyJourney.identifiedNeeds?.includes("childcare"),
    );

    const childcorePushesReady = await waitFor("YHSI sends both ChildCORE notifications", async () =>
      capturedPushes.some((push) => push.body.event === "yhsi_county_outcomes") &&
      capturedPushes.some((push) => push.body.event === "yhsi_enrollment"),
    );
    const countyPush = capturedPushes.find((push) => push.body.event === "yhsi_county_outcomes");
    const countyData = countyPush?.body.data;
    check("County aggregate is scoped to the YHSI county",
      childcorePushesReady && countyData?.countyFips === TEST_YHSI_COUNTY,
    );
    check("County aggregate suppresses counts below the floor",
      countyData?.participantCount === null &&
        countyData?.stableHousingCount === null &&
        countyData?.educationEngagedCount === null &&
        countyData?.employmentEngagedCount === null &&
        countyData?.suppressed === true &&
        countyData?.suppressionFloor === 5,
    );
    check("County ChildCORE payload contains no participant-level fields",
      countyData &&
        !("firstName" in countyData) &&
        !("lastNameInitial" in countyData) &&
        !("schoolDistrict" in countyData) &&
        !("participantRef" in countyData),
    );

    const participantPush = capturedPushes.find((push) => push.body.event === "yhsi_enrollment");
    check("Participant ChildCORE notification uses an opaque reference only",
      participantPush?.body.data?.participantRef === participantId &&
        !("firstName" in (participantPush?.body.data ?? {})) &&
        !("lastNameInitial" in (participantPush?.body.data ?? {})),
    );
  } finally {
    const cleanup = async (label: string, operation: () => Promise<unknown>) => {
      try {
        await operation();
      } catch (error) {
        failed++;
        console.error(`[journey-spine] cleanup failed for ${label}:`, error);
      }
    };
    await cleanup("server", async () => {
      if (server) await new Promise<void>((resolve) => server!.close(() => resolve()));
    });
    await cleanup("YHSI participants", () => db.delete(yhsiYouthParticipants).where(
      or(
        participantId ? eq(yhsiYouthParticipants.id, participantId) : undefined,
        eq(yhsiYouthParticipants.createdBy, USER_ID),
        like(yhsiYouthParticipants.notes, `${TEST_MARKER}%`),
      ),
    ));
    await cleanup("referrals", () => db.delete(referrals).where(
      or(
        ...referralIds.map((id) => eq(referrals.id, id)),
        eq(referrals.chwUserId, USER_ID),
        like(referrals.notes, `${TEST_MARKER}%`),
      ),
    ));
    await cleanup("benefits screenings", () => db.delete(benefitsScreenings).where(
      eq(benefitsScreenings.screeningType, TEST_MARKER),
    ));
    await cleanup("ChildCORE metric", async () => {
      if (metricId) await db.delete(childcoreCountyMetrics).where(eq(childcoreCountyMetrics.id, metricId));
    });
    await cleanup("journey rows", () => db.delete(userJourneys).where(eq(userJourneys.userId, USER_ID)));
    await cleanup("avatars", () => db.delete(academyAvatars).where(or(
      eq(academyAvatars.userId, USER_ID),
      eq(academyAvatars.userId, STUDENT_ID),
    )));
    await cleanup("users", () => db.delete(users).where(or(
      eq(users.id, USER_ID),
      eq(users.id, STUDENT_ID),
    )));
    try {
      globalThis.fetch = originalFetch;
      if (originalChildcoreKey === undefined) delete process.env.CHILDCORE_API_KEY;
      else process.env.CHILDCORE_API_KEY = originalChildcoreKey;
    } catch (error) {
      failed++;
      console.error("[journey-spine] global transport cleanup failed:", error);
    }
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});