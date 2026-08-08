import type { Express } from "express";
import { authStorage } from "./storage";
import { isAuthenticated } from "./replitAuth";
import { storage } from "../../storage";

// Register auth-specific routes
export function registerAuthRoutes(app: Express): void {
  // Get current authenticated user. The users row carries no role column, so
  // merge in the server-resolved role (same lookup every staff-gated endpoint
  // uses) — client gates (RequireAuth staffOnly, staff-only controls) need it
  // to render the same access the server will actually grant.
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await authStorage.getUser(userId);
      const roleRow = user ? await storage.getUser(userId).catch(() => undefined) : undefined;
      res.json(user ? { ...user, role: roleRow?.role ?? "student" } : user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
}
