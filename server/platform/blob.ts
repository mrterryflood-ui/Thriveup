import { get } from "@vercel/blob";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { Readable } from "node:stream";
import type { Express, Request, Response, NextFunction } from "express";

const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;
const uploadBuckets = new Map<string, { count: number; resetAt: number }>();

function consumeUpload(key: string): boolean {
  const now = Date.now();
  const bucket = uploadBuckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    uploadBuckets.set(key, { count: 1, resetAt: now + 60 * 60 * 1000 });
    return true;
  }
  if (bucket.count >= 60) return false;
  bucket.count += 1;
  return true;
}

function requireUploadAuthorization(req: Request, res: Response, next: NextFunction) {
  const user = req.user as { id?: string; claims?: { sub?: string } } | undefined;
  const userId = user?.claims?.sub ?? user?.id;
  if (!userId) return res.status(503).json({ error: "File uploads will be available after sign-in is configured." });
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  if (!consumeUpload(`user:${userId}`) || !consumeUpload(`ip:${ip}`)) {
    return res.status(429).json({ error: "Upload rate limit reached." });
  }
  next();
}

function safePathname(pathname: string): string {
  const normalized = pathname.replace(/^\/+/, "");
  if (!normalized || normalized.includes("..") || normalized.length > 512) {
    throw new Error("Invalid upload pathname");
  }
  return normalized;
}

export function registerObjectStorageRoutes(app: Express): void {
  // Retain the former endpoint shape long enough for the client to receive an
  // explicit migration response instead of silently attempting an unsupported upload.
  app.post("/api/uploads/request-url", (_req, res) => {
    res.status(503).json({ error: "Uploads require configured sign-in." });
  });

  app.post("/api/uploads", requireUploadAuthorization, async (req, res) => {
    try {
      const response = await handleUpload({
        request: req,
        body: req.body as HandleUploadBody,
        onBeforeGenerateToken: async (pathname) => ({
          allowedContentTypes: ["application/pdf", "image/jpeg", "image/png", "image/heic", "image/webp"],
          maximumSizeInBytes: MAX_UPLOAD_BYTES,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ pathname: safePathname(pathname) }),
        }),
      });
      res.status(200).json(response);
    } catch (error) {
      console.error("[Blob] client upload token error", error);
      res.status(400).json({ error: "Unable to authorize upload." });
    }
  });

  app.get("/objects/*path", requireUploadAuthorization, async (req, res) => {
    try {
      const rawPath = req.params.path;
      const pathname = safePathname(Array.isArray(rawPath) ? rawPath.join("/") : rawPath ?? "");
      const result = await get(pathname, { access: "private" });
      if (!result) return res.status(404).json({ error: "Object not found" });
      const { blob, stream } = result;
      res.set({
        "Content-Type": blob.contentType || "application/octet-stream",
        "Content-Length": String(blob.size),
        "Cache-Control": "private, max-age=3600",
      });
      Readable.fromWeb(stream as import("node:stream/web").ReadableStream).pipe(res);
    } catch (error) {
      console.error("[Blob] object retrieval error", error);
      res.status(404).json({ error: "Object not found" });
    }
  });
}
