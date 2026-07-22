// api/_json-response.js
function sanitizeJsonValue(value, depth = 0) {
  if (depth > 20) return "[truncated]";
  if (value instanceof Error) {
    return { error: value.message };
  }
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeJsonValue(item, depth + 1));
  }
  if (value && typeof value === "object") {
    const clone = {};
    for (const [key, nested] of Object.entries(value)) {
      if (key === "stack" || key === "stackTrace" || key === "cause") continue;
      clone[key] = sanitizeJsonValue(nested, depth + 1);
    }
    return clone;
  }
  return value;
}
function jsonResponse(body, status, headers = {}) {
  return new Response(JSON.stringify(sanitizeJsonValue(body)), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...headers
    }
  });
}

// api/mcp/rpc.ts
function withMcpNoStore(extraHeaders = {}) {
  return { ...extraHeaders, "Cache-Control": "no-store" };
}
function rpcOk(id, result, extraHeaders = {}) {
  return jsonResponse({ jsonrpc: "2.0", id: id ?? null, result }, 200, withMcpNoStore(extraHeaders));
}
function rpcError(id, code, message, extraHeaders = {}) {
  return jsonResponse({ jsonrpc: "2.0", id: id ?? null, error: { code, message } }, 200, withMcpNoStore(extraHeaders));
}

