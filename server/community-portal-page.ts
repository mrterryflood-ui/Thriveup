/**
 * Community Portal HTML — served at /embed/community-portal
 *
 * A self-contained, iframe-friendly page with four tool tabs:
 *   1. Community Story  — live Census data, SDOH scores, narrative
 *   2. Get Help         — benefits screener, resource finder, emergency links
 *   3. Grants           — matched grant opportunities
 *   4. Navigator AI     — deep-link to the full AI advisor
 *
 * No login required. Calls ThriveUp APIs same-origin from inside the iframe.
 * Query params: location, org, color, label
 */

export function buildCommunityPortalHtml(opts: {
  location?: string;
  org?: string;
  color?: string;
  label?: string;
}): string {
  const { location = "", org = "", color = "#1a365d", label = "Community Portal" } = opts;
  // Sanitize — these go into HTML attributes
  const safeLocation = location.replace(/[<>"']/g, "").slice(0, 100);
  const safeOrg      = org.replace(/[<>"']/g, "").slice(0, 100);
  const safeColor    = /^#[0-9a-f]{3,6}$/i.test(color) ? color : "#1a365d";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${safeOrg ? safeOrg + " — " : ""}Community Portal · TCAF</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root { --brand: ${safeColor}; --brand-light: ${safeColor}18; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f8fafc;
      color: #1e293b;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    /* ── Top bar ── */
    .topbar {
      background: var(--brand);
      color: white;
      padding: 12px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      flex-shrink: 0;
    }
    .topbar-left { display: flex; align-items: center; gap: 10px; min-width: 0; }
    .topbar-org  { font-weight: 700; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .topbar-powered { font-size: 10px; opacity: 0.7; white-space: nowrap; }
    .location-row {
      display: flex;
      align-items: center;
      gap: 6px;
      background: rgba(255,255,255,0.15);
      border-radius: 20px;
      padding: 4px 10px 4px 4px;
      flex-shrink: 0;
    }
    .loc-input {
      background: transparent;
      border: none;
      color: white;
      font-size: 13px;
      font-weight: 600;
      width: 130px;
      outline: none;
    }
    .loc-input::placeholder { color: rgba(255,255,255,0.6); }
    .loc-btn {
      background: white;
      color: var(--brand);
      border: none;
      border-radius: 14px;
      padding: 4px 12px;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
    }

    /* ── Tabs ── */
    .tabs {
      background: white;
      border-bottom: 2px solid #e2e8f0;
      display: flex;
      overflow-x: auto;
      flex-shrink: 0;
      scrollbar-width: none;
    }
    .tabs::-webkit-scrollbar { display: none; }
    .tab {
      flex-shrink: 0;
      padding: 12px 18px;
      font-size: 13px;
      font-weight: 600;
      color: #64748b;
      cursor: pointer;
      border-bottom: 2px solid transparent;
      margin-bottom: -2px;
      white-space: nowrap;
      transition: color 0.15s, border-color 0.15s;
    }
    .tab:hover { color: var(--brand); }
    .tab.active { color: var(--brand); border-color: var(--brand); }

    /* ── Content area ── */
    .content { flex: 1; overflow-y: auto; padding: 16px 20px; display: none; }
    .content.active { display: block; }

    /* ── Shared elements ── */
    .section-title {
      font-size: 18px;
      font-weight: 800;
      color: #1e293b;
      margin-bottom: 4px;
    }
    .section-sub {
      font-size: 13px;
      color: #64748b;
      margin-bottom: 16px;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 10px 20px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
      border: none;
      transition: opacity 0.15s;
    }
    .btn:hover { opacity: 0.88; }
    .btn-primary { background: var(--brand); color: white; }
    .btn-outline { background: white; color: var(--brand); border: 2px solid var(--brand); }
    .btn-full { width: 100%; justify-content: center; }
    .btn:disabled { opacity: 0.55; cursor: not-allowed; }

    /* ── Story tab ── */
    .stat-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin: 12px 0; }
    .stat-card {
      background: var(--brand-light);
      border-radius: 10px;
      padding: 12px;
      text-align: center;
    }
    .stat-card.warn { background: #fff1f2; }
    .stat-num { font-size: 22px; font-weight: 800; color: var(--brand); }
    .stat-card.warn .stat-num { color: #be123c; }
    .stat-label { font-size: 11px; color: #64748b; margin-top: 2px; }
    .score-row { margin: 6px 0; }
    .score-label-row { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 3px; }
    .score-bar-bg { height: 6px; background: #e2e8f0; border-radius: 3px; }
    .score-bar { height: 6px; background: var(--brand); border-radius: 3px; transition: width 0.6s ease; }
    .grade-badge-sm {
      display: inline-block;
      padding: 1px 7px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 700;
    }
    .narrative-box {
      background: white;
      border-left: 3px solid var(--brand);
      padding: 12px 14px;
      border-radius: 0 8px 8px 0;
      font-size: 13px;
      color: #475569;
      line-height: 1.65;
      margin: 12px 0;
      max-height: 180px;
      overflow-y: auto;
    }
    .tag { display: inline-block; background: #f1f5f9; border-radius: 99px; padding: 3px 10px; font-size: 11px; color: #475569; margin: 2px; }
    .card {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 14px 16px;
      margin-bottom: 10px;
    }
    .card-title { font-size: 14px; font-weight: 700; color: #1e293b; margin-bottom: 2px; }
    .card-sub { font-size: 12px; color: #64748b; }
    .card-left-green { border-left: 4px solid #10b981; }
    .card-left-brand { border-left: 4px solid var(--brand); }

    /* ── Get help tab ── */
    .tool-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 12px; }
    .tool-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 6px;
      background: white;
      border: 2px solid #e2e8f0;
      border-radius: 12px;
      padding: 20px 12px;
      text-align: center;
      cursor: pointer;
      text-decoration: none;
      color: #1e293b;
      font-weight: 600;
      font-size: 13px;
      transition: border-color 0.15s, background 0.15s;
    }
    .tool-btn:hover { border-color: var(--brand); background: var(--brand-light); color: var(--brand); }
    .tool-icon { font-size: 28px; }

    /* ── Spinner ── */
    .spinner { display: none; align-items: center; gap: 10px; padding: 24px 0; color: #64748b; font-size: 13px; }
    .spinner.visible { display: flex; }
    .spin-ring {
      width: 20px; height: 20px;
      border: 2.5px solid #e2e8f0;
      border-top-color: var(--brand);
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
      flex-shrink: 0;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .error-box { background: #fff1f2; border: 1px solid #fecdd3; border-radius: 8px; padding: 12px; color: #be123c; font-size: 13px; }
    .hidden { display: none; }

    /* ── Footer ── */
    .portal-footer {
      background: white;
      border-top: 1px solid #e2e8f0;
      padding: 8px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 10px;
      color: #94a3b8;
      flex-shrink: 0;
    }
    .portal-footer a { color: #64748b; text-decoration: none; font-weight: 600; }

    @media (max-width: 480px) {
      .stat-grid { grid-template-columns: repeat(2, 1fr); }
      .tool-grid { grid-template-columns: 1fr 1fr; }
    }
  </style>
</head>
<body>

<!-- ── Top bar ─────────────────────────────────────────────────── -->
<div class="topbar">
  <div class="topbar-left">
    <div>
      ${safeOrg ? `<div class="topbar-org">${safeOrg}</div>` : ''}
      <div class="topbar-powered">Powered by TCAF · Thriving Communities for All</div>
    </div>
  </div>
  <div class="location-row">
    <input id="locInput" class="loc-input" type="text"
      placeholder="ZIP or city…"
      value="${safeLocation}"
      maxlength="80"
      onkeydown="if(event.key==='Enter')loadStory()">
    <button class="loc-btn" onclick="loadStory()">Go</button>
  </div>
</div>

<!-- ── Tabs ─────────────────────────────────────────────────────── -->
<div class="tabs">
  <div class="tab active" onclick="switchTab('story', this)">📊 Community Story</div>
  <div class="tab" onclick="switchTab('help', this)">🔍 Get Help</div>
  <div class="tab" onclick="switchTab('grants', this)">💰 Grants</div>
  <div class="tab" onclick="switchTab('navigator', this)">🤖 Navigator AI</div>
</div>

<!-- ── Tab: Community Story ───────────────────────────────────── -->
<div id="tab-story" class="content active">
  <div id="story-empty" class="${safeLocation ? 'hidden' : ''}">
    <div class="section-title" style="margin-top:8px">Community Story</div>
    <div class="section-sub">Enter a ZIP code or city above to generate a live community data story.</div>
    <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:12px">
      ${safeLocation ? '' : `
        <button class="btn btn-outline" style="font-size:12px;padding:7px 14px" onclick="setLoc('28472')">28472 — Whiteville NC</button>
        <button class="btn btn-outline" style="font-size:12px;padding:7px 14px" onclick="setLoc('78741')">78741 — East Austin TX</button>
        <button class="btn btn-outline" style="font-size:12px;padding:7px 14px" onclick="setLoc('60619')">60619 — South Side Chicago</button>
      `}
    </div>
  </div>

  <div id="story-spinner" class="spinner"><div class="spin-ring"></div> Pulling live community data…</div>
  <div id="story-error" class="error-box hidden"></div>

  <div id="story-result" class="hidden">
    <div id="story-geo-header" style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
      <div>
        <div id="story-place" class="section-title"></div>
        <div id="story-county" class="section-sub"></div>
      </div>
      <div style="text-align:center">
        <div id="story-grade" class="grade-badge-sm" style="font-size:22px;font-weight:900;padding:6px 14px;border-radius:8px;color:white"></div>
        <div id="story-score" style="font-size:10px;color:#64748b;margin-top:2px"></div>
      </div>
    </div>

    <div class="stat-grid" id="story-stats"></div>

    <div style="margin:12px 0 6px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#64748b">Systems Health</div>
    <div id="story-scores"></div>

    <div id="story-populations-wrap" class="hidden">
      <div style="margin:12px 0 6px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#64748b">At-Risk Populations</div>
      <div id="story-populations"></div>
    </div>

    <div id="story-narrative-wrap" class="hidden">
      <div style="margin:12px 0 6px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#64748b">Community Narrative</div>
      <div id="story-narrative" class="narrative-box"></div>
    </div>

    <div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap">
      <button class="btn btn-primary" id="story-pdf-btn" onclick="downloadPDF()">⬇ Download PDF</button>
      <button class="btn btn-outline" id="story-present-btn" onclick="downloadPresentation()">🖥 Presentation</button>
      <button class="btn btn-outline" onclick="openFull('/community-story-pack')">↗ Full View</button>
    </div>
  </div>
</div>

<!-- ── Tab: Get Help ──────────────────────────────────────────── -->
<div id="tab-help" class="content">
  <div class="section-title">Get Help Now</div>
  <div class="section-sub">Free tools to connect with benefits, resources, and community support.</div>
  <div class="tool-grid">
    <a class="tool-btn" onclick="openFull('/benefits-screener')">
      <span class="tool-icon">✅</span>
      <span>Benefits Screener</span>
      <span style="font-size:11px;font-weight:400;color:#94a3b8">See what you qualify for</span>
    </a>
    <a class="tool-btn" onclick="openFull('/resources')">
      <span class="tool-icon">📍</span>
      <span>Resource Finder</span>
      <span style="font-size:11px;font-weight:400;color:#94a3b8">Find services near you</span>
    </a>
    <a class="tool-btn" onclick="openFull('/get-help')">
      <span class="tool-icon">🆘</span>
      <span>Emergency Help</span>
      <span style="font-size:11px;font-weight:400;color:#94a3b8">Urgent housing, food, crisis</span>
    </a>
    <a class="tool-btn" onclick="openFull('/resident-equity')">
      <span class="tool-icon">🏡</span>
      <span>County Info</span>
      <span style="font-size:11px;font-weight:400;color:#94a3b8">What's happening here</span>
    </a>
    <a class="tool-btn" onclick="openFull('/workforce')">
      <span class="tool-icon">💼</span>
      <span>Jobs & Training</span>
      <span style="font-size:11px;font-weight:400;color:#94a3b8">Workforce pathways</span>
    </a>
    <a class="tool-btn" onclick="openFull('/health-wellness')">
      <span class="tool-icon">❤️</span>
      <span>Health & Wellness</span>
      <span style="font-size:11px;font-weight:400;color:#94a3b8">Prevention & mental health</span>
    </a>
    <a class="tool-btn" onclick="openFull('/reentry-program')">
      <span class="tool-icon">⚖️</span>
      <span>Reentry Support</span>
      <span style="font-size:11px;font-weight:400;color:#94a3b8">Justice navigation</span>
    </a>
    <a class="tool-btn" onclick="openFull('/veterans')">
      <span class="tool-icon">🎖️</span>
      <span>Veterans</span>
      <span style="font-size:11px;font-weight:400;color:#94a3b8">Benefits & services</span>
    </a>
  </div>
  <div style="margin-top:14px">
    <a class="btn btn-primary btn-full" onclick="openFull('/')">Explore All Tools →</a>
  </div>
</div>

<!-- ── Tab: Grants ────────────────────────────────────────────── -->
<div id="tab-grants" class="content">
  <div class="section-title">Grant Intelligence</div>
  <div class="section-sub">Matched funding opportunities for your community and mission.</div>

  <div id="grants-spinner" class="spinner"><div class="spin-ring"></div> Matching grant opportunities…</div>
  <div id="grants-error" class="error-box hidden"></div>
  <div id="grants-result" class="hidden"></div>
  <div id="grants-actions" style="margin-top:14px;display:flex;gap:8px;flex-wrap:wrap">
    <button class="btn btn-primary" onclick="loadGrants()">🔍 Find Grants for This Community</button>
    <button class="btn btn-outline" onclick="openFull('/grant-conduit')">↗ Full Grant Intelligence</button>
  </div>
</div>

<!-- ── Tab: Navigator AI ──────────────────────────────────────── -->
<div id="tab-navigator" class="content">
  <div class="section-title">Navigator AI</div>
  <div class="section-sub">Ask anything about this community — benefits, housing, grants, policy.</div>
  <div class="card card-left-brand" style="margin-top:8px">
    <div class="card-title">🤖 Marcus — Your Community Advisor</div>
    <div class="card-sub" style="margin-top:4px;line-height:1.55">
      Navigator AI can answer questions about benefits eligibility, community resources,
      grant strategy, housing options, workforce pathways, and more.
      It uses live Census data, RPLICE research, and your community context.
    </div>
  </div>
  <div style="margin-top:14px;display:flex;gap:8px;flex-wrap:wrap">
    <button class="btn btn-primary" onclick="openFull('/navigator')">Open Navigator AI →</button>
    <button class="btn btn-outline" onclick="openFull('/community-story-pack')">📊 Community Story Pack</button>
  </div>
  <div style="margin-top:16px">
    <div style="font-size:12px;font-weight:600;color:#64748b;margin-bottom:8px">Common questions:</div>
    <div style="display:flex;flex-direction:column;gap:6px">
      ${[
        "What are the biggest health gaps in this community?",
        "What grants are available for emergency housing assistance?",
        "How does our poverty rate compare to the state average?",
        "What evidence-based programs work for food insecurity?",
      ].map(q => `<button class="btn btn-outline" style="font-size:12px;padding:8px 12px;justify-content:flex-start;text-align:left"
        onclick="openFull('/navigator?q=${encodeURIComponent(q)}')">${q}</button>`).join('')}
    </div>
  </div>
</div>

<!-- ── Footer ───────────────────────────────────────────────────── -->
<div class="portal-footer">
  <span>Data: Census ACS · RPLICE · HUD · Gun Violence Registry</span>
  <span>Powered by <a href="https://thrivingcommunitiesforall.com" target="_blank" rel="noopener">TCAF</a></span>
</div>

<script>
(function() {
  var ORIGIN = window.location.origin;
  var currentLoc = ${JSON.stringify(safeLocation)};
  var orgName    = ${JSON.stringify(safeOrg)};
  var storyData  = null;

  // ── Tab switching ─────────────────────────────────────────────
  window.switchTab = function(id, el) {
    document.querySelectorAll('.tab').forEach(function(t) { t.classList.remove('active'); });
    document.querySelectorAll('.content').forEach(function(c) { c.classList.remove('active'); });
    el.classList.add('active');
    document.getElementById('tab-' + id).classList.add('active');
    // Auto-load story if switching to story tab and have a location
    if (id === 'story' && currentLoc && !storyData) { loadStory(); }
    if (id === 'grants' && currentLoc && !document.getElementById('grants-result').children.length) {
      // don't auto-load grants — let user click the button
    }
  };

  // ── Helpers ───────────────────────────────────────────────────
  window.openFull = function(path) {
    window.open(ORIGIN + path, '_blank', 'noopener,noreferrer');
  };

  window.setLoc = function(zip) {
    document.getElementById('locInput').value = zip;
    loadStory();
  };

  function fmt(v, suffix) {
    if (v == null || isNaN(Number(v))) return '—';
    return Number(v).toFixed(1) + (suffix || '');
  }
  function fmtPct(v) { return fmt(v, '%'); }
  function fmtNum(v) { return v ? Number(v).toLocaleString() : '—'; }
  function fmtDollar(n) {
    if (!n) return '—';
    if (n >= 1e6) return '$' + (n/1e6).toFixed(1) + 'M';
    if (n >= 1e3) return '$' + (n/1e3).toFixed(0) + 'K';
    return '$' + Math.round(n);
  }
  function gradeColor(g) {
    return g==='A'?'#16a34a':g==='B'?'#2563eb':g==='C'?'#d97706':g==='D'?'#dc2626':'#7f1d1d';
  }
  function el(id) { return document.getElementById(id); }

  // ── Load story ────────────────────────────────────────────────
  window.loadStory = function() {
    var loc = (document.getElementById('locInput').value || '').trim();
    if (!loc) return;
    currentLoc = loc;
    storyData = null;

    el('story-empty').classList.add('hidden');
    el('story-error').classList.add('hidden');
    el('story-result').classList.add('hidden');
    el('story-spinner').classList.add('visible');

    fetch(ORIGIN + '/api/community-story/pack', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ location: loc, orgName: orgName || undefined, includeGrantData: false }),
    })
    .then(function(r) { return r.ok ? r.json() : r.json().then(function(e) { throw new Error(e.error || 'Failed'); }); })
    .then(function(data) {
      el('story-spinner').classList.remove('visible');
      storyData = data;
      renderStory(data);
    })
    .catch(function(err) {
      el('story-spinner').classList.remove('visible');
      el('story-error').textContent = err.message || 'Could not load community data. Try a different ZIP code.';
      el('story-error').classList.remove('hidden');
    });
  };

  function renderStory(data) {
    var brief = data.brief || {};
    var geo   = brief.geography || {};
    var demo  = brief.demographics || {};
    var scores = brief.systemsScores || {};
    var atRisk = brief.atRiskPopulations || [];
    var narrative = brief.narrative || '';

    el('story-place').textContent   = geo.displayName || geo.input || currentLoc;
    el('story-county').textContent  = [geo.countyName, geo.state].filter(Boolean).join(', ');

    var gradeEl = el('story-grade');
    gradeEl.textContent = brief.overallGrade || '—';
    gradeEl.style.background = gradeColor(brief.overallGrade);

    el('story-score').textContent = brief.overallScore != null ? brief.overallScore + '/100' : '';

    // Stats
    var stats = [
      { label: 'Population',     value: fmtNum(demo.totalPopulation),     warn: false },
      { label: 'Poverty Rate',   value: fmtPct(demo.povertyRate),         warn: demo.povertyRate > 15 },
      { label: 'Uninsured',      value: fmtPct(demo.uninsuredRate),       warn: demo.uninsuredRate > 10 },
      { label: 'Unemployed',     value: fmtPct(demo.unemploymentRate),    warn: demo.unemploymentRate > 8 },
      { label: 'Housing Burden', value: fmtPct(demo.housingCostBurden),   warn: demo.housingCostBurden > 30 },
      { label: 'Median Income',  value: fmtDollar(demo.medianIncome),     warn: false },
    ];
    el('story-stats').innerHTML = stats.map(function(s) {
      return '<div class="stat-card' + (s.warn ? ' warn' : '') + '">' +
        '<div class="stat-num">' + s.value + '</div>' +
        '<div class="stat-label">' + s.label + '</div></div>';
    }).join('');

    // Systems scores
    var scoresHtml = Object.entries(scores).slice(0,8).map(function(entry) {
      var s = entry[1];
      var sc = Math.round(s.score || 0);
      var gr = s.grade || '—';
      return '<div class="score-row">' +
        '<div class="score-label-row"><span>' + (s.label || entry[0]) + '</span>' +
        '<span class="grade-badge-sm" style="background:' + gradeColor(gr) + ';color:white">' + gr + ' · ' + sc + '</span></div>' +
        '<div class="score-bar-bg"><div class="score-bar" style="width:' + sc + '%"></div></div>' +
        (s.keyGap ? '<div style="font-size:10px;color:#94a3b8;margin-top:2px">' + s.keyGap.slice(0,80) + '</div>' : '') +
        '</div>';
    }).join('');
    el('story-scores').innerHTML = scoresHtml;

    // At-risk populations
    if (atRisk.length) {
      el('story-populations').innerHTML = atRisk.map(function(p) {
        return '<span class="tag">' + p + '</span>';
      }).join('');
      el('story-populations-wrap').classList.remove('hidden');
    }

    // Narrative
    if (narrative) {
      el('story-narrative').textContent = narrative;
      el('story-narrative-wrap').classList.remove('hidden');
    }

    el('story-result').classList.remove('hidden');
  }

  // ── PDF download ──────────────────────────────────────────────
  window.downloadPDF = function() {
    if (!currentLoc) return;
    var btn = el('story-pdf-btn');
    btn.disabled = true;
    btn.textContent = '⏳ Generating…';
    fetch(ORIGIN + '/api/community-story/pdf', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ location: currentLoc, orgName: orgName || undefined, includeGrantData: false }),
    })
    .then(function(r) { return r.blob(); })
    .then(function(blob) {
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url; a.download = 'community-story-' + currentLoc.replace(/[^a-z0-9]/gi,'-').slice(0,40) + '.pdf';
      a.click(); URL.revokeObjectURL(url);
    })
    .finally(function() { btn.disabled = false; btn.textContent = '⬇ Download PDF'; });
  };

  // ── Presentation download ─────────────────────────────────────
  window.downloadPresentation = function() {
    if (!currentLoc) return;
    var btn = el('story-present-btn');
    btn.disabled = true; btn.textContent = '⏳ Building…';
    fetch(ORIGIN + '/api/community-story/presentation', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ location: currentLoc, orgName: orgName || undefined, includeGrantData: false }),
    })
    .then(function(r) { return r.blob(); })
    .then(function(blob) {
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a'); a.href = url;
      a.download = 'community-story-' + currentLoc.replace(/[^a-z0-9]/gi,'-').slice(0,40) + '.html';
      a.click(); URL.revokeObjectURL(url);
    })
    .finally(function() { btn.disabled = false; btn.textContent = '🖥 Presentation'; });
  };

  // ── Load grants ───────────────────────────────────────────────
  window.loadGrants = function() {
    if (!currentLoc) { alert('Enter a location first.'); return; }
    el('grants-spinner').classList.add('visible');
    el('grants-error').classList.add('hidden');
    el('grants-result').classList.add('hidden');
    el('grants-actions').style.display = 'none';

    fetch(ORIGIN + '/api/grant-conduit/package', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ geography: { state: 'NC', zip: currentLoc }, orgType: 'nonprofit', includeGrantData: true }),
    })
    .then(function(r) { return r.ok ? r.json() : r.json().then(function(e){ throw new Error(e.error||'Failed'); }); })
    .then(function(data) {
      el('grants-spinner').classList.remove('visible');
      var opps = data.matchedOpportunities || [];
      var html = opps.length
        ? opps.slice(0,8).map(function(o) {
            return '<div class="card card-left-green">' +
              '<div class="card-title">' + (o.title||o.name||'Opportunity').slice(0,90) + '</div>' +
              '<div class="card-sub">' + (o.agency||o.funder||'') +
              (o.maxAward ? ' · Up to ' + fmtDollar(o.maxAward) : '') +
              (o.deadline ? ' · Deadline: ' + String(o.deadline).slice(0,20) : '') + '</div></div>';
          }).join('')
        : '<div class="card-sub">No matches found for this location. Try the full Grant Intelligence tool for more options.</div>';
      el('grants-result').innerHTML = html;
      el('grants-result').classList.remove('hidden');
      el('grants-actions').style.display = 'flex';
      el('grants-actions').querySelector('button').textContent = '🔄 Refresh';
    })
    .catch(function(err) {
      el('grants-spinner').classList.remove('visible');
      el('grants-error').textContent = err.message;
      el('grants-error').classList.remove('hidden');
      el('grants-actions').style.display = 'flex';
    });
  };

  // ── Auto-load story if location is pre-set ────────────────────
  if (currentLoc) {
    loadStory();
  }
})();
</script>
</body>
</html>`;
}
