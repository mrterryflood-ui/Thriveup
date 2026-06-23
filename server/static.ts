import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { isKnownPublicPath } from "./public-routes";

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
  app.use("/{*path}", (req, res) => {
    const indexHtml = path.resolve(distPath, "index.html");
    const status = isKnownPublicPath(req.path) ? 200 : 404;
    res.status(status).sendFile(indexHtml);
  });
}
