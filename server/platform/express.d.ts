import type { User } from "express";

declare global {
  namespace Express {
    interface Request {
      user?: User & { id?: string; claims?: { sub?: string }; expires_at?: number };
      isAuthenticated?: () => boolean;
    }
  }
}
export {};
