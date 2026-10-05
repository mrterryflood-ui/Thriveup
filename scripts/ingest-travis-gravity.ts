import { ingestState } from "../server/community-gravity/engine";
// Primary-county ZIP scope, not exact filing-address county or service-area coverage.
try {
  const result = await ingestState("TX", undefined, "48453");
  console.log(JSON.stringify({ ...result, countyFips: "48453", scope: "Travis primary-county filing ZIPs; cross-county ZIP approximation" }));
  process.exit(0);
} catch (error) {
  console.error("Travis ingest failed:", error);
  process.exit(1);
}