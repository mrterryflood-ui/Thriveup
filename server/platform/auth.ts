import type { Express, RequestHandler } from "express";

const unavailable = (_req: unknown, res: any) => {
  res.status(503).json({ message: "Sign-in is not configured for this deployment." });
};

/**
 * Authentication is deliberately disabled until the PostgreSQL-backed provider
 * migration is deployed. No legacy identity provider is contacted at runtime.
 */
export async function setupAuth(app: Express): Promise<void> {
  app.get("/api/login", unavailable);
  app.get("/api/callback", unavailable);
  app.get("/api/logout", (_req, res) => res.redirect("/"));
}

export const isAuthenticated: RequestHandler = (_req, res) => {
  res.status(503).json({ message: "Sign-in is not configured for this deployment." });
};

export function registerAuthRoutes(app: Express): void {
  app.get("/api/auth/user", unavailable);
}