// api/mcp/ui/shell.ts
var UI_PROTOCOL_VERSION = "2026-01-26";
var UI_RESOURCE_MIME_TYPE = "text/html;profile=mcp-app";
var UI_CONNECT_DOMAINS = ["https://worldmonitor.app", "https://www.worldmonitor.app"];
var UI_FRAME_ANCESTORS = ["https://chatgpt.com", "https://claude.ai", "https://claude.com"];
function buildUiMeta() {
  return {
    ui: {
      csp: {
        connectDomains: [...UI_CONNECT_DOMAINS],
        resourceDomains: [],
        frameDomains: [],
        baseUriDomains: []
      },
      prefersBorder: true
    }
  };
}
var SHARED_CSP = "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src 'self' data:; connect-src 'self' " + UI_CONNECT_DOMAINS.join(" ") + "; frame-ancestors " + UI_FRAME_ANCESTORS.join(" ") + "; form-action 'none'; base-uri 'none'";
var SHARED_STYLE_TOKENS = `
  :root {
    --bg: #ffffff; --fg: #0f172a; --muted: #64748b; --card: #f8fafc;
    --border: #e2e8f0; --accent: #2563eb;
    --low: #16a34a; --moderate: #ca8a04; --high: #ea580c; --severe: #dc2626;
    --up: #16a34a; --down: #dc2626;
  }
  [data-theme="dark"] {
    --bg: #0b1220; --fg: #e5e7eb; --muted: #94a3b8; --card: #131c2e;
    --border: #1e293b; --accent: #60a5fa;
  }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: var(--bg); color: var(--fg);
    font: 14px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
  .wrap { padding: 16px; max-width: 560px; }
  .head { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; }
  .title { font-size: 20px; font-weight: 650; letter-spacing: 0.2px; }
  .badge { font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--muted); }
  .empty { color: var(--muted); padding: 8px 0; }
  .foot { margin-top: 14px; font-size: 11px; color: var(--muted); }
  a { color: var(--accent); text-decoration: none; }
  .pbar { height: 6px; border-radius: 999px; background: var(--border); overflow: hidden; margin-top: 5px; }
  .pbar > span { display: block; height: 100%; width: 0%; background: var(--accent); }
`;
var SHARED_BRIDGE_HEAD = `
(function () {
  "use strict";
  var parentWin = window.parent;

  function post(msg) {
    try { parentWin.postMessage(msg, "*"); } catch (e) { /* host gone */ }
  }
  function notify(method, params) {
    post({ jsonrpc: "2.0", method: method, params: params || {} });
  }

  // ---- shared render helpers (widget renderBody uses these) ----
  function q(id) { return document.getElementById(id); }
  function num(v) {
    if (v == null) return null;
    var n = typeof v === "number" ? v : Number(v);
    return isFinite(n) ? n : null;
  }
  // Normalise both full array fields and summary:true fields shaped as
  // { count, sample }. The available flag remains false for absent/null/malformed
  // fields so widgets can distinguish a partial cache miss from a real empty
  // array (including { count: 0, sample: [] }).
  function listState(v) {
    if (Array.isArray(v)) return { available: true, items: v };
    if (v && typeof v === "object" && Array.isArray(v.sample)) {
      return { available: true, items: v.sample };
    }
    return { available: false, items: [] };
  }
  function clampPct(n) { return Math.max(0, Math.min(100, n)); }
  function setText(id, text) { var e = q(id); if (e) e.textContent = text == null ? "\u2014" : String(text); }
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = String(text);
    return e;
  }
  // Shared 0-100 probability bar: a .pbar node with a filled span, or null when
  // pct is not a finite number. Callers pass an already-0-100 value and append
  // the returned node under a market / forecast row.
  function probabilityBar(pct) {
    if (typeof pct !== "number" || !isFinite(pct)) return null;
    var bar = el("div", "pbar");
    var fill = el("span");
    fill.style.width = clampPct(pct) + "%";
    bar.appendChild(fill);
    return bar;
  }
  function cssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }
  function pctText(v) {
    var n = num(v);
    if (n == null) return "\u2014";
    return (n > 0 ? "+" : "") + n.toFixed(2) + "%";
  }
  function levelFor(score) {
    if (typeof score !== "number" || isNaN(score)) return { label: "Unknown", varName: "--muted" };
    if (score >= 75) return { label: "Severe", varName: "--severe" };
    if (score >= 50) return { label: "High", varName: "--high" };
    if (score >= 25) return { label: "Moderate", varName: "--moderate" };
    return { label: "Low", varName: "--low" };
  }
  // Text helpers centralised here so widget renderBody stays regex/escape-free.
  function collapseWs(s) { return String(s == null ? "" : s).replace(/\\s+/g, " ").trim(); }
  function paragraphs(s) {
    return String(s == null ? "" : s)
      .split(/\\n\\s*\\n/)
      .map(function (p) { return collapseWs(p); })
      .filter(Boolean);
  }
  function httpUrl(u) {
    if (typeof u !== "string") return "";
    try {
      var parsed = new URL(u.trim());
      return (parsed.protocol === "http:" || parsed.protocol === "https:") ? parsed.href : "";
    } catch (e) { return ""; }
  }
  function countryName(code) {
    var c = String(code == null ? "" : code).toUpperCase().slice(0, 2);
    if (!c) return "";
    try {
      var n = new Intl.DisplayNames(["en"], { type: "region" }).of(c);
      return n || c;
    } catch (e) { return c; }
  }

  function reportSize() {
    var root = q("root");
    if (!root) return;
    var h = Math.ceil(root.getBoundingClientRect().height) + 8;
    notify("ui/notifications/size-changed", { height: h });
  }

  function extractToolData(result) {
    if (!result || typeof result !== "object") return null;
    if (result.structuredContent && typeof result.structuredContent === "object") {
      return result.structuredContent;
    }
    if (Array.isArray(result.content)) {
      for (var i = 0; i < result.content.length; i++) {
        var c = result.content[i];
        if (c && c.type === "text" && typeof c.text === "string") {
          try { return JSON.parse(c.text); } catch (e) { /* not JSON */ }
        }
      }
    }
    return null;
  }

  function applyTheme(hostContext) {
    var theme = hostContext && hostContext.theme;
    if (theme === "dark" || theme === "light") {
      document.documentElement.setAttribute("data-theme", theme);
    } else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      document.documentElement.setAttribute("data-theme", "dark");
    }
  }

  // Soft-error envelopes are SUCCESSFUL tools/call results (HTTP 200, valid
  // JSON) that carry an error sentinel instead of renderable data \u2014 the
  // dispatcher returns { _budget_exceeded, ... } when the tool output exceeds
  // its byte budget, and a bad jmespath projection returns { _jmespath_error,
  // ... }. A few tools also surface user-input faults as a result-level
  // { error: "..." } string. Rendering any of these through renderData() shows
  // a blank / empty-success dashboard, so detect them and surface a visible
  // message instead. Returns the message string, or null when data is genuinely
  // renderable.
  function softError(data) {
    if (!data || typeof data !== "object") return null;
    if (data._budget_exceeded === true) {
      return "This response is too large to display here. Narrow the request (fewer items, or a jmespath projection) and try again.";
    }
    if (data._jmespath_error) {
      return "The response projection could not be applied, so there is nothing to render. Remove the jmespath argument and retry.";
    }
    if (typeof data.error === "string" && data.error) return data.error;
    return null;
  }
  // Every fleet widget owns an #empty placeholder and an #card body; on a soft
  // error we reuse #empty as the error slot (hide the card) so the message is
  // visible regardless of which widget is mounted.
  function showError(msg) {
    var card = q("card");
    if (card) card.style.display = "none";
    var empty = q("empty");
    if (empty) { empty.textContent = msg; empty.style.display = "block"; }
  }

  function safeRender(data) {
    var errMsg = softError(data);
    if (errMsg) { showError(errMsg); reportSize(); return; }
    try { renderData(data); } catch (e) { /* never break the host on a bad payload */ }
    reportSize();
  }
`;
function renderBridgeTail(appName) {
  return `
  window.addEventListener("message", function (event) {
    if (event.source !== parentWin) return;
    var msg = event.data;
    if (!msg || typeof msg !== "object" || msg.jsonrpc !== "2.0") return;

    if (msg.id === 1 && msg.result) {
      applyTheme(msg.result.hostContext);
      notify("ui/notifications/initialized", {});
      reportSize();
      return;
    }

    switch (msg.method) {
      case "ui/notifications/tool-result": {
        var data = extractToolData(msg.params && msg.params.result ? msg.params.result : msg.params);
        if (data) safeRender(data);
        break;
      }
      case "ui/notifications/tool-input":
        break;
      case "ui/notifications/host-context-changed":
        applyTheme(msg.params && msg.params.hostContext ? msg.params.hostContext : msg.params);
        break;
      default:
        break;
    }
  });

  applyTheme(null);

  post({
    jsonrpc: "2.0",
    id: 1,
    method: "ui/initialize",
    params: {
      protocolVersion: "${UI_PROTOCOL_VERSION}",
      appInfo: { name: ${JSON.stringify(appName)}, version: "1.0.0" },
      appCapabilities: {}
    }
  });
})();
`;
}
function buildAppHtml(spec) {
  const bridge = SHARED_BRIDGE_HEAD + "\n  function renderData(data) {\n" + spec.renderBody + "\n  }\n" + renderBridgeTail(spec.appName);
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<!-- MCP Apps view quality: uppercase DOCTYPE + color-scheme so the host renders
     light/dark correctly (orank mcp-apps-ui-quality + mcp-view-domain checks). -->
<meta name="color-scheme" content="light dark">
<!-- MCP Apps view CSP (orank mcp-view-csp): all 4 required directive categories
     scoped. Shared across the widget fleet via api/mcp/ui/shell.ts. -->
<meta http-equiv="Content-Security-Policy" content="${SHARED_CSP}">
<title>${spec.title}</title>
<style>${SHARED_STYLE_TOKENS}${spec.styles}</style>
</head>
<body>
<div class="wrap" id="root">
${spec.body}
</div>
<script>${bridge}</script>
</body>
</html>`;
}

// api/mcp/ui/chokepoint-monitor-app.ts
var STYLES = `
  .crow { margin-top: 14px; padding-top: 12px; border-top: 1px solid var(--border); }
  .crow:first-child { border-top: none; }
  .crow-head { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; }
  .cname { font-size: 15px; font-weight: 600; }
  .risk { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;
    padding: 1px 8px; border-radius: 999px; border: 1px solid var(--border); }
  .cstats { display: flex; gap: 18px; margin-top: 6px; flex-wrap: wrap; }
  .cstat { display: flex; flex-direction: column; }
  .cstat .k { font-size: 11px; color: var(--muted); }
  .cstat .v { font-size: 15px; font-weight: 600; font-variant-numeric: tabular-nums; }
  .csum { margin-top: 6px; font-size: 12px; color: var(--muted); }
`;
var BODY = `
  <div class="head">
    <div class="title">Chokepoint Monitor</div>
    <div class="badge">WorldMonitor Maritime</div>
  </div>
  <div class="empty" id="empty">Waiting for chokepoint data\u2026</div>
  <div id="card" style="display:none">
    <div id="rows"></div>
    <div class="foot" id="foot"></div>
  </div>
`;
var RENDER = `
    if (!data || typeof data !== "object") return;
    var d = data.data && typeof data.data === "object" ? data.data : data;
    q("empty").style.display = "none";
    q("card").style.display = "block";

    function prettyName(key) {
      var s = String(key == null ? "" : key).split("_").join(" ").trim();
      if (!s) return "\u2014";
      return s.charAt(0).toUpperCase() + s.slice(1);
    }
    function riskColor(r) {
      if (r === "critical" || r === "severe") return cssVar("--severe");
      if (r === "high" || r === "elevated") return cssVar("--high");
      if (r === "moderate" || r === "warning") return cssVar("--moderate");
      return cssVar("--low");
    }
    function stat(k, v, color) {
      var wrap = el("div", "cstat");
      wrap.appendChild(el("span", "k", k));
      var val = el("span", "v", v);
      if (color) val.style.color = color;
      wrap.appendChild(val);
      return wrap;
    }

    var ts = d["transit-summaries"];
    var summaries = ts && typeof ts === "object" ? ts.summaries : null;
    var host = q("rows");
    host.textContent = "";
    var count = 0;
    if (summaries && typeof summaries === "object") {
      var keys = Object.keys(summaries);
      for (var i = 0; i < keys.length && count < 20; i++) {
        var s = summaries[keys[i]];
        if (!s || typeof s !== "object" || s.dataAvailable === false) continue;
        var row = el("div", "crow");
        var head = el("div", "crow-head");
        head.appendChild(el("span", "cname", prettyName(keys[i])));
        var risk = collapseWs(s.riskLevel).toLowerCase() || "normal";
        var badge = el("span", "risk", risk);
        var rc = riskColor(risk);
        badge.style.color = rc;
        badge.style.borderColor = rc;
        head.appendChild(badge);
        row.appendChild(head);

        var stats = el("div", "cstats");
        var total = num(s.todayTotal);
        stats.appendChild(stat("Transits today", total == null ? "\u2014" : String(Math.round(total))));
        var wow = num(s.wowChangePct);
        var wowColor = wow == null ? null : (wow >= 0 ? cssVar("--up") : cssVar("--down"));
        stats.appendChild(stat("Week over week", pctText(wow), wowColor));
        var tanker = num(s.todayTanker);
        if (tanker != null) stats.appendChild(stat("Tanker", String(Math.round(tanker))));
        row.appendChild(stats);

        if (s.riskSummary) row.appendChild(el("div", "csum", collapseWs(s.riskSummary)));
        host.appendChild(row);
        count++;
      }
    }
    if (!count) host.appendChild(el("div", "empty", "No chokepoint transit data available."));

    q("foot").textContent = data.cached_at
      ? "Snapshot: " + collapseWs(data.cached_at) + (data.stale ? " (stale)" : "")
      : "";
`;
var CHOKEPOINT_MONITOR_APP_HTML = buildAppHtml({
  title: "Chokepoint Monitor \u2014 WorldMonitor",
  appName: "worldmonitor-chokepoint-monitor",
  styles: STYLES,
  body: BODY,
  renderBody: RENDER
});

// api/mcp/ui/country-brief-app.ts
var STYLES2 = `
  .lens { display: inline-block; margin: 4px 0 0; font-size: 11px; color: var(--muted); }
  .lens b { color: var(--fg); font-weight: 600; }
  .brief { margin: 14px 0 4px; }
  .brief .para { margin: 0 0 10px; font-size: 14px; line-height: 1.6; }
  .section { margin-top: 16px; padding-top: 12px; border-top: 1px solid var(--border); }
  .sec-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--muted); margin-bottom: 8px; }
  .src-row { display: flex; flex-direction: column; gap: 1px; padding: 6px 0; border-bottom: 1px solid var(--border); }
  .src-row:last-child { border-bottom: none; }
  .src-name { font-size: 11px; color: var(--accent); font-weight: 600; }
  .src-title { font-size: 12px; color: var(--fg); }
`;
var BODY2 = `
  <div class="head">
    <div class="title" id="title">Country Brief</div>
    <div class="badge">WorldMonitor Intelligence</div>
  </div>
  <div class="lens" id="lens" style="display:none"></div>
  <div class="empty" id="empty">Waiting for country-brief data\u2026</div>
  <div id="card" style="display:none">
    <div class="brief" id="brief"></div>
    <div class="section" id="src-sec" style="display:none">
      <div class="sec-label">Sources</div>
      <div class="sources" id="sources"></div>
    </div>
    <div class="foot" id="foot"></div>
  </div>
