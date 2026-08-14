/**
 * TCAF Community Portal Widget  v2.0
 * Drop-in, no framework, no build step. Works on any website.
 *
 * ── MODE 1: Portal button (NEW) ────────────────────────────────────────────
 * Replaces a div with a branded button. On click, opens a full-screen modal
 * with the TCAF community portal (Community Story · Get Help · Grants · Navigator AI).
 *
 *   <div data-tcaf-portal
 *        data-location="28472"
 *        data-org="Emergency Charitable Services (NC)"
 *        data-label="Tell My Community Story"
 *        data-color="#1a365d"></div>
 *   <script src="https://thrivingcommunitiesforall.com/embed/tcaf-widget.js" async></script>
 *
 * Attributes (all optional except the div itself):
 *   data-location       ZIP code, city, or county pre-loaded into the portal
 *   data-org            Organization name shown in the portal header
 *   data-label          Button label (default: "Community Story & Tools")
 *   data-color          Button + portal brand color (hex, default: #1a365d)
 *   data-button-style   "floating" | "inline" (default: inline)
 *
 * ── MODE 2: Inline community brief (legacy v1) ──────────────────────────────
 * Shows a compact inline brief widget (Census grade + demographics).
 *
 *   <div data-tcaf-widget="community-brief"
 *        data-org-name="My Org"
 *        data-org-color="#2563EB"
 *        data-placeholder-zip="78753"></div>
 *   <script src="https://thrivingcommunitiesforall.com/embed/tcaf-widget.js" async></script>
 */
