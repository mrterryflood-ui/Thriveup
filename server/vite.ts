import express, { type Express } from "express";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import fs from "fs";
import path from "path";
import { nanoid } from "nanoid";
import { isKnownPublicPath } from "./public-routes";
import { injectRouteMeta } from "./route-meta";

const viteLogger = createLogger();

export async function setupVite(server: Server, app: Express) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server, path: "/vite-hmr" },
    allowedHosts: [
      "localhost",
      "127.0.0.1",
      ...(process.env.REPLIT_DEV_DOMAIN ? [process.env.REPLIT_DEV_DOMAIN] : []),
      ".replit.dev",
      ".replit.app",
    ],
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);

  // Serve repository-level public deliverables in development too. Vite's
  // root is client/, while platform briefs and other standalone assets live
  // in the repository-level public/ directory.
  const repositoryPublicPath = path.resolve(process.cwd(), "public");
  if (fs.existsSync(repositoryPublicPath)) {
    app.use(express.static(repositoryPublicPath));
  }

  app.use("/{*path}", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html",
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      let page = await vite.transformIndexHtml(url, template);
      const pathname = req.originalUrl.split("?")[0];
      page = injectRouteMeta(page, pathname);
      // Return 404 for structurally unknown paths so crawlers don't treat
      // them as valid pages; the SPA shell still renders the not-found UI.
      const status = isKnownPublicPath(req.path) ? 200 : 404;
      res.status(status).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}