`;
var RENDER2 = `
    if (!data || typeof data !== "object") return;
    q("empty").style.display = "none";
    q("card").style.display = "block";

    var name = collapseWs(data.countryName) || countryName(data.countryCode || data.country_code);
    setText("title", name ? name + " Brief" : "Country Brief");

    var fw = collapseWs(data.framework);
    if (fw) {
      var lens = q("lens");
      lens.textContent = "";
      lens.appendChild(el("span", null, "Lens: "));
      lens.appendChild(el("b", null, fw));
      lens.style.display = "block";
    } else {
      q("lens").style.display = "none";
    }

    var brief = typeof data.brief === "string" ? data.brief
      : (typeof data.summary === "string" ? data.summary : "");
    var briefEl = q("brief");
    briefEl.textContent = "";
    var paras = paragraphs(brief);
    for (var i = 0; i < paras.length; i++) briefEl.appendChild(el("p", "para", paras[i]));
    if (!briefEl.childNodes.length) briefEl.appendChild(el("div", "empty", "No brief text available."));

    var srcs = Array.isArray(data.sources) ? data.sources : [];
    var srcHost = q("sources");
    srcHost.textContent = "";
    for (var k = 0; k < srcs.length && srcHost.childNodes.length < 8; k++) {
      var s = srcs[k];
      if (!s || typeof s !== "object") continue;
      var row = el("div", "src-row");
      row.appendChild(el("span", "src-name", collapseWs(s.source) || "source"));
      var url = httpUrl(s.url);
      if (s.title) {
        var titleText = collapseWs(s.title);
        if (url) {
          var a = el("a", "src-title", titleText);
          a.href = url;
          a.target = "_blank";
          a.rel = "noopener noreferrer";
          row.appendChild(a);
        } else {
          row.appendChild(el("span", "src-title", titleText));
        }
      }
      srcHost.appendChild(row);
    }
    q("src-sec").style.display = srcHost.childNodes.length ? "block" : "none";

    var prov = [data.provider, data.model].filter(Boolean).map(collapseWs).filter(Boolean).join(" \xB7 ");
    var gen = data.generatedAt != null ? "Generated " + collapseWs(data.generatedAt) : "";
    q("foot").textContent = [prov, gen].filter(Boolean).join(" \xB7 ");
`;
var COUNTRY_BRIEF_APP_HTML = buildAppHtml({
  title: "Country Brief \u2014 WorldMonitor",
  appName: "worldmonitor-country-brief",
  styles: STYLES2,
  body: BODY2,
  renderBody: RENDER2
});

// api/mcp/ui/country-risk-app.ts
var COUNTRY_RISK_APP_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<!-- MCP Apps view quality: uppercase DOCTYPE + color-scheme so the host renders
     light/dark correctly (orank mcp-apps-ui-quality + mcp-view-domain checks). -->
<meta name="color-scheme" content="light dark">
<!-- MCP Apps view CSP (orank mcp-view-csp). Scopes all 4 required directive
     categories: connect-src pins the MCP origin; frame-ancestors allowlists the
     agent hosts that embed this shell; form-action is locked ('none' \u2014 no forms);
     img/script/style-src are specific ('unsafe-inline' keeps the inline bridge +
     styles working) rather than '*'. default-src 'none' earns full credit over a
     permissive default. frame-ancestors is advisory in a <meta> CSP (browsers honor
     it only via HTTP header) but the static scanner reads it here. -->
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src 'self' data:; connect-src 'self' https://worldmonitor.app https://www.worldmonitor.app; frame-ancestors https://chatgpt.com https://claude.ai https://claude.com; form-action 'none'; base-uri 'none'">
<title>Country Risk \u2014 WorldMonitor</title>
<style>
  :root {
    --bg: #ffffff; --fg: #0f172a; --muted: #64748b; --card: #f8fafc;
    --border: #e2e8f0; --accent: #2563eb;
    --low: #16a34a; --moderate: #ca8a04; --high: #ea580c; --severe: #dc2626;
  }
  [data-theme="dark"] {
    --bg: #0b1220; --fg: #e5e7eb; --muted: #94a3b8; --card: #131c2e;
    --border: #1e293b; --accent: #60a5fa;
  }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: var(--bg); color: var(--fg);
    font: 14px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
  .wrap { padding: 16px; max-width: 520px; }
  .head { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; }
  .country { font-size: 20px; font-weight: 650; letter-spacing: 0.2px; }
  .badge { font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em;
    color: var(--muted); }
  .cii-row { display: flex; align-items: center; gap: 14px; margin: 14px 0 4px; }
  .cii-score { font-size: 40px; font-weight: 700; line-height: 1; font-variant-numeric: tabular-nums; }
  .cii-of { color: var(--muted); font-size: 13px; }
  .level { font-weight: 600; font-size: 13px; padding: 2px 10px; border-radius: 999px;
    background: var(--card); border: 1px solid var(--border); }
  .bar { height: 8px; border-radius: 999px; background: var(--border); overflow: hidden; margin: 6px 0 18px; }
  .bar > span { display: block; height: 100%; background: var(--accent); width: 0%; transition: width .3s ease; }
  .components { display: grid; grid-template-columns: 1fr; gap: 10px; }
  .comp { }
  .comp-top { display: flex; justify-content: space-between; font-size: 12px; color: var(--muted); }
  .comp-name { text-transform: capitalize; color: var(--fg); font-weight: 550; }
  .comp-bar { height: 6px; border-radius: 999px; background: var(--border); overflow: hidden; margin-top: 4px; }
  .comp-bar > span { display: block; height: 100%; width: 0%; }
  .meta { margin-top: 18px; padding-top: 14px; border-top: 1px solid var(--border);
    display: grid; grid-template-columns: 1fr 1fr; gap: 10px 16px; font-size: 12px; }
  .meta .k { color: var(--muted); }
  .meta .v { font-weight: 600; }
  .foot { margin-top: 14px; font-size: 11px; color: var(--muted); }
  .empty { color: var(--muted); padding: 8px 0; }
  a { color: var(--accent); text-decoration: none; }
</style>
</head>
<body>
<div class="wrap" id="root">
  <div class="empty" id="empty">Waiting for country-risk data\u2026</div>
  <div id="card" style="display:none">
    <div class="head">
      <div class="country" id="country">\u2014</div>
      <div class="badge" id="badge">Composite Instability Index</div>
    </div>
    <div class="cii-row">
      <div class="cii-score" id="cii">\u2014</div>
      <div class="cii-of">/ 100</div>
      <div class="level" id="level">\u2014</div>
    </div>
    <div class="bar"><span id="ciibar"></span></div>
    <div class="components" id="components"></div>
    <div class="meta">
      <div class="k">Travel advisory</div><div class="v" id="advisory">\u2014</div>
      <div class="k">Sanctions exposure</div><div class="v" id="sanctions">\u2014</div>
    </div>
    <div class="foot" id="foot"></div>
  </div>
</div>
<script>
(function () {
  "use strict";
  var parentWin = window.parent;

  function post(msg) {
    // Opaque sandbox origin: the host expects "*" and validates on its side.
    try { parentWin.postMessage(msg, "*"); } catch (e) { /* host gone */ }
  }
  function notify(method, params) {
    post({ jsonrpc: "2.0", method: method, params: params || {} });
  }

  function levelFor(score) {
    if (typeof score !== "number" || isNaN(score)) return { label: "Unknown", varName: "--muted" };
    if (score >= 75) return { label: "Severe", varName: "--severe" };
    if (score >= 50) return { label: "High", varName: "--high" };
    if (score >= 25) return { label: "Moderate", varName: "--moderate" };
    return { label: "Low", varName: "--low" };
  }
  function num(v) {
    var n = typeof v === "number" ? v : Number(v);
    return isFinite(n) ? n : null;
  }
  function clampPct(n) { return Math.max(0, Math.min(100, n)); }

  function setText(id, text) {
    var el = document.getElementById(id);
    if (el) el.textContent = text == null ? "\u2014" : String(text);
  }

  function describeAdvisory(a) {
    if (a == null) return "\u2014";
    if (typeof a === "string") return a;
    if (typeof a === "object" && a.level != null) {
      var lvl = num(a.level);
      return lvl == null ? "\u2014" : "Level " + lvl;
    }
    return "\u2014";
  }
  function describeSanctions(s) {
    if (s == null) return "None";
    if (Array.isArray(s)) return s.length === 0 ? "None" : String(s.length) + " listed";
    if (typeof s === "object") {
      var keys = Object.keys(s);
      return keys.length === 0 ? "None" : String(keys.length) + " field(s)";
    }
    if (typeof s === "number") return String(s);
    return String(s);
  }

  function render(data) {
    if (!data || typeof data !== "object") return;
    document.getElementById("empty").style.display = "none";
    document.getElementById("card").style.display = "block";

    setText("country", data.country_code || data.country || "\u2014");

    var cii = num(data.cii);
    setText("cii", cii == null ? "\u2014" : String(Math.round(cii)));
    var lv = levelFor(cii);
    var levelEl = document.getElementById("level");
    levelEl.textContent = lv.label;
    if (cii != null) {
      var color = getComputedStyle(document.documentElement).getPropertyValue(lv.varName).trim();
      levelEl.style.color = color;
      var bar = document.getElementById("ciibar");
      bar.style.width = clampPct(cii) + "%";
      bar.style.background = color || "var(--accent)";
    }

    var comps = (data.components && typeof data.components === "object") ? data.components : {};
    var order = ["unrest", "conflict", "security", "news"];
    var host = document.getElementById("components");
    host.textContent = "";
    var any = false;
    order.forEach(function (key) {
      var val = num(comps[key]);
      if (val == null) return;
      any = true;
      var wrap = document.createElement("div");
      wrap.className = "comp";
      var top = document.createElement("div");
      top.className = "comp-top";
      var name = document.createElement("span");
      name.className = "comp-name";
      name.textContent = key;
      var v = document.createElement("span");
      v.textContent = String(Math.round(val));
      top.appendChild(name); top.appendChild(v);
      var cbar = document.createElement("div");
      cbar.className = "comp-bar";
      var fill = document.createElement("span");
      var cl = levelFor(val);
      var ccolor = getComputedStyle(document.documentElement).getPropertyValue(cl.varName).trim();
      fill.style.width = clampPct(val) + "%";
      fill.style.background = ccolor || "var(--accent)";
      cbar.appendChild(fill);
      wrap.appendChild(top); wrap.appendChild(cbar);
      host.appendChild(wrap);
    });
    if (!any) {
      var none = document.createElement("div");
      none.className = "empty";
      none.textContent = "No component breakdown available.";
      host.appendChild(none);
    }

    setText("advisory", describeAdvisory(data.travelAdvisory));
    setText("sanctions", describeSanctions(data.sanctionsExposure));

    var foot = document.getElementById("foot");
    if (data.cached_at) {
      foot.textContent = "Snapshot: " + String(data.cached_at) + (data.stale ? " (stale)" : "");
    } else {
      foot.textContent = "";
    }
    reportSize();
  }

  function applyTheme(hostContext) {
    var theme = hostContext && hostContext.theme;
    if (theme === "dark" || theme === "light") {
      document.documentElement.setAttribute("data-theme", theme);
    } else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      document.documentElement.setAttribute("data-theme", "dark");
    }
  }

  function extractToolData(result) {
    if (!result || typeof result !== "object") return null;
    if (result.structuredContent && typeof result.structuredContent === "object") {
      return result.structuredContent;
    }
    if (Array.isArray(result.content)) {
      for (var i = 0; i < result.content.length; i++) {
        var c = result.content[i];
        if (c && c.type === "text" && typeof c.text === "string") {
          try { return JSON.parse(c.text); } catch (e) { /* not JSON */ }
        }
      }
    }
    return null;
  }

  function reportSize() {
    var h = Math.ceil(document.getElementById("root").getBoundingClientRect().height) + 8;
    notify("ui/notifications/size-changed", { height: h });
  }

  window.addEventListener("message", function (event) {
    // Trust boundary: only the embedding host (window.parent) may drive us.
    if (event.source !== parentWin) return;
    var msg = event.data;
    if (!msg || typeof msg !== "object" || msg.jsonrpc !== "2.0") return;

    // Response to our ui/initialize request.
    if (msg.id === 1 && msg.result) {
      applyTheme(msg.result.hostContext);
      notify("ui/notifications/initialized", {});
      reportSize();
      return;
    }

    switch (msg.method) {
      case "ui/notifications/tool-result": {
        var data = extractToolData(msg.params && msg.params.result ? msg.params.result : msg.params);
        if (data) render(data);
        break;
      }
      case "ui/notifications/tool-input":
        // Arguments (e.g. country_code) arrive before the result; no-op \u2014
        // the header country is populated from the result payload.
        break;
      case "ui/notifications/host-context-changed":
        applyTheme(msg.params && msg.params.hostContext ? msg.params.hostContext : msg.params);
        break;
      default:
        break;
    }
  });

  // Apply the OS/browser color preference up front so the theme is correct
  // from first paint regardless of host message ordering; the host's
  // ui/initialize result (hostContext.theme) overrides it if provided.
  applyTheme(null);

  // Kick off the handshake.
  post({
    jsonrpc: "2.0",
    id: 1,
    method: "ui/initialize",
    params: {
      protocolVersion: "2026-01-26",
      appInfo: { name: "worldmonitor-country-risk", version: "1.0.0" },
      appCapabilities: {}
    }
  });
})();
</script>
</body>
</html>`;

