import { test, expect, request as pwRequest } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { Client } from "pg";
import { cleanupTestUser, ensureTestUser, forgeSession, requireEnv } from "./helpers/auth";

const BASE = process.env.E2E_BASE_URL || "http://localhost:5000";
const RUN = randomUUID().replace(/[^a-f]/gi, "").slice(0, 6) || "e2etest";
const STAFF = { userId: `e2e-gravity-staff-${RUN}`, email: `e2e-gravity-staff-${RUN}@test.local` };
const NONSTAFF = { userId: `e2e-gravity-member-${RUN}`, email: `e2e-gravity-member-${RUN}@test.local` };
const TEST_CITY = `Gravity${RUN}`;
const PROFILE_NAME = `E2E Community Network ${RUN}`;

/**
 * Community Gravity (the Magnet) — public read path, provenance, honesty states,
 * and the server-side staff gate. Uses the live Austin, TX ingest; no AI calls.
 */

test("gravity API: provenance, method disclosure, validation, and staff gates", async ({ request }) => {
  const field = await request.get(`${BASE}/api/community-gravity?city=Austin&state=TX`);
  expect(field.status()).toBe(200);
  const body = await field.json();
  expect(body.builtFrom.source).toContain("IRS");
  expect(body.builtFrom.orgCount).toBeGreaterThan(1000);
  expect(body.method.magnet).toContain("never as $0");
  expect(body.limits.join(" ")).toContain("not a service area");
  const edu = body.clusters.find((c: { domain: string }) => c.domain === "education");
  expect(edu.magnets.length).toBeGreaterThan(0);
  for (const m of edu.magnets) expect(m.revenueAmt === null || m.revenueAmt > 0).toBeTruthy();

  const empty = await request.get(`${BASE}/api/community-gravity?city=Nowhereville&state=TX`);
  expect((await empty.json()).builtFrom).toBeNull();
  expect((await request.get(`${BASE}/api/community-gravity?city=1;drop&state=TX`)).status()).toBe(400);
  expect((await request.get(`${BASE}/api/community-gravity?city=Austin&state=ZZ`)).status()).toBe(400);
  expect((await request.get(`${BASE}/api/community-gravity?city=San%20Jos%C3%A9&state=CA`)).status()).toBe(200);
  expect((await request.get(`${BASE}/api/community-gravity/orgs/12345/facts`)).status()).toBe(400);

  const search = await request.get(`${BASE}/api/community-gravity/orgs?city=Austin&state=TX&q=food+bank`);
  const orgs = (await search.json()).orgs as { ein: string; name: string; verifiedNote?: string | null }[];
  expect(orgs.some(o => /FOOD BANK/.test(o.name))).toBeTruthy();
  expect(orgs.every(o => !("verifiedNote" in o))).toBeTruthy();
  const facts = await request.get(`${BASE}/api/community-gravity/orgs/${orgs[0].ein}/facts`);
  expect(facts.status()).toBe(200);
  expect(Array.isArray((await facts.json()).facts)).toBeTruthy();

  // Writes are staff-only and enforced server-side (anonymous → 401).
  for (const path of [`/api/community-gravity/orgs/${orgs[0].ein}/research`, `/api/community-gravity/orgs/${orgs[0].ein}/verify`, `/api/community-gravity/ingest`]) {
    expect((await request.post(`${BASE}${path}`, { data: { verified: true, state: "TX" } })).status()).toBe(401);
  }
});

test("organization Rolodex: public source-backed read, no relationship inference, and staff-only writes", async ({ request }) => {
  const directory = await request.get(`${BASE}/api/community-gravity/network?city=Austin&state=TX`);
  expect(directory.status()).toBe(200);
  const body = await directory.json();
  expect(body.community).toEqual({ city: "Austin", state: "TX" });
  expect(body.limits.join(" ")).toContain("does not establish a partnership");
  expect(body.limits.join(" ")).toContain("directory coverage gap");
  expect(body.limits.join(" ")).toContain("IRS filing records are separate sources");
  expect(body.profiles.length).toBeLessThanOrEqual(body.limit);
  const publicFields = new Set(["id", "name", "stakeholderType", "description", "city", "state", "communityArea", "focusAreas", "serviceArea", "website", "sourceUrl", "publishedAt"]);
  for (const profile of body.profiles) {
    expect(Object.keys(profile).every((key: string) => publicFields.has(key))).toBeTruthy();
  }
  expect((await request.get(`${BASE}/api/community-gravity/network?city=Austin&state=1;drop`)).status()).toBe(400);
  expect((await request.get(`${BASE}/api/community-gravity/network?city=Austin&state=ZZ`)).status()).toBe(400);
  expect((await request.get(`${BASE}/api/community-gravity/network?city=San%20Jos%C3%A9&state=CA`)).status()).toBe(200);
  expect((await request.get(`${BASE}/api/community-gravity/network/manage?city=Austin&state=TX`)).status()).toBe(401);
  expect((await request.post(`${BASE}/api/community-gravity/network`, { data: {} })).status()).toBe(401);
  expect((await request.patch(`${BASE}/api/community-gravity/network/00000000-0000-0000-0000-000000000000`, { data: {} })).status()).toBe(401);
  expect((await request.post(`${BASE}/api/community-gravity/network/00000000-0000-0000-0000-000000000000/publish`)).status()).toBe(401);
  expect((await request.post(`${BASE}/api/community-gravity/network/00000000-0000-0000-0000-000000000000/archive`)).status()).toBe(401);

  const inviteValidation = await request.post(`${BASE}/api/iti/invitations`, { data: { surface: "community-gravity" } });
  expect(inviteValidation.status()).toBe(400);
  expect((await inviteValidation.json()).error).toContain("workDescription is required");
});

