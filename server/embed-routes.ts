/**
 * TCAF Embed Routes — no auth required.
 *
 * GET /embed/tcaf-widget.js  — serves the embeddable widget JS with cache headers
 * GET /embed/demo            — HTML demo page showing 3 sample embed implementations
 */

import { Router } from "express";
import { readFileSync } from "fs";
import { join } from "path";

export const embedRouter = Router();

// ── Widget file path ─────────────────────────────────────────────────────────
const WIDGET_PATH = join(process.cwd(), "client", "public", "embed", "tcaf-widget.js");

let widgetCache: string | null = null;

function getWidgetContent(): string {
  if (widgetCache !== null) return widgetCache;
  try {
    widgetCache = readFileSync(WIDGET_PATH, "utf-8");
    return widgetCache;
  } catch (err) {
    throw new Error(`[embed-routes] Cannot read widget file at ${WIDGET_PATH}: ${(err as Error).message}`);
  }
}

// ── GET /embed/tcaf-widget.js ────────────────────────────────────────────────
embedRouter.get("/tcaf-widget.js", (_req, res) => {
  try {
    const content = getWidgetContent();
    res.set("Content-Type", "application/javascript; charset=utf-8");
    res.set("Cache-Control", "public, max-age=86400, stale-while-revalidate=3600");
    res.set("X-Content-Type-Options", "nosniff");
    res.set("Access-Control-Allow-Origin", "*");
    res.send(content);
  } catch (err) {
    console.error("[embed-routes] Failed to serve widget:", err);
    res.status(500).send("// Widget unavailable — try again shortly.");
  }
});

// ── GET /embed/demo ──────────────────────────────────────────────────────────
embedRouter.get("/demo", (_req, res) => {
  const demoHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>TCAF Community Brief Widget — Embed Demo</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f9fafb;
      color: #111827;
      padding: 40px 20px;
    }
    h1 { font-size: 24px; font-weight: 800; margin-bottom: 8px; }
    .subtitle { color: #6b7280; font-size: 15px; margin-bottom: 40px; }
    .demo-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 32px;
      max-width: 1100px;
      margin: 0 auto;
    }
    .demo-section { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; }
    .demo-section h2 { font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; margin-bottom: 6px; }
    .demo-section p { font-size: 13px; color: #4b5563; margin-bottom: 16px; }
    .code-block {
      background: #1f2937;
      color: #e5e7eb;
      border-radius: 8px;
      padding: 14px;
      font-family: 'Fira Code', Consolas, monospace;
      font-size: 11.5px;
      line-height: 1.6;
      overflow-x: auto;
      white-space: pre;
      margin-top: 16px;
    }
    .live-widget { margin-bottom: 16px; }
    footer {
      text-align: center;
      margin-top: 48px;
      font-size: 12px;
      color: #9ca3af;
    }
    footer a { color: #6b7280; }
  </style>
</head>
<body>
  <h1>TCAF Widget — Embed Demos</h1>
  <p class="subtitle">Three sample embed implementations for partner organizations. Copy the snippet and drop it on your site.</p>

  <div class="demo-grid">

    <!-- Demo 1: Austin Travis County -->
    <div class="demo-section">
      <h2>Demo 1 — Austin Travis County</h2>
      <p>County government site with branded color and pre-filled ZIP for Travis County.</p>
      <div class="live-widget">
        <div data-tcaf-widget="community-brief"
             data-org-name="Austin Travis County"
             data-org-color="#1d4ed8"
             data-placeholder-zip="78701"></div>
      </div>
      <div class="code-block">&lt;div data-tcaf-widget="community-brief"
     data-org-name="Austin Travis County"
     data-org-color="#1d4ed8"
     data-placeholder-zip="78701"&gt;&lt;/div&gt;

&lt;script src="https://thrivingcommunitiesforall.com/embed/tcaf-widget.js" async&gt;&lt;/script&gt;</div>
    </div>

    <!-- Demo 2: Housing Nonprofit -->
    <div class="demo-section">
      <h2>Demo 2 — Housing Nonprofit</h2>
      <p>Nonprofit housing org embedding the analyzer with their brand color and logo.</p>
      <div class="live-widget">
        <div data-tcaf-widget="community-brief"
             data-org-name="Community Housing Works"
             data-org-color="#059669"
             data-placeholder-zip="78741"></div>
      </div>
      <div class="code-block">&lt;div data-tcaf-widget="community-brief"
     data-org-name="Community Housing Works"
     data-org-color="#059669"
     data-org-logo-url="https://yourdomain.com/logo.png"
     data-placeholder-zip="78741"&gt;&lt;/div&gt;

&lt;script src="https://thrivingcommunitiesforall.com/embed/tcaf-widget.js" async&gt;&lt;/script&gt;</div>
    </div>

    <!-- Demo 3: School District -->
    <div class="demo-section">
      <h2>Demo 3 — School District</h2>
      <p>School district site using default TCAF colors with no customization required.</p>
      <div class="live-widget">
        <div data-tcaf-widget="community-brief"
             data-org-name="Manor ISD"
             data-placeholder-zip="78653"></div>
      </div>
      <div class="code-block">&lt;div data-tcaf-widget="community-brief"
     data-org-name="Manor ISD"
     data-placeholder-zip="78653"&gt;&lt;/div&gt;

&lt;script src="https://thrivingcommunitiesforall.com/embed/tcaf-widget.js" async&gt;&lt;/script&gt;</div>
    </div>

  </div>

  <footer>
    <p>Powered by <a href="https://thrivingcommunitiesforall.com" target="_blank" rel="noopener">TCAF — Thriving Communities for All</a></p>
  </footer>

  <script src="/embed/tcaf-widget.js"></script>
</body>
</html>`;

  res.set("Content-Type", "text/html; charset=utf-8");
  res.set("Cache-Control", "public, max-age=3600");
  res.send(demoHtml);
});
