/**
 * TCAF Embed Routes — no auth required.
 *
 * GET /embed/tcaf-widget.js       — embeddable widget JS (cached 24h)
 * GET /embed/community-portal     — full portal HTML for iframe embedding
 * GET /embed/demo                 — demo page with live widget + install snippets
 */

import { Router } from "express";
import { readFileSync } from "fs";
import { join } from "path";
import { buildCommunityPortalHtml } from "./community-portal-page";

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
  // Bust cache on every request in development so the updated widget.js is served immediately
  widgetCache = null;
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

// ── GET /embed/community-portal ──────────────────────────────────────────────
// The full interactive portal loaded inside an iframe on any partner website.
// Query params: location, org, color, label
embedRouter.get("/community-portal", (req, res) => {
  const html = buildCommunityPortalHtml({
    location: typeof req.query.location === "string" ? req.query.location : "",
    org:      typeof req.query.org      === "string" ? req.query.org      : "",
    color:    typeof req.query.color    === "string" ? req.query.color    : "#1a365d",
    label:    typeof req.query.label    === "string" ? req.query.label    : "",
  });
  res.set("Content-Type", "text/html; charset=utf-8");
  // Allow cross-origin framing from any domain (the whole point of the embed)
  res.set("X-Frame-Options", "ALLOWALL");
  res.set("Content-Security-Policy", "frame-ancestors *");
  res.set("Cache-Control", "public, max-age=300, stale-while-revalidate=60");
  res.send(html);
});

// ── GET /embed/demo ──────────────────────────────────────────────────────────
embedRouter.get("/demo", (_req, res) => {
  const demoHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>TCAF Community Portal Widget — Embed Demo</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f9fafb; color: #111827; padding: 40px 20px;
    }
    h1 { font-size: 26px; font-weight: 800; margin-bottom: 6px; }
    .subtitle { color: #6b7280; font-size: 15px; margin-bottom: 40px; }
    .demo-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 32px; max-width: 1100px; margin: 0 auto;
    }
    .demo-section { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; }
    .demo-section h2 { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: #6b7280; margin-bottom: 6px; }
    .demo-section p { font-size: 13px; color: #4b5563; margin-bottom: 16px; line-height: 1.55; }
    .code-block {
      background: #1f2937; color: #e5e7eb; border-radius: 8px; padding: 14px;
      font-family: 'Fira Code', Consolas, monospace; font-size: 11.5px;
      line-height: 1.6; overflow-x: auto; white-space: pre; margin-top: 16px;
    }
    .live-widget { margin-bottom: 16px; min-height: 60px; }
    footer { text-align: center; margin-top: 48px; font-size: 12px; color: #9ca3af; }
    footer a { color: #6b7280; }
    .badge { display: inline-block; background: #dcfce7; color: #15803d; border-radius: 4px; padding: 2px 8px; font-size: 11px; font-weight: 700; margin-left: 8px; vertical-align: middle; }
  </style>
</head>
<body>
  <h1>TCAF Community Portal Widget <span class="badge">NEW</span></h1>
  <p class="subtitle">
    Drop one div + one script on any website. Visitors get a button that opens a full community portal —
    Census data, SDOH scores, matched grants, 8 help tools, and Navigator AI — pre-loaded for your community.
  </p>

  <div class="demo-grid">

    <!-- Demo 1: ECS / Columbus County NC -->
    <div class="demo-section">
      <h2>Demo 1 — Emergency Charitable Services NC</h2>
      <p>Button pre-loaded with Columbus County, NC (ZIP 28472). Visitors click to see community data and find help.</p>
      <div class="live-widget">
        <div data-tcaf-portal
             data-location="28472"
             data-org="Emergency Charitable Services (NC)"
             data-label="Tell Our Community Story"
             data-color="#1a365d"></div>
      </div>
      <div class="code-block">&lt;div data-tcaf-portal
     data-location="28472"
     data-org="Emergency Charitable Services (NC)"
     data-label="Tell Our Community Story"
     data-color="#1a365d"&gt;&lt;/div&gt;

&lt;script src="https://thrivingcommunitiesforall.com/embed/tcaf-widget.js" async&gt;&lt;/script&gt;</div>
    </div>

    <!-- Demo 2: County health dept -->
    <div class="demo-section">
      <h2>Demo 2 — County Health Department</h2>
      <p>No location pre-set — visitors enter their own ZIP to see their community's data.</p>
      <div class="live-widget">
        <div data-tcaf-portal
             data-org="Columbus County Health Dept"
             data-label="Community Health Data"
             data-color="#059669"></div>
      </div>
      <div class="code-block">&lt;div data-tcaf-portal
     data-org="Columbus County Health Dept"
     data-label="Community Health Data"
     data-color="#059669"&gt;&lt;/div&gt;

&lt;script src="https://thrivingcommunitiesforall.com/embed/tcaf-widget.js" async&gt;&lt;/script&gt;</div>
    </div>

    <!-- Demo 3: Iframe embed -->
    <div class="demo-section">
      <h2>Demo 3 — Direct iframe embed</h2>
      <p>Paste this iframe anywhere for an always-visible community portal (no button click required).</p>
      <div class="live-widget">
        <iframe
          src="/embed/community-portal?location=78741&org=El+Buen+Samaritano&color=%230d9488"
          width="100%" height="500"
          frameborder="0"
          style="border-radius:12px;border:1px solid #e5e7eb;"
          title="Community Portal"></iframe>
      </div>
      <div class="code-block">&lt;iframe
  src="https://thrivingcommunitiesforall.com/embed/community-portal
       ?location=78741
       &amp;org=El+Buen+Samaritano
       &amp;color=%230d9488"
  width="100%" height="500"
  frameborder="0"
  style="border-radius:12px;border:1px solid #e5e7eb;"
  title="Community Portal"&gt;
&lt;/iframe&gt;</div>
    </div>

  </div>

  <footer>
    <p>Powered by <a href="https://thrivingcommunitiesforall.com" target="_blank" rel="noopener">TCAF — Thriving Communities for All</a></p>
  </footer>

  <script src="/embed/tcaf-widget.js" async></script>
</body>
</html>`;
  res.set("Content-Type", "text/html; charset=utf-8");
  res.set("Cache-Control", "public, max-age=3600");
  res.send(demoHtml);
});
