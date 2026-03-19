// ============================================================
// ThriveUp Ecosystem Connector — EasyAI Learning
// Generated: 2026-03-19T02:19:06.132Z
// Platform ID: easyai-learning
// Role: prevention
// Grant Alignment: ssg-fox, wioa, nba-foundation, st-davids, dfc
// ============================================================
// DROP THIS FILE INTO YOUR PROJECT as ecosystem-connector.js
// It does three things:
//   1. Heartbeat — tells ThriveUp you are alive (every 5 min)
//   2. Send Events — notify the ecosystem when things happen
//   3. Receive Events — get events from other platforms
//
// Data this platform SENDS:
//   - "enrollment_status"
//   - "progress_milestones"
//   - "mentor_connections"
//   - "career_pathway_updates"
// Data this platform RECEIVES:
//   - "veteran_family_referrals"
//   - "transition_youth_referrals"
//   - "crisis_alerts"
//   - "screening_flags"
// ============================================================

const THRIVE_ECOSYSTEM_CONFIG = {
  hubUrl: "https://thrivingcommunitiesforall.com",
  platformId: "easyai-learning",
  apiKey: "tveco_2654bdb0519dbe3884179c394b48813a468b65a885ca6886f180a6bb51c7f4a1",
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
  // TODO: Add your platform-specific event handling here
  // Common event types across the ecosystem:
  //   screening_completed, crisis_alert, veteran_referred, transition_milestone,
  //   life_event_risk, research_update, youth_enrolled, resource_referral,
  //   safety_plan_created, medication_alert, cognitive_assessment, incident_report
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
console.log("[ThriveUp Ecosystem] EasyAI Learning connector initialized — ID: easyai-learning");

if (typeof module !== "undefined") {
  module.exports = { sendHeartbeat, sendEcosystemEvent, getIntegrationDoc, THRIVE_ECOSYSTEM_CONFIG };
}