test.describe("staff-managed organization profile lifecycle", () => {
  let db: Client | null = null;
  const itiInvitationIds: string[] = [];

  test.beforeAll(async () => {
    db = new Client({ connectionString: requireEnv("DATABASE_URL") });
    await db.connect();
    await cleanupTestUser(db, STAFF.userId);
    await cleanupTestUser(db, NONSTAFF.userId);
    await ensureTestUser(db, { ...STAFF, firstName: "E2E", lastName: "GravityStaff", role: "admin" });
    await ensureTestUser(db, { ...NONSTAFF, firstName: "E2E", lastName: "GravityMember", role: "student" });
  });

  test.afterAll(async () => {
    if (!db) return;
    try {
      await db.query("DELETE FROM community_network_profiles WHERE name = ANY($1::text[])", [[PROFILE_NAME, `${PROFILE_NAME} Updated`]]);
      for (const invitationId of itiInvitationIds) {
        await db.query("DELETE FROM community_voice_pins WHERE iti_invitation_id = $1", [invitationId]);
        await db.query("DELETE FROM integration_invitations WHERE id = $1", [invitationId]);
      }
      await cleanupTestUser(db, STAFF.userId);
      await cleanupTestUser(db, NONSTAFF.userId);
    } finally {
      await db.end();
    }
  });

  test("creates drafts, publishes only after staff action, resets edits to draft, and archives without public deletion", async ({ page, request }) => {
    if (!db) throw new Error("The E2E database did not initialize.");
    const staffCookie = await forgeSession(db, STAFF);
    const memberCookie = await forgeSession(db, NONSTAFF);

    const memberApi = await pwRequest.newContext({ baseURL: BASE, extraHTTPHeaders: { Cookie: memberCookie } });
    expect((await memberApi.get("/api/community-gravity/network/manage")).status()).toBe(403);
    expect((await memberApi.post("/api/community-gravity/network", { data: {} })).status()).toBe(403);
    expect((await memberApi.patch("/api/community-gravity/network/00000000-0000-0000-0000-000000000000", { data: {} })).status()).toBe(403);
    expect((await memberApi.post("/api/community-gravity/network/00000000-0000-0000-0000-000000000000/publish")).status()).toBe(403);
    expect((await memberApi.post("/api/community-gravity/network/00000000-0000-0000-0000-000000000000/archive")).status()).toBe(403);
    await memberApi.dispose();

    const staffApi = await pwRequest.newContext({ baseURL: BASE, extraHTTPHeaders: { Cookie: staffCookie } });
    const validDraft = {
      name: `${PROFILE_NAME} Invalid Probe`,
      stakeholderType: "Community institution",
      city: "Austin",
      state: "TX",
      sourceUrl: "https://8.8.8.8/community-profile",
    };
    expect((await staffApi.post("/api/community-gravity/network", { data: { ...validDraft, sourceUrl: "http://127.0.0.1/private" } })).status()).toBe(400);
    expect((await staffApi.post("/api/community-gravity/network", { data: { ...validDraft, sourceUrl: "http://localhost/private" } })).status()).toBe(400);
    expect((await staffApi.post("/api/community-gravity/network", { data: { ...validDraft, state: "ZZ" } })).status()).toBe(400);

    await page.setExtraHTTPHeaders({ Cookie: staffCookie });
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(`${BASE}/community-gravity?city=${encodeURIComponent(TEST_CITY)}&state=TX`);
    const management = page.getByTestId("gravity-network-management");
    await expect(management).toBeVisible();
    await page.getByTestId("gravity-profile-name").fill(PROFILE_NAME);
    await page.getByTestId("gravity-profile-type").fill("Workforce development center");
    await page.getByTestId("gravity-profile-city").fill(TEST_CITY);
    await page.getByTestId("gravity-profile-state").fill("TX");
    await page.getByTestId("gravity-profile-source-input").fill("https://8.8.8.8/community-profile");
    await page.getByTestId("gravity-profile-save").click();

    let profileRow = page.locator('[data-testid^="gravity-managed-profile-"]').filter({ hasText: PROFILE_NAME });
    await expect(profileRow).toContainText("draft");
    const managedProfileTestId = await profileRow.getAttribute("data-testid");
    const managedProfileId = managedProfileTestId?.replace(/^gravity-managed-profile-/, "");
    if (!managedProfileId) throw new Error("The managed profile row did not expose its test identifier.");
    await db.query("UPDATE community_network_profiles SET website = $1 WHERE id = $2", ["http://127.0.0.1/private", managedProfileId]);
    expect((await staffApi.post(`/api/community-gravity/network/${managedProfileId}/publish`)).status()).toBe(400);
    await db.query("UPDATE community_network_profiles SET website = NULL WHERE id = $1", [managedProfileId]);
    await staffApi.dispose();
    const publicUrl = `${BASE}/api/community-gravity/network?city=${encodeURIComponent(TEST_CITY)}&state=TX`;
    const drafts = await request.get(publicUrl);
    expect((await drafts.json()).profiles.some((profile: { name: string }) => profile.name === PROFILE_NAME)).toBeFalsy();

    await profileRow.getByRole("button", { name: "Publish" }).click();
    await expect(profileRow).toContainText("published");
    const published = await request.get(publicUrl);
    expect((await published.json()).profiles.some((profile: { name: string }) => profile.name === PROFILE_NAME)).toBeTruthy();

    await profileRow.getByRole("button", { name: "Edit" }).click();
    await page.getByTestId("gravity-profile-name").fill(`${PROFILE_NAME} Updated`);
    await page.getByTestId("gravity-profile-city").fill("San José");
    await page.getByTestId("gravity-profile-state").fill("CA");
    await page.getByTestId("gravity-profile-save").click();
    profileRow = page.locator('[data-testid^="gravity-managed-profile-"]').filter({ hasText: `${PROFILE_NAME} Updated` });
    await expect(profileRow).toContainText("draft");
    const movedPublicUrl = `${BASE}/api/community-gravity/network?city=San%20Jos%C3%A9&state=CA`;
    const unpublishedEdit = await request.get(movedPublicUrl);
    expect((await unpublishedEdit.json()).profiles.some((profile: { name: string }) => profile.name === `${PROFILE_NAME} Updated`)).toBeFalsy();

    await profileRow.getByRole("button", { name: "Publish" }).click();
    await expect(profileRow).toContainText("published");
    const republished = await request.get(movedPublicUrl);
    expect((await republished.json()).profiles.some((profile: { name: string }) => profile.name === `${PROFILE_NAME} Updated`)).toBeTruthy();
    page.once("dialog", dialog => dialog.accept());
    await profileRow.getByRole("button", { name: "Archive" }).click();
    await expect(profileRow).toContainText("archived");
    const archived = await request.get(movedPublicUrl);
    expect((await archived.json()).profiles.some((profile: { name: string }) => profile.name === `${PROFILE_NAME} Updated`)).toBeFalsy();
    await page.context().clearCookies();
  });

  test("ITI keeps self-identification separate, serializes consent changes, and locks profile after withdrawal", async ({ request, page }) => {
    if (!db) throw new Error("The E2E database did not initialize.");
    const created = await request.post(`${BASE}/api/iti/invitations`, {
      data: {
        surface: "community-gravity",
        surfaceContext: `e2e-${RUN}`,
        workDescription: "Synthetic E2E check of the invitation consent defaults.",
        workRolesSelfIdentified: ["community health worker"],
      },
    });
    expect(created.status()).toBe(201);
    const payload = await created.json();
    const itiInvitationId = payload.invitation.id as string;
    itiInvitationIds.push(itiInvitationId);
    expect(payload.withdrawalToken).toMatch(/^[a-f0-9]{64}$/i);
    expect(payload.withdrawalToken).not.toBe(payload.accessToken);
    expect(payload.invitation.workDescription).toContain("Synthetic E2E");
    expect(payload.invitation.workRolesSelfIdentified).toContain("community health worker");

    const restored = await request.get(`${BASE}/api/iti/invitations/${itiInvitationId}`, {
      headers: { "x-iti-token": payload.accessToken },
    });
    expect(restored.status()).toBe(200);
    const record = await restored.json();
    const consentKeys = ["quoteMe", "aggregateMyData", "nameMePublicly", "routeMyInfoToService", "shareWithFunder", "inviteToConvening", "acceptStipend", "routeToCredentialing"];
    expect(consentKeys.every(key => record.consents[key] === false)).toBeTruthy();

    await page.addInitScript(({ id, token }) => {
      sessionStorage.setItem("iti-token:community-gravity:community-directory", JSON.stringify({ value: token, storedAt: Date.now() }));
      sessionStorage.setItem("iti-id:community-gravity:community-directory", JSON.stringify({ value: id, storedAt: Date.now() }));
    }, { id: itiInvitationId, token: payload.accessToken });
    await page.goto(`${BASE}/community-gravity`);
    await expect(page.getByTestId("card-iti-witness-loop")).toBeVisible();
    const consentRoute = `**/api/iti/invitations/${itiInvitationId}/consents`;
    let releaseConsentResponse!: () => void;
    const consentGate = new Promise<void>(resolve => { releaseConsentResponse = resolve; });
    await page.route(consentRoute, async route => {
      await consentGate;
      await route.continue();
    });
    const consentResponse = page.waitForResponse(response =>
      response.url().includes(`/api/iti/invitations/${itiInvitationId}/consents`) &&
      response.request().method() === "PATCH",
    );
    await page.getByTestId("switch-iti-consent-quote").click();
    await expect(page.getByTestId("switch-iti-consent-quote")).toBeDisabled();
    await expect(page.getByTestId("button-iti-withdraw")).toBeDisabled();
    releaseConsentResponse();
    expect((await consentResponse).status()).toBe(200);
    await page.unroute(consentRoute);
    page.once("dialog", dialog => dialog.accept());
    await page.getByTestId("button-iti-withdraw").click();
    await expect(page.getByTestId("button-iti-withdraw")).toContainText("Invitation withdrawn");
    await expect(page.getByTestId("switch-iti-consent-quote")).toBeDisabled();
    await expect(page.getByTestId("switch-iti-consent-quote")).toHaveAttribute("aria-checked", "false");
    expect((await request.patch(`${BASE}/api/iti/invitations/${itiInvitationId}`, {
      headers: { "x-iti-token": payload.accessToken },
      data: { workDescription: "Synthetic E2E edit after withdrawal." },
    })).status()).toBe(409);

    await db.query("UPDATE integration_invitations SET created_at = now() - interval '25 hours' WHERE id = $1", [itiInvitationId]);
    expect((await request.get(`${BASE}/api/iti/invitations/${itiInvitationId}`, {
      headers: { "x-iti-token": payload.accessToken },
    })).status()).toBe(404);
  });

  test("ITI keeps withdrawal-only access after 24 hours without reopening profile or history", async ({ request, page }) => {
    if (!db) throw new Error("The E2E database did not initialize.");
    const created = await request.post(`${BASE}/api/iti/invitations`, {
      data: {
        surface: "community-gravity",
        surfaceContext: "community-directory",
        workDescription: "Synthetic E2E check of withdrawal-only access after expiry.",
      },
    });
    expect(created.status()).toBe(201);
    const payload = await created.json();
    const invitationId = payload.invitation.id as string;
    itiInvitationIds.push(invitationId);
    expect(payload.withdrawalToken).toMatch(/^[a-f0-9]{64}$/i);
    expect(payload.withdrawalToken).not.toBe(payload.accessToken);

    const forbiddenRead = await request.get(`${BASE}/api/iti/invitations/${invitationId}`, {
      headers: { "x-iti-withdrawal-token": payload.withdrawalToken },
    });
    expect(forbiddenRead.status()).toBe(404);
    const grantConsent = await request.patch(`${BASE}/api/iti/invitations/${invitationId}/consents`, {
      headers: { "x-iti-token": payload.accessToken },
      data: { aggregateMyData: true },
    });
    expect(grantConsent.status()).toBe(200);

    const activeLinkedVoicePin = await request.post(`${BASE}/api/voice/projects/pflugerville-holistic-services/pins`, {
      headers: { "x-iti-token": payload.accessToken },
      data: {
        lat: 30.4394,
        lng: -97.62,
        category: "story",
        body: "Synthetic active ITI-linked voice submission.",
        itiInvitationId: invitationId,
      },
    });
    expect(activeLinkedVoicePin.status()).toBe(200);
    const activePinPayload = await activeLinkedVoicePin.json();
    expect(activePinPayload.pin?.id).toBeTruthy();
    const linkedPinsBeforeExpiry = await db.query("SELECT id FROM community_voice_pins WHERE iti_invitation_id = $1", [invitationId]);
    expect(linkedPinsBeforeExpiry.rows).toEqual([{ id: activePinPayload.pin.id }]);

    await db.query("UPDATE integration_invitations SET created_at = now() - interval '25 hours' WHERE id = $1", [invitationId]);
    const linkedVoicePin = await request.post(`${BASE}/api/voice/projects/pflugerville-holistic-services/pins`, {
      headers: { "x-iti-token": payload.accessToken },
      data: {
        lat: 30.4394,
        lng: -97.62,
        category: "story",
        body: "Synthetic expired ITI-linked voice submission.",
        itiInvitationId: invitationId,
      },
    });
    expect(linkedVoicePin.status()).toBe(403);
    const linkedPins = await db.query("SELECT id FROM community_voice_pins WHERE iti_invitation_id = $1", [invitationId]);
    expect(linkedPins.rows).toEqual([{ id: activePinPayload.pin.id }]);
    expect((await request.get(`${BASE}/api/iti/invitations/${invitationId}`, {
      headers: { "x-iti-token": payload.accessToken },
    })).status()).toBe(404);
    expect((await request.get(`${BASE}/api/iti/invitations/${invitationId}`, {
      headers: { "x-iti-withdrawal-token": payload.withdrawalToken },
    })).status()).toBe(404);
    expect((await request.get(`${BASE}/api/iti/invitations/${invitationId}/recognition`, {
      headers: { "x-iti-withdrawal-token": payload.withdrawalToken },
    })).status()).toBe(404);
    expect((await request.patch(`${BASE}/api/iti/invitations/${invitationId}`, {
      headers: { "x-iti-withdrawal-token": payload.withdrawalToken },
      data: { workDescription: "This profile must remain locked." },
    })).status()).toBe(404);
    expect((await request.patch(`${BASE}/api/iti/invitations/${invitationId}/consents`, {
      headers: { "x-iti-withdrawal-token": payload.withdrawalToken },
      data: { aggregateMyData: false },
    })).status()).toBe(404);

    const stillActive = await db.query("SELECT aggregate_my_data FROM invitation_consents WHERE invitation_id = $1", [invitationId]);
    expect(stillActive.rows[0]?.aggregate_my_data).toBe(true);

    await page.addInitScript(({ id, accessToken, withdrawalToken }) => {
      const expired = JSON.stringify({ value: accessToken, storedAt: Date.now() - 25 * 60 * 60 * 1000 });
      sessionStorage.setItem("iti-token:community-gravity:community-directory", expired);
      sessionStorage.setItem("iti-id:community-gravity:community-directory", JSON.stringify({ value: id, storedAt: Date.now() - 25 * 60 * 60 * 1000 }));
      localStorage.setItem("iti-withdrawal:v1:community-gravity:community-directory", JSON.stringify({
        version: 1,
        entries: [{ invitationId: id, token: withdrawalToken }],
      }));
    }, { id: invitationId, accessToken: payload.accessToken, withdrawalToken: payload.withdrawalToken });
    await page.goto(`${BASE}/community-gravity`);
    await expect(page.getByTestId("iti-return-access-expired")).toContainText("expired after 24 hours");
    const withdrawalButton = page.getByTestId(`button-iti-expired-withdraw-${invitationId}`);
    await expect(withdrawalButton).toBeVisible();
    await withdrawalButton.click();
    await expect(withdrawalButton).toHaveCount(0);

    const consentAfterWithdrawal = await db.query(
      "SELECT quote_me, aggregate_my_data, name_me_publicly, route_my_info_to_service, share_with_funder, invite_to_convening, accept_stipend, route_to_credentialing FROM invitation_consents WHERE invitation_id = $1",
      [invitationId],
    );
    expect(Object.values(consentAfterWithdrawal.rows[0] ?? {})).toEqual(Array(8).fill(false));
    const finalStatus = await db.query("SELECT status FROM integration_invitations WHERE id = $1", [invitationId]);
    expect(finalStatus.rows[0]?.status).toBe("withdrawn");
    const repeatedWithdrawal = await request.post(`${BASE}/api/iti/invitations/${invitationId}/withdraw`, {
      headers: { "x-iti-withdrawal-token": payload.withdrawalToken },
    });
    expect(repeatedWithdrawal.status()).toBe(200);
    expect((await repeatedWithdrawal.json()).alreadyWithdrawn).toBe(true);
  });

  test("server-side expiry still exposes withdrawal when the browser session clock is behind", async ({ request, page }) => {
    if (!db) throw new Error("The E2E database did not initialize.");
    const created = await request.post(`${BASE}/api/iti/invitations`, {
      data: {
        surface: "community-gravity",
        surfaceContext: "community-directory",
        workDescription: "Synthetic E2E clock-skew check for withdrawal-only access.",
      },
    });
    expect(created.status()).toBe(201);
    const payload = await created.json();
    const invitationId = payload.invitation.id as string;
    itiInvitationIds.push(invitationId);
    expect((await request.patch(`${BASE}/api/iti/invitations/${invitationId}/consents`, {
      headers: { "x-iti-token": payload.accessToken },
      data: { aggregateMyData: true },
    })).status()).toBe(200);
    await db.query("UPDATE integration_invitations SET created_at = now() - interval '25 hours' WHERE id = $1", [invitationId]);

    await page.addInitScript(({ id, accessToken, withdrawalToken }) => {
      const fresh = JSON.stringify({ value: accessToken, storedAt: Date.now() });
      sessionStorage.setItem("iti-token:community-gravity:community-directory", fresh);
      sessionStorage.setItem("iti-id:community-gravity:community-directory", JSON.stringify({ value: id, storedAt: Date.now() }));
      localStorage.setItem(`iti-withdrawal:v2:${JSON.stringify(["community-gravity", "community-directory"])}`, JSON.stringify({
        version: 2,
        entries: [{ invitationId: id, token: withdrawalToken }],
      }));
    }, { id: invitationId, accessToken: payload.accessToken, withdrawalToken: payload.withdrawalToken });

    await page.goto(`${BASE}/community-gravity`);
    await expect(page.getByTestId("card-iti-restore-error")).toContainText("Private profile and recognition history are no longer available");
    await expect(page.getByTestId("button-iti-retry-restore")).toHaveCount(0);
    const withdrawalButton = page.getByTestId(`button-iti-expired-withdraw-${invitationId}`);
    await expect(withdrawalButton).toBeVisible();
    await withdrawalButton.click();
    await expect(withdrawalButton).toHaveCount(0);

    const consents = await db.query(
      "SELECT quote_me, aggregate_my_data, name_me_publicly, route_my_info_to_service, share_with_funder, invite_to_convening, accept_stipend, route_to_credentialing FROM invitation_consents WHERE invitation_id = $1",
      [invitationId],
    );
    expect(Object.values(consents.rows[0] ?? {})).toEqual(Array(8).fill(false));
  });

  test("saved invitations stay distinguishable and another tab reflects withdrawal", async ({ request, page }) => {
    if (!db) throw new Error("The E2E database did not initialize.");
    const createInvitation = async (workDescription: string) => {
      const response = await request.post(`${BASE}/api/iti/invitations`, {
        data: { surface: "community-gravity", surfaceContext: "community-directory", workDescription },
      });
      expect(response.status()).toBe(201);
      const data = await response.json();
      itiInvitationIds.push(data.invitation.id as string);
      return data;
    };
    const firstSaved = await createInvitation("Synthetic E2E prior invitation one.");
    const secondSaved = await createInvitation("Synthetic E2E prior invitation two.");
    const active = await createInvitation("Synthetic E2E active invitation for cross-tab refresh.");
    expect((await request.patch(`${BASE}/api/iti/invitations/${active.invitation.id}/consents`, {
      headers: { "x-iti-token": active.accessToken },
      data: { aggregateMyData: true },
    })).status()).toBe(200);

    await page.context().addInitScript(({ id, accessToken, entries }) => {
      const fresh = JSON.stringify({ value: accessToken, storedAt: Date.now() });
      sessionStorage.setItem(`iti-token:v2:${JSON.stringify(["community-gravity", "community-directory"])}`, fresh);
      sessionStorage.setItem(`iti-id:v2:${JSON.stringify(["community-gravity", "community-directory"])}`, JSON.stringify({ value: id, storedAt: Date.now() }));
      localStorage.setItem(`iti-withdrawal:v2:${JSON.stringify(["community-gravity", "community-directory"])}`, JSON.stringify({
        version: 2,
        entries,
      }));
    }, {
      id: active.invitation.id,
      accessToken: active.accessToken,
      entries: [
        { invitationId: firstSaved.invitation.id, token: firstSaved.withdrawalToken },
        { invitationId: secondSaved.invitation.id, token: secondSaved.withdrawalToken },
        { invitationId: active.invitation.id, token: active.withdrawalToken },
      ],
    });

    await page.goto(`${BASE}/community-gravity`);
    await expect(page.getByTestId("card-iti-witness-loop")).toBeVisible();
    const recoveryButtons = page.getByTestId("iti-withdrawal-recovery").getByRole("button");
    await expect(recoveryButtons).toHaveCount(2);
    const recoveryNames = await recoveryButtons.allTextContents();
    expect(new Set(recoveryNames).size).toBe(2);

    const secondTab = await page.context().newPage();
    await secondTab.goto(`${BASE}/community-gravity`);
    await expect(secondTab.getByTestId("card-iti-witness-loop")).toBeVisible();
    await expect(secondTab.getByTestId("iti-consent-aggregate")).toHaveAttribute("data-state", "checked");

    const restoreUrl = `${BASE}/api/iti/invitations/${active.invitation.id}`;
    await page.route(restoreUrl, (route) => route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ error: "Temporary restore failure." }),
    }));
    await page.evaluate(() => document.dispatchEvent(new Event("visibilitychange")));
    await expect(page.getByTestId("iti-refresh-error")).toBeVisible();
    await expect(page.getByTestId("iti-refresh-error")).toContainText("displayed details may be out of date");
    await expect(page.getByTestId("button-iti-retry-refresh")).toBeVisible();
    await page.unroute(restoreUrl);
    const retryResponse = page.waitForResponse((response) =>
      response.url().includes(`/api/iti/invitations/${active.invitation.id}`) &&
      !response.url().includes("/recognition") && response.request().method() === "GET");
    await page.getByTestId("button-iti-retry-refresh").click();
    expect((await retryResponse).status()).toBe(200);
    await expect(page.getByTestId("iti-refresh-error")).toHaveCount(0);
    await expect(page.getByTestId("card-iti-witness-loop")).toBeVisible();

    page.once("dialog", (dialog) => dialog.accept());
    await page.getByTestId("button-iti-withdraw").click();
    await expect(page.getByTestId("button-iti-withdraw")).toContainText("Invitation withdrawn");
    await expect(secondTab.getByTestId("button-iti-withdraw")).toContainText("Invitation withdrawn");
    await expect(secondTab.getByTestId("iti-consent-aggregate")).toHaveAttribute("data-state", "unchecked");
  });

  test("another tab cannot recreate withdrawal recovery after its storage is cleared", async ({ request, page }) => {
    const response = await request.post(`${BASE}/api/iti/invitations`, {
      data: {
        surface: "community-gravity",
        surfaceContext: "community-directory",
        workDescription: "Synthetic E2E invitation for cross-tab storage clearing.",
      },
    });
    expect(response.status()).toBe(201);
    const data = await response.json();
    itiInvitationIds.push(data.invitation.id as string);

    await page.context().addInitScript(({ id, accessToken, withdrawalToken }) => {
      const contextKey = JSON.stringify(["community-gravity", "community-directory"]);
      sessionStorage.setItem(`iti-token:v2:${contextKey}`, JSON.stringify({ value: accessToken, storedAt: Date.now() }));
      sessionStorage.setItem(`iti-id:v2:${contextKey}`, JSON.stringify({ value: id, storedAt: Date.now() }));
      localStorage.setItem(`iti-withdrawal:v2:${contextKey}`, JSON.stringify({
        version: 2,
        entries: [{ invitationId: id, token: withdrawalToken }],
      }));
    }, {
      id: data.invitation.id,
      accessToken: data.accessToken,
      withdrawalToken: data.withdrawalToken,
    });

    const secondTab = await page.context().newPage();
    const recoveryKey = `iti-withdrawal:v2:${JSON.stringify(["community-gravity", "community-directory"])}`;
    const restoreUrl = `${BASE}/api/iti/invitations/${data.invitation.id}`;
    let restoreCalls = 0;
    await secondTab.route(restoreUrl, async (route) => {
      restoreCalls += 1;
      await route.continue();
    });
    await page.goto(`${BASE}/community-gravity`);
    await expect(page.getByTestId("card-iti-witness-loop")).toBeVisible();
    await secondTab.goto(`${BASE}/community-gravity`);
    await expect(secondTab.getByTestId("card-iti-witness-loop")).toBeVisible();

    const callsBeforeClear = restoreCalls;
    await page.evaluate(() => localStorage.clear());
    await expect.poll(() => restoreCalls).toBeGreaterThan(callsBeforeClear);
    await secondTab.evaluate(() => document.dispatchEvent(new Event("visibilitychange")));
    const callsAfterStorageEvent = restoreCalls;
    await expect.poll(() => restoreCalls).toBeGreaterThan(callsAfterStorageEvent);
    await expect.poll(() => secondTab.evaluate((key) => localStorage.getItem(key), recoveryKey)).toBeNull();
  });

  test("an unrelated recovery-list update does not block saving the active invitation key", async ({ request, page }) => {
    const createInvitation = async (workDescription: string) => {
      const response = await request.post(`${BASE}/api/iti/invitations`, {
        data: { surface: "community-gravity", surfaceContext: "community-directory", workDescription },
      });
      expect(response.status()).toBe(201);
      const data = await response.json();
      itiInvitationIds.push(data.invitation.id as string);
      return data;
    };
    const active = await createInvitation("Synthetic E2E invitation whose first recovery save will fail.");
    const unrelated = await createInvitation("Synthetic E2E unrelated recovery-list entry.");
    const contextKey = JSON.stringify(["community-gravity", "community-directory"]);
    const recoveryKey = `iti-withdrawal:v2:${contextKey}`;

    await page.addInitScript(({ id, accessToken, recoveryKey, contextKey }) => {
      sessionStorage.setItem(`iti-token:v2:${contextKey}`, JSON.stringify({ value: accessToken, storedAt: Date.now() }));
      sessionStorage.setItem(`iti-id:v2:${contextKey}`, JSON.stringify({ value: id, storedAt: Date.now() }));
      const originalSetItem = Storage.prototype.setItem;
      let failFirstRecoveryWrite = true;
      Storage.prototype.setItem = function(key, value) {
        if (this === window.localStorage && key === recoveryKey && failFirstRecoveryWrite) {
          failFirstRecoveryWrite = false;
          throw new DOMException("Synthetic first-write failure.", "QuotaExceededError");
        }
        return originalSetItem.call(this, key, value);
      };
    }, { id: active.invitation.id, accessToken: active.accessToken, recoveryKey, contextKey });

    await page.goto(`${BASE}/community-gravity`);
    await expect(page.getByTestId("card-iti-witness-loop")).toBeVisible();
    await expect(page.getByTestId("iti-withdrawal-storage-warning")).toBeVisible();

    const secondTab = await page.context().newPage();
    await secondTab.goto(`${BASE}/community-gravity`);
    await secondTab.evaluate(({ key, invitationId, token }) => {
      localStorage.setItem(key, JSON.stringify({
        version: 2,
        entries: [{ invitationId, token }],
      }));
    }, { key: recoveryKey, invitationId: unrelated.invitation.id, token: unrelated.withdrawalToken });

    await expect(page.getByTestId("iti-withdrawal-storage-warning")).toHaveCount(0);
    await expect.poll(() => page.evaluate((key) => {
      const stored = JSON.parse(localStorage.getItem(key) ?? "null");
      return stored?.entries?.map((entry: { invitationId: string }) => entry.invitationId).sort();
    }, recoveryKey)).toEqual([active.invitation.id, unrelated.invitation.id].sort());
  });
});

