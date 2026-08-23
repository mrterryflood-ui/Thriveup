/**
 * Verifies the ThriveUp-side GPP embed bridge without sending credentials or
 * requiring the external partner to be reachable.
 */
const BASE = process.env.BASE_URL || "http://localhost:5000";

const response = await fetch(
  `${BASE}/api/consortium/gpp-embed?entityId=verification-entity&mode=iframe`,
);
if (response.status !== 401) {
  console.error(`  ✗ anonymous embed request returned HTTP ${response.status}, expected 401`);
  process.exit(1);
}
console.log("  ✓ embed bridge is protected by a ThriveUp session");
console.log("GPP embed bridge guard passed.");