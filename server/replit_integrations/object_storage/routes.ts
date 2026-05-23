import type { Express, Request, Response, NextFunction } from "express";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";

// Per-user + per-IP rate limit on signed-upload-URL minting.
// In-memory, resets on process restart — acceptable floor against abuse / cost runaway.
const uploadBuckets = new Map<string, { count: number; resetAt: number }>();
const UPLOAD_RATE_MAX = 60;                  // 60 signed URLs
const UPLOAD_RATE_WINDOW_MS = 60 * 60 * 1000; // per hour, per key

function consumeUpload(key: string): { allowed: boolean; retryAfter: number } {
  const now = Date.now();
  const b = uploadBuckets.get(key);
  if (!b || b.resetAt < now) {
    uploadBuckets.set(key, { count: 1, resetAt: now + UPLOAD_RATE_WINDOW_MS });
    return { allowed: true, retryAfter: 0 };
  }
  if (b.count >= UPLOAD_RATE_MAX) {
    return { allowed: false, retryAfter: Math.ceil((b.resetAt - now) / 1000) };
  }
  b.count += 1;
  return { allowed: true, retryAfter: 0 };
}

function requireAuthForUpload(req: Request, res: Response, next: NextFunction) {
  const u = (req as any).user;
  const uid = u?.claims?.sub || u?.id;
  if (!uid) return res.status(401).json({ error: "Sign in to upload files." });
  const ip = req.ip || req.socket?.remoteAddress || "unknown";
  for (const key of [`uid:${uid}`, `ip:${ip}`]) {
    const r = consumeUpload(key);
    if (!r.allowed) {
      res.setHeader("Retry-After", String(r.retryAfter));
      return res.status(429).json({ error: `Upload-URL rate limit reached. Try again in ${r.retryAfter}s.` });
    }
  }
  return next();
}

/**
 * Register object storage routes for file uploads.
 *
 * This provides example routes for the presigned URL upload flow:
 * 1. POST /api/uploads/request-url - Get a presigned URL for uploading
 * 2. The client then uploads directly to the presigned URL
 *
 * IMPORTANT: These are example routes. Customize based on your use case:
 * - Add authentication middleware for protected uploads
 * - Add file metadata storage (save to database after upload)
 * - Add ACL policies for access control
 */
export function registerObjectStorageRoutes(app: Express): void {
  const objectStorageService = new ObjectStorageService();

  /**
   * Request a presigned URL for file upload.
   *
   * Request body (JSON):
   * {
   *   "name": "filename.jpg",
   *   "size": 12345,
   *   "contentType": "image/jpeg"
   * }
   *
   * Response:
   * {
   *   "uploadURL": "https://storage.googleapis.com/...",
   *   "objectPath": "/objects/uploads/uuid"
   * }
   *
   * IMPORTANT: The client should NOT send the file to this endpoint.
   * Send JSON metadata only, then upload the file directly to uploadURL.
   */
  app.post("/api/uploads/request-url", requireAuthForUpload, async (req, res) => {
    try {
      const { name, size, contentType } = req.body;

      if (!name) {
        return res.status(400).json({
          error: "Missing required field: name",
        });
      }

      const uploadURL = await objectStorageService.getObjectEntityUploadURL();

      // Extract object path from the presigned URL for later reference
      const objectPath = objectStorageService.normalizeObjectEntityPath(uploadURL);

      res.json({
        uploadURL,
        objectPath,
        // Echo back the metadata for client convenience
        metadata: { name, size, contentType },
      });
    } catch (error) {
      console.error("Error generating upload URL:", error);
      res.status(500).json({ error: "Failed to generate upload URL" });
    }
  });

  /**
   * Serve uploaded objects.
   *
   * GET /objects/:objectPath(*)
   *
   * This serves files from object storage. For public files, no auth needed.
   * For protected files, add authentication middleware and ACL checks.
   */
  app.get("/objects/*path", async (req, res) => {
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      await objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error serving object:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.status(404).json({ error: "Object not found" });
      }
      return res.status(500).json({ error: "Failed to serve object" });
    }
  });
}