test("gravity landing does not infer Austin and keeps the invitation place-neutral", async ({ page }) => {
  await page.goto(`${BASE}/community-gravity`);
  await expect(page.locator("h1")).toContainText("choose a community");
  await expect(page.getByTestId("gravity-example")).toContainText("Austin, TX. This is not your inferred location");
  await expect(page.getByTestId("gravity-provenance")).toHaveCount(0);
  await expect(page.getByTestId("gravity-iti-invitation")).toBeVisible();
});

test("gravity page: clusters, drill-down, org drawer with provenance, and limits", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(`${BASE}/community-gravity?city=Austin&state=TX`);
  await expect(page.getByTestId("gravity-provenance")).toContainText("IRS Exempt Organizations Business Master File");
  await expect(page.getByTestId("gravity-cluster-education")).toBeVisible();
  await expect(page.getByTestId("gravity-evidence")).toContainText("not a service area");
  await expect(page.getByTestId("gravity-iti-invitation")).toBeVisible();
  await expect(page.getByTestId("gravity-unclassified")).toContainText("no IRS activity");

  await page.getByTestId("gravity-see-all-education").click();
  await expect(page.getByTestId("gravity-results")).toContainText("matching organizations");
  await page.getByTestId("gravity-clear-domain").click();

  await page.getByTestId("gravity-search").fill("food bank");
  await expect(page.getByTestId("gravity-results")).toContainText("matching organizations");
  const orgTrigger = page.locator('[data-testid^="gravity-org-"]').first();
  await orgTrigger.focus();
  await orgTrigger.press("Enter");
  const drawer = page.getByTestId("gravity-org-drawer");
  await expect(drawer).toContainText("IRS filing address");
  await expect(drawer).toContainText("EIN");
  await expect(page.getByTestId("gravity-org-profile")).toHaveAttribute("href", /propublica\.org\/nonprofits\/organizations\/\d{9}/);
  await expect(drawer).toContainText(/Each fact carries the URL|No cited research on file/);
  await expect(page.getByTestId("gravity-org-research")).toHaveCount(0); // anonymous: no staff controls
  await expect(page.getByTestId("gravity-org-close")).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(drawer).toHaveCount(0);
  await expect(orgTrigger).toBeFocused();

  await page.getByTestId("gravity-city").fill("Nowhereville");
  await page.getByTestId("gravity-go").click();
  await expect(page.getByTestId("gravity-empty")).toContainText("not been loaded");
});

test("gravity page fits a phone without horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 740 });
  await page.goto(`${BASE}/community-gravity?city=Austin&state=TX`);
  await expect(page.getByTestId("gravity-cluster-education")).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});
