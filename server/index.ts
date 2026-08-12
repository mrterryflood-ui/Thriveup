import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { communityRouter } from "./community-api-routes";
import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";
import { serveStatic } from "./static";
import { createServer } from "http";

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    limit: "4mb",
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", timestamp: Date.now() });
});

app.get("/", (req, res, next) => {
  if (req.headers["user-agent"]?.includes("HealthCheck") || req.headers["user-agent"]?.includes("Replit")) {
    return res.status(200).send("ok");
  }
  next();
});

app.use("/api/ecosystem/shadow", (req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Content-Type, x-shadow-key");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

app.use("/api/ecosystem/capability-portfolio", (req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  res.header("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

app.use("/api/ecosystem/capability-orchestration-map", (req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  res.header("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

app.use("/api/community", (req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Content-Type, X-Api-Key, Authorization");
  res.header("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    const shouldLog = path.startsWith("/api") || res.statusCode >= 400;
    if (shouldLog) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        const responseStr = JSON.stringify(capturedJsonResponse);
        logLine += ` :: ${responseStr.length > 200 ? responseStr.slice(0, 200) + "..." : responseStr}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const port = parseInt(process.env.PORT || "5000", 10);

  // Apply committed SQL migrations before anything touches the schema —
  // this is the single deploy path that upgrades existing databases.
  const { runMigrations } = await import("./run-migrations");
  await runMigrations();

  await setupAuth(app);
  registerAuthRoutes(app);

  // STEP 1 — API routers first, before any static middleware
  app.use("/api/community", communityRouter);

  // STEP 2 — remaining API routes
  await registerRoutes(httpServer, app);

  // AI engine smoke tests — runs every 15 min in production, emails Dr. Flood
  // when the Navigator is completely down (all engines failing). Also runs once
  // at startup (after a 15s delay) so we know immediately if anything is broken.
  if (process.env.NODE_ENV === "production") {
    const { startAISmokeTests } = await import("./ai-smoke-test");
    startAISmokeTests();
  }

  // Community-brief production probe — runs every 30 min in production against
  // the live site anonymously.  Emails Dr. Flood on the 2nd consecutive failure
  // (401/403 login-wall regression, 429-loop, 5xx, or hollow narrative) and
  // sends an all-clear when the endpoint recovers.  Closes the gap where the
  // original outage sat unnoticed because the dev-gate only ran before ship.
  if (process.env.NODE_ENV === "production") {
    const { startCommunityBriefProbe } = await import("./community-brief-probe");
    startCommunityBriefProbe();
  }

  // NOTE: Trade Sims lesson content sync happens on EVERY boot (dev and
  // production) via seedTradeSimsAll() inside seedComprehensive(), called
  // from registerRoutes above. It re-upserts all trades' lessons from
  // shared/data with no fast path, so deploying a content change updates the
  // production DB automatically — no manual re-seed. Guarded by
  // scripts/verify-trade-sims-content-sync.ts (drift-restore test).

  // Trade Sims daily digest — fires once every 24 hours. The function itself
  // is a no-op when there are no new signups.
  if (process.env.NODE_ENV === "production") {
    const { sendTradeSimsSignupsDigest } = await import("./trade-sims-trial-routes");
    setInterval(() => {
      sendTradeSimsSignupsDigest().catch((err) => {
        console.error("[trade-sims-digest] interval failed:", err?.message || err);
      });
    }, 24 * 60 * 60 * 1000);
  }

  // Gun violence registry sync — runs every 24 hours in any environment.
  // Pulls current GVA incidents from gun-violence-registry.replit.app and
  // upserts them locally.  Idempotent; errors are logged but never crash the server.
  {
    const GV_SYNC_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 h
    // Delay first auto-run by 3 minutes so startup load settles.
    setTimeout(async () => {
      try {
        const { runGunViolenceRegistrySync } = await import("./gun-violence-routes");
        const result = await runGunViolenceRegistrySync();
        console.info(`[gun-violence] scheduled sync complete — fetched=${result.fetched} upserted=${result.upserted} elapsed=${result.elapsedMs}ms`);
      } catch (err: any) {
        console.warn("[gun-violence] scheduled sync failed:", err?.message ?? err);
      }
      setInterval(async () => {
        try {
          const { runGunViolenceRegistrySync } = await import("./gun-violence-routes");
          const result = await runGunViolenceRegistrySync();
          console.info(`[gun-violence] scheduled sync complete — fetched=${result.fetched} upserted=${result.upserted} elapsed=${result.elapsedMs}ms`);
        } catch (err: any) {
          console.warn("[gun-violence] scheduled sync failed:", err?.message ?? err);
        }
      }, GV_SYNC_INTERVAL_MS);
    }, 3 * 60 * 1000);
  }

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error("Internal Server Error:", err);

    if (res.headersSent) {
      return next(err);
    }

    return res.status(status).json({ message });
  });

  // Global API 404 firebreak — explicit wildcard so Express 5 path-to-regexp
  // matches only unhandled /api/... sub-paths, never bleeds into the SPA.
  // Sits between registerRoutes (top) and serveStatic (bottom) — that ordering
  // is what makes it work. HTML can never be the response to an API path.
  app.use("/api/*path", (_req: Request, res: Response) => {
    res.status(404).json({ error: "API endpoint not found." });
  });

  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
})();
