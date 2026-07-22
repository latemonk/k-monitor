// shared/iso2-to-iso3.js
var ISO2_TO_ISO3 = {
  "AD": "AND",
  "AE": "ARE",
  "AF": "AFG",
  "AG": "ATG",
  "AI": "AIA",
  "AL": "ALB",
  "AM": "ARM",
  "AO": "AGO",
  "AQ": "ATA",
  "AR": "ARG",
  "AS": "ASM",
  "AT": "AUT",
  "AU": "AUS",
  "AW": "ABW",
  "AX": "ALA",
  "AZ": "AZE",
  "BA": "BIH",
  "BB": "BRB",
  "BD": "BGD",
  "BE": "BEL",
  "BF": "BFA",
  "BG": "BGR",
  "BH": "BHR",
  "BI": "BDI",
  "BJ": "BEN",
  "BL": "BLM",
  "BM": "BMU",
  "BN": "BRN",
  "BO": "BOL",
  "BR": "BRA",
  "BS": "BHS",
  "BT": "BTN",
  "BW": "BWA",
  "BY": "BLR",
  "BZ": "BLZ",
  "CA": "CAN",
  "CD": "COD",
  "CF": "CAF",
  "CG": "COG",
  "CH": "CHE",
  "CI": "CIV",
  "CK": "COK",
  "CL": "CHL",
  "CM": "CMR",
  "CN": "CHN",
  "CO": "COL",
  "CR": "CRI",
  "CU": "CUB",
  "CV": "CPV",
  "CW": "CUW",
  "CY": "CYP",
  "CZ": "CZE",
  "DE": "DEU",
  "DJ": "DJI",
  "DK": "DNK",
  "DM": "DMA",
  "DO": "DOM",
  "DZ": "DZA",
  "EC": "ECU",
  "EE": "EST",
  "EG": "EGY",
  "EH": "ESH",
  "ER": "ERI",
  "ES": "ESP",
  "ET": "ETH",
  "FI": "FIN",
  "FJ": "FJI",
  "FK": "FLK",
  "FM": "FSM",
  "FO": "FRO",
  "FR": "FRA",
  "GA": "GAB",
  "GB": "GBR",
  "GD": "GRD",
  "GE": "GEO",
  "GG": "GGY",
  "GH": "GHA",
  "GI": "GIB",
  "GL": "GRL",
  "GM": "GMB",
  "GN": "GIN",
  "GQ": "GNQ",
  "GR": "GRC",
  "GS": "SGS",
  "GT": "GTM",
  "GU": "GUM",
  "GW": "GNB",
  "GY": "GUY",
  "HK": "HKG",
  "HM": "HMD",
  "HN": "HND",
  "HR": "HRV",
  "HT": "HTI",
  "HU": "HUN",
  "ID": "IDN",
  "IE": "IRL",
  "IL": "ISR",
  "IM": "IMN",
  "IN": "IND",
  "IO": "IOT",
  "IQ": "IRQ",
  "IR": "IRN",
  "IS": "ISL",
  "IT": "ITA",
  "JE": "JEY",
  "JM": "JAM",
  "JO": "JOR",
  "JP": "JPN",
  "KE": "KEN",
  "KG": "KGZ",
  "KH": "KHM",
  "KI": "KIR",
  "KM": "COM",
  "KN": "KNA",
  "KP": "PRK",
  "KR": "KOR",
  "KW": "KWT",
  "KY": "CYM",
  "KZ": "KAZ",
  "LA": "LAO",
  "LB": "LBN",
  "LC": "LCA",
  "LI": "LIE",
  "LK": "LKA",
  "LR": "LBR",
  "LS": "LSO",
  "LT": "LTU",
  "LU": "LUX",
  "LV": "LVA",
  "LY": "LBY",
  "MA": "MAR",
  "MC": "MCO",
  "MD": "MDA",
  "ME": "MNE",
  "MF": "MAF",
  "MG": "MDG",
  "MH": "MHL",
  "MK": "MKD",
  "ML": "MLI",
  "MM": "MMR",
  "MN": "MNG",
  "MO": "MAC",
  "MP": "MNP",
  "MR": "MRT",
  "MS": "MSR",
  "MT": "MLT",
  "MU": "MUS",
  "MV": "MDV",
  "MW": "MWI",
  "MX": "MEX",
  "MY": "MYS",
  "MZ": "MOZ",
  "NA": "NAM",
  "NC": "NCL",
  "NE": "NER",
  "NF": "NFK",
  "NG": "NGA",
  "NI": "NIC",
  "NL": "NLD",
  "NO": "NOR",
  "NP": "NPL",
  "NR": "NRU",
  "NU": "NIU",
  "NZ": "NZL",
  "OM": "OMN",
  "PA": "PAN",
  "PE": "PER",
  "PF": "PYF",
  "PG": "PNG",
  "PH": "PHL",
  "PK": "PAK",
  "PL": "POL",
  "PM": "SPM",
  "PN": "PCN",
  "PR": "PRI",
  "PS": "PSE",
  "PT": "PRT",
  "PW": "PLW",
  "PY": "PRY",
  "QA": "QAT",
  "RO": "ROU",
  "RS": "SRB",
  "RU": "RUS",
  "RW": "RWA",
  "SA": "SAU",
  "SB": "SLB",
  "SC": "SYC",
  "SD": "SDN",
  "SE": "SWE",
  "SG": "SGP",
  "SH": "SHN",
  "SI": "SVN",
  "SK": "SVK",
  "SL": "SLE",
  "SM": "SMR",
  "SN": "SEN",
  "SO": "SOM",
  "SR": "SUR",
  "SS": "SSD",
  "ST": "STP",
  "SV": "SLV",
  "SX": "SXM",
  "SY": "SYR",
  "SZ": "SWZ",
  "TC": "TCA",
  "TD": "TCD",
  "TF": "ATF",
  "TG": "TGO",
  "TH": "THA",
  "TJ": "TJK",
  "TL": "TLS",
  "TM": "TKM",
  "TN": "TUN",
  "TO": "TON",
  "TR": "TUR",
  "TT": "TTO",
  "TV": "TUV",
  "TW": "TWN",
  "TZ": "TZA",
  "UA": "UKR",
  "UG": "UGA",
  "UM": "UMI",
  "US": "USA",
  "UY": "URY",
  "UZ": "UZB",
  "VA": "VAT",
  "VC": "VCT",
  "VE": "VEN",
  "VG": "VGB",
  "VI": "VIR",
  "VN": "VNM",
  "VU": "VUT",
  "WF": "WLF",
  "WS": "WSM",
  "XK": "XKX",
  "YE": "YEM",
  "ZA": "ZAF",
  "ZM": "ZMB",
  "ZW": "ZWE"
};
var iso2_to_iso3_default = ISO2_TO_ISO3;

// api/_cii-risk-cache-keys.js
var CII_RISK_SCORE_CACHE_KEYS = Object.freeze({
  live: "risk:scores:sebuf:v8",
  stale: "risk:scores:sebuf:stale:v8",
  trendHistoryPrefix: "risk:scores:sebuf:trend-history:v8"
});

// api/mcp/constants.ts
var JMESPATH_MAX_EXPR_BYTES = 1024;
var JMESPATH_MAX_OUTPUT_BYTES = 256 * 1024;
var TOOL_DESCRIPTION_MAX_BYTES = 120;
var SERVER_INSTRUCTIONS = [
  "Every tool accepts an optional `jmespath` string. Server-side projection applied AFTER per-tool filter/summary; typical 80-95% token reduction. Grammar: https://jmespath.org/specification.html. Guide + 12 worked examples: https://www.worldmonitor.app/docs/mcp-jmespath.",
  "",
  `Limits: expr \u2264 ${JMESPATH_MAX_EXPR_BYTES}B, output \u2264 ${JMESPATH_MAX_OUTPUT_BYTES}B. Bad expressions soft-fail via {_jmespath_error, original_keys} envelope (consumes one Pro/OAuth daily quota unit on retry when that quota path applies \u2014 self-correct from original_keys). Full envelope reference: https://www.worldmonitor.app/docs/mcp-error-catalog.`,
  "",
  `tools/list ships compressed tool descriptions (\u2264${TOOL_DESCRIPTION_MAX_BYTES}B). Call describe_tool({tool_name}) for the full uncompressed definition \u2014 quota-exempt (still counts toward the 60/min rate limit), so use freely while exploring. describe_tool({tool_name: 'nonexistent'}) returns {error: 'unknown_tool', available: [...]} so you can self-correct. Full reference: https://www.worldmonitor.app/docs/mcp-tools-reference.`,
  "",
  "Issue prompts/list to discover pre-built workflow templates (country-briefing, energy-shock-watch, market-open-prep, conflict-pulse, route-risk-check, freshness-audit). Each prompt pre-bakes a JMESPath projection per step so the first execution lands on the right shape. prompts/list + prompts/get are quota-exempt (per-minute limit only).",
  "",
  "Issue resources/list for concrete read-only resources (v1: seed-meta freshness \u2014 anonymous + quota-free) and resources/templates/list for parameterised URI templates (country risk, chokepoint status, market quote). Substitute the template placeholder, then resources/read the concrete URI; a template read consumes the Pro daily quota IDENTICALLY to the equivalent tools/call \u2014 there is no free path around the cap via those resources."
].join("\n");
var DEFAULT_LIST_LIMIT = 30;