// api/mcp/ui/market-radar-app.ts
var STYLES3 = `
  .fg { display: none; align-items: center; gap: 12px; margin: 14px 0 4px; }
  .fg-score { font-size: 34px; font-weight: 700; line-height: 1; font-variant-numeric: tabular-nums; }
  .fg-meta { flex: 1; }
  .fg-cap { font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--muted); }
  .fg-label { font-size: 13px; font-weight: 600; }
  .fg-track { height: 8px; border-radius: 999px; background: var(--border); overflow: hidden; margin-top: 6px; }
  .fg-track > span { display: block; height: 100%; width: 0%; transition: width .3s ease; }
  .mgroup { margin-top: 16px; }
  .sec-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--muted); margin-bottom: 6px; }
  .qtbl { display: grid; grid-template-columns: 1fr auto auto; gap: 4px 14px; align-items: baseline; }
  .qsym { font-weight: 600; font-size: 13px; }
  .qprice { font-variant-numeric: tabular-nums; color: var(--muted); text-align: right; }
  .qchg { font-variant-numeric: tabular-nums; text-align: right; min-width: 68px; }
`;
var BODY3 = `
  <div class="head">
    <div class="title">Market Radar</div>
    <div class="badge">WorldMonitor Markets</div>
  </div>
  <div class="empty" id="empty">Waiting for market data\u2026</div>
  <div id="card" style="display:none">
    <div class="fg" id="fg">
      <div class="fg-score" id="fg-score">\u2014</div>
      <div class="fg-meta">
        <div class="fg-cap">Fear &amp; Greed</div>
        <div class="fg-label" id="fg-label">\u2014</div>
        <div class="fg-track"><span id="fg-bar"></span></div>
      </div>
    </div>
    <div id="groups"></div>
    <div class="foot" id="foot"></div>
  </div>
`;
var RENDER3 = `
    if (!data || typeof data !== "object") return;
    var d = data.data && typeof data.data === "object" ? data.data : data;
    q("empty").style.display = "none";
    q("card").style.display = "block";

    var fg = d["fear-greed"];
    var comp = fg && typeof fg === "object" ? fg.composite : null;
    var score = null, label = "";
    if (comp && typeof comp === "object") { score = num(comp.score); label = collapseWs(comp.label); }
    else if (typeof comp === "number") { score = num(comp); }
    if (score != null) {
      q("fg").style.display = "flex";
      setText("fg-score", String(Math.round(score)));
      setText("fg-label", label || "");
      var col = score >= 55 ? cssVar("--up") : (score <= 45 ? cssVar("--down") : cssVar("--moderate"));
      var fgBar = q("fg-bar");
      fgBar.style.width = clampPct(score) + "%";
      fgBar.style.background = col || "var(--accent)";
      q("fg-score").style.color = col || "";
    } else {
      q("fg").style.display = "none";
    }

    var groups = [
      { key: "stocks-bootstrap", list: "quotes", label: "Equities" },
      { key: "commodities-bootstrap", list: "quotes", label: "Commodities" },
      { key: "crypto", list: "quotes", label: "Crypto" },
      { key: "gulf-quotes", list: "quotes", label: "Gulf" },
      { key: "sectors", list: "sectors", label: "Sectors" }
    ];
    var host = q("groups");
    host.textContent = "";
    var rendered = 0;
    for (var g = 0; g < groups.length; g++) {
      var cfg = groups[g];
      var node = d[cfg.key];
      var items = node && typeof node === "object" ? node[cfg.list] : null;
      if (!Array.isArray(items) || !items.length) continue;
      var sec = el("div", "mgroup");
      sec.appendChild(el("div", "sec-label", cfg.label));
      var tbl = el("div", "qtbl");
      for (var i = 0; i < items.length && i < 8; i++) {
        var it = items[i];
        if (!it || typeof it !== "object") continue;
        tbl.appendChild(el("span", "qsym", collapseWs(it.symbol || it.name || it.ticker) || "\u2014"));
        var price = num(it.price);
        tbl.appendChild(el("span", "qprice",
          price == null ? "\u2014" : price.toLocaleString(undefined, { maximumFractionDigits: 2 })));
        var chg = num(it.changePercent);
        var cell = el("span", "qchg", pctText(chg));
        if (chg != null) cell.style.color = chg >= 0 ? cssVar("--up") : cssVar("--down");
        tbl.appendChild(cell);
      }
      sec.appendChild(tbl);
      host.appendChild(sec);
      rendered++;
    }
    if (!rendered) host.appendChild(el("div", "empty", "No market data available."));

    q("foot").textContent = data.cached_at
      ? "Snapshot: " + collapseWs(data.cached_at) + (data.stale ? " (stale)" : "")
      : "";
`;
var MARKET_RADAR_APP_HTML = buildAppHtml({
  title: "Market Radar \u2014 WorldMonitor",
  appName: "worldmonitor-market-radar",
  styles: STYLES3,
  body: BODY3,
  renderBody: RENDER3
});

