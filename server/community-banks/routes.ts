import type { Express, Request, Response } from "express";
import { resolvePlace, buildBankProfile } from "./profile";

// Public, anonymous, read-only. Rate-limited per req.ip (public endpoint doctrine).
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 30;
const hits = new Map<string, { count: number; resetAt: number }>();

function limited(ip: string): boolean {
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || entry.resetAt < now) { hits.set(ip, { count: 1, resetAt: now + WINDOW_MS }); return false; }
  entry.count += 1;
  return entry.count > MAX_PER_WINDOW;
}

export function registerCommunityBankRoutes(app: Express) {
  app.get("/api/community-banks/profile", async (req: Request, res: Response) => {
    try {
      if (limited(req.ip ?? "unknown")) return res.status(429).json({ error: "Too many requests. Try again in a minute." });
      const place = typeof req.query.place === "string" ? req.query.place : undefined;
      const resolved = await resolvePlace(place);
      if (!resolved.ok) return res.status(404).json({ error: resolved.reason });
      const profile = await buildBankProfile(resolved.geography);
      res.set("Cache-Control", "public, max-age=300");
      res.json(profile);
    } catch (error) {
      console.error("[community-banks] profile failed:", error);
      res.status(500).json({ error: "Community profile could not be assembled." });
    }
  });
}
