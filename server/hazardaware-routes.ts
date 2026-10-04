// HazardAware partner connector, ThriveUp side of the bridge.
//
// Two owned platforms, each sovereign: ThriveUp consumes hazard context for
// the communities it serves through HazardAware's authenticated partner
// exchange, and nothing here grants ThriveUp the right to trigger compute or
// represent HazardAware's numbers as its own. Honest states, honored here:
//   - Unconfigured (HAZARDAWARE_PARTNER_URL / HAZARDAWARE_PARTNER_KEY unset):
//     routes say so plainly; no bridge is pretended.
//   - A partner outage or refusal is surfaced as what it is — never as calm
//     weather or an empty hazard list.
import type { Express, Request, Response } from "express";

function partnerConfig(): { url: string; key: string } | null {
  let url = process.env.HAZARDAWARE_PARTNER_URL || "";
  // Keys contain no whitespace of any kind: a paste that splits the key
  // with a space or newline must not fail an otherwise valid key.
  const key = (process.env.HAZARDAWARE_PARTNER_KEY || "").replace(/\s+/g, "");
  if (!url || !key) return null;
  // Accept either the bare site origin or the full partner path — a half-
  // remembered URL must not silently become a 404 that reads as "no hazard
  // context". Only https is honored.
  url = url.replace(/\/+$/, "");
  if (!/^https:\/\//.test(url)) return null;
  if (!url.endsWith("/api/partner/thriveup")) {
    url = url.replace(/\/api\/partner.*$/, "") + "/api/partner/thriveup";
  }
  return { url, key };
}

async function partnerCall(
  path: string,
  body: unknown,
): Promise<{ status: number; data: any } | { unreachable: true; reason: string }> {
  const config = partnerConfig();
  if (!config) return { unreachable: true, reason: "unconfigured" };
  try {
    const response = await fetch(`${config.url}${path}`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-partner-key": config.key },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(70_000),
    });
    const data = await response.json().catch(() => ({}));
    return { status: response.status, data };
  } catch (error: any) {
    return { unreachable: true, reason: String(error?.message || error) };
  }
}

// Shared by the /api/hazardaware routes and the community story: one place
// where the partner call, its honest failure states, and layer selection
// live. Returns the packet, or { message } describing the honest failure.
export async function hazardContext(
  body: { q?: string; lat?: number; lon?: number; name?: string; select?: string[] },
): Promise<Record<string, unknown>> {
  const config = partnerConfig();
  if (!config) {
    return { message: "The HazardAware bridge is not configured on this deployment. No hazard context is available, and none is fabricated." };
  }
  const outcome = await partnerCall("/place", {
    ...(body.q ? { q: body.q } : {}),
    ...(typeof body.lat === "number" ? { lat: body.lat } : {}),
    ...(typeof body.lon === "number" ? { lon: body.lon } : {}),
    ...(body.name ? { name: body.name } : {}),
    select: Array.isArray(body.select) && body.select.length ? body.select : ["place.summary", "place.feeds"],
  });
  if ("unreachable" in outcome) {
    return { message: `HazardAware did not answer (${outcome.reason}). No hazard context is shown; this is not calm weather.` };
  }
  return ((outcome as any).data || {}) as Record<string, unknown>;
}

export function registerHazardawareRoutes(app: Express) {
  app.get("/api/hazardaware/status", (_req: Request, res: Response) => {
    const config = partnerConfig();
    res.json({
      bridge: "hazardaware",
      configured: !!config,
      // Honest state: a bridge with one built end is a contract, not an
      // integration. ThriveUp says so rather than showing an empty hazard box.
      note: config
        ? "Partner exchange configured. Hazard context flows in; failed feeds are named, never shown as calm."
        : "The HazardAware bridge is not configured on this deployment (HAZARDAWARE_PARTNER_URL and HAZARDAWARE_PARTNER_KEY). No hazard context is available, and none is fabricated.",
      partnerBaseUrl: config ? new URL(config.url).origin : null,
    });
  });

  app.post("/api/hazardaware/context", async (req: Request, res: Response) => {
    const { q, lat, lon, name, select } = req.body || {};
    if (!q && (typeof lat !== "number" || typeof lon !== "number")) {
      return res.status(400).json({ message: "A place needs q, or both lat and lon." });
    }
    const data = await hazardContext({ q, lat, lon, name, select });
    if ("message" in data && !("place" in data) && !("feeds" in data)) {
      const message = String((data as any).message);
      return res.status(/not configured/.test(message) ? 503 : 502).json({ message });
    }
    return res.json(data);
  });

  // The resident answer lane through the partner door: plain-words answers
  // composed by HazardAware from its live feeds, with its limits attached.
  app.post("/api/hazardaware/ask", async (req: Request, res: Response) => {
    const config = partnerConfig();
    if (!config) {
      return res.status(503).json({ message: "The HazardAware bridge is not configured on this deployment. No answers are available, and none are invented." });
    }
    const { q, lat, lon, placeName } = req.body || {};
    if (typeof q !== "string" || !q.trim()) {
      return res.status(400).json({ message: "A question (q) is required." });
    }
    const outcome = await partnerCall("/ask", {
      q: q.trim().slice(0, 500),
      ...(typeof lat === "number" ? { lat } : {}),
      ...(typeof lon === "number" ? { lon } : {}),
      ...(placeName ? { placeName } : {}),
    });
    if ("unreachable" in outcome) {
      return res.status(502).json({ message: `The HazardAware answer lane did not answer (${outcome.reason}). Nothing was improvised.` });
    }
    return res.status(outcome.status).json(outcome.data);
  });
}