(function () {
  "use strict";

  // Detect TCAF origin from the script tag's src
  var TCAF_ORIGIN = (function () {
    var scripts = document.querySelectorAll('script[src*="tcaf-widget"]');
    if (scripts.length) {
      var src = scripts[scripts.length - 1].src;
      var m = src.match(/^(https?:\/\/[^\/]+)/);
      if (m) return m[1];
    }
    return "https://thrivingcommunitiesforall.com";
  })();

  // ── Shared utilities ──────────────────────────────────────────────────────
  function isValidHex(hex) {
    return /^#([0-9A-Fa-f]{3}){1,2}$/.test(hex);
  }
  function safeColor(c, fallback) {
    return (c && isValidHex(c)) ? c : (fallback || "#1a365d");
  }
  function hexToRgb(hex) {
    var r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return r ? parseInt(r[1],16)+","+parseInt(r[2],16)+","+parseInt(r[3],16) : "26,54,93";
  }

  // ── ═══════════════════════════════════════════════════════════════════════
  // ── MODE 1: Portal button ─────────────────────────────────────────────────
  // ── ═══════════════════════════════════════════════════════════════════════

  var modalEl   = null; // the overlay div
  var iframeEl  = null; // the iframe inside the modal

  function buildModal() {
    if (modalEl) return;

    var style = document.createElement("style");
    style.textContent = [
      ".tcaf-modal-overlay{position:fixed;inset:0;z-index:2147483647;background:rgba(0,0,0,.6);",
      "display:flex;align-items:center;justify-content:center;animation:tcafFadeIn .2s ease;}",
      ".tcaf-modal-box{position:relative;width:min(680px,calc(100vw - 24px));height:min(760px,calc(100vh - 40px));",
      "border-radius:14px;overflow:hidden;box-shadow:0 24px 80px rgba(0,0,0,.35);",
      "display:flex;flex-direction:column;background:#f8fafc;}",
      ".tcaf-modal-close{position:absolute;top:10px;right:10px;z-index:10;width:30px;height:30px;",
      "background:rgba(0,0,0,.25);color:#fff;border:none;border-radius:50%;font-size:16px;",
      "cursor:pointer;display:flex;align-items:center;justify-content:center;line-height:1;}",
      ".tcaf-modal-close:hover{background:rgba(0,0,0,.45);}",
      ".tcaf-modal-iframe{flex:1;border:none;width:100%;height:100%;}",
      "@keyframes tcafFadeIn{from{opacity:0;transform:scale(.97)}to{opacity:1;transform:scale(1)}}",
    ].join("");
    document.head.appendChild(style);

    modalEl = document.createElement("div");
    modalEl.className = "tcaf-modal-overlay";
    modalEl.style.display = "none";
    modalEl.setAttribute("role", "dialog");
    modalEl.setAttribute("aria-modal", "true");
    modalEl.setAttribute("aria-label", "TCAF Community Portal");

    var box = document.createElement("div");
    box.className = "tcaf-modal-box";

    var closeBtn = document.createElement("button");
    closeBtn.className = "tcaf-modal-close";
    closeBtn.innerHTML = "&#x2715;";
    closeBtn.setAttribute("aria-label", "Close portal");
    closeBtn.addEventListener("click", closeModal);

    iframeEl = document.createElement("iframe");
    iframeEl.className = "tcaf-modal-iframe";
    iframeEl.setAttribute("title", "TCAF Community Portal");
    iframeEl.setAttribute("loading", "lazy");
    iframeEl.setAttribute("allow", "clipboard-write");

    box.appendChild(closeBtn);
    box.appendChild(iframeEl);
    modalEl.appendChild(box);

    // Close on backdrop click
    modalEl.addEventListener("click", function (e) {
      if (e.target === modalEl) closeModal();
    });
    // Close on Escape
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && modalEl.style.display !== "none") closeModal();
    });

    document.body.appendChild(modalEl);
  }

  function openModal(portalUrl) {
    buildModal();
    iframeEl.src = portalUrl;
    modalEl.style.display = "flex";
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    if (!modalEl) return;
    modalEl.style.display = "none";
    document.body.style.overflow = "";
    // Clear iframe src to stop any media playing
    setTimeout(function () { if (iframeEl) iframeEl.src = "about:blank"; }, 300);
  }

  function initPortalWidget(container) {
    var loc    = container.getAttribute("data-location") || "";
    var org    = container.getAttribute("data-org") || "";
    var label  = container.getAttribute("data-label") || "Community Story & Tools";
    var color  = safeColor(container.getAttribute("data-color"), "#1a365d");
    var mode   = container.getAttribute("data-button-style") || "inline";

    // Build portal URL
    var params = new URLSearchParams();
    if (loc)   params.set("location", loc);
    if (org)   params.set("org", org);
    if (color) params.set("color", color);
    var portalUrl = TCAF_ORIGIN + "/embed/community-portal?" + params.toString();

    var rgb = hexToRgb(color);

    if (mode === "floating") {
      // Floating button — fixed bottom-right
      var floatStyle = document.createElement("style");
      floatStyle.textContent =
        ".tcaf-float-btn{position:fixed;bottom:24px;right:24px;z-index:2147483646;" +
        "padding:14px 22px;background:" + color + ";color:#fff;border:none;border-radius:50px;" +
        "font-family:inherit;font-size:15px;font-weight:700;cursor:pointer;" +
        "box-shadow:0 4px 20px rgba(" + rgb + ",.4);" +
        "display:flex;align-items:center;gap:8px;transition:transform .15s,box-shadow .15s;}" +
        ".tcaf-float-btn:hover{transform:translateY(-2px);box-shadow:0 8px 28px rgba(" + rgb + ",.5);}";
      document.head.appendChild(floatStyle);

      var floatBtn = document.createElement("button");
      floatBtn.className = "tcaf-float-btn";
      floatBtn.innerHTML = "<span>🌐</span><span>" + escapeHtml(label) + "</span>";
      floatBtn.addEventListener("click", function () { openModal(portalUrl); });
      document.body.appendChild(floatBtn);
      container.style.display = "none";
    } else {
      // Inline button — replaces the container div
      var btnHtml = [
        '<button style="',
        "display:inline-flex;align-items:center;gap:8px;",
        "padding:12px 24px;",
        "background:" + color + ";",
        "color:#ffffff;",
        "border:none;border-radius:10px;",
        "font-family:inherit;font-size:15px;font-weight:700;cursor:pointer;",
        "box-shadow:0 4px 16px rgba(" + rgb + ",.3);",
        "transition:opacity .15s,transform .15s;",
        '" onmouseover="this.style.opacity=.88;this.style.transform=\'translateY(-1px)\'"',
        ' onmouseout="this.style.opacity=1;this.style.transform=\'none\'"',
        ' aria-label="' + escapeAttr(label) + '"',
        ">",
        "<span style='font-size:18px'>🌐</span>",
        "<span>" + escapeHtml(label) + "</span>",
        "</button>",
      ].join("");
      container.innerHTML = btnHtml;
      container.querySelector("button").addEventListener("click", function () {
        openModal(portalUrl);
      });
    }
  }

  function escapeHtml(s) {
    return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  }
  function escapeAttr(s) {
    return String(s).replace(/"/g,"&quot;").replace(/'/g,"&#39;");
  }

  // ── ═══════════════════════════════════════════════════════════════════════
  // ── MODE 2: Inline community brief (legacy v1) ────────────────────────────
  // ── ═══════════════════════════════════════════════════════════════════════

  var GRADE_COLORS = { A:"#16a34a", B:"#65a30d", C:"#d97706", D:"#dc2626", F:"#7f1d1d" };
  function getGradeColor(g) {
    if (!g) return "#6b7280";
    return GRADE_COLORS[String(g).charAt(0).toUpperCase()] || "#6b7280";
  }

  var BRIEF_CSS = [
    ":host{display:block;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;box-sizing:border-box;}",
    "*,*::before,*::after{box-sizing:inherit;}",
    ".widget{background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:20px;max-width:480px;width:100%;margin:0 auto;box-shadow:0 2px 12px rgba(0,0,0,.06);}",
    ".org-header{display:flex;align-items:center;gap:10px;margin-bottom:14px;}",
    ".org-logo{width:36px;height:36px;object-fit:contain;border-radius:6px;flex-shrink:0;}",
    ".org-name{font-weight:700;font-size:15px;color:#111827;}",
    ".widget-title{font-size:14px;font-weight:600;color:#374151;margin-bottom:12px;}",
    ".input-row{display:flex;gap:8px;align-items:stretch;}",
    ".zip-input{flex:1;padding:9px 12px;border:1.5px solid #d1d5db;border-radius:8px;font-size:15px;color:#111827;outline:none;transition:border-color .15s;min-width:0;}",
    ".zip-input:focus{border-color:var(--org-color,#4F46E5);box-shadow:0 0 0 3px var(--org-color-alpha,rgba(79,70,229,.15));}",
    ".analyze-btn{padding:9px 18px;background:var(--org-color,#4F46E5);color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;white-space:nowrap;transition:opacity .15s;flex-shrink:0;}",
    ".analyze-btn:hover{opacity:.88;} .analyze-btn:disabled{opacity:.55;cursor:not-allowed;}",
    ".spinner{display:flex;align-items:center;gap:10px;padding:16px 0;color:#6b7280;font-size:13px;}",
    ".spinner-ring{width:20px;height:20px;border:2.5px solid #e5e7eb;border-top-color:var(--org-color,#4F46E5);border-radius:50%;animation:spin .7s linear infinite;flex-shrink:0;}",
    "@keyframes spin{to{transform:rotate(360deg)}}",
    ".error-msg{padding:12px;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;color:#b91c1c;font-size:13px;margin-top:12px;}",
    ".result-card{margin-top:16px;animation:fadeIn .3s ease;}",
    "@keyframes fadeIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}",
    ".grade-row{display:flex;align-items:center;gap:12px;margin-bottom:14px;}",
    ".grade-badge{font-size:28px;font-weight:800;width:52px;height:52px;border-radius:10px;display:flex;align-items:center;justify-content:center;color:#fff;flex-shrink:0;}",
    ".grade-meta{flex:1;} .grade-label{font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;}",
    ".score-line{font-size:20px;font-weight:700;color:#111827;line-height:1.2;}",
    ".populations-label{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:#6b7280;margin-bottom:6px;}",
    ".populations-list{display:flex;flex-wrap:wrap;gap:5px;margin-bottom:14px;}",
    ".pop-tag{font-size:12px;background:#f3f4f6;border:1px solid #e5e7eb;border-radius:99px;padding:3px 10px;color:#374151;}",
    ".narrative{font-size:13px;color:#4b5563;line-height:1.6;margin-bottom:14px;border-left:3px solid var(--org-color,#4F46E5);padding-left:10px;}",
    ".report-link{display:inline-flex;align-items:center;gap:5px;font-size:13px;font-weight:600;color:var(--org-color,#4F46E5);text-decoration:none;padding:8px 14px;border:1.5px solid var(--org-color,#4F46E5);border-radius:7px;transition:background .15s;margin-bottom:14px;}",
    ".report-link:hover{background:var(--org-color-alpha,rgba(79,70,229,.08));}",
    ".powered-by{display:flex;align-items:center;gap:5px;border-top:1px solid #f3f4f6;padding-top:10px;margin-top:4px;}",
    ".powered-by-text{font-size:10px;color:#9ca3af;}",
    ".powered-by a{font-size:10px;color:var(--org-color,#4F46E5);font-weight:600;text-decoration:none;}",
  ].join("");

  function initBriefWidget(container) {
    var orgName    = container.getAttribute("data-org-name") || "";
    var orgColor   = safeColor(container.getAttribute("data-org-color"), "#4F46E5");
    var orgLogoUrl = container.getAttribute("data-org-logo-url") || "";
    var placeholderZip = container.getAttribute("data-placeholder-zip") || "";

    var rgb = hexToRgb(orgColor);
    var orgColorAlpha = "rgba(" + rgb + ",.12)";

    var shadow = container.attachShadow({ mode: "open" });
    var styleEl = document.createElement("style");
    styleEl.textContent = BRIEF_CSS;
    shadow.appendChild(styleEl);

    var host = document.createElement("div");
    host.className = "widget";
    host.style.setProperty("--org-color", orgColor);
    host.style.setProperty("--org-color-alpha", orgColorAlpha);
    shadow.appendChild(host);

    // Org header
    if (orgName || orgLogoUrl) {
      var header = document.createElement("div");
      header.className = "org-header";
      if (orgLogoUrl) {
        var img = document.createElement("img");
        img.className = "org-logo";
        img.src = orgLogoUrl;
        img.alt = orgName || "Organization logo";
        header.appendChild(img);
      }
      if (orgName) {
        var nameEl = document.createElement("div");
        nameEl.className = "org-name";
        nameEl.textContent = orgName;
        header.appendChild(nameEl);
      }
      host.appendChild(header);
    }

    // Title
    var titleEl = document.createElement("div");
    titleEl.className = "widget-title";
    titleEl.textContent = "Community Health Score";
    host.appendChild(titleEl);

    // Input row
    var inputRow = document.createElement("div");
    inputRow.className = "input-row";
    var zipInput = document.createElement("input");
    zipInput.className = "zip-input";
    zipInput.type = "text";
    zipInput.placeholder = placeholderZip || "ZIP code or city…";
    zipInput.maxLength = 80;
    zipInput.setAttribute("aria-label", "Location");
    var analyzeBtn = document.createElement("button");
    analyzeBtn.className = "analyze-btn";
    analyzeBtn.textContent = "Analyze";
    analyzeBtn.setAttribute("aria-label", "Analyze community");
    inputRow.appendChild(zipInput);
    inputRow.appendChild(analyzeBtn);
    host.appendChild(inputRow);

    // Spinner
    var spinnerEl = document.createElement("div");
    spinnerEl.className = "spinner";
    spinnerEl.style.display = "none";
    spinnerEl.innerHTML = '<div class="spinner-ring"></div><span>Loading community data…</span>';
    host.appendChild(spinnerEl);

    // Error
    var errorEl = document.createElement("div");
    errorEl.className = "error-msg";
    errorEl.style.display = "none";
    host.appendChild(errorEl);

    // Result
    var resultEl = document.createElement("div");
    resultEl.className = "result-card";
    resultEl.style.display = "none";
    host.appendChild(resultEl);

    // Powered-by footer
    var poweredBy = document.createElement("div");
    poweredBy.className = "powered-by";
    poweredBy.innerHTML = '<span class="powered-by-text">Powered by&nbsp;</span>' +
      '<a href="' + TCAF_ORIGIN + '" target="_blank" rel="noopener">TCAF</a>';
    host.appendChild(poweredBy);

    function analyze() {
      var loc = zipInput.value.trim();
      if (!loc) return;
      analyzeBtn.disabled = true;
      spinnerEl.style.display = "flex";
      errorEl.style.display = "none";
      resultEl.style.display = "none";

      fetch(TCAF_ORIGIN + "/api/conductor/community-brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location: loc, populationSize: 50000 }),
      })
        .then(function (r) {
          return r.ok ? r.json() : r.json().then(function (e) { throw new Error(e.error || "Failed"); });
        })
        .then(function (data) {
          spinnerEl.style.display = "none";
          analyzeBtn.disabled = false;
          renderBriefResult(resultEl, data, orgColor, orgName, loc);
        })
        .catch(function (err) {
          spinnerEl.style.display = "none";
          analyzeBtn.disabled = false;
          errorEl.textContent = err.message || "Could not load community data.";
          errorEl.style.display = "block";
        });
    }

    analyzeBtn.addEventListener("click", analyze);
    zipInput.addEventListener("keydown", function (e) { if (e.key === "Enter") analyze(); });

    // Auto-analyze if placeholder ZIP is given
    if (placeholderZip) {
      zipInput.value = placeholderZip;
      setTimeout(analyze, 300);
    }
  }

  function renderBriefResult(resultEl, data, orgColor, orgName, location) {
    var geo   = data.geography || {};
    var demo  = data.demographics || {};
    var atRisk = data.atRiskPopulations || [];
    var narrative = (data.narrative || data.narrativeSummary || "").slice(0, 280);
    var grade = data.overallGrade || "";
    var score = data.overallScore;
    var evidence = data.evidence || {};
    var resolved = (evidence.geography || {}).resolved || {};
    var displayName = resolved.label || geo.displayName || geo.input || location;

    resultEl.innerHTML = "";
    resultEl.style.display = "block";

    // Grade row
    var gradeRow = document.createElement("div");
    gradeRow.className = "grade-row";
    var gradeBadge = document.createElement("div");
    gradeBadge.className = "grade-badge";
    gradeBadge.textContent = grade || "—";
    gradeBadge.style.background = getGradeColor(grade);
    var gradeMeta = document.createElement("div");
    gradeMeta.className = "grade-meta";
    gradeMeta.innerHTML =
      '<div class="grade-label">TCAF-derived Community Score</div>' +
      '<div class="score-line">' + displayName + "</div>" +
      (typeof score === "number" && isFinite(score) ? '<div style="font-size:13px;color:#6b7280;">' + score + "/100</div>" : "");
    gradeRow.appendChild(gradeBadge);
    gradeRow.appendChild(gradeMeta);
    resultEl.appendChild(gradeRow);

    var disclosure = document.createElement("div");
    disclosure.style.cssText = "font-size:11px;line-height:1.35;color:#475569;background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:8px 10px;margin:0 0 12px;";
    disclosure.textContent = "Analyzed geography: " + (resolved.label || "not disclosed") +
      (resolved.type ? " (" + String(resolved.type).toUpperCase() + ")" : "") +
      ". Values are public-data estimates at this geography; the score and narrative are TCAF-derived/AI decision support.";
    resultEl.appendChild(disclosure);

    // Key stats
    var stats = [
      ["Poverty", demo.povertyRate != null ? demo.povertyRate.toFixed(1) + "%" : "—"],
      ["Uninsured", demo.uninsuredRate != null ? demo.uninsuredRate.toFixed(1) + "%" : "—"],
      ["Unemployed", demo.unemploymentRate != null ? demo.unemploymentRate.toFixed(1) + "%" : "—"],
      ["Housing Burden", demo.housingCostBurden != null ? demo.housingCostBurden.toFixed(1) + "%" : "—"],
    ];
    var statsGrid = document.createElement("div");
    statsGrid.style.cssText = "display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px;";
    stats.forEach(function (s) {
      var card = document.createElement("div");
      card.style.cssText = "background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:10px;text-align:center;";
      card.innerHTML = '<div style="font-size:18px;font-weight:800;color:' + orgColor + '">' + s[1] + '</div>' +
        '<div style="font-size:11px;color:#6b7280;margin-top:2px">' + s[0] + "</div>";
      statsGrid.appendChild(card);
    });
    resultEl.appendChild(statsGrid);

    // At-risk populations
    if (atRisk.length) {
      var popLabel = document.createElement("div");
      popLabel.className = "populations-label";
      popLabel.textContent = "At-Risk Populations";
      var popList = document.createElement("div");
      popList.className = "populations-list";
      atRisk.slice(0, 6).forEach(function (p) {
        var label = typeof p === "string" ? p : (p && p.name) || "";
        if (!label) return;
        var tag = document.createElement("span");
        tag.className = "pop-tag";
        tag.textContent = label;
        popList.appendChild(tag);
      });
      resultEl.appendChild(popLabel);
      resultEl.appendChild(popList);
    }

    // Narrative snippet
    if (narrative) {
      var narEl = document.createElement("div");
      narEl.className = "narrative";
      narEl.textContent = narrative + (data.narrative && data.narrative.length > 280 ? "…" : "");
      resultEl.appendChild(narEl);
    }

    // "Open full portal" link
    var params = new URLSearchParams();
    params.set("location", geo.zip || location);
    if (orgName) params.set("org", orgName);
    if (orgColor) params.set("color", orgColor);
    var link = document.createElement("a");
    link.className = "report-link";
    link.href = TCAF_ORIGIN + "/embed/community-portal?" + params.toString();
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "Open Full Community Portal →";
    resultEl.appendChild(link);
  }

  // ── ═══════════════════════════════════════════════════════════════════════
  // ── Bootstrap: find and init all widget containers ────────────────────────
  // ── ═══════════════════════════════════════════════════════════════════════

  function init() {
    // Mode 1 — portal button
    var portals = document.querySelectorAll("[data-tcaf-portal]");
    portals.forEach(function (el) {
      if (el.__tcafInit) return;
      el.__tcafInit = true;
      try { initPortalWidget(el); } catch (e) { console.error("[tcaf-widget] portal init error:", e); }
    });

    // Mode 2 — legacy inline brief
    var briefs = document.querySelectorAll('[data-tcaf-widget="community-brief"]');
    briefs.forEach(function (el) {
      if (el.__tcafInit) return;
      el.__tcafInit = true;
      try { initBriefWidget(el); } catch (e) { console.error("[tcaf-widget] brief init error:", e); }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // Re-scan for dynamically inserted widgets
  if (typeof MutationObserver !== "undefined") {
    var observer = new MutationObserver(function (mutations) {
      var needsInit = mutations.some(function (m) {
        return Array.from(m.addedNodes).some(function (n) {
          return n.nodeType === 1 && (
            n.hasAttribute && (n.hasAttribute("data-tcaf-portal") || n.getAttribute("data-tcaf-widget") === "community-brief") ||
            (n.querySelector && (n.querySelector("[data-tcaf-portal]") || n.querySelector('[data-tcaf-widget="community-brief"]')))
          );
        });
      });
      if (needsInit) init();
    });
    observer.observe(document.body || document.documentElement, { childList: true, subtree: true });
  }
})();
