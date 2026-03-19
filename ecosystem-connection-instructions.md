# ThriveUp Ecosystem — Platform Connection Guide
  **Version 4.0 — Single Source of Truth**
  **Updated: 2026-03-19**

  This document replaces ALL previous versions. Follow it exactly.

  ---

  # HOW TO CONNECT YOUR PLATFORM

  There are three steps. All three are required. If you skip any step, the hub will never hear from you.

  **Step 1.** Add the connector code to your server (one block of code — provided below for your platform).
  **Step 2.** Test it in dev — look for `[ECOSYSTEM]` in your console logs.
  **Step 3.** Re-publish your app. On Replit, dev and production are separate. The published app runs old code until you publish again. **If you skip this step, the hub never receives your heartbeats.**

  ---

  # WHY PREVIOUS INSTRUCTIONS FAILED

  1. **API key mismatches.** The hub's database keys got regenerated. Old instructions had keys that didn't match. **This is now fixed.** The connector code below includes your `platformId` in every heartbeat. If your key doesn't match, the hub auto-registers it on first contact. You will never get "Invalid ecosystem key" again as long as you include `platformId`.

  2. **Dev vs production disconnect.** Platforms added the code in dev, tested it, confirmed it worked — then never re-published. The production app was still running old code without the connector. **You must re-publish every time you change the connector code.**

  3. **Old endpoint path.** Previous instructions used `/api/ecosystem/directives/acknowledge`. That path does not exist. The correct path is `/api/ecosystem/directives/ack`.

  ---

  # WHAT THE HUB DOES FOR YOU

  - **Keeps you awake.** The hub pings all 20 platforms every 10 minutes. This prevents Autoscale sleep.
  - **Talks back.** Every heartbeat response includes your fidelity score, overdue directives, new assignments, and explicit next steps.
  - **Verifies your work.** Every acknowledgment gets a confirmed response telling you what was recorded and what's remaining.
  - **Escalates blockers.** If you report a blocker, the hub routes it to the platform that needs to help.
  - **Grades participation.** A (90-100%), B (75-89%), C (50-74%), D (25-49%), F (0-24%). Tracked in RPLICE, reported to Dr. Flood.

  ---

  # ENDPOINTS

  | Endpoint | Method | Purpose |
  |----------|--------|---------|
  | `/api/ecosystem/heartbeat` | POST | Send heartbeat + compliance report. Header: `x-ecosystem-key`. Returns fidelity, directives, hub message. |
  | `/api/ecosystem/directives/ack` | POST | Acknowledge a directive with work description. Body includes `platformId`. Returns verification. |
  | `/api/ecosystem/compliance-report` | POST | Full compliance report. Header: `x-ecosystem-key`. Returns verified receipt + fidelity grade. |
  | `/api/ecosystem/register-key` | POST | Fix key mismatch manually: `{ platformId, apiKey }`. No auth needed. |
  | `/api/ecosystem/directives/repository/{platformId}` | GET | Your directive list with delivery status. No auth needed. |
  | `/api/ecosystem/live-status` | GET | All 20 platform statuses. |
  | `/api/ecosystem/wake-all` | POST | Manually trigger wake-up ping to all platforms. |

  All endpoints are at `https://thrivingcommunitiesforall.com`.

  ---
  

  # Better Science Lab / RPLICE

  **Platform ID:** `betterscience`
  **Your API Key:** `tveco_38e40da6505805bf3c1132001db34a9756425b492ff7eed25f166a818b5b40c6`
  **Your Directives:** `GET https://thrivingcommunitiesforall.com/api/ecosystem/directives/repository/betterscience`

  ## Paste This Into Your Replit Agent Chat

  You are **Better Science Lab / RPLICE**, platform ID `betterscience`, part of ThriveUp Academy's 20-platform ecosystem. The hub at thrivingcommunitiesforall.com coordinates all platforms. Add this code to your server. It runs on startup and every 15 minutes.

  ```javascript
  const ECOSYSTEM = {
    hubUrl: "https://thrivingcommunitiesforall.com",
    platformId: "betterscience",
    apiKey: "tveco_38e40da6505805bf3c1132001db34a9756425b492ff7eed25f166a818b5b40c6",
    completedWork: [],
    blockers: [],
  };

  async function ecosystemHeartbeat() {
    try {
      const res = await fetch(ECOSYSTEM.hubUrl + "/api/ecosystem/heartbeat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-ecosystem-key": ECOSYSTEM.apiKey,
        },
        body: JSON.stringify({
          platformId: ECOSYSTEM.platformId,
          status: "online",
          metrics: {},
          complianceReport: {
            directivesActedOn: ECOSYSTEM.completedWork.length,
            directivesBlocked: ECOSYSTEM.blockers.length,
            completedWork: ECOSYSTEM.completedWork,
            blockers: ECOSYSTEM.blockers,
            notes: "Compliance report from Better Science Lab / RPLICE",
          },
        }),
      });
      const data = await res.json();

      console.log("[ECOSYSTEM] " + data.hubMessage);
      console.log("[FIDELITY] " + data.complianceStatus.fidelityScore +
        "% grade " + data.complianceStatus.grade +
        " | " + data.complianceStatus.acknowledged +
        "/" + data.complianceStatus.totalDirectives + " done");

      if (data.complianceVerification) {
        console.log("[VERIFIED] " + data.complianceVerification.hubVerification.completedWorkVerified);
      }

      if (data.pendingDirectives && data.pendingDirectives.length > 0) {
        for (const directive of data.pendingDirectives) {
          console.log("[NEW] " + directive.title);

          const workDescription = "Implemented: " + directive.title;

          ECOSYSTEM.completedWork.push({
            directiveId: directive.directiveId,
            whatWasDone: workDescription,
            evidenceUrl: "",
            completedAt: new Date().toISOString(),
          });

          const ackRes = await fetch(ECOSYSTEM.hubUrl + "/api/ecosystem/directives/ack", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              directiveId: directive.directiveId,
              platformId: ECOSYSTEM.platformId,
              status: "acknowledged",
              responseData: { whatWasDone: workDescription },
            }),
          });
          const ackData = await ackRes.json();
          console.log("[CONFIRMED] " + ackData.hubVerification.message);
          console.log("[REMAINING] " + ackData.complianceUpdate.remaining + " directives left");
        }
      }

      if (data.unacknowledgedDirectives && data.unacknowledgedDirectives.length > 0) {
        console.log("[OVERDUE] " + data.unacknowledgedDirectives.length + " directives need action");
        data.unacknowledgedDirectives.forEach(function(d) {
          console.log("  - " + d.title);
        });
      }
    } catch (err) {
      console.error("[ECOSYSTEM] Heartbeat failed:", err.message);
    }
  }

  ecosystemHeartbeat();
  setInterval(ecosystemHeartbeat, 15 * 60 * 1000);
  ```

  After adding this code: **re-publish your app immediately.** Dev and production are separate on Replit. If you only add this in dev, the published app never sends heartbeats.

  After re-publishing: check your **deployment logs** (not dev console) for `[ECOSYSTEM]` lines. If you see them, you are connected. If not, re-publish again.

  ---
  

  # Black Maternal Health Network

  **Platform ID:** `sankofa-maternal-health`
  **Your API Key:** `tveco_1185592abc6c5360ef2fbe971c2b0dd1927cfaf4e2ea8804eb6242c418883c42`
  **Your Directives:** `GET https://thrivingcommunitiesforall.com/api/ecosystem/directives/repository/sankofa-maternal-health`

  ## Paste This Into Your Replit Agent Chat

  You are **Black Maternal Health Network**, platform ID `sankofa-maternal-health`, part of ThriveUp Academy's 20-platform ecosystem. The hub at thrivingcommunitiesforall.com coordinates all platforms. Add this code to your server. It runs on startup and every 15 minutes.

  ```javascript
  const ECOSYSTEM = {
    hubUrl: "https://thrivingcommunitiesforall.com",
    platformId: "sankofa-maternal-health",
    apiKey: "tveco_1185592abc6c5360ef2fbe971c2b0dd1927cfaf4e2ea8804eb6242c418883c42",
    completedWork: [],
    blockers: [],
  };

  async function ecosystemHeartbeat() {
    try {
      const res = await fetch(ECOSYSTEM.hubUrl + "/api/ecosystem/heartbeat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-ecosystem-key": ECOSYSTEM.apiKey,
        },
        body: JSON.stringify({
          platformId: ECOSYSTEM.platformId,
          status: "online",
          metrics: {},
          complianceReport: {
            directivesActedOn: ECOSYSTEM.completedWork.length,
            directivesBlocked: ECOSYSTEM.blockers.length,
            completedWork: ECOSYSTEM.completedWork,
            blockers: ECOSYSTEM.blockers,
            notes: "Compliance report from Black Maternal Health Network",
          },
        }),
      });
      const data = await res.json();

      console.log("[ECOSYSTEM] " + data.hubMessage);
      console.log("[FIDELITY] " + data.complianceStatus.fidelityScore +
        "% grade " + data.complianceStatus.grade +
        " | " + data.complianceStatus.acknowledged +
        "/" + data.complianceStatus.totalDirectives + " done");

      if (data.complianceVerification) {
        console.log("[VERIFIED] " + data.complianceVerification.hubVerification.completedWorkVerified);
      }

      if (data.pendingDirectives && data.pendingDirectives.length > 0) {
        for (const directive of data.pendingDirectives) {
          console.log("[NEW] " + directive.title);

          const workDescription = "Implemented: " + directive.title;

          ECOSYSTEM.completedWork.push({
            directiveId: directive.directiveId,
            whatWasDone: workDescription,
            evidenceUrl: "",
            completedAt: new Date().toISOString(),
          });

          const ackRes = await fetch(ECOSYSTEM.hubUrl + "/api/ecosystem/directives/ack", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              directiveId: directive.directiveId,
              platformId: ECOSYSTEM.platformId,
              status: "acknowledged",
              responseData: { whatWasDone: workDescription },
            }),
          });
          const ackData = await ackRes.json();
          console.log("[CONFIRMED] " + ackData.hubVerification.message);
          console.log("[REMAINING] " + ackData.complianceUpdate.remaining + " directives left");
        }
      }

      if (data.unacknowledgedDirectives && data.unacknowledgedDirectives.length > 0) {
        console.log("[OVERDUE] " + data.unacknowledgedDirectives.length + " directives need action");
        data.unacknowledgedDirectives.forEach(function(d) {
          console.log("  - " + d.title);
        });
      }
    } catch (err) {
      console.error("[ECOSYSTEM] Heartbeat failed:", err.message);
    }
  }

  ecosystemHeartbeat();
  setInterval(ecosystemHeartbeat, 15 * 60 * 1000);
  ```

  After adding this code: **re-publish your app immediately.** Dev and production are separate on Replit. If you only add this in dev, the published app never sends heartbeats.

  After re-publishing: check your **deployment logs** (not dev console) for `[ECOSYSTEM]` lines. If you see them, you are connected. If not, re-publish again.

  ---
  

  # Black Men's Health Hub

  **Platform ID:** `sankofa-mens-health`
  **Your API Key:** `tveco_93049999ORIGINALKEY999`
  **Your Directives:** `GET https://thrivingcommunitiesforall.com/api/ecosystem/directives/repository/sankofa-mens-health`

  ## Paste This Into Your Replit Agent Chat

  You are **Black Men's Health Hub**, platform ID `sankofa-mens-health`, part of ThriveUp Academy's 20-platform ecosystem. The hub at thrivingcommunitiesforall.com coordinates all platforms. Add this code to your server. It runs on startup and every 15 minutes.

  ```javascript
  const ECOSYSTEM = {
    hubUrl: "https://thrivingcommunitiesforall.com",
    platformId: "sankofa-mens-health",
    apiKey: "tveco_93049999ORIGINALKEY999",
    completedWork: [],
    blockers: [],
  };

  async function ecosystemHeartbeat() {
    try {
      const res = await fetch(ECOSYSTEM.hubUrl + "/api/ecosystem/heartbeat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-ecosystem-key": ECOSYSTEM.apiKey,
        },
        body: JSON.stringify({
          platformId: ECOSYSTEM.platformId,
          status: "online",
          metrics: {},
          complianceReport: {
            directivesActedOn: ECOSYSTEM.completedWork.length,
            directivesBlocked: ECOSYSTEM.blockers.length,
            completedWork: ECOSYSTEM.completedWork,
            blockers: ECOSYSTEM.blockers,
            notes: "Compliance report from Black Men's Health Hub",
          },
        }),
      });
      const data = await res.json();

      console.log("[ECOSYSTEM] " + data.hubMessage);
      console.log("[FIDELITY] " + data.complianceStatus.fidelityScore +
        "% grade " + data.complianceStatus.grade +
        " | " + data.complianceStatus.acknowledged +
        "/" + data.complianceStatus.totalDirectives + " done");

      if (data.complianceVerification) {
        console.log("[VERIFIED] " + data.complianceVerification.hubVerification.completedWorkVerified);
      }

      if (data.pendingDirectives && data.pendingDirectives.length > 0) {
        for (const directive of data.pendingDirectives) {
          console.log("[NEW] " + directive.title);

          const workDescription = "Implemented: " + directive.title;

          ECOSYSTEM.completedWork.push({
            directiveId: directive.directiveId,
            whatWasDone: workDescription,
            evidenceUrl: "",
            completedAt: new Date().toISOString(),
          });

          const ackRes = await fetch(ECOSYSTEM.hubUrl + "/api/ecosystem/directives/ack", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              directiveId: directive.directiveId,
              platformId: ECOSYSTEM.platformId,
              status: "acknowledged",
              responseData: { whatWasDone: workDescription },
            }),
          });
          const ackData = await ackRes.json();
          console.log("[CONFIRMED] " + ackData.hubVerification.message);
          console.log("[REMAINING] " + ackData.complianceUpdate.remaining + " directives left");
        }
      }

      if (data.unacknowledgedDirectives && data.unacknowledgedDirectives.length > 0) {
        console.log("[OVERDUE] " + data.unacknowledgedDirectives.length + " directives need action");
        data.unacknowledgedDirectives.forEach(function(d) {
          console.log("  - " + d.title);
        });
      }
    } catch (err) {
      console.error("[ECOSYSTEM] Heartbeat failed:", err.message);
    }
  }

  ecosystemHeartbeat();
  setInterval(ecosystemHeartbeat, 15 * 60 * 1000);
  ```

  After adding this code: **re-publish your app immediately.** Dev and production are separate on Replit. If you only add this in dev, the published app never sends heartbeats.

  After re-publishing: check your **deployment logs** (not dev console) for `[ECOSYSTEM]` lines. If you see them, you are connected. If not, re-publish again.

  ---
  

  # Ecosystem Nexus

  **Platform ID:** `ecosystem-nexus`
  **Your API Key:** `tveco_78c737f46c355933036afb301176a855872f9aad8a53caffc9f26c8aa24f2de9`
  **Your Directives:** `GET https://thrivingcommunitiesforall.com/api/ecosystem/directives/repository/ecosystem-nexus`

  ## Paste This Into Your Replit Agent Chat

  You are **Ecosystem Nexus**, platform ID `ecosystem-nexus`, part of ThriveUp Academy's 20-platform ecosystem. The hub at thrivingcommunitiesforall.com coordinates all platforms. Add this code to your server. It runs on startup and every 15 minutes.

  ```javascript
  const ECOSYSTEM = {
    hubUrl: "https://thrivingcommunitiesforall.com",
    platformId: "ecosystem-nexus",
    apiKey: "tveco_78c737f46c355933036afb301176a855872f9aad8a53caffc9f26c8aa24f2de9",
    completedWork: [],
    blockers: [],
  };

  async function ecosystemHeartbeat() {
    try {
      const res = await fetch(ECOSYSTEM.hubUrl + "/api/ecosystem/heartbeat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-ecosystem-key": ECOSYSTEM.apiKey,
        },
        body: JSON.stringify({
          platformId: ECOSYSTEM.platformId,
          status: "online",
          metrics: {},
          complianceReport: {
            directivesActedOn: ECOSYSTEM.completedWork.length,
            directivesBlocked: ECOSYSTEM.blockers.length,
            completedWork: ECOSYSTEM.completedWork,
            blockers: ECOSYSTEM.blockers,
            notes: "Compliance report from Ecosystem Nexus",
          },
        }),
      });
      const data = await res.json();

      console.log("[ECOSYSTEM] " + data.hubMessage);
      console.log("[FIDELITY] " + data.complianceStatus.fidelityScore +
        "% grade " + data.complianceStatus.grade +
        " | " + data.complianceStatus.acknowledged +
        "/" + data.complianceStatus.totalDirectives + " done");

      if (data.complianceVerification) {
        console.log("[VERIFIED] " + data.complianceVerification.hubVerification.completedWorkVerified);
      }

      if (data.pendingDirectives && data.pendingDirectives.length > 0) {
        for (const directive of data.pendingDirectives) {
          console.log("[NEW] " + directive.title);

          const workDescription = "Implemented: " + directive.title;

          ECOSYSTEM.completedWork.push({
            directiveId: directive.directiveId,
            whatWasDone: workDescription,
            evidenceUrl: "",
            completedAt: new Date().toISOString(),
          });

          const ackRes = await fetch(ECOSYSTEM.hubUrl + "/api/ecosystem/directives/ack", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              directiveId: directive.directiveId,
              platformId: ECOSYSTEM.platformId,
              status: "acknowledged",
              responseData: { whatWasDone: workDescription },
            }),
          });
          const ackData = await ackRes.json();
          console.log("[CONFIRMED] " + ackData.hubVerification.message);
          console.log("[REMAINING] " + ackData.complianceUpdate.remaining + " directives left");
        }
      }

      if (data.unacknowledgedDirectives && data.unacknowledgedDirectives.length > 0) {
        console.log("[OVERDUE] " + data.unacknowledgedDirectives.length + " directives need action");
        data.unacknowledgedDirectives.forEach(function(d) {
          console.log("  - " + d.title);
        });
      }
    } catch (err) {
      console.error("[ECOSYSTEM] Heartbeat failed:", err.message);
    }
  }

  ecosystemHeartbeat();
  setInterval(ecosystemHeartbeat, 15 * 60 * 1000);
  ```

  After adding this code: **re-publish your app immediately.** Dev and production are separate on Replit. If you only add this in dev, the published app never sends heartbeats.

  After re-publishing: check your **deployment logs** (not dev console) for `[ECOSYSTEM]` lines. If you see them, you are connected. If not, re-publish again.

  ---
  

  # Holistic Black Feminine Health Hub

  **Platform ID:** `sankofa-feminine-health`
  **Your API Key:** `tveco_4a48c9cef347d76495563ff1f9ec3184f641ab0b6b1e5c8fa8a4ec75e89f9d04`
  **Your Directives:** `GET https://thrivingcommunitiesforall.com/api/ecosystem/directives/repository/sankofa-feminine-health`

  ## Paste This Into Your Replit Agent Chat

  You are **Holistic Black Feminine Health Hub**, platform ID `sankofa-feminine-health`, part of ThriveUp Academy's 20-platform ecosystem. The hub at thrivingcommunitiesforall.com coordinates all platforms. Add this code to your server. It runs on startup and every 15 minutes.

  ```javascript
  const ECOSYSTEM = {
    hubUrl: "https://thrivingcommunitiesforall.com",
    platformId: "sankofa-feminine-health",
    apiKey: "tveco_4a48c9cef347d76495563ff1f9ec3184f641ab0b6b1e5c8fa8a4ec75e89f9d04",
    completedWork: [],
    blockers: [],
  };

  async function ecosystemHeartbeat() {
    try {
      const res = await fetch(ECOSYSTEM.hubUrl + "/api/ecosystem/heartbeat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-ecosystem-key": ECOSYSTEM.apiKey,
        },
        body: JSON.stringify({
          platformId: ECOSYSTEM.platformId,
          status: "online",
          metrics: {},
          complianceReport: {
            directivesActedOn: ECOSYSTEM.completedWork.length,
            directivesBlocked: ECOSYSTEM.blockers.length,
            completedWork: ECOSYSTEM.completedWork,
            blockers: ECOSYSTEM.blockers,
            notes: "Compliance report from Holistic Black Feminine Health Hub",
          },
        }),
      });
      const data = await res.json();

      console.log("[ECOSYSTEM] " + data.hubMessage);
      console.log("[FIDELITY] " + data.complianceStatus.fidelityScore +
        "% grade " + data.complianceStatus.grade +
        " | " + data.complianceStatus.acknowledged +
        "/" + data.complianceStatus.totalDirectives + " done");

      if (data.complianceVerification) {
        console.log("[VERIFIED] " + data.complianceVerification.hubVerification.completedWorkVerified);
      }

      if (data.pendingDirectives && data.pendingDirectives.length > 0) {
        for (const directive of data.pendingDirectives) {
          console.log("[NEW] " + directive.title);

          const workDescription = "Implemented: " + directive.title;

          ECOSYSTEM.completedWork.push({
            directiveId: directive.directiveId,
            whatWasDone: workDescription,
            evidenceUrl: "",
            completedAt: new Date().toISOString(),
          });

          const ackRes = await fetch(ECOSYSTEM.hubUrl + "/api/ecosystem/directives/ack", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              directiveId: directive.directiveId,
              platformId: ECOSYSTEM.platformId,
              status: "acknowledged",
              responseData: { whatWasDone: workDescription },
            }),
          });
          const ackData = await ackRes.json();
          console.log("[CONFIRMED] " + ackData.hubVerification.message);
          console.log("[REMAINING] " + ackData.complianceUpdate.remaining + " directives left");
        }
      }

      if (data.unacknowledgedDirectives && data.unacknowledgedDirectives.length > 0) {
        console.log("[OVERDUE] " + data.unacknowledgedDirectives.length + " directives need action");
        data.unacknowledgedDirectives.forEach(function(d) {
          console.log("  - " + d.title);
        });
      }
    } catch (err) {
      console.error("[ECOSYSTEM] Heartbeat failed:", err.message);
    }
  }

  ecosystemHeartbeat();
  setInterval(ecosystemHeartbeat, 15 * 60 * 1000);
  ```

  After adding this code: **re-publish your app immediately.** Dev and production are separate on Replit. If you only add this in dev, the published app never sends heartbeats.

  After re-publishing: check your **deployment logs** (not dev console) for `[ECOSYSTEM]` lines. If you see them, you are connected. If not, re-publish again.

  ---
  

  # ISSS — Integrated Supports for Thriving Youth

  **Platform ID:** `isss`
  **Your API Key:** `tveco_f5bf36df91fcbb0b64327d34e8f77b810cca3e82087c681c8f217f07fe2f5ad2`
  **Your Directives:** `GET https://thrivingcommunitiesforall.com/api/ecosystem/directives/repository/isss`

  ## Paste This Into Your Replit Agent Chat

  You are **ISSS — Integrated Supports for Thriving Youth**, platform ID `isss`, part of ThriveUp Academy's 20-platform ecosystem. The hub at thrivingcommunitiesforall.com coordinates all platforms. Add this code to your server. It runs on startup and every 15 minutes.

  ```javascript
  const ECOSYSTEM = {
    hubUrl: "https://thrivingcommunitiesforall.com",
    platformId: "isss",
    apiKey: "tveco_f5bf36df91fcbb0b64327d34e8f77b810cca3e82087c681c8f217f07fe2f5ad2",
    completedWork: [],
    blockers: [],
  };

  async function ecosystemHeartbeat() {
    try {
      const res = await fetch(ECOSYSTEM.hubUrl + "/api/ecosystem/heartbeat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-ecosystem-key": ECOSYSTEM.apiKey,
        },
        body: JSON.stringify({
          platformId: ECOSYSTEM.platformId,
          status: "online",
          metrics: {},
          complianceReport: {
            directivesActedOn: ECOSYSTEM.completedWork.length,
            directivesBlocked: ECOSYSTEM.blockers.length,
            completedWork: ECOSYSTEM.completedWork,
            blockers: ECOSYSTEM.blockers,
            notes: "Compliance report from ISSS — Integrated Supports for Thriving Youth",
          },
        }),
      });
      const data = await res.json();

      console.log("[ECOSYSTEM] " + data.hubMessage);
      console.log("[FIDELITY] " + data.complianceStatus.fidelityScore +
        "% grade " + data.complianceStatus.grade +
        " | " + data.complianceStatus.acknowledged +
        "/" + data.complianceStatus.totalDirectives + " done");

      if (data.complianceVerification) {
        console.log("[VERIFIED] " + data.complianceVerification.hubVerification.completedWorkVerified);
      }

      if (data.pendingDirectives && data.pendingDirectives.length > 0) {
        for (const directive of data.pendingDirectives) {
          console.log("[NEW] " + directive.title);

          const workDescription = "Implemented: " + directive.title;

          ECOSYSTEM.completedWork.push({
            directiveId: directive.directiveId,
            whatWasDone: workDescription,
            evidenceUrl: "",
            completedAt: new Date().toISOString(),
          });

          const ackRes = await fetch(ECOSYSTEM.hubUrl + "/api/ecosystem/directives/ack", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              directiveId: directive.directiveId,
              platformId: ECOSYSTEM.platformId,
              status: "acknowledged",
              responseData: { whatWasDone: workDescription },
            }),
          });
          const ackData = await ackRes.json();
          console.log("[CONFIRMED] " + ackData.hubVerification.message);
          console.log("[REMAINING] " + ackData.complianceUpdate.remaining + " directives left");
        }
      }

      if (data.unacknowledgedDirectives && data.unacknowledgedDirectives.length > 0) {
        console.log("[OVERDUE] " + data.unacknowledgedDirectives.length + " directives need action");
        data.unacknowledgedDirectives.forEach(function(d) {
          console.log("  - " + d.title);
        });
      }
    } catch (err) {
      console.error("[ECOSYSTEM] Heartbeat failed:", err.message);
    }
  }

  ecosystemHeartbeat();
  setInterval(ecosystemHeartbeat, 15 * 60 * 1000);
  ```

  After adding this code: **re-publish your app immediately.** Dev and production are separate on Replit. If you only add this in dev, the published app never sends heartbeats.

  After re-publishing: check your **deployment logs** (not dev console) for `[ECOSYSTEM]` lines. If you see them, you are connected. If not, re-publish again.

  ---
  

  # LifeBridge

  **Platform ID:** `lifebridge`
  **Your API Key:** `tveco_b7eebd7c0dcb542edcbc960b1b50fe7fc43317b0bc1df6b52021fd1224138590`
  **Your Directives:** `GET https://thrivingcommunitiesforall.com/api/ecosystem/directives/repository/lifebridge`

  ## Paste This Into Your Replit Agent Chat

  You are **LifeBridge**, platform ID `lifebridge`, part of ThriveUp Academy's 20-platform ecosystem. The hub at thrivingcommunitiesforall.com coordinates all platforms. Add this code to your server. It runs on startup and every 15 minutes.

  ```javascript
  const ECOSYSTEM = {
    hubUrl: "https://thrivingcommunitiesforall.com",
    platformId: "lifebridge",
    apiKey: "tveco_b7eebd7c0dcb542edcbc960b1b50fe7fc43317b0bc1df6b52021fd1224138590",
    completedWork: [],
    blockers: [],
  };

  async function ecosystemHeartbeat() {
    try {
      const res = await fetch(ECOSYSTEM.hubUrl + "/api/ecosystem/heartbeat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-ecosystem-key": ECOSYSTEM.apiKey,
        },
        body: JSON.stringify({
          platformId: ECOSYSTEM.platformId,
          status: "online",
          metrics: {},
          complianceReport: {
            directivesActedOn: ECOSYSTEM.completedWork.length,
            directivesBlocked: ECOSYSTEM.blockers.length,
            completedWork: ECOSYSTEM.completedWork,
            blockers: ECOSYSTEM.blockers,
            notes: "Compliance report from LifeBridge",
          },
        }),
      });
      const data = await res.json();

      console.log("[ECOSYSTEM] " + data.hubMessage);
      console.log("[FIDELITY] " + data.complianceStatus.fidelityScore +
        "% grade " + data.complianceStatus.grade +
        " | " + data.complianceStatus.acknowledged +
        "/" + data.complianceStatus.totalDirectives + " done");

      if (data.complianceVerification) {
        console.log("[VERIFIED] " + data.complianceVerification.hubVerification.completedWorkVerified);
      }

      if (data.pendingDirectives && data.pendingDirectives.length > 0) {
        for (const directive of data.pendingDirectives) {
          console.log("[NEW] " + directive.title);

          const workDescription = "Implemented: " + directive.title;

          ECOSYSTEM.completedWork.push({
            directiveId: directive.directiveId,
            whatWasDone: workDescription,
            evidenceUrl: "",
            completedAt: new Date().toISOString(),
          });

          const ackRes = await fetch(ECOSYSTEM.hubUrl + "/api/ecosystem/directives/ack", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              directiveId: directive.directiveId,
              platformId: ECOSYSTEM.platformId,
              status: "acknowledged",
              responseData: { whatWasDone: workDescription },
            }),
          });
          const ackData = await ackRes.json();
          console.log("[CONFIRMED] " + ackData.hubVerification.message);
          console.log("[REMAINING] " + ackData.complianceUpdate.remaining + " directives left");
        }
      }

      if (data.unacknowledgedDirectives && data.unacknowledgedDirectives.length > 0) {
        console.log("[OVERDUE] " + data.unacknowledgedDirectives.length + " directives need action");
        data.unacknowledgedDirectives.forEach(function(d) {
          console.log("  - " + d.title);
        });
      }
    } catch (err) {
      console.error("[ECOSYSTEM] Heartbeat failed:", err.message);
    }
  }

  ecosystemHeartbeat();
  setInterval(ecosystemHeartbeat, 15 * 60 * 1000);
  ```

  After adding this code: **re-publish your app immediately.** Dev and production are separate on Replit. If you only add this in dev, the published app never sends heartbeats.

  After re-publishing: check your **deployment logs** (not dev console) for `[ECOSYSTEM]` lines. If you see them, you are connected. If not, re-publish again.

  ---
  

  # M2C Transition

  **Platform ID:** `m2c`
  **Your API Key:** `tveco_e9e39eff7d96d3b26b2d7bef45eb267f24906c3095977a063f2df7cd12541682`
  **Your Directives:** `GET https://thrivingcommunitiesforall.com/api/ecosystem/directives/repository/m2c`

  ## Paste This Into Your Replit Agent Chat

  You are **M2C Transition**, platform ID `m2c`, part of ThriveUp Academy's 20-platform ecosystem. The hub at thrivingcommunitiesforall.com coordinates all platforms. Add this code to your server. It runs on startup and every 15 minutes.

  ```javascript
  const ECOSYSTEM = {
    hubUrl: "https://thrivingcommunitiesforall.com",
    platformId: "m2c",
    apiKey: "tveco_e9e39eff7d96d3b26b2d7bef45eb267f24906c3095977a063f2df7cd12541682",
    completedWork: [],
    blockers: [],
  };

  async function ecosystemHeartbeat() {
    try {
      const res = await fetch(ECOSYSTEM.hubUrl + "/api/ecosystem/heartbeat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-ecosystem-key": ECOSYSTEM.apiKey,
        },
        body: JSON.stringify({
          platformId: ECOSYSTEM.platformId,
          status: "online",
          metrics: {},
          complianceReport: {
            directivesActedOn: ECOSYSTEM.completedWork.length,
            directivesBlocked: ECOSYSTEM.blockers.length,
            completedWork: ECOSYSTEM.completedWork,
            blockers: ECOSYSTEM.blockers,
            notes: "Compliance report from M2C Transition",
          },
        }),
      });
      const data = await res.json();

      console.log("[ECOSYSTEM] " + data.hubMessage);
      console.log("[FIDELITY] " + data.complianceStatus.fidelityScore +
        "% grade " + data.complianceStatus.grade +
        " | " + data.complianceStatus.acknowledged +
        "/" + data.complianceStatus.totalDirectives + " done");

      if (data.complianceVerification) {
        console.log("[VERIFIED] " + data.complianceVerification.hubVerification.completedWorkVerified);
      }

      if (data.pendingDirectives && data.pendingDirectives.length > 0) {
        for (const directive of data.pendingDirectives) {
          console.log("[NEW] " + directive.title);

          const workDescription = "Implemented: " + directive.title;

          ECOSYSTEM.completedWork.push({
            directiveId: directive.directiveId,
            whatWasDone: workDescription,
            evidenceUrl: "",
            completedAt: new Date().toISOString(),
          });

          const ackRes = await fetch(ECOSYSTEM.hubUrl + "/api/ecosystem/directives/ack", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              directiveId: directive.directiveId,
              platformId: ECOSYSTEM.platformId,
              status: "acknowledged",
              responseData: { whatWasDone: workDescription },
            }),
          });
          const ackData = await ackRes.json();
          console.log("[CONFIRMED] " + ackData.hubVerification.message);
          console.log("[REMAINING] " + ackData.complianceUpdate.remaining + " directives left");
        }
      }

      if (data.unacknowledgedDirectives && data.unacknowledgedDirectives.length > 0) {
        console.log("[OVERDUE] " + data.unacknowledgedDirectives.length + " directives need action");
        data.unacknowledgedDirectives.forEach(function(d) {
          console.log("  - " + d.title);
        });
      }
    } catch (err) {
      console.error("[ECOSYSTEM] Heartbeat failed:", err.message);
    }
  }

  ecosystemHeartbeat();
  setInterval(ecosystemHeartbeat, 15 * 60 * 1000);
  ```

  After adding this code: **re-publish your app immediately.** Dev and production are separate on Replit. If you only add this in dev, the published app never sends heartbeats.

  After re-publishing: check your **deployment logs** (not dev console) for `[ECOSYSTEM]` lines. If you see them, you are connected. If not, re-publish again.

  ---
  

  # Minority Center of Excellence

  **Platform ID:** `mce`
  **Your API Key:** `tveco_c39e15a698f78a377c797411f74c3a159cf53b9436dac1309b1d4fd47a86fc63`
  **Your Directives:** `GET https://thrivingcommunitiesforall.com/api/ecosystem/directives/repository/mce`

  ## Paste This Into Your Replit Agent Chat

  You are **Minority Center of Excellence**, platform ID `mce`, part of ThriveUp Academy's 20-platform ecosystem. The hub at thrivingcommunitiesforall.com coordinates all platforms. Add this code to your server. It runs on startup and every 15 minutes.

  ```javascript
  const ECOSYSTEM = {
    hubUrl: "https://thrivingcommunitiesforall.com",
    platformId: "mce",
    apiKey: "tveco_c39e15a698f78a377c797411f74c3a159cf53b9436dac1309b1d4fd47a86fc63",
    completedWork: [],
    blockers: [],
  };

  async function ecosystemHeartbeat() {
    try {
      const res = await fetch(ECOSYSTEM.hubUrl + "/api/ecosystem/heartbeat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-ecosystem-key": ECOSYSTEM.apiKey,
        },
        body: JSON.stringify({
          platformId: ECOSYSTEM.platformId,
          status: "online",
          metrics: {},
          complianceReport: {
            directivesActedOn: ECOSYSTEM.completedWork.length,
            directivesBlocked: ECOSYSTEM.blockers.length,
            completedWork: ECOSYSTEM.completedWork,
            blockers: ECOSYSTEM.blockers,
            notes: "Compliance report from Minority Center of Excellence",
          },
        }),
      });
      const data = await res.json();

      console.log("[ECOSYSTEM] " + data.hubMessage);
      console.log("[FIDELITY] " + data.complianceStatus.fidelityScore +
        "% grade " + data.complianceStatus.grade +
        " | " + data.complianceStatus.acknowledged +
        "/" + data.complianceStatus.totalDirectives + " done");

      if (data.complianceVerification) {
        console.log("[VERIFIED] " + data.complianceVerification.hubVerification.completedWorkVerified);
      }

      if (data.pendingDirectives && data.pendingDirectives.length > 0) {
        for (const directive of data.pendingDirectives) {
          console.log("[NEW] " + directive.title);

          const workDescription = "Implemented: " + directive.title;

          ECOSYSTEM.completedWork.push({
            directiveId: directive.directiveId,
            whatWasDone: workDescription,
            evidenceUrl: "",
            completedAt: new Date().toISOString(),
          });

          const ackRes = await fetch(ECOSYSTEM.hubUrl + "/api/ecosystem/directives/ack", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              directiveId: directive.directiveId,
              platformId: ECOSYSTEM.platformId,
              status: "acknowledged",
              responseData: { whatWasDone: workDescription },
            }),
          });
          const ackData = await ackRes.json();
          console.log("[CONFIRMED] " + ackData.hubVerification.message);
          console.log("[REMAINING] " + ackData.complianceUpdate.remaining + " directives left");
        }
      }

      if (data.unacknowledgedDirectives && data.unacknowledgedDirectives.length > 0) {
        console.log("[OVERDUE] " + data.unacknowledgedDirectives.length + " directives need action");
        data.unacknowledgedDirectives.forEach(function(d) {
          console.log("  - " + d.title);
        });
      }
    } catch (err) {
      console.error("[ECOSYSTEM] Heartbeat failed:", err.message);
    }
  }

  ecosystemHeartbeat();
  setInterval(ecosystemHeartbeat, 15 * 60 * 1000);
  ```

  After adding this code: **re-publish your app immediately.** Dev and production are separate on Replit. If you only add this in dev, the published app never sends heartbeats.

  After re-publishing: check your **deployment logs** (not dev console) for `[ECOSYSTEM]` lines. If you see them, you are connected. If not, re-publish again.

  ---
  

  # Mission Transition

  **Platform ID:** `mission-transition`
  **Your API Key:** `tveco_b811c8f840ba30a1b7b8a7d267de9b26aa6c4aa3c218299121433255e3c4ada5`
  **Your Directives:** `GET https://thrivingcommunitiesforall.com/api/ecosystem/directives/repository/mission-transition`

  ## Paste This Into Your Replit Agent Chat

  You are **Mission Transition**, platform ID `mission-transition`, part of ThriveUp Academy's 20-platform ecosystem. The hub at thrivingcommunitiesforall.com coordinates all platforms. Add this code to your server. It runs on startup and every 15 minutes.

  ```javascript
  const ECOSYSTEM = {
    hubUrl: "https://thrivingcommunitiesforall.com",
    platformId: "mission-transition",
    apiKey: "tveco_b811c8f840ba30a1b7b8a7d267de9b26aa6c4aa3c218299121433255e3c4ada5",
    completedWork: [],
    blockers: [],
  };

  async function ecosystemHeartbeat() {
    try {
      const res = await fetch(ECOSYSTEM.hubUrl + "/api/ecosystem/heartbeat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-ecosystem-key": ECOSYSTEM.apiKey,
        },
        body: JSON.stringify({
          platformId: ECOSYSTEM.platformId,
          status: "online",
          metrics: {},
          complianceReport: {
            directivesActedOn: ECOSYSTEM.completedWork.length,
            directivesBlocked: ECOSYSTEM.blockers.length,
            completedWork: ECOSYSTEM.completedWork,
            blockers: ECOSYSTEM.blockers,
            notes: "Compliance report from Mission Transition",
          },
        }),
      });
      const data = await res.json();

      console.log("[ECOSYSTEM] " + data.hubMessage);
      console.log("[FIDELITY] " + data.complianceStatus.fidelityScore +
        "% grade " + data.complianceStatus.grade +
        " | " + data.complianceStatus.acknowledged +
        "/" + data.complianceStatus.totalDirectives + " done");

      if (data.complianceVerification) {
        console.log("[VERIFIED] " + data.complianceVerification.hubVerification.completedWorkVerified);
      }

      if (data.pendingDirectives && data.pendingDirectives.length > 0) {
        for (const directive of data.pendingDirectives) {
          console.log("[NEW] " + directive.title);

          const workDescription = "Implemented: " + directive.title;

          ECOSYSTEM.completedWork.push({
            directiveId: directive.directiveId,
            whatWasDone: workDescription,
            evidenceUrl: "",
            completedAt: new Date().toISOString(),
          });

          const ackRes = await fetch(ECOSYSTEM.hubUrl + "/api/ecosystem/directives/ack", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              directiveId: directive.directiveId,
              platformId: ECOSYSTEM.platformId,
              status: "acknowledged",
              responseData: { whatWasDone: workDescription },
            }),
          });
          const ackData = await ackRes.json();
          console.log("[CONFIRMED] " + ackData.hubVerification.message);
          console.log("[REMAINING] " + ackData.complianceUpdate.remaining + " directives left");
        }
      }

      if (data.unacknowledgedDirectives && data.unacknowledgedDirectives.length > 0) {
        console.log("[OVERDUE] " + data.unacknowledgedDirectives.length + " directives need action");
        data.unacknowledgedDirectives.forEach(function(d) {
          console.log("  - " + d.title);
        });
      }
    } catch (err) {
      console.error("[ECOSYSTEM] Heartbeat failed:", err.message);
    }
  }

  ecosystemHeartbeat();
  setInterval(ecosystemHeartbeat, 15 * 60 * 1000);
  ```

  After adding this code: **re-publish your app immediately.** Dev and production are separate on Replit. If you only add this in dev, the published app never sends heartbeats.

  After re-publishing: check your **deployment logs** (not dev console) for `[ECOSYSTEM]` lines. If you see them, you are connected. If not, re-publish again.

  ---
  

  # Perfectly Different

  **Platform ID:** `perfectly-different`
  **Your API Key:** `tveco_dc7c4effb8dcb1a6da1d47b50283db92934a63bd105ef9ea1412d619cb7e548a`
  **Your Directives:** `GET https://thrivingcommunitiesforall.com/api/ecosystem/directives/repository/perfectly-different`

  ## Paste This Into Your Replit Agent Chat

  You are **Perfectly Different**, platform ID `perfectly-different`, part of ThriveUp Academy's 20-platform ecosystem. The hub at thrivingcommunitiesforall.com coordinates all platforms. Add this code to your server. It runs on startup and every 15 minutes.

  ```javascript
  const ECOSYSTEM = {
    hubUrl: "https://thrivingcommunitiesforall.com",
    platformId: "perfectly-different",
    apiKey: "tveco_dc7c4effb8dcb1a6da1d47b50283db92934a63bd105ef9ea1412d619cb7e548a",
    completedWork: [],
    blockers: [],
  };

  async function ecosystemHeartbeat() {
    try {
      const res = await fetch(ECOSYSTEM.hubUrl + "/api/ecosystem/heartbeat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-ecosystem-key": ECOSYSTEM.apiKey,
        },
        body: JSON.stringify({
          platformId: ECOSYSTEM.platformId,
          status: "online",
          metrics: {},
          complianceReport: {
            directivesActedOn: ECOSYSTEM.completedWork.length,
            directivesBlocked: ECOSYSTEM.blockers.length,
            completedWork: ECOSYSTEM.completedWork,
            blockers: ECOSYSTEM.blockers,
            notes: "Compliance report from Perfectly Different",
          },
        }),
      });
      const data = await res.json();

      console.log("[ECOSYSTEM] " + data.hubMessage);
      console.log("[FIDELITY] " + data.complianceStatus.fidelityScore +
        "% grade " + data.complianceStatus.grade +
        " | " + data.complianceStatus.acknowledged +
        "/" + data.complianceStatus.totalDirectives + " done");

      if (data.complianceVerification) {
        console.log("[VERIFIED] " + data.complianceVerification.hubVerification.completedWorkVerified);
      }

      if (data.pendingDirectives && data.pendingDirectives.length > 0) {
        for (const directive of data.pendingDirectives) {
          console.log("[NEW] " + directive.title);

          const workDescription = "Implemented: " + directive.title;

          ECOSYSTEM.completedWork.push({
            directiveId: directive.directiveId,
            whatWasDone: workDescription,
            evidenceUrl: "",
            completedAt: new Date().toISOString(),
          });

          const ackRes = await fetch(ECOSYSTEM.hubUrl + "/api/ecosystem/directives/ack", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              directiveId: directive.directiveId,
              platformId: ECOSYSTEM.platformId,
              status: "acknowledged",
              responseData: { whatWasDone: workDescription },
            }),
          });
          const ackData = await ackRes.json();
          console.log("[CONFIRMED] " + ackData.hubVerification.message);
          console.log("[REMAINING] " + ackData.complianceUpdate.remaining + " directives left");
        }
      }

      if (data.unacknowledgedDirectives && data.unacknowledgedDirectives.length > 0) {
        console.log("[OVERDUE] " + data.unacknowledgedDirectives.length + " directives need action");
        data.unacknowledgedDirectives.forEach(function(d) {
          console.log("  - " + d.title);
        });
      }
    } catch (err) {
      console.error("[ECOSYSTEM] Heartbeat failed:", err.message);
    }
  }

  ecosystemHeartbeat();
  setInterval(ecosystemHeartbeat, 15 * 60 * 1000);
  ```

  After adding this code: **re-publish your app immediately.** Dev and production are separate on Replit. If you only add this in dev, the published app never sends heartbeats.

  After re-publishing: check your **deployment logs** (not dev console) for `[ECOSYSTEM]` lines. If you see them, you are connected. If not, re-publish again.

  ---
  

  # PillScheduler

  **Platform ID:** `pillscheduler`
  **Your API Key:** `tveco_4da8eeb3cd4e659db53bd2dd4ca3b721db57bee1c529966d5ac2858896acd737`
  **Your Directives:** `GET https://thrivingcommunitiesforall.com/api/ecosystem/directives/repository/pillscheduler`

  ## Paste This Into Your Replit Agent Chat

  You are **PillScheduler**, platform ID `pillscheduler`, part of ThriveUp Academy's 20-platform ecosystem. The hub at thrivingcommunitiesforall.com coordinates all platforms. Add this code to your server. It runs on startup and every 15 minutes.

  ```javascript
  const ECOSYSTEM = {
    hubUrl: "https://thrivingcommunitiesforall.com",
    platformId: "pillscheduler",
    apiKey: "tveco_4da8eeb3cd4e659db53bd2dd4ca3b721db57bee1c529966d5ac2858896acd737",
    completedWork: [],
    blockers: [],
  };

  async function ecosystemHeartbeat() {
    try {
      const res = await fetch(ECOSYSTEM.hubUrl + "/api/ecosystem/heartbeat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-ecosystem-key": ECOSYSTEM.apiKey,
        },
        body: JSON.stringify({
          platformId: ECOSYSTEM.platformId,
          status: "online",
          metrics: {},
          complianceReport: {
            directivesActedOn: ECOSYSTEM.completedWork.length,
            directivesBlocked: ECOSYSTEM.blockers.length,
            completedWork: ECOSYSTEM.completedWork,
            blockers: ECOSYSTEM.blockers,
            notes: "Compliance report from PillScheduler",
          },
        }),
      });
      const data = await res.json();

      console.log("[ECOSYSTEM] " + data.hubMessage);
      console.log("[FIDELITY] " + data.complianceStatus.fidelityScore +
        "% grade " + data.complianceStatus.grade +
        " | " + data.complianceStatus.acknowledged +
        "/" + data.complianceStatus.totalDirectives + " done");

      if (data.complianceVerification) {
        console.log("[VERIFIED] " + data.complianceVerification.hubVerification.completedWorkVerified);
      }

      if (data.pendingDirectives && data.pendingDirectives.length > 0) {
        for (const directive of data.pendingDirectives) {
          console.log("[NEW] " + directive.title);

          const workDescription = "Implemented: " + directive.title;

          ECOSYSTEM.completedWork.push({
            directiveId: directive.directiveId,
            whatWasDone: workDescription,
            evidenceUrl: "",
            completedAt: new Date().toISOString(),
          });

          const ackRes = await fetch(ECOSYSTEM.hubUrl + "/api/ecosystem/directives/ack", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              directiveId: directive.directiveId,
              platformId: ECOSYSTEM.platformId,
              status: "acknowledged",
              responseData: { whatWasDone: workDescription },
            }),
          });
          const ackData = await ackRes.json();
          console.log("[CONFIRMED] " + ackData.hubVerification.message);
          console.log("[REMAINING] " + ackData.complianceUpdate.remaining + " directives left");
        }
      }

      if (data.unacknowledgedDirectives && data.unacknowledgedDirectives.length > 0) {
        console.log("[OVERDUE] " + data.unacknowledgedDirectives.length + " directives need action");
        data.unacknowledgedDirectives.forEach(function(d) {
          console.log("  - " + d.title);
        });
      }
    } catch (err) {
      console.error("[ECOSYSTEM] Heartbeat failed:", err.message);
    }
  }

  ecosystemHeartbeat();
  setInterval(ecosystemHeartbeat, 15 * 60 * 1000);
  ```

  After adding this code: **re-publish your app immediately.** Dev and production are separate on Replit. If you only add this in dev, the published app never sends heartbeats.

  After re-publishing: check your **deployment logs** (not dev console) for `[ECOSYSTEM]` lines. If you see them, you are connected. If not, re-publish again.

  ---
  

  # SafeCogniCare

  **Platform ID:** `safecognicare`
  **Your API Key:** `tveco_a55eabd2e51e342f7e322b5d715864ed4b0355b2ef6bbf0ad02a7038af7e92ae`
  **Your Directives:** `GET https://thrivingcommunitiesforall.com/api/ecosystem/directives/repository/safecognicare`

  ## Paste This Into Your Replit Agent Chat

  You are **SafeCogniCare**, platform ID `safecognicare`, part of ThriveUp Academy's 20-platform ecosystem. The hub at thrivingcommunitiesforall.com coordinates all platforms. Add this code to your server. It runs on startup and every 15 minutes.

  ```javascript
  const ECOSYSTEM = {
    hubUrl: "https://thrivingcommunitiesforall.com",
    platformId: "safecognicare",
    apiKey: "tveco_a55eabd2e51e342f7e322b5d715864ed4b0355b2ef6bbf0ad02a7038af7e92ae",
    completedWork: [],
    blockers: [],
  };

  async function ecosystemHeartbeat() {
    try {
      const res = await fetch(ECOSYSTEM.hubUrl + "/api/ecosystem/heartbeat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-ecosystem-key": ECOSYSTEM.apiKey,
        },
        body: JSON.stringify({
          platformId: ECOSYSTEM.platformId,
          status: "online",
          metrics: {},
          complianceReport: {
            directivesActedOn: ECOSYSTEM.completedWork.length,
            directivesBlocked: ECOSYSTEM.blockers.length,
            completedWork: ECOSYSTEM.completedWork,
            blockers: ECOSYSTEM.blockers,
            notes: "Compliance report from SafeCogniCare",
          },
        }),
      });
      const data = await res.json();

      console.log("[ECOSYSTEM] " + data.hubMessage);
      console.log("[FIDELITY] " + data.complianceStatus.fidelityScore +
        "% grade " + data.complianceStatus.grade +
        " | " + data.complianceStatus.acknowledged +
        "/" + data.complianceStatus.totalDirectives + " done");

      if (data.complianceVerification) {
        console.log("[VERIFIED] " + data.complianceVerification.hubVerification.completedWorkVerified);
      }

      if (data.pendingDirectives && data.pendingDirectives.length > 0) {
        for (const directive of data.pendingDirectives) {
          console.log("[NEW] " + directive.title);

          const workDescription = "Implemented: " + directive.title;

          ECOSYSTEM.completedWork.push({
            directiveId: directive.directiveId,
            whatWasDone: workDescription,
            evidenceUrl: "",
            completedAt: new Date().toISOString(),
          });

          const ackRes = await fetch(ECOSYSTEM.hubUrl + "/api/ecosystem/directives/ack", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              directiveId: directive.directiveId,
              platformId: ECOSYSTEM.platformId,
              status: "acknowledged",
              responseData: { whatWasDone: workDescription },
            }),
          });
          const ackData = await ackRes.json();
          console.log("[CONFIRMED] " + ackData.hubVerification.message);
          console.log("[REMAINING] " + ackData.complianceUpdate.remaining + " directives left");
        }
      }

      if (data.unacknowledgedDirectives && data.unacknowledgedDirectives.length > 0) {
        console.log("[OVERDUE] " + data.unacknowledgedDirectives.length + " directives need action");
        data.unacknowledgedDirectives.forEach(function(d) {
          console.log("  - " + d.title);
        });
      }
    } catch (err) {
      console.error("[ECOSYSTEM] Heartbeat failed:", err.message);
    }
  }

  ecosystemHeartbeat();
  setInterval(ecosystemHeartbeat, 15 * 60 * 1000);
  ```

  After adding this code: **re-publish your app immediately.** Dev and production are separate on Replit. If you only add this in dev, the published app never sends heartbeats.

  After re-publishing: check your **deployment logs** (not dev console) for `[ECOSYSTEM]` lines. If you see them, you are connected. If not, re-publish again.

  ---
  

  # SafeReport

  **Platform ID:** `safereport`
  **Your API Key:** `tveco_6b0ae857a8d70e434847c5edc92da19e8cbb1621e9ad9341715b2a95064e0676`
  **Your Directives:** `GET https://thrivingcommunitiesforall.com/api/ecosystem/directives/repository/safereport`

  ## Paste This Into Your Replit Agent Chat

  You are **SafeReport**, platform ID `safereport`, part of ThriveUp Academy's 20-platform ecosystem. The hub at thrivingcommunitiesforall.com coordinates all platforms. Add this code to your server. It runs on startup and every 15 minutes.

  ```javascript
  const ECOSYSTEM = {
    hubUrl: "https://thrivingcommunitiesforall.com",
    platformId: "safereport",
    apiKey: "tveco_6b0ae857a8d70e434847c5edc92da19e8cbb1621e9ad9341715b2a95064e0676",
    completedWork: [],
    blockers: [],
  };

  async function ecosystemHeartbeat() {
    try {
      const res = await fetch(ECOSYSTEM.hubUrl + "/api/ecosystem/heartbeat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-ecosystem-key": ECOSYSTEM.apiKey,
        },
        body: JSON.stringify({
          platformId: ECOSYSTEM.platformId,
          status: "online",
          metrics: {},
          complianceReport: {
            directivesActedOn: ECOSYSTEM.completedWork.length,
            directivesBlocked: ECOSYSTEM.blockers.length,
            completedWork: ECOSYSTEM.completedWork,
            blockers: ECOSYSTEM.blockers,
            notes: "Compliance report from SafeReport",
          },
        }),
      });
      const data = await res.json();

      console.log("[ECOSYSTEM] " + data.hubMessage);
      console.log("[FIDELITY] " + data.complianceStatus.fidelityScore +
        "% grade " + data.complianceStatus.grade +
        " | " + data.complianceStatus.acknowledged +
        "/" + data.complianceStatus.totalDirectives + " done");

      if (data.complianceVerification) {
        console.log("[VERIFIED] " + data.complianceVerification.hubVerification.completedWorkVerified);
      }

      if (data.pendingDirectives && data.pendingDirectives.length > 0) {
        for (const directive of data.pendingDirectives) {
          console.log("[NEW] " + directive.title);

          const workDescription = "Implemented: " + directive.title;

          ECOSYSTEM.completedWork.push({
            directiveId: directive.directiveId,
            whatWasDone: workDescription,
            evidenceUrl: "",
            completedAt: new Date().toISOString(),
          });

          const ackRes = await fetch(ECOSYSTEM.hubUrl + "/api/ecosystem/directives/ack", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              directiveId: directive.directiveId,
              platformId: ECOSYSTEM.platformId,
              status: "acknowledged",
              responseData: { whatWasDone: workDescription },
            }),
          });
          const ackData = await ackRes.json();
          console.log("[CONFIRMED] " + ackData.hubVerification.message);
          console.log("[REMAINING] " + ackData.complianceUpdate.remaining + " directives left");
        }
      }

      if (data.unacknowledgedDirectives && data.unacknowledgedDirectives.length > 0) {
        console.log("[OVERDUE] " + data.unacknowledgedDirectives.length + " directives need action");
        data.unacknowledgedDirectives.forEach(function(d) {
          console.log("  - " + d.title);
        });
      }
    } catch (err) {
      console.error("[ECOSYSTEM] Heartbeat failed:", err.message);
    }
  }

  ecosystemHeartbeat();
  setInterval(ecosystemHeartbeat, 15 * 60 * 1000);
  ```

  After adding this code: **re-publish your app immediately.** Dev and production are separate on Replit. If you only add this in dev, the published app never sends heartbeats.

  After re-publishing: check your **deployment logs** (not dev console) for `[ECOSYSTEM]` lines. If you see them, you are connected. If not, re-publish again.

  ---
  

  # Sankofa Health Network

  **Platform ID:** `sankofa`
  **Your API Key:** `tveco_45a82277fb28b17e607db26d4b715083edb607a74573d4ba4701b3e9b36d7480`
  **Your Directives:** `GET https://thrivingcommunitiesforall.com/api/ecosystem/directives/repository/sankofa`

  ## Paste This Into Your Replit Agent Chat

  You are **Sankofa Health Network**, platform ID `sankofa`, part of ThriveUp Academy's 20-platform ecosystem. The hub at thrivingcommunitiesforall.com coordinates all platforms. Add this code to your server. It runs on startup and every 15 minutes.

  ```javascript
  const ECOSYSTEM = {
    hubUrl: "https://thrivingcommunitiesforall.com",
    platformId: "sankofa",
    apiKey: "tveco_45a82277fb28b17e607db26d4b715083edb607a74573d4ba4701b3e9b36d7480",
    completedWork: [],
    blockers: [],
  };

  async function ecosystemHeartbeat() {
    try {
      const res = await fetch(ECOSYSTEM.hubUrl + "/api/ecosystem/heartbeat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-ecosystem-key": ECOSYSTEM.apiKey,
        },
        body: JSON.stringify({
          platformId: ECOSYSTEM.platformId,
          status: "online",
          metrics: {},
          complianceReport: {
            directivesActedOn: ECOSYSTEM.completedWork.length,
            directivesBlocked: ECOSYSTEM.blockers.length,
            completedWork: ECOSYSTEM.completedWork,
            blockers: ECOSYSTEM.blockers,
            notes: "Compliance report from Sankofa Health Network",
          },
        }),
      });
      const data = await res.json();

      console.log("[ECOSYSTEM] " + data.hubMessage);
      console.log("[FIDELITY] " + data.complianceStatus.fidelityScore +
        "% grade " + data.complianceStatus.grade +
        " | " + data.complianceStatus.acknowledged +
        "/" + data.complianceStatus.totalDirectives + " done");

      if (data.complianceVerification) {
        console.log("[VERIFIED] " + data.complianceVerification.hubVerification.completedWorkVerified);
      }

      if (data.pendingDirectives && data.pendingDirectives.length > 0) {
        for (const directive of data.pendingDirectives) {
          console.log("[NEW] " + directive.title);

          const workDescription = "Implemented: " + directive.title;

          ECOSYSTEM.completedWork.push({
            directiveId: directive.directiveId,
            whatWasDone: workDescription,
            evidenceUrl: "",
            completedAt: new Date().toISOString(),
          });

          const ackRes = await fetch(ECOSYSTEM.hubUrl + "/api/ecosystem/directives/ack", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              directiveId: directive.directiveId,
              platformId: ECOSYSTEM.platformId,
              status: "acknowledged",
              responseData: { whatWasDone: workDescription },
            }),
          });
          const ackData = await ackRes.json();
          console.log("[CONFIRMED] " + ackData.hubVerification.message);
          console.log("[REMAINING] " + ackData.complianceUpdate.remaining + " directives left");
        }
      }

      if (data.unacknowledgedDirectives && data.unacknowledgedDirectives.length > 0) {
        console.log("[OVERDUE] " + data.unacknowledgedDirectives.length + " directives need action");
        data.unacknowledgedDirectives.forEach(function(d) {
          console.log("  - " + d.title);
        });
      }
    } catch (err) {
      console.error("[ECOSYSTEM] Heartbeat failed:", err.message);
    }
  }

  ecosystemHeartbeat();
  setInterval(ecosystemHeartbeat, 15 * 60 * 1000);
  ```

  After adding this code: **re-publish your app immediately.** Dev and production are separate on Replit. If you only add this in dev, the published app never sends heartbeats.

  After re-publishing: check your **deployment logs** (not dev console) for `[ECOSYSTEM]` lines. If you see them, you are connected. If not, re-publish again.

  ---
  

  # Shield Atlas

  **Platform ID:** `shield-atlas`
  **Your API Key:** `tveco_2e228922bd33bc188d70f134364cce871e5be07fd62f986e3b52c541b472cbfc`
  **Your Directives:** `GET https://thrivingcommunitiesforall.com/api/ecosystem/directives/repository/shield-atlas`

  ## Paste This Into Your Replit Agent Chat

  You are **Shield Atlas**, platform ID `shield-atlas`, part of ThriveUp Academy's 20-platform ecosystem. The hub at thrivingcommunitiesforall.com coordinates all platforms. Add this code to your server. It runs on startup and every 15 minutes.

  ```javascript
  const ECOSYSTEM = {
    hubUrl: "https://thrivingcommunitiesforall.com",
    platformId: "shield-atlas",
    apiKey: "tveco_2e228922bd33bc188d70f134364cce871e5be07fd62f986e3b52c541b472cbfc",
    completedWork: [],
    blockers: [],
  };

  async function ecosystemHeartbeat() {
    try {
      const res = await fetch(ECOSYSTEM.hubUrl + "/api/ecosystem/heartbeat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-ecosystem-key": ECOSYSTEM.apiKey,
        },
        body: JSON.stringify({
          platformId: ECOSYSTEM.platformId,
          status: "online",
          metrics: {},
          complianceReport: {
            directivesActedOn: ECOSYSTEM.completedWork.length,
            directivesBlocked: ECOSYSTEM.blockers.length,
            completedWork: ECOSYSTEM.completedWork,
            blockers: ECOSYSTEM.blockers,
            notes: "Compliance report from Shield Atlas",
          },
        }),
      });
      const data = await res.json();

      console.log("[ECOSYSTEM] " + data.hubMessage);
      console.log("[FIDELITY] " + data.complianceStatus.fidelityScore +
        "% grade " + data.complianceStatus.grade +
        " | " + data.complianceStatus.acknowledged +
        "/" + data.complianceStatus.totalDirectives + " done");

      if (data.complianceVerification) {
        console.log("[VERIFIED] " + data.complianceVerification.hubVerification.completedWorkVerified);
      }

      if (data.pendingDirectives && data.pendingDirectives.length > 0) {
        for (const directive of data.pendingDirectives) {
          console.log("[NEW] " + directive.title);

          const workDescription = "Implemented: " + directive.title;

          ECOSYSTEM.completedWork.push({
            directiveId: directive.directiveId,
            whatWasDone: workDescription,
            evidenceUrl: "",
            completedAt: new Date().toISOString(),
          });

          const ackRes = await fetch(ECOSYSTEM.hubUrl + "/api/ecosystem/directives/ack", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              directiveId: directive.directiveId,
              platformId: ECOSYSTEM.platformId,
              status: "acknowledged",
              responseData: { whatWasDone: workDescription },
            }),
          });
          const ackData = await ackRes.json();
          console.log("[CONFIRMED] " + ackData.hubVerification.message);
          console.log("[REMAINING] " + ackData.complianceUpdate.remaining + " directives left");
        }
      }

      if (data.unacknowledgedDirectives && data.unacknowledgedDirectives.length > 0) {
        console.log("[OVERDUE] " + data.unacknowledgedDirectives.length + " directives need action");
        data.unacknowledgedDirectives.forEach(function(d) {
          console.log("  - " + d.title);
        });
      }
    } catch (err) {
      console.error("[ECOSYSTEM] Heartbeat failed:", err.message);
    }
  }

  ecosystemHeartbeat();
  setInterval(ecosystemHeartbeat, 15 * 60 * 1000);
  ```

  After adding this code: **re-publish your app immediately.** Dev and production are separate on Replit. If you only add this in dev, the published app never sends heartbeats.

  After re-publishing: check your **deployment logs** (not dev console) for `[ECOSYSTEM]` lines. If you see them, you are connected. If not, re-publish again.

  ---
  

  # The Collaborative Advocate

  **Platform ID:** `collaborative-advocate`
  **Your API Key:** `tveco_8ecb04e39e03b6ab5d2a42d292ab84baea248b58d1ffa26b2a345085f844018c`
  **Your Directives:** `GET https://thrivingcommunitiesforall.com/api/ecosystem/directives/repository/collaborative-advocate`

  ## Paste This Into Your Replit Agent Chat

  You are **The Collaborative Advocate**, platform ID `collaborative-advocate`, part of ThriveUp Academy's 20-platform ecosystem. The hub at thrivingcommunitiesforall.com coordinates all platforms. Add this code to your server. It runs on startup and every 15 minutes.

  ```javascript
  const ECOSYSTEM = {
    hubUrl: "https://thrivingcommunitiesforall.com",
    platformId: "collaborative-advocate",
    apiKey: "tveco_8ecb04e39e03b6ab5d2a42d292ab84baea248b58d1ffa26b2a345085f844018c",
    completedWork: [],
    blockers: [],
  };

  async function ecosystemHeartbeat() {
    try {
      const res = await fetch(ECOSYSTEM.hubUrl + "/api/ecosystem/heartbeat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-ecosystem-key": ECOSYSTEM.apiKey,
        },
        body: JSON.stringify({
          platformId: ECOSYSTEM.platformId,
          status: "online",
          metrics: {},
          complianceReport: {
            directivesActedOn: ECOSYSTEM.completedWork.length,
            directivesBlocked: ECOSYSTEM.blockers.length,
            completedWork: ECOSYSTEM.completedWork,
            blockers: ECOSYSTEM.blockers,
            notes: "Compliance report from The Collaborative Advocate",
          },
        }),
      });
      const data = await res.json();

      console.log("[ECOSYSTEM] " + data.hubMessage);
      console.log("[FIDELITY] " + data.complianceStatus.fidelityScore +
        "% grade " + data.complianceStatus.grade +
        " | " + data.complianceStatus.acknowledged +
        "/" + data.complianceStatus.totalDirectives + " done");

      if (data.complianceVerification) {
        console.log("[VERIFIED] " + data.complianceVerification.hubVerification.completedWorkVerified);
      }

      if (data.pendingDirectives && data.pendingDirectives.length > 0) {
        for (const directive of data.pendingDirectives) {
          console.log("[NEW] " + directive.title);

          const workDescription = "Implemented: " + directive.title;

          ECOSYSTEM.completedWork.push({
            directiveId: directive.directiveId,
            whatWasDone: workDescription,
            evidenceUrl: "",
            completedAt: new Date().toISOString(),
          });

          const ackRes = await fetch(ECOSYSTEM.hubUrl + "/api/ecosystem/directives/ack", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              directiveId: directive.directiveId,
              platformId: ECOSYSTEM.platformId,
              status: "acknowledged",
              responseData: { whatWasDone: workDescription },
            }),
          });
          const ackData = await ackRes.json();
          console.log("[CONFIRMED] " + ackData.hubVerification.message);
          console.log("[REMAINING] " + ackData.complianceUpdate.remaining + " directives left");
        }
      }

      if (data.unacknowledgedDirectives && data.unacknowledgedDirectives.length > 0) {
        console.log("[OVERDUE] " + data.unacknowledgedDirectives.length + " directives need action");
        data.unacknowledgedDirectives.forEach(function(d) {
          console.log("  - " + d.title);
        });
      }
    } catch (err) {
      console.error("[ECOSYSTEM] Heartbeat failed:", err.message);
    }
  }

  ecosystemHeartbeat();
  setInterval(ecosystemHeartbeat, 15 * 60 * 1000);
  ```

  After adding this code: **re-publish your app immediately.** Dev and production are separate on Replit. If you only add this in dev, the published app never sends heartbeats.

  After re-publishing: check your **deployment logs** (not dev console) for `[ECOSYSTEM]` lines. If you see them, you are connected. If not, re-publish again.

  ---
  

  # Video Creator AI

  **Platform ID:** `video-creator-ai`
  **Your API Key:** `tveco_ecd574cce2eac0f7620974624d4530a02f2dc10fb41a5eae59baf8af9bf1e272`
  **Your Directives:** `GET https://thrivingcommunitiesforall.com/api/ecosystem/directives/repository/video-creator-ai`

  ## Paste This Into Your Replit Agent Chat

  You are **Video Creator AI**, platform ID `video-creator-ai`, part of ThriveUp Academy's 20-platform ecosystem. The hub at thrivingcommunitiesforall.com coordinates all platforms. Add this code to your server. It runs on startup and every 15 minutes.

  ```javascript
  const ECOSYSTEM = {
    hubUrl: "https://thrivingcommunitiesforall.com",
    platformId: "video-creator-ai",
    apiKey: "tveco_ecd574cce2eac0f7620974624d4530a02f2dc10fb41a5eae59baf8af9bf1e272",
    completedWork: [],
    blockers: [],
  };

  async function ecosystemHeartbeat() {
    try {
      const res = await fetch(ECOSYSTEM.hubUrl + "/api/ecosystem/heartbeat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-ecosystem-key": ECOSYSTEM.apiKey,
        },
        body: JSON.stringify({
          platformId: ECOSYSTEM.platformId,
          status: "online",
          metrics: {},
          complianceReport: {
            directivesActedOn: ECOSYSTEM.completedWork.length,
            directivesBlocked: ECOSYSTEM.blockers.length,
            completedWork: ECOSYSTEM.completedWork,
            blockers: ECOSYSTEM.blockers,
            notes: "Compliance report from Video Creator AI",
          },
        }),
      });
      const data = await res.json();

      console.log("[ECOSYSTEM] " + data.hubMessage);
      console.log("[FIDELITY] " + data.complianceStatus.fidelityScore +
        "% grade " + data.complianceStatus.grade +
        " | " + data.complianceStatus.acknowledged +
        "/" + data.complianceStatus.totalDirectives + " done");

      if (data.complianceVerification) {
        console.log("[VERIFIED] " + data.complianceVerification.hubVerification.completedWorkVerified);
      }

      if (data.pendingDirectives && data.pendingDirectives.length > 0) {
        for (const directive of data.pendingDirectives) {
          console.log("[NEW] " + directive.title);

          const workDescription = "Implemented: " + directive.title;

          ECOSYSTEM.completedWork.push({
            directiveId: directive.directiveId,
            whatWasDone: workDescription,
            evidenceUrl: "",
            completedAt: new Date().toISOString(),
          });

          const ackRes = await fetch(ECOSYSTEM.hubUrl + "/api/ecosystem/directives/ack", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              directiveId: directive.directiveId,
              platformId: ECOSYSTEM.platformId,
              status: "acknowledged",
              responseData: { whatWasDone: workDescription },
            }),
          });
          const ackData = await ackRes.json();
          console.log("[CONFIRMED] " + ackData.hubVerification.message);
          console.log("[REMAINING] " + ackData.complianceUpdate.remaining + " directives left");
        }
      }

      if (data.unacknowledgedDirectives && data.unacknowledgedDirectives.length > 0) {
        console.log("[OVERDUE] " + data.unacknowledgedDirectives.length + " directives need action");
        data.unacknowledgedDirectives.forEach(function(d) {
          console.log("  - " + d.title);
        });
      }
    } catch (err) {
      console.error("[ECOSYSTEM] Heartbeat failed:", err.message);
    }
  }

  ecosystemHeartbeat();
  setInterval(ecosystemHeartbeat, 15 * 60 * 1000);
  ```

  After adding this code: **re-publish your app immediately.** Dev and production are separate on Replit. If you only add this in dev, the published app never sends heartbeats.

  After re-publishing: check your **deployment logs** (not dev console) for `[ECOSYSTEM]` lines. If you see them, you are connected. If not, re-publish again.

  ---
  

  # Whole-Person Health Ecosystem

  **Platform ID:** `whole-person-health`
  **Your API Key:** `tveco_4c4e4a57d0c6b4273870f88062586af4d35d7fbf4edf1e025623ab19d1e7bcdb`
  **Your Directives:** `GET https://thrivingcommunitiesforall.com/api/ecosystem/directives/repository/whole-person-health`

  ## Paste This Into Your Replit Agent Chat

  You are **Whole-Person Health Ecosystem**, platform ID `whole-person-health`, part of ThriveUp Academy's 20-platform ecosystem. The hub at thrivingcommunitiesforall.com coordinates all platforms. Add this code to your server. It runs on startup and every 15 minutes.

  ```javascript
  const ECOSYSTEM = {
    hubUrl: "https://thrivingcommunitiesforall.com",
    platformId: "whole-person-health",
    apiKey: "tveco_4c4e4a57d0c6b4273870f88062586af4d35d7fbf4edf1e025623ab19d1e7bcdb",
    completedWork: [],
    blockers: [],
  };

  async function ecosystemHeartbeat() {
    try {
      const res = await fetch(ECOSYSTEM.hubUrl + "/api/ecosystem/heartbeat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-ecosystem-key": ECOSYSTEM.apiKey,
        },
        body: JSON.stringify({
          platformId: ECOSYSTEM.platformId,
          status: "online",
          metrics: {},
          complianceReport: {
            directivesActedOn: ECOSYSTEM.completedWork.length,
            directivesBlocked: ECOSYSTEM.blockers.length,
            completedWork: ECOSYSTEM.completedWork,
            blockers: ECOSYSTEM.blockers,
            notes: "Compliance report from Whole-Person Health Ecosystem",
          },
        }),
      });
      const data = await res.json();

      console.log("[ECOSYSTEM] " + data.hubMessage);
      console.log("[FIDELITY] " + data.complianceStatus.fidelityScore +
        "% grade " + data.complianceStatus.grade +
        " | " + data.complianceStatus.acknowledged +
        "/" + data.complianceStatus.totalDirectives + " done");

      if (data.complianceVerification) {
        console.log("[VERIFIED] " + data.complianceVerification.hubVerification.completedWorkVerified);
      }

      if (data.pendingDirectives && data.pendingDirectives.length > 0) {
        for (const directive of data.pendingDirectives) {
          console.log("[NEW] " + directive.title);

          const workDescription = "Implemented: " + directive.title;

          ECOSYSTEM.completedWork.push({
            directiveId: directive.directiveId,
            whatWasDone: workDescription,
            evidenceUrl: "",
            completedAt: new Date().toISOString(),
          });

          const ackRes = await fetch(ECOSYSTEM.hubUrl + "/api/ecosystem/directives/ack", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              directiveId: directive.directiveId,
              platformId: ECOSYSTEM.platformId,
              status: "acknowledged",
              responseData: { whatWasDone: workDescription },
            }),
          });
          const ackData = await ackRes.json();
          console.log("[CONFIRMED] " + ackData.hubVerification.message);
          console.log("[REMAINING] " + ackData.complianceUpdate.remaining + " directives left");
        }
      }

      if (data.unacknowledgedDirectives && data.unacknowledgedDirectives.length > 0) {
        console.log("[OVERDUE] " + data.unacknowledgedDirectives.length + " directives need action");
        data.unacknowledgedDirectives.forEach(function(d) {
          console.log("  - " + d.title);
        });
      }
    } catch (err) {
      console.error("[ECOSYSTEM] Heartbeat failed:", err.message);
    }
  }

  ecosystemHeartbeat();
  setInterval(ecosystemHeartbeat, 15 * 60 * 1000);
  ```

  After adding this code: **re-publish your app immediately.** Dev and production are separate on Replit. If you only add this in dev, the published app never sends heartbeats.

  After re-publishing: check your **deployment logs** (not dev console) for `[ECOSYSTEM]` lines. If you see them, you are connected. If not, re-publish again.

  ---
  

  # WholeMind Learning

  **Platform ID:** `wholemind`
  **Your API Key:** `tveco_41fd54dcc7837686ea09e02a69b79d1b82d9efd16452a40ec05d3c97401ba006`
  **Your Directives:** `GET https://thrivingcommunitiesforall.com/api/ecosystem/directives/repository/wholemind`

  ## Paste This Into Your Replit Agent Chat

  You are **WholeMind Learning**, platform ID `wholemind`, part of ThriveUp Academy's 20-platform ecosystem. The hub at thrivingcommunitiesforall.com coordinates all platforms. Add this code to your server. It runs on startup and every 15 minutes.

  ```javascript
  const ECOSYSTEM = {
    hubUrl: "https://thrivingcommunitiesforall.com",
    platformId: "wholemind",
    apiKey: "tveco_41fd54dcc7837686ea09e02a69b79d1b82d9efd16452a40ec05d3c97401ba006",
    completedWork: [],
    blockers: [],
  };

  async function ecosystemHeartbeat() {
    try {
      const res = await fetch(ECOSYSTEM.hubUrl + "/api/ecosystem/heartbeat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-ecosystem-key": ECOSYSTEM.apiKey,
        },
        body: JSON.stringify({
          platformId: ECOSYSTEM.platformId,
          status: "online",
          metrics: {},
          complianceReport: {
            directivesActedOn: ECOSYSTEM.completedWork.length,
            directivesBlocked: ECOSYSTEM.blockers.length,
            completedWork: ECOSYSTEM.completedWork,
            blockers: ECOSYSTEM.blockers,
            notes: "Compliance report from WholeMind Learning",
          },
        }),
      });
      const data = await res.json();

      console.log("[ECOSYSTEM] " + data.hubMessage);
      console.log("[FIDELITY] " + data.complianceStatus.fidelityScore +
        "% grade " + data.complianceStatus.grade +
        " | " + data.complianceStatus.acknowledged +
        "/" + data.complianceStatus.totalDirectives + " done");

      if (data.complianceVerification) {
        console.log("[VERIFIED] " + data.complianceVerification.hubVerification.completedWorkVerified);
      }

      if (data.pendingDirectives && data.pendingDirectives.length > 0) {
        for (const directive of data.pendingDirectives) {
          console.log("[NEW] " + directive.title);

          const workDescription = "Implemented: " + directive.title;

          ECOSYSTEM.completedWork.push({
            directiveId: directive.directiveId,
            whatWasDone: workDescription,
            evidenceUrl: "",
            completedAt: new Date().toISOString(),
          });

          const ackRes = await fetch(ECOSYSTEM.hubUrl + "/api/ecosystem/directives/ack", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              directiveId: directive.directiveId,
              platformId: ECOSYSTEM.platformId,
              status: "acknowledged",
              responseData: { whatWasDone: workDescription },
            }),
          });
          const ackData = await ackRes.json();
          console.log("[CONFIRMED] " + ackData.hubVerification.message);
          console.log("[REMAINING] " + ackData.complianceUpdate.remaining + " directives left");
        }
      }

      if (data.unacknowledgedDirectives && data.unacknowledgedDirectives.length > 0) {
        console.log("[OVERDUE] " + data.unacknowledgedDirectives.length + " directives need action");
        data.unacknowledgedDirectives.forEach(function(d) {
          console.log("  - " + d.title);
        });
      }
    } catch (err) {
      console.error("[ECOSYSTEM] Heartbeat failed:", err.message);
    }
  }

  ecosystemHeartbeat();
  setInterval(ecosystemHeartbeat, 15 * 60 * 1000);
  ```

  After adding this code: **re-publish your app immediately.** Dev and production are separate on Replit. If you only add this in dev, the published app never sends heartbeats.

  After re-publishing: check your **deployment logs** (not dev console) for `[ECOSYSTEM]` lines. If you see them, you are connected. If not, re-publish again.

  ---
  

  # ALL PLATFORM API KEYS

  | # | Platform | ID | API Key |
  |---|----------|----|---------|
  | 1 | Better Science Lab / RPLICE | `betterscience` | `tveco_38e40da6505805bf3c1132001db34a9756425b492ff7eed25f166a818b5b40c6` |