// api/mcp/ui/world-brief-app.ts
var STYLES4 = `
  .brief { margin: 14px 0 4px; }
  .brief .para { margin: 0 0 10px; font-size: 14px; line-height: 1.6; }
  .section { margin-top: 16px; padding-top: 12px; border-top: 1px solid var(--border); }
  .sec-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--muted); margin-bottom: 8px; }
  ul.headlines { margin: 0; padding-left: 18px; }
  ul.headlines li { margin: 4px 0; font-size: 13px; }
  .src-row { display: flex; flex-direction: column; gap: 1px; padding: 6px 0; border-bottom: 1px solid var(--border); }
  .src-row:last-child { border-bottom: none; }
  .src-name { font-size: 11px; color: var(--accent); font-weight: 600; }
  .src-title { font-size: 12px; color: var(--fg); }
  .src-date { font-size: 11px; color: var(--muted); }
`;
var BODY4 = `
  <div class="head">
    <div class="title" id="title">World Brief</div>
    <div class="badge">WorldMonitor Intelligence</div>
  </div>
  <div class="empty" id="empty">Waiting for world-brief data\u2026</div>
  <div id="card" style="display:none">
    <div class="brief" id="brief"></div>
    <div class="section" id="hl-sec" style="display:none">
      <div class="sec-label">Grounding headlines</div>
      <ul class="headlines" id="headlines"></ul>
    </div>
    <div class="section" id="src-sec" style="display:none">
      <div class="sec-label">Sources</div>
      <div class="sources" id="sources"></div>
    </div>
    <div class="foot" id="foot"></div>
  </div>
`;
var RENDER4 = `
    if (!data || typeof data !== "object") return;
    var brief = typeof data.brief === "string" && data.brief ? data.brief
      : (typeof data.summary === "string" ? data.summary : "");
    q("empty").style.display = "none";
    q("card").style.display = "block";

    var briefEl = q("brief");
    briefEl.textContent = "";
    var paras = paragraphs(brief);
    for (var i = 0; i < paras.length; i++) briefEl.appendChild(el("p", "para", paras[i]));
    if (!briefEl.childNodes.length) briefEl.appendChild(el("div", "empty", "No brief text available."));

    var hls = Array.isArray(data.headlines) ? data.headlines : [];
    var hlHost = q("headlines");
    hlHost.textContent = "";
    for (var j = 0; j < hls.length && hlHost.childNodes.length < 12; j++) {
      var h = hls[j];
      if (typeof h !== "string" || !h) continue;
      hlHost.appendChild(el("li", null, collapseWs(h)));
    }
    q("hl-sec").style.display = hlHost.childNodes.length ? "block" : "none";

    var srcs = Array.isArray(data.sources) ? data.sources : [];
    var srcHost = q("sources");
    srcHost.textContent = "";
    for (var k = 0; k < srcs.length && srcHost.childNodes.length < 8; k++) {
      var s = srcs[k];
      if (!s || typeof s !== "object") continue;
      var row = el("div", "src-row");
      row.appendChild(el("span", "src-name", collapseWs(s.source) || "source"));
      var url = httpUrl(s.url);
      if (s.title) {
        var titleText = collapseWs(s.title);
        if (url) {
          var a = el("a", "src-title", titleText);
          a.href = url;
          a.target = "_blank";
          a.rel = "noopener noreferrer";
          row.appendChild(a);
        } else {
          row.appendChild(el("span", "src-title", titleText));
        }
      }
      if (s.publishedAt) row.appendChild(el("span", "src-date", collapseWs(s.publishedAt)));
      srcHost.appendChild(row);
    }
    q("src-sec").style.display = srcHost.childNodes.length ? "block" : "none";

    var prov = [data.provider, data.model].filter(Boolean).map(collapseWs).filter(Boolean).join(" \xB7 ");
    var gen = data.generatedAt != null ? "Generated " + collapseWs(data.generatedAt) : "";
    q("foot").textContent = [prov, gen].filter(Boolean).join(" \xB7 ");
`;
var WORLD_BRIEF_APP_HTML = buildAppHtml({
  title: "World Brief \u2014 WorldMonitor",
  appName: "worldmonitor-world-brief",
  styles: STYLES4,
  body: BODY4,
  renderBody: RENDER4
});

// api/mcp/ui/news-intelligence-app.ts
var STYLES5 = `
  .story { padding: 10px 0; border-bottom: 1px solid var(--border); }
  .story:last-child { border-bottom: none; }
  .story-head { display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap; }
  .story-title { font-size: 14px; font-weight: 600; color: var(--fg); }
  .chip { font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--muted);
    border: 1px solid var(--border); border-radius: 999px; padding: 1px 7px; }
  .chip.alert { color: #fff; background: var(--severe); border-color: var(--severe); font-weight: 600; }
  .story-country { font-size: 11px; color: var(--muted); }
  .story-src { margin-top: 4px; font-size: 12px; color: var(--muted); }
`;
var BODY5 = `
  <div class="head">
    <div class="title">News Intelligence</div>
    <div class="badge">WorldMonitor Intelligence</div>
  </div>
  <div class="empty" id="empty">Waiting for news intelligence\u2026</div>
  <div id="card" style="display:none">
    <div id="list"></div>
    <div class="foot" id="foot"></div>
  </div>
`;
var RENDER5 = `
    if (!data || typeof data !== "object") return;
    var d = data.data && typeof data.data === "object" ? data.data : data;
    q("empty").style.display = "none";
    q("card").style.display = "block";

    var ins = d.insights && typeof d.insights === "object" ? d.insights : null;
    var storyState = listState(ins && ins.topStories);
    var stories = storyState.items;
    var host = q("list");
    host.textContent = "";
    for (var i = 0; i < stories.length && i < 12; i++) {
      var s = stories[i];
      if (!s || typeof s !== "object") continue;
      var row = el("div", "story");
      var head = el("div", "story-head");
      head.appendChild(el("span", "story-title", collapseWs(s.primaryTitle) || "Untitled story"));
      var cat = collapseWs(s.category);
      if (cat) head.appendChild(el("span", "chip", cat));
      if (s.isAlert === true) head.appendChild(el("span", "chip alert", "Alert"));
      var cn = countryName(s.countryCode);
      if (cn) head.appendChild(el("span", "story-country", cn));
      row.appendChild(head);
      var src = collapseWs(s.primarySource);
      if (src) row.appendChild(el("div", "story-src", src));
      host.appendChild(row);
    }
    if (!host.childNodes.length) {
      host.appendChild(el("div", "empty", storyState.available
        ? "No news stories available."
        : "News intelligence is temporarily unavailable."));
    }

    q("foot").textContent = data.cached_at
      ? "Snapshot: " + collapseWs(data.cached_at) + (data.stale ? " (stale)" : "")
      : "";
`;
var NEWS_INTELLIGENCE_APP_HTML = buildAppHtml({
  title: "News Intelligence \u2014 WorldMonitor",
  appName: "worldmonitor-news-intelligence",
  styles: STYLES5,
  body: BODY5,
  renderBody: RENDER5
});

