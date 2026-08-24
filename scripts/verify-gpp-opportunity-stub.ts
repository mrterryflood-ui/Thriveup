/**
 * Safe contract test for the GrantPath Pro receiver shape.
 *
 * This intentionally uses a local HTTP stub and never reads or calls the live
 * partner URL. It verifies Bearer auth, idempotency-key reuse, and that the
 * same handoff is accepted only once.
 */
import { createServer } from "node:http";
import { randomUUID } from "node:crypto";

const token = "local-stub-token";
const handoffId = `gpp_handoff_${randomUUID()}`;
const received = new Set<string>();
const server = createServer((req, res) => {
  if (req.method !== "POST" || req.url !== "/thriveup/mirror") {
    res.writeHead(404).end();
    return;
  }
  const chunks: Buffer[] = [];
  req.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
  req.on("end", () => {
    let body: Record<string, unknown> | null = null;
    try {
      body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    } catch {
      res.writeHead(400).end();
      return;
    }
    const key = req.headers.authorization?.replace(/^Bearer\s+/i, "");
    const idempotencyKey = req.headers["idempotency-key"];
    if (key !== token || idempotencyKey !== handoffId || body?.handoff !== undefined && typeof body.handoff !== "object") {
      res.writeHead(401).end();
      return;
    }
    const duplicate = received.has(handoffId);
    received.add(handoffId);
    res.writeHead(200, { "content-type": "application/json" }).end(JSON.stringify({
      pursuitId: "local-stub-pursuit",
      duplicate,
    }));
  });
});

await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
try {
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Stub did not expose a port");
  const body = {
    contractVersion: "v1",
    organization: { id: "local-org", sourceStatus: "not independently verified" },
    opportunityLanes: ["grants", "partnership"],
    privacy: { organizationPrivateByDefault: true },
    handoff: { handoffId, authorization: "explicit_organization_confirmation" },
  };
  const send = () => fetch(`http://127.0.0.1:${address.port}/thriveup/mirror`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Idempotency-Key": handoffId, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const first = await send();
  const second = await send();
  const firstBody = await first.json() as { duplicate?: boolean; pursuitId?: string };
  const secondBody = await second.json() as { duplicate?: boolean; pursuitId?: string };
  if (first.status !== 200 || firstBody.duplicate || second.status !== 200 || !secondBody.duplicate || firstBody.pursuitId !== secondBody.pursuitId) {
    throw new Error("Stub receiver failed Bearer/idempotency contract");
  }
  console.log("GrantPath Pro local stub receiver contract passed.");
} finally {
  await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
}