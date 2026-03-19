// ============================================================
// ThriveUp Ecosystem Connector — Black Men's Health Hub
// Generated: 2026-03-19T03:23:57.712Z
// Platform ID: sankofa-mens-health
// Role: mens-health
// Parent Network: Sankofa Health Network
// Grant Alignment: samhsa, st-davids, ssg-fox
// ============================================================
// DROP THIS FILE INTO YOUR PROJECT as ecosystem-connector.js
// It does three things:
//   1. Heartbeat — tells ThriveUp you are alive (every 5 min)
//   2. Send Events — notify the ecosystem when things happen
//   3. Receive Events — get events from other platforms
//
// Data this platform SENDS:
//   - "health_screening_data"
//   - "resource_recommendations"
//   - "wellness_metrics"
// Data this platform RECEIVES:
//   - "crisis_alerts"
//   - "community_health_data"
//   - "veteran_health_referrals"
// ============================================================

const THRIVE_ECOSYSTEM_CONFIG = {
  hubUrl: "https://thrivingcommunitiesforall.com",
  platformId: "sankofa-mens-health",
  apiKey: "tveco_e40557e29a300a27f30e5c6c410a63036a9285e8ed72d08bd02301d7e42d6436",
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
console.log("[ThriveUp Ecosystem] Black Men's Health Hub connector initialized — ID: sankofa-mens-health");

if (typeof module !== "undefined") {
  module.exports = { sendHeartbeat, sendEcosystemEvent, getIntegrationDoc, THRIVE_ECOSYSTEM_CONFIG };
}