// api/mcp/ui/conflict-events-app.ts
var STYLES6 = `
  .evt { display: flex; align-items: baseline; justify-content: space-between; gap: 10px;
    padding: 9px 0; border-bottom: 1px solid var(--border); }
  .evt:last-child { border-bottom: none; }
  .evt-main { min-width: 0; }
  .evt-sides { font-size: 13px; font-weight: 600; color: var(--fg); }
  .evt-meta { font-size: 11px; color: var(--muted); margin-top: 2px; }
  .evt-deaths { font-variant-numeric: tabular-nums; font-size: 12px; font-weight: 600; white-space: nowrap; }
`;
var BODY6 = `
  <div class="head">
    <div class="title">Conflict Events</div>
    <div class="badge">WorldMonitor Conflict</div>
  </div>
  <div class="empty" id="empty">Waiting for conflict data\u2026</div>
  <div id="card" style="display:none">
    <div id="list"></div>
    <div class="foot" id="foot"></div>
  </div>
`;
var RENDER6 = `
    if (!data || typeof data !== "object") return;
    var d = data.data && typeof data.data === "object" ? data.data : data;
    q("empty").style.display = "none";
    q("card").style.display = "block";

    var uc = d["ucdp-events"] && typeof d["ucdp-events"] === "object" ? d["ucdp-events"] : null;
    var eventState = listState(uc && uc.events);
    var evs = eventState.items;
    var vtMap = {
      UCDP_VIOLENCE_TYPE_STATE_BASED: "State-based",
      UCDP_VIOLENCE_TYPE_NON_STATE: "Non-state",
      UCDP_VIOLENCE_TYPE_ONE_SIDED: "One-sided"
    };
    var host = q("list");
    host.textContent = "";
    for (var i = 0; i < evs.length && i < 14; i++) {
      var ev = evs[i];
      if (!ev || typeof ev !== "object") continue;
      var row = el("div", "evt");
      var main = el("div", "evt-main");
      var a = collapseWs(ev.sideA);
      var b = collapseWs(ev.sideB);
      var vt = vtMap[collapseWs(ev.violenceType)] || "";
      var sides = a && b ? a + " vs " + b : (a || b || vt || "Event");
      main.appendChild(el("div", "evt-sides", sides));
      var metaParts = [];
      var ct = collapseWs(ev.country);
      if (ct) metaParts.push(ct);
      if (vt && a && b) metaParts.push(vt);
      var dv = ev.dateStart;
      var dt = dv != null ? new Date(typeof dv === "number" ? dv : String(dv)) : null;
      if (dt && !isNaN(dt.getTime())) metaParts.push(dt.toISOString().slice(0, 10));
      main.appendChild(el("div", "evt-meta", metaParts.join(" \xB7 ")));
      row.appendChild(main);
      var deaths = num(ev.deathsBest);
      if (deaths != null) {
        var badge = el("span", "evt-deaths", deaths.toLocaleString() + (deaths === 1 ? " death" : " deaths"));
        var dcol = deaths >= 100 ? cssVar("--severe") : (deaths >= 10 ? cssVar("--high") : (deaths >= 1 ? cssVar("--moderate") : cssVar("--muted")));
        badge.style.color = dcol || "";
        row.appendChild(badge);
      }
      host.appendChild(row);
    }
    if (!host.childNodes.length) {
      host.appendChild(el("div", "empty", eventState.available
        ? "No conflict events available."
        : "Conflict event data is temporarily unavailable."));
    }

    q("foot").textContent = data.cached_at
      ? "Snapshot: " + collapseWs(data.cached_at) + (data.stale ? " (stale)" : "")
      : "";
`;
var CONFLICT_EVENTS_APP_HTML = buildAppHtml({
  title: "Conflict Events \u2014 WorldMonitor",
  appName: "worldmonitor-conflict-events",
  styles: STYLES6,
  body: BODY6,
  renderBody: RENDER6
});

// api/mcp/ui/natural-disasters-app.ts
var STYLES7 = `
  .dgroup { margin-top: 14px; }
  .dgroup:first-child { margin-top: 4px; }
  .sec-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--muted); margin-bottom: 6px; }
  .drow { display: flex; align-items: baseline; gap: 10px; padding: 6px 0; border-bottom: 1px solid var(--border); }
  .drow:last-child { border-bottom: none; }
  .mag { font-variant-numeric: tabular-nums; font-weight: 700; font-size: 13px; min-width: 52px; }
  .dplace { flex: 1; font-size: 13px; color: var(--fg); min-width: 0; }
  .dtime { font-size: 11px; color: var(--muted); white-space: nowrap; }
`;
var BODY7 = `
  <div class="head">
    <div class="title">Natural Disasters</div>
    <div class="badge">WorldMonitor Hazards</div>
  </div>
  <div class="empty" id="empty">Waiting for hazard data\u2026</div>
  <div id="card" style="display:none">
    <div id="groups"></div>
    <div class="foot" id="foot"></div>
  </div>
`;
var RENDER7 = `
    if (!data || typeof data !== "object") return;
    var d = data.data && typeof data.data === "object" ? data.data : data;
    q("empty").style.display = "none";
    q("card").style.display = "block";

    var host = q("groups");
    host.textContent = "";

    var quakeNode = d.earthquakes && typeof d.earthquakes === "object" ? d.earthquakes : null;
    var quakeState = listState(quakeNode && quakeNode.earthquakes);
    var quakes = quakeState.items;
    if (quakes.length) {
      var sec = el("div", "dgroup");
      sec.appendChild(el("div", "sec-label", "Earthquakes"));
      for (var i = 0; i < quakes.length && i < 8; i++) {
        var eq = quakes[i];
        if (!eq || typeof eq !== "object") continue;
        var row = el("div", "drow");
        var m = num(eq.magnitude);
        var mag = el("span", "mag", m == null ? "\u2014" : "M" + m.toFixed(1));
        var col = m == null ? cssVar("--muted") : (m >= 6 ? cssVar("--severe") : (m >= 5 ? cssVar("--high") : (m >= 4 ? cssVar("--moderate") : cssVar("--low"))));
        mag.style.color = col || "";
        row.appendChild(mag);
        row.appendChild(el("span", "dplace", collapseWs(eq.place) || "Unknown location"));
        var tv = eq.occurredAt;
        var dt = tv != null ? new Date(typeof tv === "number" ? tv : String(tv)) : null;
        row.appendChild(el("span", "dtime", dt && !isNaN(dt.getTime()) ? dt.toISOString().slice(0, 10) : ""));
        sec.appendChild(row);
      }
      host.appendChild(sec);
    } else if (!quakeState.available) {
      var quakeMissing = el("div", "dgroup");
      quakeMissing.appendChild(el("div", "sec-label", "Earthquakes"));
      quakeMissing.appendChild(el("div", "empty", "Earthquake data is temporarily unavailable."));
      host.appendChild(quakeMissing);
    }

    var fireNode = d.fires && typeof d.fires === "object" ? d.fires : null;
    var fireState = listState(fireNode && fireNode.fireDetections);
    var fires = fireState.items;
    if (fires.length) {
      var fsec = el("div", "dgroup");
      var fireShown = Math.min(fires.length, 6);
      var fireLabel = fires.length > fireShown
        ? "Active Wildfires (" + fireShown + " of " + fires.length + ")"
        : "Active Wildfires (" + fires.length + ")";
      fsec.appendChild(el("div", "sec-label", fireLabel));
      var confMap = {
        FIRE_CONFIDENCE_HIGH: "High",
        FIRE_CONFIDENCE_NOMINAL: "Nominal",
        FIRE_CONFIDENCE_LOW: "Low"
      };
      for (var k = 0; k < fireShown; k++) {
        var fr = fires[k];
        if (!fr || typeof fr !== "object") continue;
        var frow = el("div", "drow");
        var confLabel = confMap[collapseWs(fr.confidence)] || "";
        frow.appendChild(el("span", "mag", confLabel || "Fire"));
        var loc = fr.location && typeof fr.location === "object" ? fr.location : null;
        var lat = loc ? num(loc.latitude) : null;
        var lng = loc ? num(loc.longitude) : null;
        var place = collapseWs(fr.region) || (lat != null && lng != null ? lat.toFixed(2) + ", " + lng.toFixed(2) : "detection");
        frow.appendChild(el("span", "dplace", place));
        var bright = num(fr.brightness);
        frow.appendChild(el("span", "dtime", bright != null ? "brightness " + Math.round(bright) : ""));
        fsec.appendChild(frow);
      }
      host.appendChild(fsec);
    } else if (!fireState.available) {
      var fireMissing = el("div", "dgroup");
      fireMissing.appendChild(el("div", "sec-label", "Active Wildfires"));
      fireMissing.appendChild(el("div", "empty", "Wildfire data is temporarily unavailable."));
      host.appendChild(fireMissing);
    }

    if (!host.childNodes.length) host.appendChild(el("div", "empty", "No natural-hazard events available."));

    q("foot").textContent = data.cached_at
      ? "Snapshot: " + collapseWs(data.cached_at) + (data.stale ? " (stale)" : "")
      : "";
`;
var NATURAL_DISASTERS_APP_HTML = buildAppHtml({
  title: "Natural Disasters \u2014 WorldMonitor",
  appName: "worldmonitor-natural-disasters",
  styles: STYLES7,
  body: BODY7,
  renderBody: RENDER7
});

