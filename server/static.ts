import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { isKnownPublicPath } from "./public-routes";
import { injectRouteMeta } from "./route-meta";

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));

  // SPA fallback: serve index.html for known public routes (HTTP 200) and
  // for unknown paths render the same shell but with HTTP 404 so search
  // engines classify them correctly rather than as soft 404s.
  // Read and inject per-route metadata before sending so crawlers receive
  // route-specific titles, descriptions, og:* tags, and canonical URLs in
  // the initial HTML without requiring JavaScript execution.
  app.use("/{*path}", (req, res) => {
    const indexHtml = path.resolve(distPath, "index.html");
    const status = isKnownPublicPath(req.path) ? 200 : 404;
    try {
      const raw = fs.readFileSync(indexHtml, "utf-8");
      const pathname = req.originalUrl.split("?")[0];
      const page = injectRouteMeta(raw, pathname);
      res.status(status).set({ "Content-Type": "text/html" }).end(page);
    } catch (error) {
      console.error("[Static] SPA fallback metadata injection failed:", error);
      res.status(status).sendFile(indexHtml);
    }
  });
}
