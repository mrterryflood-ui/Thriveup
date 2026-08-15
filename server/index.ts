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
  // After each sync (success or failure) a 48h staleness check fires and emails
  // staff if no successful audit row exists within the last 48 hours.
  {
    const GV_SYNC_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 h
    const GV_STALE_THRESHOLD_MS = 48 * 60 * 60 * 1000; // 48 h

    async function checkGunViolenceStaleness(): Promise<void> {
      try {
        const { db: gvDb } = await import("./storage");
        const { gunViolenceImports: gvImports } = await import("@shared/schema");
        const { desc, gte } = await import("drizzle-orm");
        const cutoff = new Date(Date.now() - GV_STALE_THRESHOLD_MS);
        const recent = await gvDb
          .select({ importedAt: gvImports.importedAt })
          .from(gvImports)
          .where(gte(gvImports.importedAt, cutoff))
          .orderBy(desc(gvImports.importedAt))
          .limit(1);
        if (recent.length === 0) {
          console.warn("[gv-sync] STALE: no successful import in the last 48 hours — sending staff alert");
          const { sendEcosystemUpdate } = await import("./email-service");
          const subject = "[ALERT] Gun Violence Registry sync hasn't succeeded in over 48 hours";
          const html = `
            <div style="max-width:600px;font-family:Arial,sans-serif">
              <div style="background:#c53030;color:white;padding:16px;border-radius:6px 6px 0 0">
                <h2 style="margin:0;font-size:18px">Gun Violence Registry — Sync Stale</h2>
                <p style="margin:6px 0 0;font-size:13px;opacity:.9">No successful sync in the last 48 hours</p>
              </div>
              <div style="padding:16px;border:1px solid #ddd;border-top:none;background:white">
                <p style="color:#c53030;font-weight:bold">
                  ⚠ The gun violence registry sync has not written a successful audit row to
                  <code>gun_violence_imports</code> in the last 48 hours. Local incident data
                  may be stale and gun-violence summary/intelligence endpoints will serve
                  out-of-date counts.
                </p>
                <table style="width:100%;border-collapse:collapse;font-size:14px;margin:12px 0">
                  <tr>
                    <td style="padding:6px 10px;color:#666;white-space:nowrap">Staleness threshold:</td>
                    <td style="padding:6px 10px">48 hours</td>
                  </tr>
                  <tr style="background:#f5f5f5">
                    <td style="padding:6px 10px;color:#666">Detected at:</td>
                    <td style="padding:6px 10px">${new Date().toISOString()}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 10px;color:#666">Audit table:</td>
                    <td style="padding:6px 10px;font-family:monospace">gun_violence_imports</td>
                  </tr>
                  <tr style="background:#f5f5f5">
                    <td style="padding:6px 10px;color:#666">Registry source:</td>
                    <td style="padding:6px 10px">gun-violence-registry.replit.app</td>
                  </tr>
                </table>
                <div style="background:#fff3cd;border-left:4px solid #ffc107;padding:12px;border-radius:4px;margin-top:12px">
                  <strong>Recommended actions:</strong>
                  <ol style="margin:8px 0 0;padding-left:18px;font-size:13px">
                    <li>Check server logs for <code>[gv-sync]</code> errors around the last expected sync</li>
                    <li>Verify <code>gun-violence-registry.replit.app</code> is reachable from this server</li>
                    <li>Trigger a manual sync via <code>POST /api/gun-violence/sync</code> (staff-gated)</li>
                    <li>Check <code>GET /api/gun-violence/imports</code> for the last successful audit row</li>
                  </ol>
                </div>
                <p style="font-size:12px;color:#888;margin-top:16px">
                  Generated by the server-side gun violence staleness check (server/index.ts).
                  This alert fires once per 48-hour staleness window detected at sync time.
                </p>
              </div>
            </div>
          `;
          await sendEcosystemUpdate(subject, html).catch((emailErr: any) =>
            console.error("[gv-sync] staleness alert email failed (non-fatal):", emailErr?.message ?? emailErr)
          );
        } else {
          console.info(`[gv-sync] staleness check OK — last import at ${recent[0].importedAt?.toISOString()}`);
        }
      } catch (err: any) {
        console.warn("[gv-sync] staleness check error (non-fatal):", err?.message ?? err);
      }
    }

    // Delay first auto-run by 3 minutes so startup load settles.
    setTimeout(async () => {
      try {
        const { runGunViolenceRegistrySync } = await import("./gun-violence-routes");
        const result = await runGunViolenceRegistrySync();
        console.info(`[gv-sync] scheduled sync complete — fetched=${result.fetched} upserted=${result.upserted} elapsed=${result.elapsedMs}ms`);
      } catch (err: any) {
        console.warn("[gv-sync] scheduled sync failed:", err?.message ?? err);
      }
      // Staleness check runs after every sync attempt (success or failure)
      await checkGunViolenceStaleness();

      setInterval(async () => {
        try {
          const { runGunViolenceRegistrySync } = await import("./gun-violence-routes");
          const result = await runGunViolenceRegistrySync();
          console.info(`[gv-sync] scheduled sync complete — fetched=${result.fetched} upserted=${result.upserted} elapsed=${result.elapsedMs}ms`);
        } catch (err: any) {
          console.warn("[gv-sync] scheduled sync failed:", err?.message ?? err);
        }
        await checkGunViolenceStaleness();
      }, GV_SYNC_INTERVAL_MS);
    }, 3 * 60 * 1000);
  }

  // Nationwide Equity-Loss snapshot monthly refresh scheduler.
  // Runs in any environment (dev + prod) — checks the last completed run's age
  // before doing anything, so hot-reloads within the same day are no-ops.
  // Boot delay: 90 seconds. Re-check interval: 30 days.
  {
    const { scheduleEquityLossNationwideRefresh } = await import("./equity-loss-national-scheduler");
    scheduleEquityLossNationwideRefresh();
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
