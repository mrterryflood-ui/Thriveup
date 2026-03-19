// ============================================================
// ThriveUp Ecosystem Connector — The Collaborative Advocate
// Generated: 2026-03-19
// Platform ID: collaborative-advocate
// Role: vosb-services (Veteran-Owned Small Business)
// Grant Alignment: ssg-fox, wioa, dfc, st-davids
// ============================================================
// DROP THIS FILE INTO YOUR PROJECT as ecosystem-connector.js
// It does three things:
//   1. Heartbeat — tells ThriveUp you are alive (every 5 min)
//   2. Send Events — notify the ecosystem when things happen
//   3. Receive Events — get events from other platforms
//
// Data this platform SENDS:
//   - "veteran_referrals"
//   - "service_delivery_metrics"
//   - "workforce_outcomes"
//   - "advocacy_cases"
// Data this platform RECEIVES:
//   - "crisis_alerts"
//   - "screening_results"
//   - "case_management_data"
//   - "provider_referrals"
//   - "grant_milestones"
// ============================================================

const THRIVE_ECOSYSTEM_CONFIG = {
  hubUrl: "https://thrivingcommunitiesforall.com",
  platformId: "collaborative-advocate",
  apiKey: "tveco_77a2c5551d3bc36a026b17bb68e15393df206629a0bfcf0a7001ec4ebeb0af08",
  heartbeatIntervalMs: 5 * 60 * 1000,
};

async function sendHeartbeat(metrics = {}) {
  try {
    const response = await fetch(`${THRIVE_ECOSYSTEM_CONFIG.hubUrl}/api/ecosystem/heartbeat`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-ecosystem-key": THRIVE_ECOSYSTEM_CONFIG.apiKey },
      body: JSON.stringify({ platformId: THRIVE_ECOSYSTEM_CONFIG.platformId, metrics, timestamp: new Date().toISOString() }),
    });
    const data = await response.json();
    if (data.pendingEvents?.length > 0) {
      for (const event of data.pendingEvents) { await handleIncomingEvent(event); }
    }
    return data;
  } catch (error) {
    console.error("[ThriveUp Ecosystem] Heartbeat failed:", error.message);
  }
}

async function sendEcosystemEvent(eventType, eventData, targetPlatformId = null) {
  try {
    const response = await fetch(`${THRIVE_ECOSYSTEM_CONFIG.hubUrl}/api/ecosystem/event`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-ecosystem-key": THRIVE_ECOSYSTEM_CONFIG.apiKey },
      body: JSON.stringify({ eventType, eventData, targetPlatformId }),
    });
    return await response.json();
  } catch (error) {
    console.error("[ThriveUp Ecosystem] Event send failed:", error.message);
  }
}

async function handleIncomingEvent(event) {
  console.log(`[ThriveUp Ecosystem] Received: ${event.eventType} from ${event.sourcePlatformId}`);
  // Event types you will receive from the ecosystem:
  //   crisis_alert — immediate safety concern from any platform
  //   screening_completed — C-SSRS, PHQ-9, GAD-7 results
  //   case_management_data — case updates from partner platforms
  //   provider_referrals — referrals from health/service platforms
  //   grant_milestones — grant execution updates
  //   veteran_referred — veteran referral from another platform
  //   resource_referral — resource navigation from LifeBridge
}

async function getIntegrationDoc() {
  try {
    const response = await fetch(`${THRIVE_ECOSYSTEM_CONFIG.hubUrl}/api/ecosystem/integration-doc`, {
      headers: { "x-ecosystem-key": THRIVE_ECOSYSTEM_CONFIG.apiKey },
    });
    return await response.json();
  } catch (error) {
    console.error("[ThriveUp Ecosystem] Failed to fetch integration doc:", error.message);
  }
}

setInterval(() => sendHeartbeat(), THRIVE_ECOSYSTEM_CONFIG.heartbeatIntervalMs);
sendHeartbeat();
console.log("[ThriveUp Ecosystem] The Collaborative Advocate connector initialized — ID: collaborative-advocate");

if (typeof module !== "undefined") {
  module.exports = { sendHeartbeat, sendEcosystemEvent, getIntegrationDoc, THRIVE_ECOSYSTEM_CONFIG };
}
