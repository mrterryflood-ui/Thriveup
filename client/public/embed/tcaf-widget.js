/**
 * TCAF Community Brief Embeddable Widget
 * Drop-in, no framework, no build step.
 *
 * Usage:
 *   <div data-tcaf-widget="community-brief"
 *        data-org-name="My Org"
 *        data-org-color="#2563EB"
 *        data-org-logo-url="https://example.com/logo.png"
 *        data-placeholder-zip="78753"></div>
 *   <script src="https://yourdomain.com/embed/tcaf-widget.js" async></script>
 */
(function () {
  "use strict";

  // In production the widget is served from the TCAF domain; allow override via
  // data-api-origin on the script tag or fall back to the canonical prod URL.
  var TCAF_ORIGIN = (function() {
    var scripts = document.querySelectorAll('script[src*="tcaf-widget"]');
    if (scripts.length) {
      var src = scripts[scripts.length - 1].src;
      var m = src.match(/^(https?:\/\/[^\/]+)/);
      if (m) return m[1];
    }
    return "https://thrivingcommunitiesforall.com";
  })();
  var TCAF_API = TCAF_ORIGIN + "/api/conductor/community-brief";
  var TCAF_HOME = TCAF_ORIGIN;
  var TCAF_REPORT_BASE = TCAF_HOME + "/community-impact?location=";

  var GRADE_COLORS = {
    A: "#16a34a",
    B: "#65a30d",
    C: "#d97706",
    D: "#dc2626",
    F: "#7f1d1d",
  };

  function getGradeColor(grade) {
    if (!grade) return "#6b7280";
    var letter = String(grade).charAt(0).toUpperCase();
    return GRADE_COLORS[letter] || "#6b7280";
  }

  function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? "rgb(" +
          parseInt(result[1], 16) +
          "," +
          parseInt(result[2], 16) +
          "," +
          parseInt(result[3], 16) +
          ")"
      : null;
  }

  function isValidHex(hex) {
    return /^#([0-9A-Fa-f]{3}){1,2}$/.test(hex);
  }

  var CSS = `
    :host {
      display: block;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      box-sizing: border-box;
    }
    *, *::before, *::after { box-sizing: inherit; }

    .widget {
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 20px;
      max-width: 480px;
      width: 100%;
      margin: 0 auto;
      box-shadow: 0 2px 12px rgba(0,0,0,0.06);
    }

    .org-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 14px;
    }
    .org-logo {
      width: 36px;
      height: 36px;
      object-fit: contain;
      border-radius: 6px;
      flex-shrink: 0;
    }
    .org-name {
      font-weight: 700;
      font-size: 15px;
      color: #111827;
    }

    .widget-title {
      font-size: 14px;
      font-weight: 600;
      color: #374151;
      margin-bottom: 12px;
    }

    .input-row {
      display: flex;
      gap: 8px;
      align-items: stretch;
    }
    .zip-input {
      flex: 1;
      padding: 9px 12px;
      border: 1.5px solid #d1d5db;
      border-radius: 8px;
      font-size: 15px;
      color: #111827;
      outline: none;
      transition: border-color 0.15s;
      min-width: 0;
    }
    .zip-input:focus {
      border-color: var(--org-color, #4F46E5);
      box-shadow: 0 0 0 3px var(--org-color-alpha, rgba(79,70,229,0.15));
    }
    .analyze-btn {
      padding: 9px 18px;
      background: var(--org-color, #4F46E5);
      color: #ffffff;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      white-space: nowrap;
      transition: opacity 0.15s;
      flex-shrink: 0;
    }
    .analyze-btn:hover { opacity: 0.88; }
    .analyze-btn:disabled { opacity: 0.55; cursor: not-allowed; }

    .spinner {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 16px 0;
      color: #6b7280;
      font-size: 13px;
    }
    .spinner-ring {
      width: 20px;
      height: 20px;
      border: 2.5px solid #e5e7eb;
      border-top-color: var(--org-color, #4F46E5);
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
      flex-shrink: 0;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .error-msg {
      padding: 12px;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 8px;
      color: #b91c1c;
      font-size: 13px;
      margin-top: 12px;
    }

    .result-card {
      margin-top: 16px;
      animation: fadeIn 0.3s ease;
    }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }

    .grade-row {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 14px;
    }
    .grade-badge {
      font-size: 28px;
      font-weight: 800;
      width: 52px;
      height: 52px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ffffff;
      flex-shrink: 0;
    }
    .grade-meta {
      flex: 1;
    }
    .grade-label {
      font-size: 12px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .score-line {
      font-size: 20px;
      font-weight: 700;
      color: #111827;
      line-height: 1.2;
    }

    .populations-label {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #6b7280;
      margin-bottom: 6px;
    }
    .populations-list {
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
      margin-bottom: 14px;
    }
    .pop-tag {
      font-size: 12px;
      background: #f3f4f6;
      border: 1px solid #e5e7eb;
      border-radius: 99px;
      padding: 3px 10px;
      color: #374151;
    }

    .narrative {
      font-size: 13px;
      color: #4b5563;
      line-height: 1.6;
      margin-bottom: 14px;
      border-left: 3px solid var(--org-color, #4F46E5);
      padding-left: 10px;
    }

    .report-link {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-size: 13px;
      font-weight: 600;
      color: var(--org-color, #4F46E5);
      text-decoration: none;
      padding: 8px 14px;
      border: 1.5px solid var(--org-color, #4F46E5);
      border-radius: 7px;
      transition: background 0.15s;
      margin-bottom: 14px;
    }
    .report-link:hover { background: var(--org-color-alpha, rgba(79,70,229,0.08)); }

    .powered-by {
      display: flex;
      align-items: center;
      gap: 5px;
      border-top: 1px solid #f3f4f6;
      padding-top: 10px;
      margin-top: 4px;
    }
    .powered-by-text {
      font-size: 10px;
      color: #9ca3af;
    }
    .powered-by a {
      font-size: 10px;
      font-weight: 600;
      color: #6b7280;
      text-decoration: none;
    }
    .powered-by a:hover { color: #374151; text-decoration: underline; }
    .tcaf-dot {
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: var(--org-color, #4F46E5);
      display: inline-block;
      margin: 0 2px;
    }

    @media (max-width: 360px) {
      .widget { padding: 14px; border-radius: 8px; }
      .input-row { flex-direction: column; }
      .analyze-btn { width: 100%; }
      .grade-badge { width: 44px; height: 44px; font-size: 22px; }
    }
  `;

  function buildWidget(el) {
    var orgName = el.getAttribute("data-org-name") || "";
    var orgColor = el.getAttribute("data-org-color") || "#4F46E5";
    var orgLogoUrl = el.getAttribute("data-org-logo-url") || "";
    var placeholderZip = el.getAttribute("data-placeholder-zip") || "e.g. 78753";

    if (!isValidHex(orgColor)) orgColor = "#4F46E5";

    var shadow = el.attachShadow({ mode: "open" });

    // Set CSS custom properties
    var alphaColor = "rgba(79,70,229,0.15)";
    try {
      var rgb = hexToRgb(orgColor);
      if (rgb) {
        alphaColor = rgb.replace("rgb(", "rgba(").replace(")", ",0.15)");
      }
    } catch (e) {}

    var styleEl = document.createElement("style");
    styleEl.textContent = CSS;
    shadow.appendChild(styleEl);

    var root = document.createElement("div");
    root.className = "widget";
    root.style.setProperty("--org-color", orgColor);
    root.style.setProperty("--org-color-alpha", alphaColor);

    // Org header
    if (orgName || orgLogoUrl) {
      var header = document.createElement("div");
      header.className = "org-header";
      if (orgLogoUrl) {
        var logo = document.createElement("img");
        logo.className = "org-logo";
        logo.src = orgLogoUrl;
        logo.alt = orgName || "Organization logo";
        logo.onerror = function () { logo.style.display = "none"; };
        header.appendChild(logo);
      }
      if (orgName) {
        var nameEl = document.createElement("span");
        nameEl.className = "org-name";
        nameEl.textContent = orgName;
        header.appendChild(nameEl);
      }
      root.appendChild(header);
    }

    // Title
    var title = document.createElement("p");
    title.className = "widget-title";
    title.textContent = "Community Health & Equity Brief";
    root.appendChild(title);

    // Input row
    var inputRow = document.createElement("div");
    inputRow.className = "input-row";

    var zipInput = document.createElement("input");
    zipInput.type = "text";
    zipInput.className = "zip-input";
    zipInput.placeholder = placeholderZip;
    zipInput.maxLength = 10;
    zipInput.setAttribute("aria-label", "ZIP code or city");
    zipInput.setAttribute("inputmode", "numeric");
    inputRow.appendChild(zipInput);

    var btn = document.createElement("button");
    btn.className = "analyze-btn";
    btn.textContent = "Analyze";
    btn.setAttribute("type", "button");
    inputRow.appendChild(btn);

    root.appendChild(inputRow);

    // Status area
    var statusArea = document.createElement("div");
    root.appendChild(statusArea);

    // Powered-by footer (always shown)
    var footer = document.createElement("div");
    footer.className = "powered-by";
    footer.innerHTML =
      '<span class="powered-by-text">Powered by</span>' +
      '<span class="tcaf-dot"></span>' +
      '<a href="' + TCAF_HOME + '" target="_blank" rel="noopener noreferrer">TCAF</a>';
    root.appendChild(footer);

    shadow.appendChild(root);

    // State
    var currentZip = "";

    function showSpinner() {
      statusArea.innerHTML = "";
      var spin = document.createElement("div");
      spin.className = "spinner";
      var ring = document.createElement("div");
      ring.className = "spinner-ring";
      var txt = document.createTextNode("Analyzing community data…");
      spin.appendChild(ring);
      spin.appendChild(txt);
      statusArea.appendChild(spin);
    }

    function showError(msg) {
      statusArea.innerHTML = "";
      var err = document.createElement("div");
      err.className = "error-msg";
      err.setAttribute("role", "alert");
      err.textContent = msg;
      statusArea.appendChild(err);
    }

    function showResult(brief, zip) {
      statusArea.innerHTML = "";
      var card = document.createElement("div");
      card.className = "result-card";

      // Grade row
      var gradeRow = document.createElement("div");
      gradeRow.className = "grade-row";

      var grade = (brief.overallGrade || "?").charAt(0);
      var gradeBadge = document.createElement("div");
      gradeBadge.className = "grade-badge";
      gradeBadge.textContent = grade;
      gradeBadge.style.background = getGradeColor(grade);
      gradeBadge.setAttribute("aria-label", "Grade " + grade);
      gradeRow.appendChild(gradeBadge);

      var meta = document.createElement("div");
      meta.className = "grade-meta";
      var lbl = document.createElement("div");
      lbl.className = "grade-label";
      lbl.textContent = "Community Grade";
      var scoreLine = document.createElement("div");
      scoreLine.className = "score-line";
      scoreLine.textContent =
        typeof brief.overallScore === "number"
          ? "Score: " + brief.overallScore + " / 100"
          : "Score: — ";
      meta.appendChild(lbl);
      meta.appendChild(scoreLine);
      gradeRow.appendChild(meta);
      card.appendChild(gradeRow);

      // At-risk populations
      var pops =
        Array.isArray(brief.atRiskPopulations) ? brief.atRiskPopulations.slice(0, 3) : [];
      if (pops.length === 0 && brief.cascade && Array.isArray(brief.cascade.affectedPopulations)) {
        pops = brief.cascade.affectedPopulations.slice(0, 3);
      }
      if (pops.length > 0) {
        var popLbl = document.createElement("div");
        popLbl.className = "populations-label";
        popLbl.textContent = "At-Risk Populations";
        card.appendChild(popLbl);

        var popList = document.createElement("div");
        popList.className = "populations-list";
        pops.forEach(function (p) {
          var tag = document.createElement("span");
          tag.className = "pop-tag";
          tag.textContent = typeof p === "string" ? p : JSON.stringify(p);
          popList.appendChild(tag);
        });
        card.appendChild(popList);
      }

      // Narrative
      var narrativeText =
        brief.narrativeSummary ||
        (brief.cascade && brief.cascade.keyChains && brief.cascade.keyChains[0]) ||
        "Community analysis complete.";
      // Trim to 2 sentences
      var sentences = String(narrativeText).match(/[^.!?]+[.!?]*/g) || [];
      var twoSentences = sentences.slice(0, 2).join(" ").trim() || narrativeText;
      var narr = document.createElement("p");
      narr.className = "narrative";
      narr.textContent = twoSentences;
      card.appendChild(narr);

      // Report link
      var link = document.createElement("a");
      link.className = "report-link";
      link.href = TCAF_REPORT_BASE + encodeURIComponent(zip);
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.setAttribute("aria-label", "View full community report for " + zip);
      link.innerHTML = "View full report &rarr;";
      card.appendChild(link);

      statusArea.appendChild(card);
    }

    function doAnalyze() {
      var raw = zipInput.value.trim();
      if (!raw) {
        zipInput.focus();
        return;
      }
      currentZip = raw;
      btn.disabled = true;
      showSpinner();

      fetch(TCAF_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location: raw }),
        mode: "cors",
        credentials: "omit",
      })
        .then(function (res) {
          if (!res.ok) {
            throw new Error("HTTP " + res.status);
          }
          return res.json();
        })
        .then(function (data) {
          btn.disabled = false;
          var brief = data.brief || data;
          showResult(brief, currentZip);
        })
        .catch(function (err) {
          btn.disabled = false;
          console.error("[tcaf-widget] fetch error:", err);
          showError("Analysis unavailable — try again shortly.");
        });
    }

    btn.addEventListener("click", doAnalyze);
    zipInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter") doAnalyze();
    });
  }

  function init() {
    var targets = document.querySelectorAll(
      '[data-tcaf-widget="community-brief"]'
    );
    for (var i = 0; i < targets.length; i++) {
      // Skip if already initialized
      if (targets[i].shadowRoot) continue;
      buildWidget(targets[i]);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // Expose for dynamic insertion
  window.TCAFWidget = { init: init };
})();