// api/mcp/ui/prediction-markets-app.ts
var STYLES8 = `
  .mgroup { margin-top: 14px; }
  .mgroup:first-child { margin-top: 4px; }
  .sec-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--muted); margin-bottom: 6px; }
  .mkt { padding: 7px 0; border-bottom: 1px solid var(--border); }
  .mkt:last-child { border-bottom: none; }
  .mkt-head { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; }
  .mkt-title { font-size: 13px; color: var(--fg); min-width: 0; }
  .mkt-prob { font-variant-numeric: tabular-nums; font-weight: 700; font-size: 13px; white-space: nowrap; }
  .mkt-src { font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--muted); margin-top: 2px; }
`;
var BODY8 = `
  <div class="head">
    <div class="title">Prediction Markets</div>
    <div class="badge">WorldMonitor Markets</div>
  </div>
  <div class="empty" id="empty">Waiting for market odds\u2026</div>
  <div id="card" style="display:none">
    <div id="groups"></div>
    <div class="foot" id="foot"></div>
  </div>
`;
var RENDER8 = `
    if (!data || typeof data !== "object") return;
    var d = data.data && typeof data.data === "object" ? data.data : data;
    q("empty").style.display = "none";
    q("card").style.display = "block";

    var mb = d["markets-bootstrap"] && typeof d["markets-bootstrap"] === "object" ? d["markets-bootstrap"] : null;
    var buckets = [
      { key: "geopolitical", label: "Geopolitical" },
      { key: "tech", label: "Tech" },
      { key: "finance", label: "Finance" }
    ];
    var host = q("groups");
    host.textContent = "";
    for (var g = 0; g < buckets.length; g++) {
      var cfg = buckets[g];
      var list = listState(mb && mb[cfg.key]).items;
      if (!list || !list.length) continue;
      var sec = el("div", "mgroup");
      sec.appendChild(el("div", "sec-label", cfg.label));
      for (var i = 0; i < list.length && i < 6; i++) {
        var m = list[i];
        if (!m || typeof m !== "object") continue;
        var mkt = el("div", "mkt");
        var head = el("div", "mkt-head");
        head.appendChild(el("span", "mkt-title", collapseWs(m.title) || "Market"));
        var p = num(m.yesPrice);
        var pct = p == null ? null : p; // yesPrice is already a 0-100 percentage \u2014 no scaling
        head.appendChild(el("span", "mkt-prob", pct == null ? "\u2014" : Math.round(pct) + "%"));
        mkt.appendChild(head);
        var bar = probabilityBar(pct);
        if (bar) mkt.appendChild(bar);
        var src = collapseWs(m.source);
        if (src) mkt.appendChild(el("div", "mkt-src", src));
        sec.appendChild(mkt);
      }
      host.appendChild(sec);
    }
    if (!host.childNodes.length) host.appendChild(el("div", "empty", "No prediction markets available."));

    q("foot").textContent = data.cached_at
      ? "Snapshot: " + collapseWs(data.cached_at) + (data.stale ? " (stale)" : "")
      : "";
`;
var PREDICTION_MARKETS_APP_HTML = buildAppHtml({
  title: "Prediction Markets \u2014 WorldMonitor",
  appName: "worldmonitor-prediction-markets",
  styles: STYLES8,
  body: BODY8,
  renderBody: RENDER8
});

// api/mcp/ui/forecasts-app.ts
var STYLES9 = `
  .fc { padding: 8px 0; border-bottom: 1px solid var(--border); }
  .fc:last-child { border-bottom: none; }
  .fc-head { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; }
  .fc-title { font-size: 13px; color: var(--fg); min-width: 0; }
  .fc-prob { font-variant-numeric: tabular-nums; font-weight: 700; font-size: 13px; white-space: nowrap; }
  .fc-meta { margin-top: 3px; display: flex; gap: 6px; flex-wrap: wrap; }
  .chip { font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--muted);
    border: 1px solid var(--border); border-radius: 999px; padding: 1px 7px; }
`;
var BODY9 = `
  <div class="head">
    <div class="title">Forecasts</div>
    <div class="badge">WorldMonitor Forecasts</div>
  </div>
  <div class="empty" id="empty">Waiting for forecasts\u2026</div>
  <div id="card" style="display:none">
    <div id="list"></div>
    <div class="foot" id="foot"></div>
  </div>
`;
var RENDER9 = `
    if (!data || typeof data !== "object") return;
    var d = data.data && typeof data.data === "object" ? data.data : data;
    q("empty").style.display = "none";
    q("card").style.display = "block";

    var node = d.predictions && typeof d.predictions === "object" ? d.predictions : null;
    var preds = listState(node && node.predictions).items;
    var host = q("list");
    host.textContent = "";
    for (var i = 0; i < preds.length && i < 12; i++) {
      var p = preds[i];
      if (!p || typeof p !== "object") continue;
      var fc = el("div", "fc");
      var head = el("div", "fc-head");
      head.appendChild(el("span", "fc-title", collapseWs(p.title) || "Forecast"));
      var pr = num(p.probability);
      var pct = pr == null ? null : (pr <= 1 ? pr * 100 : pr);
      head.appendChild(el("span", "fc-prob", pct == null ? "\u2014" : Math.round(pct) + "%"));
      fc.appendChild(head);
      var meta = el("div", "fc-meta");
      var dom = collapseWs(p.domain);
      if (dom) meta.appendChild(el("span", "chip", dom));
      var reg = collapseWs(p.region);
      if (reg) meta.appendChild(el("span", "chip", reg));
      if (meta.childNodes.length) fc.appendChild(meta);
      var bar = probabilityBar(pct);
      if (bar) fc.appendChild(bar);
      host.appendChild(fc);
    }
    if (!host.childNodes.length) host.appendChild(el("div", "empty", "No forecasts available."));

    q("foot").textContent = data.cached_at
      ? "Snapshot: " + collapseWs(data.cached_at) + (data.stale ? " (stale)" : "")
      : "";
`;
var FORECASTS_APP_HTML = buildAppHtml({
  title: "Forecasts \u2014 WorldMonitor",
  appName: "worldmonitor-forecasts",
  styles: STYLES9,
  body: BODY9,
  renderBody: RENDER9
});