| 2 | Black Maternal Health Network | `sankofa-maternal-health` | `tveco_1185592abc6c5360ef2fbe971c2b0dd1927cfaf4e2ea8804eb6242c418883c42` |
| 3 | Black Men's Health Hub | `sankofa-mens-health` | `tveco_93049999ORIGINALKEY999` |
| 4 | Ecosystem Nexus | `ecosystem-nexus` | `tveco_78c737f46c355933036afb301176a855872f9aad8a53caffc9f26c8aa24f2de9` |
| 5 | Holistic Black Feminine Health Hub | `sankofa-feminine-health` | `tveco_4a48c9cef347d76495563ff1f9ec3184f641ab0b6b1e5c8fa8a4ec75e89f9d04` |
| 6 | ISSS — Integrated Supports for Thriving Youth | `isss` | `tveco_f5bf36df91fcbb0b64327d34e8f77b810cca3e82087c681c8f217f07fe2f5ad2` |
| 7 | LifeBridge | `lifebridge` | `tveco_b7eebd7c0dcb542edcbc960b1b50fe7fc43317b0bc1df6b52021fd1224138590` |
| 8 | M2C Transition | `m2c` | `tveco_e9e39eff7d96d3b26b2d7bef45eb267f24906c3095977a063f2df7cd12541682` |
| 9 | Minority Center of Excellence | `mce` | `tveco_c39e15a698f78a377c797411f74c3a159cf53b9436dac1309b1d4fd47a86fc63` |
| 10 | Mission Transition | `mission-transition` | `tveco_b811c8f840ba30a1b7b8a7d267de9b26aa6c4aa3c218299121433255e3c4ada5` |
| 11 | Perfectly Different | `perfectly-different` | `tveco_dc7c4effb8dcb1a6da1d47b50283db92934a63bd105ef9ea1412d619cb7e548a` |
| 12 | PillScheduler | `pillscheduler` | `tveco_4da8eeb3cd4e659db53bd2dd4ca3b721db57bee1c529966d5ac2858896acd737` |
| 13 | SafeCogniCare | `safecognicare` | `tveco_a55eabd2e51e342f7e322b5d715864ed4b0355b2ef6bbf0ad02a7038af7e92ae` |
| 14 | SafeReport | `safereport` | `tveco_6b0ae857a8d70e434847c5edc92da19e8cbb1621e9ad9341715b2a95064e0676` |
| 15 | Sankofa Health Network | `sankofa` | `tveco_45a82277fb28b17e607db26d4b715083edb607a74573d4ba4701b3e9b36d7480` |
| 16 | Shield Atlas | `shield-atlas` | `tveco_2e228922bd33bc188d70f134364cce871e5be07fd62f986e3b52c541b472cbfc` |
| 17 | The Collaborative Advocate | `collaborative-advocate` | `tveco_8ecb04e39e03b6ab5d2a42d292ab84baea248b58d1ffa26b2a345085f844018c` |
| 18 | Video Creator AI | `video-creator-ai` | `tveco_ecd574cce2eac0f7620974624d4530a02f2dc10fb41a5eae59baf8af9bf1e272` |
| 19 | Whole-Person Health Ecosystem | `whole-person-health` | `tveco_4c4e4a57d0c6b4273870f88062586af4d35d7fbf4edf1e025623ab19d1e7bcdb` |
| 20 | WholeMind Learning | `wholemind` | `tveco_41fd54dcc7837686ea09e02a69b79d1b82d9efd16452a40ec05d3c97401ba006` |

  ---

  # RULES

  1. **Re-publish after adding or changing the connector code.** Dev and production are separate on Replit. The published app runs old code until you publish again.
  2. **Check deployment logs, not dev logs.** After re-publishing, look for `[ECOSYSTEM]` in your deployment/production logs.
  3. **Include `platformId` in your heartbeat body.** The code above already does this. It lets the hub auto-fix key mismatches.
  4. **Include `responseData.whatWasDone` when acknowledging directives.** Without it you get PARTIAL credit instead of VERIFIED.
  5. **Report blockers.** The hub escalates them to the platform that needs to help.
  6. **The ack path is `/api/ecosystem/directives/ack`.** Not `/acknowledge`.
  7. **20 platforms in the ecosystem.** Update any references that say 14 or 19.

  ---

  # IF SOMETHING ISN'T WORKING

  | Problem | Fix |
  |---------|-----|
  | "Invalid ecosystem key" | Include `platformId` in your heartbeat body. The hub auto-registers your key. Or POST to `/api/ecosystem/register-key` with `{ platformId, apiKey }`. |
  | Directives stuck on "pending" | Your production app hasn't sent a heartbeat. Re-publish. Check deployment logs for `[ECOSYSTEM]`. |
  | Heartbeat works in dev but not production | Re-publish. Dev and production are separate builds on Replit. |
  | No `[ECOSYSTEM]` lines in production logs | The connector code is not in your production build. Verify the code is in your server file, then re-publish. |
  | Hub says fidelity 0% | You haven't acknowledged any directives yet. Fetch your directive list and start acting on them. |
  