// api/mcp/filters.ts
function argStrList(v) {
  const raw = Array.isArray(v) ? v : v == null || v === "" ? [] : [v];
  return raw.map((x) => String(x).toLowerCase().trim()).filter(Boolean);
}
function argNum(v) {
  if (v == null || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}
function argStr(v) {
  return typeof v === "string" ? v.toLowerCase().trim() : "";
}
function argBool(v) {
  return v === true || v === "true" || v === 1 || v === "1";
}
function compact(arr) {
  return arr.filter((v) => typeof v === "string" && v.length > 0);
}
function ciIncludes(hay, needle) {
  return typeof hay === "string" && hay.toLowerCase().includes(needle);
}
function matchesCode(value, codes) {
  if (codes.length === 0) return true;
  const pool = Array.isArray(value) ? value : [value];
  return pool.some((v) => typeof v === "string" && codes.includes(v.toLowerCase()));
}
function narrowArray(data, label, pred) {
  const arr = data[label];
  if (Array.isArray(arr)) data[label] = arr.filter(pred);
}
function narrowNested(data, label, child, pred) {
  const parent = data[label];
  if (parent && typeof parent === "object" && !Array.isArray(parent)) {
    const arr = parent[child];
    if (Array.isArray(arr)) {
      parent[child] = arr.filter(pred);
    }
  }
}
function pickMapKeys(obj, codes) {
  if (codes.length === 0 || !obj || typeof obj !== "object" || Array.isArray(obj)) return obj;
  const out = {};
  for (const [k, val] of Object.entries(obj)) {
    if (codes.includes(k.toLowerCase())) out[k] = val;
  }
  return Object.keys(out).length > 0 ? out : obj;
}
function pickNestedMap(data, label, child, codes) {
  const node = data[label];
  if (node && typeof node === "object" && !Array.isArray(node)) {
    node[child] = pickMapKeys(node[child], codes);
  }
}
function capNestedMap(data, label, child, n) {
  if (n == null || n <= 0) return;
  const parent = data[label];
  if (parent && typeof parent === "object" && !Array.isArray(parent)) {
    const map = parent[child];
    if (map && typeof map === "object" && !Array.isArray(map)) {
      const entries = Object.entries(map);
      if (entries.length > n) {
        parent[child] = Object.fromEntries(entries.slice(0, n));
      }
    }
  }
}
function mapNested(data, label, child, fn) {
  const node = data[label];
  if (node && typeof node === "object" && !Array.isArray(node)) {
    const n = node;
    n[child] = fn(n[child]);
  }
}
function filterMapValues(obj, pred) {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return obj;
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v && typeof v === "object" && pred(v)) out[k] = v;
  }
  return out;
}
function pickMapKeysLike(obj, needle) {
  if (!needle || !obj || typeof obj !== "object" || Array.isArray(obj)) return obj;
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (k.toLowerCase().includes(needle)) out[k] = v;
  }
  return Object.keys(out).length > 0 ? out : obj;
}
function selectDatasets(data, labels) {
  if (labels.length === 0) return data;
  const out = {};
  for (const k of Object.keys(data)) {
    if (labels.includes(k.toLowerCase())) out[k] = data[k];
  }
  return Object.keys(out).length > 0 ? out : data;
}
function capArrays(data, n) {
  if (n == null || n <= 0) return;
  for (const k of Object.keys(data)) {
    const v = data[k];
    if (Array.isArray(v)) data[k] = v.slice(0, n);
  }
}
function capNested(data, label, child, n) {
  if (n == null || n <= 0) return;
  const parent = data[label];
  if (parent && typeof parent === "object" && !Array.isArray(parent)) {
    const arr = parent[child];
    if (Array.isArray(arr)) parent[child] = arr.slice(0, n);
  }
}
function cacheEnvelope(dataProperties) {
  return {
    type: "object",
    required: ["cached_at", "stale", "data"],
    properties: {
      cached_at: {
        type: ["string", "null"],
        description: "ISO-8601 timestamp of the OLDEST contributing cache key, or null when no valid seed-meta is present."
      },
      stale: {
        type: "boolean",
        description: "True when any contributing cache key is older than its per-key maxStaleMin freshness budget."
      },
      data: { type: "object", properties: dataProperties }
    }
  };
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
var UI_RESOURCE_LIST_RESPONSE = UI_RESOURCE_REGISTRY.map((r) => ({
  uri: r.uri,
  name: r.name,
  description: r.description,
  mimeType: r.mimeType,
  _meta: r._meta
}));

// api/mcp/registry/cache-tools.ts
var IRAN_EVENTS_ENABLED = (process.env.IRAN_EVENTS_ENABLED ?? "false").toLowerCase() === "true";
var CACHE_TOOLS = [
  {
    name: "get_market_data",
    _outputBudgetBytes: 131072,
    description: "Real-time equity quotes, commodity prices (including gold futures GC=F), crypto prices, forex FX rates (USD/EUR, USD/JPY etc.), sector performance, ETF flows, and Gulf market quotes from WorldMonitor's curated bootstrap cache.",
    inputSchema: {
      type: "object",
      properties: {
        symbols: {
          type: "array",
          items: { type: "string" },
          description: 'Tickers to keep, e.g. ["AAPL","GC=F","BTC"]. Case-insensitive; matches equity/commodity/crypto/gulf quotes, sector ETFs, and ETF-flow tickers. Omit for the full snapshot.'
        },
        asset_class: {
          type: "array",
          items: { type: "string", enum: ["equity", "commodity", "crypto", "sectors", "etf", "gulf", "sentiment"] },
          description: "Restrict the response to one or more asset classes. Omit for all."
        },
        limit: { type: "number", description: "Cap each per-class quote list (stocks/commodities/crypto/gulf/sectors/ETF flows) to at most this many items (default 30, pass 0 for no cap)." }
      },
      required: []
    },
    outputSchema: cacheEnvelope({
      "stocks-bootstrap": {
        type: ["object", "null"],
        properties: {
          quotes: { type: "array", items: { type: "object", properties: { symbol: { type: "string" }, price: { type: "number" }, changePercent: { type: "number" } } } },
          finnhubSkipped: { type: "boolean" },
          skipReason: { type: "string" },
          rateLimited: { type: "boolean" }
        }
      },
      "commodities-bootstrap": {
        type: ["object", "null"],
        properties: {
          quotes: { type: "array", items: { type: "object", properties: { symbol: { type: "string" }, price: { type: "number" }, changePercent: { type: "number" } } } }
        }
      },
      crypto: {
        type: ["object", "null"],
        properties: {
          quotes: { type: "array", items: { type: "object", properties: { symbol: { type: "string" }, price: { type: "number" }, changePercent: { type: "number" } } } }
        }
      },
      sectors: {
        type: ["object", "null"],
        properties: {
          sectors: { type: "array", items: { type: "object", properties: { symbol: { type: "string" }, name: { type: "string" }, changePercent: { type: "number" } } } },
          valuations: { type: ["object", "array", "null"] }
        }
      },
      "etf-flows": {
        type: ["object", "null"],
        properties: {
          timestamp: { type: ["string", "number", "null"] },
          summary: { type: ["object", "null"] },
          etfs: { type: "array", items: { type: "object", properties: { ticker: { type: "string" }, flow: { type: "number" } } } },
          rateLimited: { type: "boolean" }
        }
      },
      "gulf-quotes": {
        type: ["object", "null"],
        properties: {
          quotes: { type: "array", items: { type: "object", properties: { symbol: { type: "string" }, price: { type: "number" }, changePercent: { type: "number" } } } },
          rateLimited: { type: "boolean" }
        }
      },
      "fear-greed": {
        type: ["object", "null"],
        properties: {
          timestamp: { type: ["string", "number", "null"] },
          composite: { type: ["object", "number", "null"], properties: {
            score: { type: "number" },
            label: { type: "string" },
            previous: { type: ["number", "null"] }
          } },
          categories: { type: ["object", "array", "null"] },
          headerMetrics: { type: ["object", "array", "null"] },
          sectorPerformance: { type: ["object", "array", "null"] },
          unavailable: { type: "boolean" }
        }
      }
    }),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    _postFilter: (data, params) => {
      const symbols = argStrList(params.symbols);
      if (symbols.length > 0) {
        for (const label of ["stocks-bootstrap", "commodities-bootstrap", "crypto", "gulf-quotes"]) {
          narrowNested(data, label, "quotes", (q) => matchesCode(q.symbol, symbols));
        }
        narrowNested(data, "sectors", "sectors", (s) => matchesCode(s.symbol, symbols));
        narrowNested(data, "etf-flows", "etfs", (e) => matchesCode(e.ticker, symbols));
      }
      const limit = argNum(params.limit) ?? DEFAULT_LIST_LIMIT;
      for (const label of ["stocks-bootstrap", "commodities-bootstrap", "crypto", "gulf-quotes"]) {
        capNested(data, label, "quotes", limit);
      }
      capNested(data, "sectors", "sectors", limit);
      capNested(data, "etf-flows", "etfs", limit);
      const cls = argStrList(params.asset_class);
      if (cls.length > 0) {
        const map = {
          equity: "stocks-bootstrap",
          commodity: "commodities-bootstrap",
          crypto: "crypto",
          sectors: "sectors",
          etf: "etf-flows",
          gulf: "gulf-quotes",
          sentiment: "fear-greed"
        };
        return selectDatasets(data, compact(cls.map((c) => map[c])));
      }
      return data;
    },
    // MCP Apps (`io.modelcontextprotocol/ui`): links the tool to its interactive
    // ui:// app shell. Single source of truth — registered in ../ui/registry.ts.
    _uiResourceUri: MARKET_RADAR_UI_URI,
    _cacheKeys: [
      "market:stocks-bootstrap:v1",
      "market:commodities-bootstrap:v1",
      "market:crypto:v1",
      "market:sectors:v2",
      "market:etf-flows:v1",
      "market:gulf-quotes:v1",
      "market:fear-greed:v1"
    ],
    _seedMetaKey: "seed-meta:market:stocks",
    _maxStaleMin: 30,
    // NOTE: `GET /api/market/v1/get-gold-intelligence` is NOT covered here.
    // The audit-time cross-reference matched on the single `market:commodities-bootstrap:v1`
    // key shared between this tool and the gold-intel handler, but the handler also reads 4
    // gold-specific keys (COT, gold-extended, gold-ETF-flows, gold-CB-reserves) that this
    // tool's `_cacheKeys` does NOT expose. Excluded as `deferred-to-future-tool` in
    // tests/mcp-api-parity.test.mjs until a future commodities-expansion tool bundles those.
    _apiPaths: [
      "GET /api/market/v1/get-fear-greed-index",
      "GET /api/market/v1/get-sector-summary",
      "GET /api/market/v1/list-commodity-quotes",
      "GET /api/market/v1/list-crypto-quotes",
      "GET /api/market/v1/list-etf-flows",
      "GET /api/market/v1/list-gulf-quotes",
      "GET /api/market/v1/list-market-quotes"
    ]
  },
  {
    name: "get_conflict_events",
    _uiResourceUri: CONFLICT_EVENTS_UI_URI,
    _outputBudgetBytes: 131072,
    description: "Active armed conflict events (UCDP, Iran), unrest events with geo-coordinates, and country risk scores. Covers ongoing conflicts, protests, and instability indices worldwide.",
    inputSchema: {
      type: "object",
      properties: {
        country: {
          type: "string",
          description: "Filter to one country \u2014 matches the country name on conflict/unrest events and the ISO 3166-1 alpha-2 region code on risk scores (case-insensitive)."
        },
        min_fatalities: {
          type: "number",
          description: "Drop events below this fatality count (UCDP deathsBest / unrest fatalities)."
        },
        limit: { type: "number", description: "Cap each event list to at most this many items (default 30, pass 0 for no cap)." }
      },
      required: []
    },
    outputSchema: cacheEnvelope({
      "ucdp-events": {
        type: ["object", "null"],
        properties: {
          events: { type: "array", items: { type: "object", properties: {
            id: { type: "string" },
            dateStart: { type: ["number", "string"] },
            dateEnd: { type: ["number", "string"] },
            location: { type: "object", properties: { latitude: { type: "number" }, longitude: { type: "number" } } },
            country: { type: "string" },
            sideA: { type: "string" },
            sideB: { type: "string" },
            deathsBest: { type: "number" },
            deathsLow: { type: "number" },
            deathsHigh: { type: "number" },
            violenceType: { type: "string" },
            sourceOriginal: { type: "string" }
          } } },
          fetchedAt: { type: ["number", "string"] },
          version: { type: ["string", "number"] },
          totalRaw: { type: "number" },
          filteredCount: { type: "number" }
        }
      },
      "iran-events": {
        type: ["object", "null"],
        properties: {
          events: { type: "array", items: { type: "object", properties: {
            id: { type: "string" },
            country: { type: "string" },
            location: { type: "object", properties: { latitude: { type: "number" }, longitude: { type: "number" } } }
          } } },
          scrapedAt: { type: ["number", "string"] }
        }
      },
      events: {
        type: ["object", "null"],
        properties: {
          events: { type: "array", items: { type: "object", properties: {
            country: { type: "string" },
            fatalities: { type: "number" },
            location: { type: "object", properties: { latitude: { type: "number" }, longitude: { type: "number" } } }
          } } },
          clusters: { type: ["array", "object", "null"] }
        }
      },
      scores: {
        type: ["object", "null"],
        properties: {
          ciiScores: { type: "array", items: { type: "object", properties: { region: { type: "string" }, score: { type: "number" } } } },
          strategicRisks: { type: ["array", "object", "null"] }
        }
      }
    }),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    _postFilter: (data, params) => {
      const country = argStr(params.country);
      const minFatal = argNum(params.min_fatalities);
      const limit = argNum(params.limit) ?? DEFAULT_LIST_LIMIT;
      if (country) {
        narrowNested(data, "ucdp-events", "events", (e) => ciIncludes(e.country, country));
        narrowNested(data, "events", "events", (e) => ciIncludes(e.country, country));
        narrowNested(data, "scores", "ciiScores", (s) => matchesCode(s.region, [country]));
      }
      if (minFatal != null) {
        narrowNested(data, "ucdp-events", "events", (e) => (argNum(e.deathsBest) ?? 0) >= minFatal);
        narrowNested(data, "events", "events", (e) => (argNum(e.fatalities) ?? 0) >= minFatal);
      }
      for (const label of ["ucdp-events", "iran-events", "events"]) capNested(data, label, "events", limit);
      return data;
    },
    _cacheKeys: [
      "conflict:ucdp-events:v1",
      ...IRAN_EVENTS_ENABLED ? ["conflict:iran-events:v1"] : [],
      "unrest:events:v1",
      CII_RISK_SCORE_CACHE_KEYS.stale
    ],
    _seedMetaKey: "seed-meta:conflict:ucdp-events",
    _maxStaleMin: 30,
    // NOTE: `GET /api/intelligence/v1/get-risk-scores` is NOT covered here.
    // The audit-time hint matched only this tool's conflict/risk cache keys,
    // but the handler at server/worldmonitor/intelligence/v1/get-risk-scores.ts
    // reads a broader cross-domain set (infra outages, climate anomalies,
    // cyber threats, wildfires, GPS jamming, OREF history, security
    // advisories, displacement, news insights, news threats, aviation,
    // earthquakes, sanctions, temporal anomalies, and military CII). Excluded
    // as `deferred-to-future-tool` -
    // belongs in a future expanded_risk_scores composite tool, not here.
    _apiPaths: [
      "GET /api/conflict/v1/list-iran-events",
      "GET /api/conflict/v1/list-ucdp-events",
      "GET /api/unrest/v1/list-unrest-events"
    ]
  },
  {
    name: "get_aviation_status",
    _outputBudgetBytes: 131072,
    description: "Airport delays, NOTAM airspace closures, and tracked military aircraft. Covers FAA delay data and active airspace restrictions.",
    inputSchema: {
      type: "object",
      properties: {
        disrupted_only: {
          type: "boolean",
          description: 'Drop airports with severity "normal" \u2014 keep only airports actually experiencing delays/closures. The bootstrap lists every monitored airport, so most rows are non-events without this.'
        },
        country: { type: "string", description: 'Filter to one country by name (case-insensitive substring, e.g. "united states").' },
        iata: { type: "string", description: 'Filter to a single airport by IATA code (e.g. "JFK").' },
        limit: { type: "number", description: "Cap the alert list to at most this many items (default 30, pass 0 for no cap)." }
      },
      required: []
    },
    outputSchema: cacheEnvelope({
      "delays-bootstrap": {
        type: ["object", "null"],
        properties: {
          alerts: { type: "array", items: { type: "object", properties: {
            iata: { type: "string" },
            country: { type: "string" },
            severity: { type: "string" },
            name: { type: "string" }
          } } }
        }
      }
    }),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    _postFilter: (data, params) => {
      const country = argStr(params.country);
      const iata = argStr(params.iata);
      if (argBool(params.disrupted_only)) {
        narrowNested(data, "delays-bootstrap", "alerts", (a) => argStr(a.severity) !== "normal");
      }
      if (country) narrowNested(data, "delays-bootstrap", "alerts", (a) => ciIncludes(a.country, country));
      if (iata) narrowNested(data, "delays-bootstrap", "alerts", (a) => argStr(a.iata) === iata);
      capNested(data, "delays-bootstrap", "alerts", argNum(params.limit) ?? DEFAULT_LIST_LIMIT);
      return data;
    },
    _cacheKeys: ["aviation:delays-bootstrap:v2"],
    _seedMetaKey: "seed-meta:aviation:faa",
    _maxStaleMin: 90,
    _apiPaths: []
  },
  {
    name: "get_news_intelligence",
    _uiResourceUri: NEWS_INTELLIGENCE_UI_URI,
    _outputBudgetBytes: 131072,
    description: "AI-classified geopolitical threat news summaries, GDELT intelligence signals, cross-source signals, and security advisories from WorldMonitor's intelligence layer.",
    inputSchema: {
      type: "object",
      properties: {
        topic: {
          type: "string",
          enum: ["conflict", "economy", "cyber", "nuclear", "intelligence", "maritime"],
          description: "Filter GDELT intelligence to a single topic."
        },
        category: { type: "string", description: 'Filter top news stories to one category (e.g. "conflict", "economy"; fallback is "general").' },
        country: { type: "string", description: "Filter top stories and travel advisories to one ISO 3166-1 alpha-2 country code (case-insensitive)." },
        alerts_only: { type: "boolean", description: "Keep only top stories flagged as alerts." },
        limit: { type: "number", description: "Cap each list (top stories, signals, advisories) to at most this many items (default 30, pass 0 for no cap)." }
      },
      required: []
    },
    outputSchema: cacheEnvelope({
      insights: {
        type: ["object", "null"],
        properties: {
          topStories: { type: "array", items: { type: "object", properties: {
            primaryTitle: { type: "string" },
            primarySource: { type: "string" },
            primaryLink: { type: "string" },
            pubDate: { type: "string" },
            sourceCount: { type: "number" },
            importanceScore: { type: "number" },
            velocity: { type: "object", properties: {
              level: { type: "string" },
              sourcesPerHour: { type: "number" }
            } },
            category: { type: "string" },
            threatLevel: { type: "string" },
            countryCode: { type: ["string", "null"] },
            isAlert: { type: "boolean" }
          } } }
        }
      },
      "gdelt-intel": {
        type: ["object", "null"],
        properties: {
          topics: { type: "array", items: { type: "object", properties: { id: { type: "string" }, signals: { type: ["array", "object"] } } } }
        }
      },
      "cross-source-signals": {
        type: ["object", "null"],
        properties: { signals: { type: "array", items: { type: "object" } } }
      },
      "advisories-bootstrap": {
        type: ["object", "null"],
        properties: {
          advisories: { type: "array", items: { type: "object", properties: { country: { type: "string" }, level: { type: ["string", "number"] } } } }
        }
      }
    }),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    _postFilter: (data, params) => {
      const topic = argStr(params.topic);
      const category = argStr(params.category);
      const countries = argStrList(params.country);
      const limit = argNum(params.limit) ?? DEFAULT_LIST_LIMIT;
      if (topic) narrowNested(data, "gdelt-intel", "topics", (t) => argStr(t.id) === topic);
      if (category) narrowNested(data, "insights", "topStories", (s) => argStr(s.category) === category);
      if (countries.length > 0) {
        narrowNested(data, "insights", "topStories", (s) => matchesCode(s.countryCode, countries));
        narrowNested(data, "advisories-bootstrap", "advisories", (a) => matchesCode(a.country, countries));
      }
      if (argBool(params.alerts_only)) narrowNested(data, "insights", "topStories", (s) => s.isAlert === true);
      capNested(data, "insights", "topStories", limit);
      capNested(data, "cross-source-signals", "signals", limit);
      capNested(data, "advisories-bootstrap", "advisories", limit);
      return data;
    },
    _cacheKeys: [
      "news:insights:v1",
      "intelligence:gdelt-intel:v1",
      "intelligence:cross-source-signals:v1",
      "intelligence:advisories-bootstrap:v1"
    ],
    _seedMetaKey: "seed-meta:news:insights",
    _maxStaleMin: 30,
    _apiPaths: [
      "GET /api/intelligence/v1/list-cross-source-signals",
      "GET /api/intelligence/v1/search-gdelt-documents"
    ]
  },
  {
    name: "get_natural_disasters",
    _uiResourceUri: NATURAL_DISASTERS_UI_URI,
    _outputBudgetBytes: 131072,
    description: "Recent earthquakes (USGS), active wildfires (NASA FIRMS), and natural hazard events. Includes magnitude, location, and threat severity.",
    inputSchema: {
      type: "object",
      properties: {
        dataset: {
          type: "array",
          items: { type: "string", enum: ["earthquakes", "wildfires", "other"] },
          description: "Restrict to one or more hazard datasets (earthquakes / wildfires / other natural events). Omit for all."
        },
        min_magnitude: { type: "number", description: "Drop earthquakes and natural events below this magnitude." },
        active_only: { type: "boolean", description: "Keep only natural events that are still active (not closed)." },
        limit: { type: "number", description: "Cap each hazard list to at most this many items (default 30, pass 0 for no cap)." }
      },
      required: []
    },
    outputSchema: cacheEnvelope({
      earthquakes: {
        type: ["object", "null"],
        properties: {
          earthquakes: { type: "array", items: { type: "object", properties: {
            id: { type: "string" },
            place: { type: "string" },
            magnitude: { type: "number" },
            depthKm: { type: "number" },
            occurredAt: { type: "number" },
            sourceUrl: { type: "string" },
            location: { type: "object", properties: {
              latitude: { type: "number" },
              longitude: { type: "number" }
            } },
            nearTestSite: { type: "boolean" },
            testSiteName: { type: "string" },
            concernScore: { type: "number" },
            concernLevel: { type: "string" }
          } } }
        }
      },
      fires: {
        type: ["object", "null"],
        properties: {
          fireDetections: { type: "array", items: { type: "object", properties: {
            id: { type: "string" },
            location: { type: "object", properties: {
              latitude: { type: "number" },
              longitude: { type: "number" }
            } },
            brightness: { type: "number" },
            frp: { type: "number" },
            confidence: { type: "string", enum: [
              "FIRE_CONFIDENCE_HIGH",
              "FIRE_CONFIDENCE_NOMINAL",
              "FIRE_CONFIDENCE_LOW",
              "FIRE_CONFIDENCE_UNSPECIFIED"
            ] },
            satellite: { type: "string" },
            detectedAt: { type: "number" },
            region: { type: "string" },
            dayNight: { type: "string" },
            possibleExplosion: { type: "boolean" }
          } } }
        }
      },
      events: {
        type: ["object", "null"],
        properties: {
          events: { type: "array", items: { type: "object", properties: {
            magnitude: { type: ["number", "null"] },
            closed: { type: "boolean" },
            country: { type: "string" },
            type: { type: "string" },
            title: { type: "string" }
          } } }
        }
      }
    }),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    _postFilter: (data, params) => {
      const minMag = argNum(params.min_magnitude);
      const limit = argNum(params.limit) ?? DEFAULT_LIST_LIMIT;
      if (minMag != null) {
        narrowNested(data, "earthquakes", "earthquakes", (q) => (argNum(q.magnitude) ?? 0) >= minMag);
        narrowNested(data, "events", "events", (e) => (argNum(e.magnitude) ?? 0) >= minMag);
      }
      if (argBool(params.active_only)) narrowNested(data, "events", "events", (e) => e.closed === false);
      capNested(data, "earthquakes", "earthquakes", limit);
      capNested(data, "fires", "fireDetections", limit);
      capNested(data, "events", "events", limit);
      const ds = argStrList(params.dataset);
      if (ds.length > 0) {
        const map = { earthquakes: "earthquakes", wildfires: "fires", other: "events" };
        return selectDatasets(data, compact(ds.map((d) => map[d])));
      }
      return data;
    },
    _cacheKeys: [
      "seismology:earthquakes:v1",
      "wildfire:fires:v1",
      "natural:events:v1"
    ],
    _seedMetaKey: "seed-meta:seismology:earthquakes",
    _maxStaleMin: 30,
    _apiPaths: [
      "GET /api/natural/v1/list-natural-events",
      "GET /api/seismology/v1/list-earthquakes",
      "GET /api/wildfire/v1/list-fire-detections"
    ]
  },
  {
    name: "get_military_posture",
    _outputBudgetBytes: 131072,
    description: "Theater posture assessment and military risk scores. Reflects aggregated military positioning and escalation signals across global theaters.",
    inputSchema: {
      type: "object",
      properties: {
        theater: { type: "string", description: 'Filter to one theater by id (case-insensitive substring, e.g. "iran", "taiwan", "baltic", "korea").' },
        posture_level: { type: "string", description: "Filter to a single posture level." },
        limit: { type: "number", description: "Cap the theaters list to at most this many items (default 30, pass 0 for no cap)." }
      },
      required: []
    },
    outputSchema: cacheEnvelope({
      theater_posture: {
        type: ["object", "null"],
        properties: {
          theaters: { type: "array", items: { type: "object", properties: {
            theater: { type: "string" },
            postureLevel: { type: "string" },
            summary: { type: "string" },
            signals: { type: ["array", "object", "null"] }
          } } }
        }
      }
    }),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    _postFilter: (data, params) => {
      const theater = argStr(params.theater);
      const level = argStr(params.posture_level);
      if (theater) narrowNested(data, "theater_posture", "theaters", (t) => ciIncludes(t.theater, theater));
      if (level) narrowNested(data, "theater_posture", "theaters", (t) => argStr(t.postureLevel) === level);
      capNested(data, "theater_posture", "theaters", argNum(params.limit) ?? DEFAULT_LIST_LIMIT);
      return data;
    },
    _cacheKeys: ["theater_posture:sebuf:stale:v1"],
    _seedMetaKey: "seed-meta:intelligence:risk-scores",
    _maxStaleMin: 120,
    // CASCADE-MIRROR EQUIVALENCE: the API handler at
    // server/worldmonitor/military/v1/get-theater-posture.ts:23 reads 3 cascade
    // variants (live + stale + backup) and returns the freshest available.
    // This MCP tool reads only the stale variant; PR #3658's U7 already
    // documents `theater-posture:sebuf:v1` and `theater-posture:sebuf:backup:v1`
    // as `cascade-mirror: covered by get_military_posture` exclusions in the
    // bootstrap-parity test — they share the same payload shape, only freshness
    // differs. Coverage is intentional. The audit script's partial-overlap
    // warning for this op is suppressed via CASCADE_MIRROR_EXEMPT in
    // scripts/audit-mcp-api-coverage.mjs.
    _apiPaths: [
      "GET /api/military/v1/get-theater-posture"
    ]
  },
  {
    name: "get_cyber_threats",
    _outputBudgetBytes: 131072,
    description: "Active cyber threat intelligence: malware IOCs (URLhaus, Feodotracker), CISA known exploited vulnerabilities, and active command-and-control infrastructure.",
    inputSchema: {
      type: "object",
      properties: {
        threat_type: { type: "string", description: 'Filter to one threat type (case-insensitive substring, e.g. "malware", "vulnerability", "c2").' },
        min_severity: {
          type: "string",
          enum: ["low", "medium", "high", "critical"],
          description: "Drop threats below this severity level."
        },
        country: { type: "string", description: "Filter to one ISO 3166-1 alpha-2 country code (many threats have no country and are dropped by this filter)." },
        limit: { type: "number", description: "Cap the threat list to at most this many items (default 30, pass 0 for no cap)." }
      },
      required: []
    },
    outputSchema: cacheEnvelope({
      "threats-bootstrap": {
        type: ["object", "null"],
        properties: {
          threats: { type: "array", items: { type: "object", properties: {
            type: { type: "string" },
            severity: { type: "string" },
            country: { type: "string" },
            indicator: { type: "string" },
            description: { type: "string" }
          } } }
        }
      }
    }),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    _postFilter: (data, params) => {
      const type = argStr(params.threat_type);
      const countries = argStrList(params.country);
      const minSev = argStr(params.min_severity).replace("criticality_level_", "");
      const ranks = { low: 1, medium: 2, high: 3, critical: 4 };
      const minRank = ranks[minSev];
      if (type) narrowNested(data, "threats-bootstrap", "threats", (t) => ciIncludes(t.type, type));
      if (countries.length > 0) {
        narrowNested(data, "threats-bootstrap", "threats", (t) => matchesCode(t.country, countries));
      }
      if (minRank != null) {
        narrowNested(data, "threats-bootstrap", "threats", (t) => {
          const tok = argStr(t.severity).replace("criticality_level_", "");
          const r = ranks[tok];
          return r == null || r >= minRank;
        });
      }
      capNested(data, "threats-bootstrap", "threats", argNum(params.limit) ?? DEFAULT_LIST_LIMIT);
      return data;
    },
    _cacheKeys: ["cyber:threats-bootstrap:v2"],
    _seedMetaKey: "seed-meta:cyber:threats",
    _maxStaleMin: 240,
    _apiPaths: []
  },
  {
    name: "get_economic_data",
    _outputBudgetBytes: 131072,
    description: "Macro economic indicators: Fed Funds rate (FRED), economic calendar events, the normalized China macro snapshot plus official NBS/PBoC release calendar, fuel prices, ECB FX rates, EU yield curve, earnings calendar, COT positioning, energy storage data, BIS household debt service ratio (DSR, quarterly, leading indicator of household financial stress across ~40 advanced economies), and BIS residential + commercial property price indices (real, quarterly).",
    inputSchema: {
      type: "object",
      properties: {
        dataset: {
          type: "array",
          items: {
            type: "string",
            enum: ["fedfunds", "econ-calendar", "china-macro", "china-release-calendar", "fuel-prices", "ecb-fx-rates", "yield-curve-eu", "spending", "earnings-calendar", "cot", "dsr", "property-residential", "property-commercial"]
          },
          description: "Restrict the response to one or more sub-datasets. Omit for the full economic bundle."
        },
        country: {
          type: "string",
          description: "Filter the country-keyed datasets (fuel-prices, BIS DSR/property, economic calendar) to one ISO 3166-1 alpha-2 code."
        },
        limit: { type: "number", description: "Cap each list dataset (calendar, spending, earnings) to at most this many items (default 30, pass 0 for no cap)." }
      },
      required: []
    },
    // FRED key is `economic:fred:v1:FEDFUNDS:0` — the label-walk skips the
    // `0` suffix (NON_LABEL regex matches bare digits) and the `v1` segment,
    // landing on `FEDFUNDS`.
    outputSchema: cacheEnvelope({
      FEDFUNDS: { type: ["object", "array", "null"] },
      "econ-calendar": {
        type: ["object", "null"],
        properties: { events: { type: "array", items: { type: "object", properties: {
          country: { type: "string" },
          event: { type: "string" },
          time: { type: ["string", "number"] }
        } } } }
      },
      "china-macro": {
        type: ["object", "null"],
        properties: {
          countryCode: { type: "string" },
          launchReady: { type: "boolean" },
          status: { type: "string" },
          indicators: { type: "array", items: { type: "object", properties: {
            id: { type: "string" },
            label: { type: "string" },
            category: { type: "string" },
            value: { type: ["number", "null"] },
            priorValue: { type: ["number", "null"] },
            unit: { type: "string" },
            observationDate: { type: "string" },
            source: { type: "string" },
            stale: { type: "boolean" },
            unavailableReason: { type: "string" }
          } } }
        }
      },
      "china-release-calendar": {
        type: ["object", "null"],
        properties: { events: { type: "array", items: { type: "object", properties: {
          event: { type: "string" },
          countryCode: { type: "string" },
          releaseDate: { type: "string" },
          status: { type: "string" },
          source: { type: "string" }
        } } } }
      },
      "fuel-prices": {
        type: ["object", "null"],
        properties: { countries: { type: "array", items: { type: "object", properties: { code: { type: "string" }, price: { type: "number" }, currency: { type: "string" } } } } }
      },
      "ecb-fx-rates": { type: ["object", "null"] },
      "yield-curve-eu": { type: ["object", "null"] },
      spending: {
        type: ["object", "null"],
        properties: { awards: { type: "array", items: { type: "object" } } }
      },
      "earnings-calendar": {
        type: ["object", "null"],
        properties: { earnings: { type: "array", items: { type: "object", properties: { symbol: { type: "string" }, date: { type: "string" } } } } }
      },
      cot: { type: ["object", "null"] },
      dsr: {
        type: ["object", "null"],
        properties: { entries: { type: "array", items: { type: "object", properties: { countryCode: { type: "string" }, value: { type: "number" } } } } }
      },
      "property-residential": {
        type: ["object", "null"],
        properties: { entries: { type: "array", items: { type: "object", properties: { countryCode: { type: "string" }, value: { type: "number" } } } } }
      },
      "property-commercial": {
        type: ["object", "null"],
        properties: { entries: { type: "array", items: { type: "object", properties: { countryCode: { type: "string" }, value: { type: "number" } } } } }
      }
    }),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    _postFilter: (data, params) => {
      const countries = argStrList(params.country);
      const limit = argNum(params.limit) ?? DEFAULT_LIST_LIMIT;
      if (countries.length > 0) {
        narrowNested(data, "fuel-prices", "countries", (c) => matchesCode(c.code, countries));
        narrowNested(data, "econ-calendar", "events", (e) => matchesCode(e.country, countries));
        narrowNested(data, "china-release-calendar", "events", (e) => matchesCode(e.countryCode, countries));
        if (!countries.some((code) => code.toUpperCase() === "CN")) data["china-macro"] = null;
        for (const label of ["dsr", "property-residential", "property-commercial"]) {
          narrowNested(data, label, "entries", (e) => matchesCode(e.countryCode, countries));
        }
      }
      capNested(data, "econ-calendar", "events", limit);
      capNested(data, "china-release-calendar", "events", limit);
      capNested(data, "spending", "awards", limit);
      capNested(data, "earnings-calendar", "earnings", limit);
      return selectDatasets(data, argStrList(params.dataset));
    },
    _cacheKeys: [
      "economic:fred:v1:FEDFUNDS:0",
      "economic:econ-calendar:v1",
      "economic:china:macro:v1",
      "economic:china:release-calendar:v1",
      "economic:fuel-prices:v1",
      "economic:ecb-fx-rates:v1",
      "economic:yield-curve-eu:v1",
      "economic:spending:v1",
      "market:earnings-calendar:v1",
      "market:cot:v1",
      "economic:bis:dsr:v1",
      "economic:bis:property-residential:v1",
      "economic:bis:property-commercial:v1"
    ],
    _seedMetaKey: "seed-meta:economic:econ-calendar",
    _maxStaleMin: 1440,
    _freshnessChecks: [
      { key: "seed-meta:economic:econ-calendar", maxStaleMin: 1440 },
      { key: "seed-meta:economic:china-macro", maxStaleMin: 4320 },
      { key: "seed-meta:economic:china-release-calendar", maxStaleMin: 4320 },
      // Per-dataset BIS seed-meta keys — the aggregate
      // `seed-meta:economic:bis-extended` would report "fresh" even if only
      // one of the three datasets (DSR / SPP / CPP) is current, matching the
      // false-freshness bug already fixed for /api/health and resilience.
      { key: "seed-meta:economic:bis-dsr", maxStaleMin: 1440 },
      // 12h cron × 2
      { key: "seed-meta:economic:bis-property-residential", maxStaleMin: 1440 },
      { key: "seed-meta:economic:bis-property-commercial", maxStaleMin: 1440 }
    ],
    _apiPaths: [
      "GET /api/economic/v1/get-ecb-fx-rates",
      "GET /api/economic/v1/get-economic-calendar",
      "GET /api/economic/v1/get-china-macro-snapshot",
      "GET /api/economic/v1/get-eu-yield-curve",
      "GET /api/economic/v1/list-fuel-prices",
      "GET /api/market/v1/get-cot-positioning",
      "GET /api/market/v1/list-earnings-calendar"
    ]
  },
  {
    name: "get_country_macro",
    _outputBudgetBytes: 131072,
    description: "Per-country macroeconomic indicators from IMF WEO (~210 countries, monthly cadence). Bundles fiscal/external balance (inflation, current account, gov revenue/expenditure/primary balance, CPI), growth & per-capita (real GDP growth, GDP/capita USD & PPP, savings & investment rates, savings-investment gap), labor & demographics (unemployment, population), and external trade (current account USD, import/export volume % changes). Latest available year per series. Use for country-level economic screening, peer benchmarking, and stagflation/imbalance flags. NOTE: export/import LEVELS in USD (exportsUsd, importsUsd, tradeBalanceUsd) are returned as null \u2014 WEO retracted broad coverage for BX/BM indicators in 2026-04; use currentAccountUsd or volume changes (import/exportVolumePctChg) instead.",
    inputSchema: {
      type: "object",
      properties: {
        countries: {
          type: "array",
          items: { type: "string" },
          description: 'ISO 3166-1 alpha-2 country codes to keep across all four IMF datasets (e.g. ["US","DE","CN"]). Omit for all ~210 countries.'
        },
        limit: { type: "integer", minimum: 0, description: "Cap each IMF dataset country map to at most this many entries when no countries filter is supplied (default 30, pass 0 for no cap)." }
      },
      required: []
    },
    // Each IMF label maps to `{ countries: { [iso2]: { ... per-series metrics ... } } }`.
    outputSchema: cacheEnvelope({
      macro: { type: ["object", "null"], properties: { countries: { type: "object", additionalProperties: { type: "object" } } } },
      growth: { type: ["object", "null"], properties: { countries: { type: "object", additionalProperties: { type: "object" } } } },
      labor: { type: ["object", "null"], properties: { countries: { type: "object", additionalProperties: { type: "object" } } } },
      external: { type: ["object", "null"], properties: { countries: { type: "object", additionalProperties: { type: "object" } } } }
    }),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    _postFilter: (data, params) => {
      const codes = argStrList(params.countries);
      if (codes.length > 0) {
        for (const label of ["macro", "growth", "labor", "external"]) pickNestedMap(data, label, "countries", codes);
        return data;
      }
      const limit = argNum(params.limit) ?? DEFAULT_LIST_LIMIT;
      for (const label of ["macro", "growth", "labor", "external"]) capNestedMap(data, label, "countries", limit);
      return data;
    },
    _cacheKeys: [
      "economic:imf:macro:v2",
      "economic:imf:growth:v1",
      "economic:imf:labor:v1",
      "economic:imf:external:v1"
    ],
    _seedMetaKey: "seed-meta:economic:imf-macro",
    _maxStaleMin: 100800,
    // monthly WEO release; 70d = 2× interval (absorbs one missed run)
    _freshnessChecks: [
      { key: "seed-meta:economic:imf-macro", maxStaleMin: 100800 },
      { key: "seed-meta:economic:imf-growth", maxStaleMin: 100800 },
      { key: "seed-meta:economic:imf-labor", maxStaleMin: 100800 },
      { key: "seed-meta:economic:imf-external", maxStaleMin: 100800 }
    ],
    _apiPaths: []
  },
  {
    name: "get_eu_housing_cycle",
    _outputBudgetBytes: 131072,
    description: "Eurostat annual house price index (prc_hpi_a, base 2015=100) for all 27 EU members plus EA20 and EU27_2020 aggregates. Each country entry includes the latest value, prior value, date, unit, and a 10-year sparkline series. Complements BIS WS_SPP with broader EU coverage for the Housing cycle tile.",
    inputSchema: {
      type: "object",
      properties: {
        countries: {
          type: "array",
          items: { type: "string" },
          description: 'Eurostat geo codes to keep \u2014 ISO 3166-1 alpha-2, but "EL" for Greece, plus aggregates "EA20" and "EU27_2020". Omit for all.'
        },
        limit: { type: "integer", minimum: 0, description: "Cap the country map to at most this many entries when no countries filter is supplied (default 30, pass 0 for no cap)." }
      },
      required: []
    },
    outputSchema: cacheEnvelope({
      "house-prices": {
        type: ["object", "null"],
        properties: { countries: { type: "object", additionalProperties: { type: "object", properties: {
          latest: { type: ["number", "null"] },
          prior: { type: ["number", "null"] },
          date: { type: "string" },
          unit: { type: "string" },
          series: { type: "array", items: { type: "object" } }
        } } } }
      }
    }),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    _postFilter: (data, params) => {
      const codes = argStrList(params.countries);
      if (codes.length > 0) {
        pickNestedMap(data, "house-prices", "countries", codes);
        return data;
      }
      capNestedMap(data, "house-prices", "countries", argNum(params.limit) ?? DEFAULT_LIST_LIMIT);
      return data;
    },
    _cacheKeys: ["economic:eurostat:house-prices:v1"],
    _seedMetaKey: "seed-meta:economic:eurostat-house-prices",
    _maxStaleMin: 60 * 24 * 50,
    // weekly cron, annual data
    _apiPaths: []
  },
  {
    name: "get_eu_quarterly_gov_debt",
    _outputBudgetBytes: 131072,
    description: "Eurostat quarterly general government gross debt (gov_10q_ggdebt, %GDP) for all 27 EU members plus EA20 and EU27_2020 aggregates. Each country entry includes latest value, prior value, quarter label, and an 8-quarter sparkline series. Provides fresher debt-trajectory signal than annual IMF GGXWDG_NGDP for EU panels.",
    inputSchema: {
      type: "object",
      properties: {
        countries: {
          type: "array",
          items: { type: "string" },
          description: 'Eurostat geo codes to keep \u2014 ISO 3166-1 alpha-2, but "EL" for Greece, plus aggregates "EA20" and "EU27_2020". Omit for all.'
        },
        limit: { type: "integer", minimum: 0, description: "Cap the country map to at most this many entries when no countries filter is supplied (default 30, pass 0 for no cap)." }
      },
      required: []
    },
    outputSchema: cacheEnvelope({
      "gov-debt-q": {
        type: ["object", "null"],
        properties: { countries: { type: "object", additionalProperties: { type: "object", properties: {
          latest: { type: ["number", "null"] },
          prior: { type: ["number", "null"] },
          quarter: { type: "string" },
          series: { type: "array", items: { type: "object" } }
        } } } }
      }
    }),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    _postFilter: (data, params) => {
      const codes = argStrList(params.countries);
      if (codes.length > 0) {
        pickNestedMap(data, "gov-debt-q", "countries", codes);
        return data;
      }
      capNestedMap(data, "gov-debt-q", "countries", argNum(params.limit) ?? DEFAULT_LIST_LIMIT);
      return data;
    },
    _cacheKeys: ["economic:eurostat:gov-debt-q:v1"],
    _seedMetaKey: "seed-meta:economic:eurostat-gov-debt-q",
    _maxStaleMin: 60 * 24 * 14,
    // quarterly data, 2-day cron
    _apiPaths: []
  },
  {
    name: "get_eu_industrial_production",
    _outputBudgetBytes: 131072,
    description: 'Eurostat monthly industrial production index (sts_inpr_m, NACE B-D industry excl. construction, SCA, base 2021=100) for all 27 EU members plus EA20 and EU27_2020 aggregates. Each country entry includes latest value, prior value, month label, and a 12-month sparkline series. Leading indicator of real-economy activity used by the "Real economy pulse" sparkline.',
    inputSchema: {
      type: "object",
      properties: {
        countries: {
          type: "array",
          items: { type: "string" },
          description: 'Eurostat geo codes to keep \u2014 ISO 3166-1 alpha-2, but "EL" for Greece, plus aggregates "EA20" and "EU27_2020". Omit for all.'
        },
        limit: { type: "integer", minimum: 0, description: "Cap the country map to at most this many entries when no countries filter is supplied (default 30, pass 0 for no cap)." }
      },
      required: []
    },
    outputSchema: cacheEnvelope({
      "industrial-production": {
        type: ["object", "null"],
        properties: { countries: { type: "object", additionalProperties: { type: "object", properties: {
          latest: { type: ["number", "null"] },
          prior: { type: ["number", "null"] },
          month: { type: "string" },
          series: { type: "array", items: { type: "object" } }
        } } } }
      }
    }),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    _postFilter: (data, params) => {
      const codes = argStrList(params.countries);
      if (codes.length > 0) {
        pickNestedMap(data, "industrial-production", "countries", codes);
        return data;
      }
      capNestedMap(data, "industrial-production", "countries", argNum(params.limit) ?? DEFAULT_LIST_LIMIT);
      return data;
    },
    _cacheKeys: ["economic:eurostat:industrial-production:v1"],
    _seedMetaKey: "seed-meta:economic:eurostat-industrial-production",
    _maxStaleMin: 60 * 24 * 5,
    // monthly data, daily cron
    _apiPaths: []
  },
  {
    name: "get_prediction_markets",
    _uiResourceUri: PREDICTION_MARKETS_UI_URI,
    _outputBudgetBytes: 131072,
    description: "Active Polymarket event contracts with current probabilities. Covers geopolitical, economic, and election prediction markets.",
    inputSchema: {
      type: "object",
      properties: {
        category: {
          type: "string",
          enum: ["geopolitical", "tech", "finance"],
          description: "Restrict to one market category bucket. Omit for all three."
        },
        query: { type: "string", description: "Keep only markets whose title contains this text (case-insensitive)." },
        source: { type: "string", enum: ["kalshi", "polymarket"], description: "Filter to one prediction-market source." },
        limit: { type: "number", description: "Cap each category bucket to at most this many markets (default 30, pass 0 for no cap)." }
      },
      required: []
    },
    outputSchema: cacheEnvelope({
      "markets-bootstrap": {
        type: ["object", "null"],
        properties: {
          geopolitical: { type: "array", items: { type: "object", properties: {
            title: { type: "string" },
            yesPrice: { type: "number", minimum: 0, maximum: 100 },
            source: { type: "string" },
            volume: { type: "number" },
            url: { type: "string" },
            endDate: { type: "string" },
            regions: { type: "array", items: { type: "string" } }
          } } },
          tech: { type: "array", items: { type: "object", properties: {
            title: { type: "string" },
            yesPrice: { type: "number", minimum: 0, maximum: 100 },
            source: { type: "string" },
            volume: { type: "number" },
            url: { type: "string" },
            endDate: { type: "string" },
            regions: { type: "array", items: { type: "string" } }
          } } },
          finance: { type: "array", items: { type: "object", properties: {
            title: { type: "string" },
            yesPrice: { type: "number", minimum: 0, maximum: 100 },
            source: { type: "string" },
            volume: { type: "number" },
            url: { type: "string" },
            endDate: { type: "string" },
            regions: { type: "array", items: { type: "string" } }
          } } }
        }
      }
    }),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    _postFilter: (data, params) => {
      const category = argStr(params.category);
      const query = argStr(params.query);
      const source = argStr(params.source);
      const limit = argNum(params.limit) ?? DEFAULT_LIST_LIMIT;
      const buckets = ["geopolitical", "tech", "finance"];
      for (const b of buckets) {
        if (query) narrowNested(data, "markets-bootstrap", b, (m) => ciIncludes(m.title, query));
        if (source) narrowNested(data, "markets-bootstrap", b, (m) => argStr(m.source) === source);
        capNested(data, "markets-bootstrap", b, limit);
      }
      if (category && buckets.includes(category)) {
        const node = data["markets-bootstrap"];
        if (node && typeof node === "object" && !Array.isArray(node)) {
          const n = node;
          for (const b of buckets) if (b !== category) n[b] = [];
        }
      }
      return data;
    },
    _cacheKeys: ["prediction:markets-bootstrap:v1"],
    _seedMetaKey: "seed-meta:prediction:markets",
    _maxStaleMin: 90,
    _apiPaths: [
      "GET /api/prediction/v1/list-prediction-markets"
    ]
  },
  {
    name: "get_sanctions_data",
    _outputBudgetBytes: 131072,
    description: "OFAC SDN sanctioned entities list and sanctions pressure scores by country. Useful for compliance screening and geopolitical pressure analysis.",
    inputSchema: {
      type: "object",
      properties: {
        country: { type: "string", description: "Filter sanctioned entities and pressure scores to one ISO 3166-1 alpha-2 country code." },
        entity_type: { type: "string", description: 'Filter to one entity type (case-insensitive substring, e.g. "vessel", "aircraft", "person", "entity").' },
        query: { type: "string", description: "Keep only sanctioned entities whose name contains this text (case-insensitive)." },
        limit: { type: "number", description: "Cap the entity list and recent pressure entries to at most this many items (default 30, pass 0 for no cap)." }
      },
      required: []
    },
    // `_postFilter` calls `narrowArray(data, 'entities', ...)` on the
    // entities slot, so that label's value is itself an array (not an object
    // with a child array). The pressure label is the usual `{entries, countries}` shape.
    outputSchema: cacheEnvelope({
      entities: {
        type: ["array", "object", "null"],
        items: { type: "object", properties: {
          name: { type: "string" },
          cc: { type: "string" },
          et: { type: "string" },
          addr: { type: "string" }
        } }
      },
      pressure: {
        type: ["object", "null"],
        properties: {
          entries: { type: "array", items: { type: "object", properties: {
            countryCodes: { type: ["array", "string"] },
            entityType: { type: "string" }
          } } },
          countries: { type: "array", items: { type: "object", properties: {
            countryCode: { type: "string" },
            pressureScore: { type: "number" }
          } } }
        }
      }
    }),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    _postFilter: (data, params) => {
      const countries = argStrList(params.country);
      const etype = argStr(params.entity_type);
      const query = argStr(params.query);
      const limit = argNum(params.limit) ?? DEFAULT_LIST_LIMIT;
      if (countries.length > 0) {
        narrowArray(data, "entities", (e) => matchesCode(e.cc, countries));
        narrowNested(data, "pressure", "entries", (e) => matchesCode(e.countryCodes, countries));
        narrowNested(data, "pressure", "countries", (c) => matchesCode(c.countryCode, countries));
      }
      if (etype) {
        narrowArray(data, "entities", (e) => ciIncludes(e.et, etype));
        narrowNested(data, "pressure", "entries", (e) => ciIncludes(e.entityType, etype));
      }
      if (query) narrowArray(data, "entities", (e) => ciIncludes(e.name, query));
      capArrays(data, limit);
      capNested(data, "pressure", "entries", limit);
      return data;
    },
    _cacheKeys: ["sanctions:entities:v1", "sanctions:pressure:v1"],
    _seedMetaKey: "seed-meta:sanctions:entities",
    _maxStaleMin: 1440,
    _apiPaths: [
      "GET /api/sanctions/v1/list-sanctions-pressure",
      "GET /api/sanctions/v1/lookup-sanction-entity"
    ]
  },
  {
    name: "get_displacement_data",
    _outputBudgetBytes: 131072,
    description: "Refugee and IDP counts by country (UNHCR annual data).",
    inputSchema: {
      type: "object",
      properties: {
        countries: {
          type: "array",
          items: { type: "string" },
          description: 'ISO 3166-1 alpha-3 country codes to keep (e.g. ["SYR","UKR","AFG"]). Matches both per-country totals and origin/asylum flows. Omit for all.'
        },
        limit: { type: "number", description: "Cap the per-country and top-flow lists to at most this many items (default 30, pass 0 for no cap)." }
      },
      required: []
    },
    outputSchema: cacheEnvelope({
      summary: {
        type: ["object", "null"],
        properties: {
          countries: { type: "array", items: { type: "object", properties: {
            code: { type: "string" },
            total: { type: ["number", "null"] },
            year: { type: ["number", "string"] }
          } } },
          topFlows: { type: "array", items: { type: "object", properties: {
            originCode: { type: "string" },
            asylumCode: { type: "string" },
            value: { type: ["number", "null"] }
          } } }
        }
      }
    }),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    _postFilter: (data, params) => {
      const codes = argStrList(params.countries);
      const limit = argNum(params.limit) ?? DEFAULT_LIST_LIMIT;
      if (codes.length > 0) {
        narrowNested(data, "summary", "countries", (c) => matchesCode(c.code, codes));
        narrowNested(data, "summary", "topFlows", (f) => matchesCode(f.originCode, codes) || matchesCode(f.asylumCode, codes));
      }
      capNested(data, "summary", "countries", limit);
      capNested(data, "summary", "topFlows", limit);
      return data;
    },
    // Dynamic-year key resolved once at module evaluation — mirrors the
    // STANDALONE_KEYS pattern in api/health.js:147. The UNHCR seeder publishes
    // a single current-year key; the prior year exists at the same prefix but
    // is intentionally excluded — the executeTool label-walk would strip the
    // year segment from both keys and collide on the same `summary` label,
    // causing the second result to overwrite the first.
    _cacheKeys: [`displacement:summary:v1:${(/* @__PURE__ */ new Date()).getUTCFullYear()}`],
    _seedMetaKey: "seed-meta:displacement:summary",
    _maxStaleMin: 3600,
    // Audit miss: handler uses cachedFetchJson with a year-suffixed key the
    // audit's regex couldn't statically resolve. The op IS covered by this
    // tool — same underlying displacement:summary:v1:<year> cache.
    _apiPaths: [
      "GET /api/displacement/v1/get-displacement-summary"
    ]
  },
  {
    name: "get_health_signals",
    _outputBudgetBytes: 131072,
    description: "Active disease outbreaks (WHO/ECDC etc.) and global air-quality station readings (OpenAQ/WAQI PM2.5). For health-risk screening.",
    inputSchema: {
      type: "object",
      properties: {
        signal_type: {
          type: "array",
          items: { type: "string", enum: ["outbreaks", "air-quality"] },
          description: "Restrict to disease outbreaks, air-quality stations, or both. Omit for both."
        },
        country: { type: "string", description: "Filter outbreaks and air-quality stations to one ISO 3166-1 alpha-2 country code." },
        disease: { type: "string", description: "Keep only outbreaks whose disease name contains this text (case-insensitive)." },
        min_aqi: { type: "number", description: "Drop air-quality stations below this AQI value." },
        limit: { type: "number", description: "Cap the outbreak and station lists to at most this many items (default 30, pass 0 for no cap)." }
      },
      required: []
    },
    outputSchema: cacheEnvelope({
      "disease-outbreaks": {
        type: ["object", "null"],
        properties: {
          outbreaks: { type: "array", items: { type: "object", properties: {
            disease: { type: "string" },
            country: { type: "string" },
            countryCode: { type: "string" },
            cases: { type: ["number", "null"] },
            deaths: { type: ["number", "null"] },
            date: { type: "string" }
          } } }
        }
      },
      "air-quality": {
        type: ["object", "null"],
        properties: {
          stations: { type: "array", items: { type: "object", properties: {
            country_code: { type: "string" },
            city: { type: "string" },
            aqi: { type: ["number", "null"] },
            pm25: { type: ["number", "null"] },
            latitude: { type: "number" },
            longitude: { type: "number" }
          } } }
        }
      }
    }),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    _postFilter: (data, params) => {
      const countries = argStrList(params.country);
      const disease = argStr(params.disease);
      const minAqi = argNum(params.min_aqi);
      const limit = argNum(params.limit) ?? DEFAULT_LIST_LIMIT;
      if (countries.length > 0) {
        narrowNested(data, "disease-outbreaks", "outbreaks", (o) => matchesCode(o.countryCode, countries));
        narrowNested(data, "air-quality", "stations", (s) => matchesCode(s.country_code, countries));
      }
      if (disease) narrowNested(data, "disease-outbreaks", "outbreaks", (o) => ciIncludes(o.disease, disease));
      if (minAqi != null) narrowNested(data, "air-quality", "stations", (s) => (argNum(s.aqi) ?? 0) >= minAqi);
      capNested(data, "disease-outbreaks", "outbreaks", limit);
      capNested(data, "air-quality", "stations", limit);
      const st = argStrList(params.signal_type);
      if (st.length > 0) {
        const map = { outbreaks: "disease-outbreaks", "air-quality": "air-quality" };
        return selectDatasets(data, compact(st.map((s) => map[s])));
      }
      return data;
    },
    // Uses the health-domain canonical key health:air-quality:v1 (NOT the
    // climate-domain mirror climate:air-quality:v1, which stays exclusively
    // in get_climate_data). Both are written by the same seeder
    // (scripts/seed-health-air-quality.mjs exports HEALTH_AIR_QUALITY_KEY +
    // CLIMATE_AIR_QUALITY_KEY) so no duplicate seed work.
    _cacheKeys: ["health:disease-outbreaks:v1", "health:air-quality:v1"],
    _seedMetaKey: "seed-meta:health:disease-outbreaks",
    _maxStaleMin: 2880,
    _freshnessChecks: [
      { key: "seed-meta:health:disease-outbreaks", maxStaleMin: 2880 },
      // daily cron; 48h budget
      { key: "seed-meta:health:air-quality", maxStaleMin: 180 }
      // hourly cron; 3h budget
    ],
    _apiPaths: [
      "GET /api/health/v1/list-air-quality-alerts",
      "GET /api/health/v1/list-disease-outbreaks"
    ]
  },
  {
    name: "get_energy_intelligence",
    _outputBudgetBytes: 131072,
    description: "Energy supply, prices, storage, disruptions, and policy: EIA petroleum stocks, electricity prices (Ember), gas storage (GIE), fuel shortages, fossil & renewable shares, active energy disruptions, government crisis policies.",
    inputSchema: {
      type: "object",
      properties: {
        dataset: {
          type: "array",
          items: {
            type: "string",
            enum: ["eia-petroleum", "electricity", "ember", "gas-storage", "fuel-shortages", "disruptions", "crisis-policies", "fossil-share", "renewable"]
          },
          description: "Restrict the response to one or more energy sub-datasets. Omit for the full bundle."
        },
        country: {
          type: "string",
          description: "Filter the country-keyed datasets (Ember electricity mix, gas storage, fuel shortages, energy disruptions, fossil-share) to one ISO 3166-1 alpha-2 code."
        },
        limit: { type: "number", description: "Cap each list-bearing energy slice (crisis-policies, electricity regions, gas-storage countries, World Bank renewable history/regions) to at most this many items (default 30, pass 0 for no cap)." }
      },
      required: []
    },
    // Labels derived from each cache key's last informative segment:
    //   energy:eia-petroleum:v1                  -> eia-petroleum
    //   energy:electricity:v1:index              -> index
    //   energy:ember:v1:_all                     -> _all
    //   energy:gas-storage:v1:_countries         -> _countries
    //   energy:fuel-shortages:v1                 -> fuel-shortages
    //   energy:disruptions:v1                    -> disruptions
    //   energy:crisis-policies:v1                -> crisis-policies
    //   resilience:fossil-electricity-share:v1   -> fossil-electricity-share
    //   economic:worldbank-renewable:v1          -> worldbank-renewable
    outputSchema: cacheEnvelope({
      "eia-petroleum": { type: ["object", "null"] },
      index: { type: ["object", "null"], properties: { regions: { type: "array", items: { type: "object" } } } },
      _all: { type: ["object", "null"] },
      _countries: { type: ["array", "object", "null"] },
      "fuel-shortages": { type: ["object", "null"], properties: { shortages: { type: ["object", "array", "null"] } } },
      disruptions: { type: ["object", "null"], properties: { events: { type: ["object", "array", "null"] } } },
      "crisis-policies": { type: ["object", "null"], properties: { policies: { type: "array", items: { type: "object" } } } },
      "fossil-electricity-share": { type: ["object", "null"], properties: { countries: { type: "object", additionalProperties: { type: "object" } } } },
      "worldbank-renewable": { type: ["object", "null"], properties: {
        historicalData: { type: "array", items: { type: "object" } },
        regions: { type: "array", items: { type: "object" } }
      } }
    }),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    _postFilter: (data, params) => {
      const countries = argStrList(params.country);
      if (countries.length > 0) {
        data._all = pickMapKeys(data._all, countries);
        pickNestedMap(data, "fossil-electricity-share", "countries", countries);
        narrowArray(data, "_countries", (c) => matchesCode(c, countries) || matchesCode(c?.iso2, countries));
        mapNested(data, "fuel-shortages", "shortages", (m) => filterMapValues(m, (s) => matchesCode(s.country, countries)));
        mapNested(data, "disruptions", "events", (m) => filterMapValues(m, (e) => matchesCode(e.countries, countries)));
      }
      const limit = argNum(params.limit) ?? DEFAULT_LIST_LIMIT;
      capNested(data, "crisis-policies", "policies", limit);
      capNested(data, "index", "regions", limit);
      capNested(data, "worldbank-renewable", "historicalData", limit);
      capNested(data, "worldbank-renewable", "regions", limit);
      capArrays(data, limit);
      const ds = argStrList(params.dataset);
      if (ds.length > 0) {
        const map = {
          "eia-petroleum": "eia-petroleum",
          electricity: "index",
          ember: "_all",
          "gas-storage": "_countries",
          "fuel-shortages": "fuel-shortages",
          disruptions: "disruptions",
          "crisis-policies": "crisis-policies",
          "fossil-share": "fossil-electricity-share",
          renewable: "worldbank-renewable"
        };
        return selectDatasets(data, compact(ds.map((d) => map[d])));
      }
      return data;
    },
    // Broad 9-key energy bundle mirroring get_economic_data. Cadences span
    // hourly (electricity prices) to annual (World Bank renewable share); use
    // _freshnessChecks with per-key maxStaleMin pulled from
    // api/health.js::SEED_META so a slow-cadence key doesn't drag the
    // aggregate stale flag unnecessarily.
    _cacheKeys: [
      "energy:eia-petroleum:v1",
      // STANDALONE_KEYS::eiaPetroleum
      "energy:electricity:v1:index",
      // BOOTSTRAP_KEYS::electricityPrices
      "energy:ember:v1:_all",
      // STANDALONE_KEYS::emberElectricity
      "energy:gas-storage:v1:_countries",
      // BOOTSTRAP_KEYS::gasStorageCountries
      "energy:fuel-shortages:v1",
      // STANDALONE_KEYS::fuelShortages
      "energy:disruptions:v1",
      // STANDALONE_KEYS::energyDisruptions
      "energy:crisis-policies:v1",
      // STANDALONE_KEYS::energyCrisisPolicies
      "resilience:fossil-electricity-share:v1",
      // STANDALONE_KEYS::fossilElectricityShare
      "economic:worldbank-renewable:v1"
      // BOOTSTRAP_KEYS::renewableEnergy
    ],
    _seedMetaKey: "seed-meta:energy:eia-petroleum",
    _maxStaleMin: 4320,
    // EIA petroleum daily-bundle baseline; per-key budgets via _freshnessChecks below
    _freshnessChecks: [
      { key: "seed-meta:energy:eia-petroleum", maxStaleMin: 4320 },
      // daily bundle; 72h = 3× interval
      { key: "seed-meta:energy:electricity-prices", maxStaleMin: 2880 },
      // daily cron (14:00 UTC); 48h = 2× interval
      { key: "seed-meta:energy:ember", maxStaleMin: 2880 },
      // daily cron (08:00 UTC); 48h = 2× interval
      { key: "seed-meta:energy:gas-storage-countries", maxStaleMin: 2880 },
      // daily cron at 10:30 UTC; 48h = 2× interval
      { key: "seed-meta:energy:fuel-shortages", maxStaleMin: 2880 },
      // 2d — daily cron × 2 headroom
      { key: "seed-meta:energy:disruptions", maxStaleMin: 20160 },
      // 14d — weekly cron × 2 headroom
      { key: "seed-meta:energy:crisis-policies", maxStaleMin: 60 * 24 * 400 },
      // ~400d static registry
      { key: "seed-meta:resilience:fossil-electricity-share", maxStaleMin: 11520 },
      // ~8d (annual WB-style cadence)
      { key: "seed-meta:economic:worldbank-renewable:v1", maxStaleMin: 10080 }
      // 7d WB weekly-cron annual data
    ],
    _apiPaths: [
      "GET /api/economic/v1/get-energy-crisis-policies",
      "GET /api/supply-chain/v1/get-fuel-shortage-detail",
      "GET /api/supply-chain/v1/list-energy-disruptions",
      "GET /api/supply-chain/v1/list-fuel-shortages"
    ]
  },
  {
    name: "get_climate_data",
    _outputBudgetBytes: 131072,
    description: "Climate intelligence: temperature/precipitation anomalies (vs 30-year WMO normals), climate-relevant disaster alerts (ReliefWeb/GDACS/FIRMS), atmospheric CO2 trend (NOAA Mauna Loa), air quality (OpenAQ/WAQI PM2.5 stations), Arctic sea ice extent and ocean heat indicators (NSIDC/NOAA), weather alerts, and climate news.",
    inputSchema: {
      type: "object",
      properties: {
        dataset: {
          type: "array",
          items: {
            type: "string",
            enum: ["anomalies", "disasters", "co2-monitoring", "air-quality", "ocean-ice", "news-intelligence", "alerts"]
          },
          description: "Restrict the response to one or more climate sub-datasets. Omit for the full bundle."
        },
        country: {
          type: "string",
          description: "Filter the country-tagged datasets (climate disasters, air-quality stations) to one ISO 3166-1 alpha-2 code."
        },
        limit: { type: "number", description: "Cap each list dataset (anomalies, disasters, stations, news, alerts) to at most this many items (default 30, pass 0 for no cap)." }
      },
      required: []
    },
    outputSchema: cacheEnvelope({
      anomalies: { type: ["object", "null"], properties: { anomalies: { type: "array", items: { type: "object" } } } },
      disasters: { type: ["object", "null"], properties: { disasters: { type: "array", items: { type: "object", properties: {
        countryCode: { type: "string" },
        type: { type: "string" },
        severity: { type: "string" }
      } } } } },
      "co2-monitoring": { type: ["object", "null"] },
      "air-quality": { type: ["object", "null"], properties: { stations: { type: "array", items: { type: "object", properties: {
        country_code: { type: "string" },
        city: { type: "string" },
        aqi: { type: ["number", "null"] }
      } } } } },
      "ocean-ice": { type: ["object", "null"] },
      "news-intelligence": { type: ["object", "null"], properties: { items: { type: "array", items: { type: "object" } } } },
      alerts: { type: ["object", "null"], properties: { alerts: { type: "array", items: { type: "object" } } } }
    }),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    _postFilter: (data, params) => {
      const countries = argStrList(params.country);
      const limit = argNum(params.limit) ?? DEFAULT_LIST_LIMIT;
      if (countries.length > 0) {
        narrowNested(data, "disasters", "disasters", (d) => matchesCode(d.countryCode, countries));
        narrowNested(data, "air-quality", "stations", (s) => matchesCode(s.country_code, countries));
      }
      capNested(data, "anomalies", "anomalies", limit);
      capNested(data, "disasters", "disasters", limit);
      capNested(data, "air-quality", "stations", limit);
      capNested(data, "news-intelligence", "items", limit);
      capNested(data, "alerts", "alerts", limit);
      return selectDatasets(data, argStrList(params.dataset));
    },
    _cacheKeys: ["climate:anomalies:v2", "climate:disasters:v1", "climate:co2-monitoring:v1", "climate:air-quality:v1", "climate:ocean-ice:v1", "climate:news-intelligence:v1", "weather:alerts:v1"],
    _seedMetaKey: "seed-meta:climate:co2-monitoring",
    _maxStaleMin: 2880,
    _freshnessChecks: [
      { key: "seed-meta:climate:anomalies", maxStaleMin: 120 },
      { key: "seed-meta:climate:disasters", maxStaleMin: 720 },
      { key: "seed-meta:climate:co2-monitoring", maxStaleMin: 2880 },
      { key: "seed-meta:health:air-quality", maxStaleMin: 180 },
      { key: "seed-meta:climate:ocean-ice", maxStaleMin: 1440 },
      { key: "seed-meta:climate:news-intelligence", maxStaleMin: 90 },
      { key: "seed-meta:weather:alerts", maxStaleMin: 45 }
    ],
    _apiPaths: [
      "GET /api/climate/v1/get-co2-monitoring",
      "GET /api/climate/v1/get-ocean-ice-data",
      "GET /api/climate/v1/list-air-quality-data",
      "GET /api/climate/v1/list-climate-anomalies",
      "GET /api/climate/v1/list-climate-disasters",
      "GET /api/climate/v1/list-climate-news"
    ]
  },
  {
    name: "get_infrastructure_status",
    _outputBudgetBytes: 131072,
    description: "Internet infrastructure health: Cloudflare Radar outages and service status for major cloud providers and internet services.",
    inputSchema: {
      type: "object",
      properties: {
        country: { type: "string", description: "Filter to one country by name (case-insensitive substring)." },
        severity: { type: "string", description: "Filter to one outage severity (case-insensitive substring)." },
        limit: { type: "number", description: "Cap the outage list to at most this many items (default 30, pass 0 for no cap)." }
      },
      required: []
    },
    outputSchema: cacheEnvelope({
      outages: {
        type: ["object", "null"],
        properties: { outages: { type: "array", items: { type: "object", properties: {
          country: { type: "string" },
          severity: { type: "string" },
          asn: { type: ["number", "string"] },
          startTime: { type: "string" },
          description: { type: "string" }
        } } } }
      }
    }),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    _postFilter: (data, params) => {
      const country = argStr(params.country);
      const severity = argStr(params.severity);
      if (country) narrowNested(data, "outages", "outages", (o) => ciIncludes(o.country, country));
      if (severity) narrowNested(data, "outages", "outages", (o) => ciIncludes(o.severity, severity));
      capNested(data, "outages", "outages", argNum(params.limit) ?? DEFAULT_LIST_LIMIT);
      return data;
    },
    _cacheKeys: ["infra:outages:v1"],
    _seedMetaKey: "seed-meta:infra:outages",
    _maxStaleMin: 30,
    _apiPaths: [
      "GET /api/infrastructure/v1/list-internet-outages"
    ]
  },
  {
    name: "get_supply_chain_data",
    _outputBudgetBytes: 131072,
    description: "Dry bulk shipping stress index, customs revenue flows, and COMTRADE bilateral trade data. Tracks global supply chain pressure and trade disruptions.",
    inputSchema: {
      type: "object",
      properties: {
        dataset: {
          type: "array",
          items: { type: "string", enum: ["shipping_stress", "customs-revenue", "flows"] },
          description: "Restrict the response to one or more sub-datasets (dry-bulk shipping stress / customs revenue / COMTRADE flows). Omit for all."
        },
        commodity: {
          type: "string",
          description: 'Filter COMTRADE flows to one commodity \u2014 matches the HS code exactly or the commodity description by substring (e.g. "2709" or "crude").'
        },
        reporter: {
          type: "string",
          description: 'Filter COMTRADE flows to one reporter by numeric reporter code or reporter name (e.g. "156" or "China").'
        },
        limit: { type: "number", description: "Cap each list dataset (carriers, months, flows) to at most this many items (default 30, pass 0 for no cap)." }
      },
      required: []
    },
    outputSchema: cacheEnvelope({
      shipping_stress: {
        type: ["object", "null"],
        properties: { carriers: { type: "array", items: { type: "object", properties: {
          name: { type: "string" },
          stressScore: { type: ["number", "null"] }
        } } } }
      },
      "customs-revenue": {
        type: ["object", "null"],
        properties: { months: { type: "array", items: { type: "object", properties: {
          month: { type: "string" },
          revenueUsd: { type: ["number", "null"] }
        } } } }
      },
      flows: {
        type: ["object", "null"],
        properties: { flows: { type: "array", items: { type: "object", properties: {
          cmdCode: { type: "string" },
          cmdDesc: { type: "string" },
          reporter: { type: "string" },
          partner: { type: "string" },
          value: { type: ["number", "null"] }
        } } } }
      }
    }),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    _postFilter: (data, params) => {
      const commodity = argStr(params.commodity);
      const reporter = argStr(params.reporter);
      const limit = argNum(params.limit) ?? DEFAULT_LIST_LIMIT;
      if (commodity) {
        narrowNested(data, "flows", "flows", (f) => argStr(f.cmdCode) === commodity || ciIncludes(f.cmdDesc, commodity));
      }
      if (reporter) {
        narrowNested(data, "flows", "flows", (f) => argStr(f.reporterCode) === reporter || ciIncludes(f.reporterName ?? f.reporter, reporter));
      }
      capNested(data, "shipping_stress", "carriers", limit);
      capNested(data, "customs-revenue", "months", limit);
      capNested(data, "flows", "flows", limit);
      return selectDatasets(data, argStrList(params.dataset));
    },
    _cacheKeys: [
      "supply_chain:shipping_stress:v1",
      "trade:customs-revenue:v1",
      "comtrade:flows:v1"
    ],
    _seedMetaKey: "seed-meta:trade:customs-revenue",
    _maxStaleMin: 2880,
    _apiPaths: [
      "GET /api/supply-chain/v1/get-shipping-stress",
      "GET /api/trade/v1/get-customs-revenue"
    ]
  },
  {
    name: "get_tariff_trends",
    _outputBudgetBytes: 131072,
    description: "Global trade and pricing indicators: US tariff trends (HTS-coded), BigMac index, FAO Food Price Index, and per-country national debt levels.",
    inputSchema: {
      type: "object",
      properties: {
        dataset: {
          type: "array",
          items: { type: "string", enum: ["tariffs", "bigmac", "fao-ffpi", "national-debt"] },
          description: "Restrict the response to one or more sub-datasets. Omit for the full bundle."
        },
        country: {
          type: "string",
          description: 'Filter the per-country datasets to one ISO 3166-1 alpha-2 country code (e.g. "US"). It is translated to alpha-3 internally for the national-debt dataset; passing an alpha-3 code directly also works.'
        },
        limit: { type: "number", description: "Cap each list dataset (tariff datapoints, BigMac countries, debt entries) to at most this many items (default 30, pass 0 for no cap)." }
      },
      required: []
    },
    // First cache key `trade:tariffs:v1:840:all:10` — NON_LABEL drops bare digits
    // (840, 10) and `v1`, lands on `all`.
    outputSchema: cacheEnvelope({
      all: {
        type: ["object", "null"],
        properties: { datapoints: { type: "array", items: { type: "object", properties: {
          hsCode: { type: "string" },
          rate: { type: ["number", "null"] },
          country: { type: "string" }
        } } } }
      },
      bigmac: {
        type: ["object", "null"],
        properties: { countries: { type: "array", items: { type: "object", properties: {
          code: { type: "string" },
          priceLocal: { type: ["number", "null"] },
          priceUsd: { type: ["number", "null"] }
        } } } }
      },
      "fao-ffpi": { type: ["object", "null"] },
      "national-debt": {
        type: ["object", "null"],
        properties: { entries: { type: "array", items: { type: "object", properties: {
          iso3: { type: "string" },
          value: { type: ["number", "null"] },
          year: { type: ["number", "string"] }
        } } } }
      }
    }),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    _postFilter: (data, params) => {
      const countries = argStrList(params.country);
      const limit = argNum(params.limit) ?? DEFAULT_LIST_LIMIT;
      if (countries.length > 0) {
        narrowNested(data, "bigmac", "countries", (c) => matchesCode(c.code, countries));
        const debtCodes = [
          ...countries,
          ...compact(countries.map((c) => iso2_to_iso3_default[c.toUpperCase()]?.toLowerCase()))
        ];
        narrowNested(data, "national-debt", "entries", (e) => matchesCode(e.iso3, debtCodes));
      }
      capNested(data, "all", "datapoints", limit);
      capNested(data, "bigmac", "countries", limit);
      capNested(data, "national-debt", "entries", limit);
      const ds = argStrList(params.dataset);
      if (ds.length > 0) {
        const map = { tariffs: "all", bigmac: "bigmac", "fao-ffpi": "fao-ffpi", "national-debt": "national-debt" };
        return selectDatasets(data, compact(ds.map((d) => map[d])));
      }
      return data;
    },
    // 4-key bundle spanning trade + economic domains. Cadences span hourly-ish
    // (tariffs co-pinned to 8h TARIFF_TTL) to monthly (FAO / national debt).
    // Per-key _freshnessChecks pulled from api/health.js::SEED_META so a slow
    // monthly key doesn't drag the aggregate stale flag and a fast tariff
    // outage isn't masked by a long FAO budget.
    _cacheKeys: [
      "trade:tariffs:v1:840:all:10",
      // STANDALONE_KEYS::tariffTrendsUs
      "economic:bigmac:v1",
      // BOOTSTRAP_KEYS::bigmac
      "economic:fao-ffpi:v1",
      // BOOTSTRAP_KEYS::faoFoodPriceIndex
      "economic:national-debt:v1"
      // BOOTSTRAP_KEYS::nationalDebt
    ],
    _seedMetaKey: "seed-meta:trade:tariffs:v1:840:all:10",
    _maxStaleMin: 540,
    // tariff cron baseline; per-key budgets via _freshnessChecks below
    _freshnessChecks: [
      { key: "seed-meta:trade:tariffs:v1:840:all:10", maxStaleMin: 540 },
      // TARIFF_TTL 8h + 60min grace
      { key: "seed-meta:economic:bigmac", maxStaleMin: 10080 },
      // weekly seed; 7d
      { key: "seed-meta:economic:fao-ffpi", maxStaleMin: 86400 },
      // monthly seed; 60d (2× interval)
      { key: "seed-meta:economic:national-debt", maxStaleMin: 86400 }
      // monthly seed; 60d (2× interval)
    ],
    _apiPaths: [
      "GET /api/economic/v1/get-fao-food-price-index",
      "GET /api/economic/v1/get-national-debt",
      "GET /api/economic/v1/list-bigmac-prices"
    ]
  },
  {
    name: "get_chokepoint_status",
    _outputBudgetBytes: 131072,
    description: "Live maritime chokepoint status: per-chokepoint vessel transit counts (10-min cadence), rolling transit summaries, per-port activity, plus static reference data (chokepoint geometry, canonical 13-chokepoint registry) and flow aggregates. Covers Suez, Hormuz, Malacca, Bab-el-Mandeb, Panama, etc.",
    inputSchema: {
      type: "object",
      properties: {
        chokepoint: {
          type: "string",
          description: 'Filter to one chokepoint \u2014 matches by case-insensitive substring across the differing identifiers used by each dataset (e.g. "hormuz" matches "hormuz_strait", "Strait of Hormuz").'
        },
        dataset: {
          type: "array",
          items: {
            type: "string",
            enum: ["transit-summaries", "chokepoint_transits", "_countries", "chokepoint-baselines", "ref", "chokepoint-flows"]
          },
          description: "Restrict the response to one or more sub-datasets. Omit for the full bundle."
        },
        limit: { type: "number", description: "Cap the chokepoint-baselines list and the _countries ISO2 index to at most this many items (default 30, pass 0 for no cap). Keyed-object maps (transit-summaries, chokepoint_transits, ref, chokepoint-flows) are intentionally not capped \u2014 use the `chokepoint` filter instead." }
      },
      required: []
    },
    // Schema validated against tests/fixtures/jmespath-samples/thin-get-chokepoint-status.response.json.
    outputSchema: cacheEnvelope({
      "transit-summaries": {
        type: ["object", "null"],
        properties: {
          summaries: { type: "object", additionalProperties: { type: "object", properties: {
            todayTotal: { type: ["number", "null"] },
            todayTanker: { type: ["number", "null"] },
            todayCargo: { type: ["number", "null"] },
            todayOther: { type: ["number", "null"] },
            wowChangePct: { type: ["number", "null"] },
            riskLevel: { type: "string" },
            incidentCount7d: { type: ["number", "null"] },
            disruptionPct: { type: ["number", "null"] },
            riskSummary: { type: "string" },
            riskReportAction: { type: "string" },
            anomaly: { type: "object" },
            dataAvailable: { type: "boolean" }
          } } },
          fetchedAt: { type: ["number", "string"] }
        }
      },
      chokepoint_transits: {
        type: ["object", "null"],
        properties: {
          transits: { type: "object", additionalProperties: { type: "object" } },
          fetchedAt: { type: ["number", "string"] }
        }
      },
      _countries: {
        type: ["array", "object", "null"],
        items: { type: "string" }
      },
      "chokepoint-baselines": {
        type: ["object", "null"],
        properties: {
          source: { type: "string" },
          referenceYear: { type: ["number", "string"] },
          updatedAt: { type: "string" },
          chokepoints: { type: "array", items: { type: "object", properties: {
            id: { type: "string" },
            relayId: { type: "string" },
            name: { type: "string" }
          } } }
        }
      },
      ref: {
        type: ["object", "null"],
        additionalProperties: { type: "object" }
      },
      "chokepoint-flows": {
        type: ["object", "null"],
        additionalProperties: { type: "object" }
      }
    }),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    _postFilter: (data, params) => {
      const cp = argStr(params.chokepoint);
      if (cp) {
        mapNested(data, "transit-summaries", "summaries", (m) => pickMapKeysLike(m, cp));
        mapNested(data, "chokepoint_transits", "transits", (m) => pickMapKeysLike(m, cp));
        data["chokepoint-flows"] = pickMapKeysLike(data["chokepoint-flows"], cp);
        narrowNested(data, "chokepoint-baselines", "chokepoints", (c) => ciIncludes(c.id, cp) || ciIncludes(c.relayId, cp) || ciIncludes(c.name, cp));
      }
      const limit = argNum(params.limit) ?? DEFAULT_LIST_LIMIT;
      capNested(data, "chokepoint-baselines", "chokepoints", limit);
      capArrays(data, limit);
      return selectDatasets(data, argStrList(params.dataset));
    },
    // Maritime chokepoint bundle distinct from get_supply_chain_data (which keeps
    // shipping-stress + customs + comtrade). Cadences span 10-minute relay
    // (transit-summaries, chokepoint_transits) to ~400-day static registries
    // (chokepoint-baselines), so per-key _freshnessChecks pulled from
    // api/health.js::SEED_META — a fast transit outage isn't masked by the
    // slow chokepoint-baselines budget, and the long-cadence portwatch keys
    // don't drag aggregate stale flagging.
    //
    // Payload measurement (PR pre-merge, fun-toad-55127.upstash.io 2026-05-11):
    //   transit-summaries:v1                        — 6.8 KB
    //   chokepoint_transits:v1                      — 1.1 KB
    //   portwatch-ports:v1:_countries               — 0.9 KB
    //   energy:chokepoint-baselines:v1              — 0.6 KB
    //   portwatch:chokepoints:ref:v1                — 7.9 KB
    //   energy:chokepoint-flows:v1                  — 1.2 KB
    //   ────────────────────────────────────────────────────
    //   Total: 18.5 KB (well under the 200KB/single-key and 500KB/aggregate
    //   thresholds that historically tripped handler timeouts —
    //   see tests/transit-summaries.test.mjs:539-545).
    //
    // EXCLUDED on purpose: supply_chain:corridorrisk:v1 is an intermediate
    // key whose data flows through supply_chain:transit-summaries:v1
    // (api/health.js:461). U7 will add corridorrisk to EXCLUDED_FROM_MCP.
    // MCP Apps (`io.modelcontextprotocol/ui`): links the tool to its interactive
    // ui:// app shell. Single source of truth — registered in ../ui/registry.ts.
    _uiResourceUri: CHOKEPOINT_MONITOR_UI_URI,
    _cacheKeys: [
      "supply_chain:transit-summaries:v1",
      // STANDALONE_KEYS::transitSummaries
      "supply_chain:chokepoint_transits:v1",
      // STANDALONE_KEYS::chokepointTransits
      "supply_chain:portwatch-ports:v1:_countries",
      // STANDALONE_KEYS::portwatchPortActivity
      "energy:chokepoint-baselines:v1",
      // STANDALONE_KEYS::chokepointBaselines
      "portwatch:chokepoints:ref:v1",
      // STANDALONE_KEYS::portwatchChokepointsRef
      "energy:chokepoint-flows:v1"
      // STANDALONE_KEYS::chokepointFlows
    ],
    _seedMetaKey: "seed-meta:supply_chain:transit-summaries",
    _maxStaleMin: 30,
    // transit-summaries 10-min relay baseline; per-key budgets via _freshnessChecks below
    _freshnessChecks: [
      { key: "seed-meta:supply_chain:transit-summaries", maxStaleMin: 30 },
      // 10-min relay; 30min = 3× interval
      { key: "seed-meta:supply_chain:chokepoint_transits", maxStaleMin: 30 },
      // 10-min relay; 30min = 3× interval
      { key: "seed-meta:supply_chain:portwatch-ports", maxStaleMin: 2160, minRecordCount: 174 },
      // 12h cron; 36h = 3× interval; #3613 requires full country coverage
      { key: "seed-meta:energy:chokepoint-baselines", maxStaleMin: 60 * 24 * 400 },
      // ~400d static registry
      { key: "seed-meta:portwatch:chokepoints-ref", maxStaleMin: 60 * 24 * 14 },
      // weekly cron; 14d = 2× interval
      { key: "seed-meta:energy:chokepoint-flows", maxStaleMin: 720 }
      // 6h cron; 12h = 2× interval
    ],
    _apiPaths: [
      "GET /api/intelligence/v1/get-country-port-activity",
      "GET /api/supply-chain/v1/get-chokepoint-status"
    ]
  },
  {
    name: "get_positive_events",
    _outputBudgetBytes: 131072,
    description: "Positive geopolitical events: diplomatic agreements, humanitarian aid, development milestones, and peace initiatives worldwide.",
    inputSchema: {
      type: "object",
      properties: {
        category: {
          type: "string",
          enum: ["science-health", "nature-wildlife", "climate-wins", "innovation-tech", "humanity-kindness", "culture-community"],
          description: "Filter to one positive-event category."
        },
        limit: { type: "number", description: "Cap the event list to at most this many items (default 30, pass 0 for no cap)." }
      },
      required: []
    },
    outputSchema: cacheEnvelope({
      "geo-bootstrap": {
        type: ["object", "null"],
        properties: { events: { type: "array", items: { type: "object", properties: {
          category: { type: "string" },
          title: { type: "string" },
          summary: { type: "string" },
          date: { type: "string" }
        } } } }
      }
    }),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    _postFilter: (data, params) => {
      const category = argStr(params.category);
      if (category) narrowNested(data, "geo-bootstrap", "events", (e) => argStr(e.category) === category);
      capNested(data, "geo-bootstrap", "events", argNum(params.limit) ?? DEFAULT_LIST_LIMIT);
      return data;
    },
    _cacheKeys: ["positive_events:geo-bootstrap:v1"],
    _seedMetaKey: "seed-meta:positive-events:geo",
    _maxStaleMin: 60,
    _apiPaths: [
      "GET /api/positive-events/v1/list-positive-geo-events"
    ]
  },
  {
    name: "get_radiation_data",
    _outputBudgetBytes: 131072,
    description: "Radiation observation levels from global monitoring stations. Flags anomalous readings that may indicate nuclear incidents.",
    inputSchema: {
      type: "object",
      properties: {
        country: { type: "string", description: "Filter to one country by name (case-insensitive substring)." },
        anomalous_only: {
          type: "boolean",
          description: 'Drop observations with severity "normal" \u2014 keep only elevated/spike readings.'
        },
        limit: { type: "number", description: "Cap the observation list to at most this many items (default 30, pass 0 for no cap)." }
      },
      required: []
    },
    outputSchema: cacheEnvelope({
      observations: {
        type: ["object", "null"],
        properties: { observations: { type: "array", items: { type: "object", properties: {
          country: { type: "string" },
          severity: { type: "string" },
          stationName: { type: "string" },
          value: { type: ["number", "null"] },
          unit: { type: "string" }
        } } } }
      }
    }),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    _postFilter: (data, params) => {
      const country = argStr(params.country);
      if (country) narrowNested(data, "observations", "observations", (o) => ciIncludes(o.country, country));
      if (argBool(params.anomalous_only)) {
        narrowNested(data, "observations", "observations", (o) => !argStr(o.severity).endsWith("normal"));
      }
      capNested(data, "observations", "observations", argNum(params.limit) ?? DEFAULT_LIST_LIMIT);
      return data;
    },
    _cacheKeys: ["radiation:observations:v1"],
    _seedMetaKey: "seed-meta:radiation:observations",
    _maxStaleMin: 30,
    _apiPaths: [
      "GET /api/radiation/v1/list-radiation-observations"
    ]
  },
  {
    name: "get_research_signals",
    _outputBudgetBytes: 131072,
    description: "Tech and research event signals: emerging technology events bootstrap data from curated research feeds.",
    inputSchema: {
      type: "object",
      properties: {
        type: {
          type: "string",
          enum: ["conference", "earnings", "ipo", "other"],
          description: "Filter to one tech-event type."
        },
        source: { type: "string", description: 'Filter to one source feed (e.g. "techmeme", "dev.events", "curated").' },
        limit: { type: "number", description: "Cap the event list to at most this many items (default 30, pass 0 for no cap)." }
      },
      required: []
    },
    outputSchema: cacheEnvelope({
      "tech-events-bootstrap": {
        type: ["object", "null"],
        properties: { events: { type: "array", items: { type: "object", properties: {
          type: { type: "string" },
          source: { type: "string" },
          title: { type: "string" },
          date: { type: "string" }
        } } } }
      }
    }),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    _postFilter: (data, params) => {
      const type = argStr(params.type);
      const source = argStr(params.source);
      if (type) narrowNested(data, "tech-events-bootstrap", "events", (e) => argStr(e.type) === type);
      if (source) narrowNested(data, "tech-events-bootstrap", "events", (e) => argStr(e.source) === source);
      capNested(data, "tech-events-bootstrap", "events", argNum(params.limit) ?? DEFAULT_LIST_LIMIT);
      return data;
    },
    _cacheKeys: ["research:tech-events-bootstrap:v1"],
    _seedMetaKey: "seed-meta:research:tech-events",
    _maxStaleMin: 480,
    _apiPaths: [
      "GET /api/research/v1/list-tech-events"
    ]
  },
  {
    name: "get_forecast_predictions",
    _uiResourceUri: FORECASTS_UI_URI,
    _outputBudgetBytes: 131072,
    description: "AI-generated geopolitical and economic forecasts from WorldMonitor's predictive models. Covers upcoming risk events and probability assessments.",
    inputSchema: {
      type: "object",
      properties: {
        domain: { type: "string", description: 'Filter to one forecast domain (exact, case-insensitive \u2014 e.g. "shipping", "energy", "macro").' },
        region: { type: "string", description: "Filter to one region/theater (case-insensitive substring)." },
        limit: { type: "number", description: "Cap the forecast list to at most this many items (default 30, pass 0 for no cap)." }
      },
      required: []
    },
    outputSchema: cacheEnvelope({
      predictions: {
        type: ["object", "null"],
        properties: { predictions: { type: "array", items: { type: "object", properties: {
          domain: { type: "string" },
          region: { type: "string" },
          probability: { type: ["number", "null"] },
          title: { type: "string" }
        } } } }
      }
    }),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    _postFilter: (data, params) => {
      const domain = argStr(params.domain);
      const region = argStr(params.region);
      if (domain) narrowNested(data, "predictions", "predictions", (p) => argStr(p.domain) === domain);
      if (region) narrowNested(data, "predictions", "predictions", (p) => ciIncludes(p.region, region));
      capNested(data, "predictions", "predictions", argNum(params.limit) ?? DEFAULT_LIST_LIMIT);
      return data;
    },
    _cacheKeys: ["forecast:predictions:v2"],
    _seedMetaKey: "seed-meta:forecast:predictions",
    _maxStaleMin: 90,
    _apiPaths: [
      "GET /api/forecast/v1/get-forecasts"
    ]
  },
  {
    name: "get_forecast_scorecard",
    _outputBudgetBytes: 65536,
    description: "Forecast resolution scorecard with calibration, Brier/log score, domain and generation-origin breakdowns, and pending/judged resolution counts.",
    inputSchema: {
      type: "object",
      properties: {},
      required: []
    },
    outputSchema: cacheEnvelope({
      scorecard: {
        type: ["object", "null"],
        properties: {
          generatedAt: { type: ["number", "null"] },
          rollingWindowDays: { type: ["number", "null"] },
          totals: { type: ["object", "null"] },
          overall: { type: ["object", "null"] },
          skill: { type: ["object", "null"] },
          byDomain: { type: "array", items: { type: "object" } },
          byGenerationOrigin: { type: "array", items: { type: "object" } },
          calibration: { type: "array", items: { type: "object" } },
          vsMarketSkill: { type: ["object", "null"] }
        }
      }
    }),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    _cacheKeys: ["forecast:scorecard:v1"],
    _seedMetaKey: "seed-meta:forecast:scorecard",
    _maxStaleMin: 2160,
    _apiPaths: [
      "GET /api/forecast/v1/get-forecast-scorecard"
    ]
  },
  // -------------------------------------------------------------------------
  // Social velocity — cache read (Reddit signals, seeded by relay)
  // -------------------------------------------------------------------------
  {
    name: "get_social_velocity",
    _outputBudgetBytes: 131072,
    description: "Reddit geopolitical social velocity: top posts from worldnews, geopolitics, and related subreddits with engagement scores and trend signals.",
    inputSchema: {
      type: "object",
      properties: {
        subreddit: { type: "string", description: 'Filter to one subreddit (e.g. "worldnews", "geopolitics").' },
        limit: { type: "number", description: "Cap the post list to at most this many items (default 30, pass 0 for no cap)." }
      },
      required: []
    },
    outputSchema: cacheEnvelope({
      reddit: {
        type: ["object", "null"],
        properties: { posts: { type: "array", items: { type: "object", properties: {
          subreddit: { type: "string" },
          title: { type: "string" },
          score: { type: ["number", "null"] },
          url: { type: "string" },
          createdAt: { type: ["string", "number"] }
        } } } }
      }
    }),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    _postFilter: (data, params) => {
      const sub = argStr(params.subreddit);
      if (sub) narrowNested(data, "reddit", "posts", (p) => argStr(p.subreddit) === sub);
      capNested(data, "reddit", "posts", argNum(params.limit) ?? DEFAULT_LIST_LIMIT);
      return data;
    },
    _cacheKeys: ["intelligence:social:reddit:v1"],
    _seedMetaKey: "seed-meta:intelligence:social-reddit",
    _maxStaleMin: 30,
    _apiPaths: [
      "GET /api/intelligence/v1/get-social-velocity"
    ]
  }
];
export {
  CACHE_TOOLS
};