// api/mcp/ui/registry.ts
var UI_RESOURCE_MIME_TYPE2 = UI_RESOURCE_MIME_TYPE;
var COUNTRY_RISK_UI_URI = "ui://worldmonitor/country-risk.html";
var WORLD_BRIEF_UI_URI = "ui://worldmonitor/world-brief.html";
var COUNTRY_BRIEF_UI_URI = "ui://worldmonitor/country-brief.html";
var MARKET_RADAR_UI_URI = "ui://worldmonitor/market-radar.html";
var CHOKEPOINT_MONITOR_UI_URI = "ui://worldmonitor/chokepoint-monitor.html";
var NEWS_INTELLIGENCE_UI_URI = "ui://worldmonitor/news-intelligence.html";
var CONFLICT_EVENTS_UI_URI = "ui://worldmonitor/conflict-events.html";
var NATURAL_DISASTERS_UI_URI = "ui://worldmonitor/natural-disasters.html";
var PREDICTION_MARKETS_UI_URI = "ui://worldmonitor/prediction-markets.html";
var FORECASTS_UI_URI = "ui://worldmonitor/forecasts.html";
var UI_RESOURCE_REGISTRY = [
  {
    uri: COUNTRY_RISK_UI_URI,
    name: "Country Risk (interactive)",
    description: "Interactive in-conversation app shell for get_country_risk: renders the Composite Instability Index (CII 0-100), the unrest/conflict/security/news component breakdown, travel-advisory level, and sanctions exposure. Linked from the get_country_risk tool via _meta.ui.resourceUri; an MCP-Apps host renders it inline and streams the tool result in via postMessage. Static, data-free template \u2014 public and quota-exempt.",
    mimeType: UI_RESOURCE_MIME_TYPE2,
    _meta: buildUiMeta(),
    html: COUNTRY_RISK_APP_HTML
  },
  {
    uri: WORLD_BRIEF_UI_URI,
    name: "World Brief (interactive)",
    description: "Interactive in-conversation app shell for get_world_brief: renders the AI-summarised global intelligence brief as readable paragraphs, the grounding headlines, and the source feed articles. Linked from the get_world_brief tool via _meta.ui.resourceUri; an MCP-Apps host renders it inline and streams the tool result in via postMessage. Static, data-free template \u2014 public and quota-exempt.",
    mimeType: UI_RESOURCE_MIME_TYPE2,
    _meta: buildUiMeta(),
    html: WORLD_BRIEF_APP_HTML
  },
  {
    uri: COUNTRY_BRIEF_UI_URI,
    name: "Country Brief (interactive)",
    description: "Interactive in-conversation app shell for get_country_brief: renders the AI-synthesised per-country intelligence brief as paragraphs, the analytical framework lens, and the grounding sources. Linked from the get_country_brief tool via _meta.ui.resourceUri; an MCP-Apps host renders it inline and streams the tool result in via postMessage. Static, data-free template \u2014 public and quota-exempt.",
    mimeType: UI_RESOURCE_MIME_TYPE2,
    _meta: buildUiMeta(),
    html: COUNTRY_BRIEF_APP_HTML
  },
  {
    uri: MARKET_RADAR_UI_URI,
    name: "Market Radar (interactive)",
    description: "Interactive in-conversation app shell for get_market_data: renders the Fear & Greed composite plus per-asset-class quote tables (equities, commodities, crypto, Gulf, sectors) with signed, colour-coded change. Linked from the get_market_data tool via _meta.ui.resourceUri; an MCP-Apps host renders it inline and streams the tool result in via postMessage. Static, data-free template \u2014 public and quota-exempt.",
    mimeType: UI_RESOURCE_MIME_TYPE2,
    _meta: buildUiMeta(),
    html: MARKET_RADAR_APP_HTML
  },
  {
    uri: CHOKEPOINT_MONITOR_UI_URI,
    name: "Chokepoint Monitor (interactive)",
    description: "Interactive in-conversation app shell for get_chokepoint_status: renders per-chokepoint rolling transit summaries (today's transit count, week-over-week change, tanker split) with a risk-level badge. Linked from the get_chokepoint_status tool via _meta.ui.resourceUri; an MCP-Apps host renders it inline and streams the tool result in via postMessage. Static, data-free template \u2014 public and quota-exempt.",
    mimeType: UI_RESOURCE_MIME_TYPE2,
    _meta: buildUiMeta(),
    html: CHOKEPOINT_MONITOR_APP_HTML
  },
  {
    uri: NEWS_INTELLIGENCE_UI_URI,
    name: "News Intelligence (interactive)",
    description: "Interactive in-conversation app shell for get_news_intelligence: renders AI-classified top stories (title, category, alert flag, country, source) from WorldMonitor's intelligence layer. Linked from the get_news_intelligence tool via _meta.ui.resourceUri; an MCP-Apps host renders it inline and streams the tool result in via postMessage. Static, data-free template \u2014 public and quota-exempt.",
    mimeType: UI_RESOURCE_MIME_TYPE2,
    _meta: buildUiMeta(),
    html: NEWS_INTELLIGENCE_APP_HTML
  },
  {
    uri: CONFLICT_EVENTS_UI_URI,
    name: "Conflict Events (interactive)",
    description: "Interactive in-conversation app shell for get_conflict_events: renders active armed-conflict events (belligerents, violence type, country, fatalities, date) from the UCDP feed. Linked from the get_conflict_events tool via _meta.ui.resourceUri; an MCP-Apps host renders it inline and streams the tool result in via postMessage. Static, data-free template \u2014 public and quota-exempt.",
    mimeType: UI_RESOURCE_MIME_TYPE2,
    _meta: buildUiMeta(),
    html: CONFLICT_EVENTS_APP_HTML
  },
  {
    uri: NATURAL_DISASTERS_UI_URI,
    name: "Natural Disasters (interactive)",
    description: "Interactive in-conversation app shell for get_natural_disasters: groups recent earthquakes (USGS magnitude, place, time) and active wildfires (NASA FIRMS). Linked from the get_natural_disasters tool via _meta.ui.resourceUri; an MCP-Apps host renders it inline and streams the tool result in via postMessage. Static, data-free template \u2014 public and quota-exempt.",
    mimeType: UI_RESOURCE_MIME_TYPE2,
    _meta: buildUiMeta(),
    html: NATURAL_DISASTERS_APP_HTML
  },
  {
    uri: PREDICTION_MARKETS_UI_URI,
    name: "Prediction Markets (interactive)",
    description: "Interactive in-conversation app shell for get_prediction_markets: renders active event-contract odds grouped by category (geopolitical, tech, finance) with a probability bar per market. Linked from the get_prediction_markets tool via _meta.ui.resourceUri; an MCP-Apps host renders it inline and streams the tool result in via postMessage. Static, data-free template \u2014 public and quota-exempt.",
    mimeType: UI_RESOURCE_MIME_TYPE2,
    _meta: buildUiMeta(),
    html: PREDICTION_MARKETS_APP_HTML
  },
  {
    uri: FORECASTS_UI_URI,
    name: "Forecasts (interactive)",
    description: "Interactive in-conversation app shell for get_forecast_predictions: renders WorldMonitor's AI-generated geopolitical and economic forecasts as probability cards (title, domain, region). Linked from the get_forecast_predictions tool via _meta.ui.resourceUri; an MCP-Apps host renders it inline and streams the tool result in via postMessage. Static, data-free template \u2014 public and quota-exempt.",
    mimeType: UI_RESOURCE_MIME_TYPE2,
    _meta: buildUiMeta(),
    html: FORECASTS_APP_HTML
  }
];
var UI_RESOURCE_BY_URI = new Map(UI_RESOURCE_REGISTRY.map((r) => [r.uri, r]));
function isUiResourceUri(uri) {
  return UI_RESOURCE_BY_URI.has(uri);
}
var UI_RESOURCE_LIST_RESPONSE = UI_RESOURCE_REGISTRY.map((r) => ({
  uri: r.uri,
  name: r.name,
  description: r.description,
  mimeType: r.mimeType,
  _meta: r._meta
}));
function buildUiResourceRead(id, uri, corsHeaders) {
  const def = UI_RESOURCE_BY_URI.get(uri);
  if (!def) {
    return rpcError(id, -32602, `Unknown ui:// resource "${uri}".`, corsHeaders);
  }
  return rpcOk(
    id,
    { contents: [{ uri: def.uri, mimeType: def.mimeType, text: def.html, _meta: def._meta }] },
    corsHeaders
  );
}
export {
  CHOKEPOINT_MONITOR_UI_URI,
  CONFLICT_EVENTS_UI_URI,
  COUNTRY_BRIEF_UI_URI,
  COUNTRY_RISK_UI_URI,
  FORECASTS_UI_URI,
  MARKET_RADAR_UI_URI,
  NATURAL_DISASTERS_UI_URI,
  NEWS_INTELLIGENCE_UI_URI,
  PREDICTION_MARKETS_UI_URI,
  UI_RESOURCE_LIST_RESPONSE,
  UI_RESOURCE_MIME_TYPE2 as UI_RESOURCE_MIME_TYPE,
  UI_RESOURCE_REGISTRY,
  WORLD_BRIEF_UI_URI,
  buildUiResourceRead,
  isUiResourceUri
};
