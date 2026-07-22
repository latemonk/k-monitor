// api/_cors.js
var ALLOWED_ORIGIN_PATTERNS = [
  /^https:\/\/(.*\.)?worldmonitor\.app$/,
  // Vercel preview deployments under the "eliewm" team scope, e.g.
  //   worldmonitor-git-<branch>-eliewm.vercel.app  (git-branch alias)
  //   worldmonitor-<hash>-eliewm.vercel.app        (deployment URL)
  // Tight on purpose: never a bare *.vercel.app (this is a security allowlist).
  /^https:\/\/worldmonitor-[a-z0-9-]+-eliewm\.vercel\.app$/,
  /^https?:\/\/tauri\.localhost(:\d+)?$/,
  /^https?:\/\/[a-z0-9-]+\.tauri\.localhost(:\d+)?$/i,
  /^tauri:\/\/localhost$/,
  /^asset:\/\/localhost$/,
  // Only allow bare localhost/127.0.0.1 in non-production (matches server/cors.ts)
  ...process.env.NODE_ENV === "production" ? [] : [
    /^https?:\/\/localhost(:\d+)?$/,
    /^https?:\/\/127\.0\.0\.1(:\d+)?$/
  ]
];
var ALLOWED_HEADERS = [
  "Content-Type",
  "Authorization",
  "X-WorldMonitor-Key",
  "X-Api-Key",
  "X-Widget-Key",
  "X-Pro-Key",
  "X-WorldMonitor-Desktop-Timestamp",
  "X-WorldMonitor-Desktop-Signature",
  "Idempotency-Key",
  "Mcp-Session-Id",
  "MCP-Protocol-Version",
  "Last-Event-ID"
].join(", ");
var EXPOSED_HEADERS = [
  "Mcp-Session-Id",
  "WWW-Authenticate",
  "Retry-After",
  "Idempotency-Key",
  "Idempotent-Replayed",
  // IETF RateLimit fields (draft-ietf-httpapi-ratelimit-headers): RateLimit-Policy
  // + RateLimit-Limit are advertised on every API response (vercel.json); the
  // combined RateLimit member and RateLimit-Remaining/Reset appear on a 429.
  // Exposed so browser-context agents can read them cross-origin and self-throttle.
  "RateLimit",
  "RateLimit-Policy",
  "RateLimit-Limit",
  "RateLimit-Remaining",
  "RateLimit-Reset",
  // Legacy X-RateLimit-* retained for back-compat with existing consumers.
  "X-RateLimit-Limit",
  "X-RateLimit-Remaining",
  "X-RateLimit-Reset",
  "X-WorldMonitor-Bbox",
  "X-WorldMonitor-Bbox-Missing",
  "X-WorldMonitor-Bbox-Invalid",
  "X-Military-Bbox"
].join(", ");
function isAllowedOrigin(origin) {
  return Boolean(origin) && ALLOWED_ORIGIN_PATTERNS.some((pattern) => pattern.test(origin));
}
function getCorsHeaders(req, methods = "GET, OPTIONS") {
  const origin = req.headers.get("origin") || "";
  const allowOrigin = isAllowedOrigin(origin) ? origin : "https://worldmonitor.app";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": methods,
    "Access-Control-Allow-Headers": ALLOWED_HEADERS,
    "Access-Control-Expose-Headers": EXPOSED_HEADERS,
    "Access-Control-Max-Age": "3600",
    "Vary": "Origin"
  };
}
function isDisallowedOrigin(req) {
  const origin = req.headers.get("origin");
  if (!origin) return false;
  return !isAllowedOrigin(origin);
}

// api/_upstash-json.js
async function readRawJsonFromUpstash(key, timeoutMs = 3e3) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    throw new Error("readRawJsonFromUpstash: UPSTASH_REDIS_REST_URL/TOKEN not configured");
  }
  const resp = await fetch(`${url}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(timeoutMs)
  });
  if (!resp.ok) {
    throw new Error(`readRawJsonFromUpstash: Upstash GET ${key} returned HTTP ${resp.status}`);
  }
  const data = await resp.json();
  if (data.result == null) return null;
  try {
    return JSON.parse(data.result);
  } catch (err) {
    throw new Error(
      `readRawJsonFromUpstash: JSON.parse failed for ${key}: ${err instanceof Error ? err.message : String(err)}`
    );
  }
}

// api/_sentry-common.js
var _key = "";
var _envelopeUrl = "";
(function parseDsn() {
  if (process.env.NODE_TEST_CONTEXT) return;
  const dsn = process.env.VITE_SENTRY_DSN ?? "";
  if (!dsn) return;
  try {
    const u = new URL(dsn);
    _key = u.username;
    const projectId = u.pathname.replace(/^\//, "");
    _envelopeUrl = `${u.protocol}//${u.host}/api/${projectId}/envelope/`;
  } catch {
  }
})();
function parseStack(stack) {
  const lines = stack.split("\n").slice(1, 30);
  const frames = [];
  for (const line of lines) {
    const m = line.match(/at\s+(?:(.+?)\s+\()?(.+?):(\d+):(\d+)\)?$/);
    if (!m) continue;
    frames.push({
      function: m[1] || "<anonymous>",
      filename: m[2],
      lineno: Number(m[3]),
      colno: Number(m[4])
    });
  }
  return frames.reverse();
}
function buildEnvelope(err, ctx, runtimeCfg) {
  const errMsg = err instanceof Error ? err.message : String(err);
  const errType = err instanceof Error ? err.constructor.name : "Error";
  const stack = err instanceof Error && err.stack ? err.stack : void 0;
  const eventId = crypto.randomUUID().replace(/-/g, "");
  const timestamp = (/* @__PURE__ */ new Date()).toISOString();
  const level = ctx?.level === "warning" || ctx?.level === "info" || ctx?.level === "fatal" ? ctx.level : "error";
  const event = {
    event_id: eventId,
    timestamp,
    level,
    platform: runtimeCfg.platform,
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "production",
    release: process.env.VERCEL_GIT_COMMIT_SHA,
    exception: {
      values: [
        {
          type: errType,
          value: errMsg,
          ...stack ? { stacktrace: { frames: parseStack(stack) } } : {}
        }
      ]
    },
    tags: { surface: "api", runtime: runtimeCfg.runtime, ...ctx?.tags ?? {} },
    extra: ctx?.extra,
    // Caller-supplied fingerprint overrides Sentry's default grouping.
    // Use when the error message contains a high-cardinality token (request id,
    // ephemeral hash) that would otherwise split one logical issue into many.
    ...Array.isArray(ctx?.fingerprint) && ctx.fingerprint.length > 0 ? { fingerprint: ctx.fingerprint } : {}
  };
  const header = JSON.stringify({ event_id: eventId, sent_at: timestamp });
  const itemHeader = JSON.stringify({ type: "event" });
  const itemPayload = JSON.stringify(event);
  return `${header}
${itemHeader}
${itemPayload}
`;
}
async function deliver(body, logPrefix) {
  if (!_envelopeUrl || !_key) return;
  try {
    const res = await fetch(_envelopeUrl, {
      method: "POST",
      keepalive: true,
      signal: AbortSignal.timeout(2e3),
      headers: {
        "Content-Type": "application/x-sentry-envelope",
        "X-Sentry-Auth": `Sentry sentry_version=7, sentry_key=${_key}`
      },
      body
    });
    if (!res.ok) {
      const hint = res.status === 401 || res.status === 403 ? " \u2014 check VITE_SENTRY_DSN and auth key" : res.status === 429 ? " \u2014 rate limited by Sentry" : " \u2014 Sentry outage or transient error";
      console.warn(`${logPrefix} non-2xx response ${res.status}${hint}`);
    }
  } catch (fetchErr) {
    console.warn(
      `${logPrefix} failed to deliver event:`,
      fetchErr instanceof Error ? fetchErr.message : fetchErr
    );
  }
}
function makeCaptureSilentError({ runtime, platform, logPrefix }) {
  const runtimeCfg = { runtime, platform };
  return function captureSilentError2(err, opts) {
    if (!_envelopeUrl || !_key) return Promise.resolve();
    const promise = deliver(buildEnvelope(err, opts, runtimeCfg), logPrefix);
    if (opts?.ctx && typeof opts.ctx.waitUntil === "function") {
      opts.ctx.waitUntil(promise);
    } else {
      promise.catch(() => {
      });
    }
    return promise;
  };
}

// api/_sentry-edge.js
var captureSilentError = makeCaptureSilentError({
  runtime: "edge",
  platform: "javascript",
  logPrefix: "[sentry-edge]"
});

// shared/brief-envelope.js
var BRIEF_ENVELOPE_VERSION = 4;
var SUPPORTED_ENVELOPE_VERSIONS = /* @__PURE__ */ new Set([1, 2, 3, 4]);

// server/_shared/brief-render.js
var FONTS_HREF = "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Source+Serif+4:ital,wght@0,400;0,600;1,400&family=IBM+Plex+Mono:wght@400;500;600&display=swap";
var MAX_THREADS_PER_PAGE = 6;
var DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
var THREAT_LABELS = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low"
};
var HIGHLIGHTED_LEVELS = /* @__PURE__ */ new Set(["critical", "high"]);
var VALID_THREAT_LEVELS = /* @__PURE__ */ new Set(
  /** @type {BriefThreatLevel[]} */
  ["critical", "high", "medium", "low"]
);
var HTML_ESCAPE_MAP = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;"
};
var HTML_ESCAPE_RE = /[&<>"']/;
var HTML_ESCAPE_RE_G = /[&<>"']/g;
function escapeHtml(str) {
  const s = String(str);
  if (!HTML_ESCAPE_RE.test(s)) return s;
  return s.replace(HTML_ESCAPE_RE_G, (ch) => HTML_ESCAPE_MAP[ch]);
}
function pad2(n) {
  return String(n).padStart(2, "0");
}
function isObject(v) {
  return typeof v === "object" && v !== null;
}
function isNonEmptyString(v) {
  return typeof v === "string" && v.length > 0;
}
function isFiniteNumber(v) {
  return typeof v === "number" && Number.isFinite(v);
}
var ALLOWED_ENVELOPE_KEYS = /* @__PURE__ */ new Set(["version", "issuedAt", "data"]);
var ALLOWED_DATA_KEYS = /* @__PURE__ */ new Set(["user", "issue", "date", "dateLong", "digest", "stories"]);
var ALLOWED_USER_KEYS = /* @__PURE__ */ new Set(["name", "tz"]);
var ALLOWED_DIGEST_KEYS = /* @__PURE__ */ new Set([
  "greeting",
  "lead",
  "numbers",
  "threads",
  "signals",
  "publicLead",
  "publicSignals",
  "publicThreads"
]);
var ALLOWED_NUMBERS_KEYS = /* @__PURE__ */ new Set(["clusters", "multiSource", "surfaced"]);
var ALLOWED_THREAD_KEYS = /* @__PURE__ */ new Set(["tag", "teaser"]);
var ALLOWED_STORY_KEYS = /* @__PURE__ */ new Set([
  "category",
  "country",
  "threatLevel",
  "headline",
  "description",
  "source",
  "sourceUrl",
  // v4+ stable per-story-cluster identity (see shared/brief-envelope.js
  // version-history doc-block). Required on v4 envelopes — checked
  // below in the per-story validator. Optional on v1-v3 envelopes
  // still in TTL.
  "clusterId",
  "whyMatters"
]);
var ALLOWED_SOURCE_URL_SCHEMES = /* @__PURE__ */ new Set(["https:", "http:"]);
function validateSourceUrl(raw) {
  if (typeof raw !== "string" || raw.length === 0) {
    throw new Error("must be a non-empty string");
  }
  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error(`must be a parseable absolute URL (got ${JSON.stringify(raw)})`);
  }
  if (!ALLOWED_SOURCE_URL_SCHEMES.has(parsed.protocol)) {
    throw new Error(`scheme ${JSON.stringify(parsed.protocol)} is not allowed (http/https only)`);
  }
  if (parsed.username || parsed.password) {
    throw new Error("must not include userinfo credentials");
  }
  return parsed.toString();
}
function assertNoExtraKeys(obj, allowed, path) {
  for (const key of Object.keys(obj)) {
    if (!allowed.has(key)) {
      throw new Error(
        `${path} has unexpected key ${JSON.stringify(key)}; allowed keys: ${[...allowed].join(", ")}`
      );
    }
  }
}
function assertBriefEnvelope(envelope) {
  if (!isObject(envelope)) {
    throw new Error("renderBriefMagazine: envelope must be an object");
  }
  const env = (
    /** @type {Record<string, unknown>} */
    envelope
  );
  assertNoExtraKeys(env, ALLOWED_ENVELOPE_KEYS, "envelope");
  if (typeof env.version !== "number" || !SUPPORTED_ENVELOPE_VERSIONS.has(env.version)) {
    throw new Error(
      `renderBriefMagazine: envelope.version=${JSON.stringify(env.version)} is not in supported set [${[...SUPPORTED_ENVELOPE_VERSIONS].join(", ")}]. Deploy a matching renderer before producing envelopes at this version.`
    );
  }
  if (!isFiniteNumber(env.issuedAt)) {
    throw new Error("renderBriefMagazine: envelope.issuedAt must be a finite number");
  }
  if (!isObject(env.data)) {
    throw new Error("renderBriefMagazine: envelope.data is required");
  }
  const data = (
    /** @type {Record<string, unknown>} */
    env.data
  );
  assertNoExtraKeys(data, ALLOWED_DATA_KEYS, "envelope.data");
  if (!isObject(data.user)) throw new Error("envelope.data.user is required");
  const user = (
    /** @type {Record<string, unknown>} */
    data.user
  );
  assertNoExtraKeys(user, ALLOWED_USER_KEYS, "envelope.data.user");
  if (!isNonEmptyString(user.name)) throw new Error("envelope.data.user.name must be a non-empty string");
  if (!isNonEmptyString(user.tz)) throw new Error("envelope.data.user.tz must be a non-empty string");
  if (!isNonEmptyString(data.issue)) throw new Error("envelope.data.issue must be a non-empty string");
  if (!isNonEmptyString(data.date)) throw new Error("envelope.data.date must be a non-empty string");
  if (!DATE_REGEX.test(
    /** @type {string} */
    data.date
  )) {
    throw new Error("envelope.data.date must match YYYY-MM-DD");
  }
  if (!isNonEmptyString(data.dateLong)) throw new Error("envelope.data.dateLong must be a non-empty string");
  if (!isObject(data.digest)) throw new Error("envelope.data.digest is required");
  const digest = (
    /** @type {Record<string, unknown>} */
    data.digest
  );
  assertNoExtraKeys(digest, ALLOWED_DIGEST_KEYS, "envelope.data.digest");
  if (!isNonEmptyString(digest.greeting)) throw new Error("envelope.data.digest.greeting must be a non-empty string");
  if (!isNonEmptyString(digest.lead)) throw new Error("envelope.data.digest.lead must be a non-empty string");
  if (digest.publicLead !== void 0 && !isNonEmptyString(digest.publicLead)) {
    throw new Error("envelope.data.digest.publicLead, when present, must be a non-empty string");
  }
  if (digest.publicSignals !== void 0) {
    if (!Array.isArray(digest.publicSignals)) {
      throw new Error("envelope.data.digest.publicSignals, when present, must be an array");
    }
    digest.publicSignals.forEach((s, i) => {
      if (!isNonEmptyString(s)) throw new Error(`envelope.data.digest.publicSignals[${i}] must be a non-empty string`);
    });
  }
  if (digest.publicThreads !== void 0) {
    if (!Array.isArray(digest.publicThreads)) {
      throw new Error("envelope.data.digest.publicThreads, when present, must be an array");
    }
    digest.publicThreads.forEach((t, i) => {
      if (!isObject(t)) throw new Error(`envelope.data.digest.publicThreads[${i}] must be an object`);
      const th = (
        /** @type {Record<string, unknown>} */
        t
      );
      assertNoExtraKeys(th, ALLOWED_THREAD_KEYS, `envelope.data.digest.publicThreads[${i}]`);
      if (!isNonEmptyString(th.tag)) throw new Error(`envelope.data.digest.publicThreads[${i}].tag must be a non-empty string`);
      if (!isNonEmptyString(th.teaser)) throw new Error(`envelope.data.digest.publicThreads[${i}].teaser must be a non-empty string`);
    });
  }
  if (!isObject(digest.numbers)) throw new Error("envelope.data.digest.numbers is required");
  const numbers = (
    /** @type {Record<string, unknown>} */
    digest.numbers
  );
  assertNoExtraKeys(numbers, ALLOWED_NUMBERS_KEYS, "envelope.data.digest.numbers");
  for (
    const key of
    /** @type {const} */
    ["clusters", "multiSource", "surfaced"]
  ) {
    if (!isFiniteNumber(numbers[key])) {
      throw new Error(`envelope.data.digest.numbers.${key} must be a finite number`);
    }
  }
  if (!Array.isArray(digest.threads)) {
    throw new Error("envelope.data.digest.threads must be an array");
  }
  digest.threads.forEach((t, i) => {
    if (!isObject(t)) throw new Error(`envelope.data.digest.threads[${i}] must be an object`);
    const th = (
      /** @type {Record<string, unknown>} */
      t
    );
    assertNoExtraKeys(th, ALLOWED_THREAD_KEYS, `envelope.data.digest.threads[${i}]`);
    if (!isNonEmptyString(th.tag)) throw new Error(`envelope.data.digest.threads[${i}].tag must be a non-empty string`);
    if (!isNonEmptyString(th.teaser)) throw new Error(`envelope.data.digest.threads[${i}].teaser must be a non-empty string`);
  });
  if (!Array.isArray(digest.signals)) {
    throw new Error("envelope.data.digest.signals must be an array");
  }
  digest.signals.forEach((s, i) => {
    if (!isNonEmptyString(s)) throw new Error(`envelope.data.digest.signals[${i}] must be a non-empty string`);
  });
  if (!Array.isArray(data.stories) || data.stories.length === 0) {
    throw new Error("envelope.data.stories must be a non-empty array");
  }
  data.stories.forEach((s, i) => {
    if (!isObject(s)) throw new Error(`envelope.data.stories[${i}] must be an object`);
    const st = (
      /** @type {Record<string, unknown>} */
      s
    );
    assertNoExtraKeys(st, ALLOWED_STORY_KEYS, `envelope.data.stories[${i}]`);
    for (
      const field of
      /** @type {const} */
      ["category", "country", "headline", "description", "source", "whyMatters"]
    ) {
      if (!isNonEmptyString(st[field])) {
        throw new Error(`envelope.data.stories[${i}].${field} must be a non-empty string`);
      }
    }
    if (typeof st.threatLevel !== "string" || !VALID_THREAT_LEVELS.has(
      /** @type {BriefThreatLevel} */
      st.threatLevel
    )) {
      throw new Error(
        `envelope.data.stories[${i}].threatLevel must be one of critical|high|medium|low (got ${JSON.stringify(st.threatLevel)})`
      );
    }
    if (env.version >= 2 || st.sourceUrl !== void 0) {
      try {
        validateSourceUrl(st.sourceUrl);
      } catch (err) {
        throw new Error(
          `envelope.data.stories[${i}].sourceUrl ${/** @type {Error} */
          err.message}`
        );
      }
    }
    if (env.version === BRIEF_ENVELOPE_VERSION) {
      if (!isNonEmptyString(st.clusterId)) {
        throw new Error(
          `envelope.data.stories[${i}].clusterId must be a non-empty string on v${BRIEF_ENVELOPE_VERSION} envelopes (got ${JSON.stringify(st.clusterId)})`
        );
      }
    } else if (st.clusterId !== void 0 && !isNonEmptyString(st.clusterId)) {
      throw new Error(
        `envelope.data.stories[${i}].clusterId, when present on v${env.version}, must be a non-empty string (got ${JSON.stringify(st.clusterId)})`
      );
    }
  });
  if (numbers.surfaced !== data.stories.length) {
    throw new Error(
      `envelope.data.digest.numbers.surfaced=${numbers.surfaced} must equal envelope.data.stories.length=${data.stories.length}`
    );
  }
}
var LOGO_SYMBOL = '<svg aria-hidden="true" style="display:none;position:absolute;width:0;height:0" focusable="false"><defs><symbol id="wm-logo-core" viewBox="0 0 64 64"><circle cx="32" cy="32" r="28"/><ellipse cx="32" cy="32" rx="5" ry="28"/><ellipse cx="32" cy="32" rx="14" ry="28"/><ellipse cx="32" cy="32" rx="22" ry="28"/><ellipse cx="32" cy="32" rx="28" ry="5"/><ellipse cx="32" cy="32" rx="28" ry="14"/><path class="wm-ekg" d="M 6 32 L 20 32 L 24 24 L 30 40 L 36 22 L 42 38 L 46 32 L 56 32"/><circle class="wm-ekg-dot" cx="57" cy="32" r="1.8"/></symbol></defs></svg>';
function logoRef({ size, color }) {
  const styleAttr = color ? ` style="color: ${color};"` : "";
  return `<svg class="wm-logo" width="${size}" height="${size}" viewBox="0 0 64 64" aria-label="WorldMonitor"${styleAttr}><use href="#wm-logo-core"/></svg>`;
}
function digestRunningHead(dateShort, label) {
  return '<div class="running-head"><span class="mono left">' + logoRef({ size: 22 }) + ` \xB7 WorldMonitor Brief \xB7 ${escapeHtml(dateShort)} \xB7</span><span class="mono">${escapeHtml(label)}</span></div>`;
}
function coverGreeting(greeting) {
  if (typeof greeting !== "string" || greeting.length === 0) return "Hello";
  return greeting.replace(/\.+$/, "").trim() || "Hello";
}
function renderCover({ dateLong, issue, storyCount, pageIndex, totalPages, greeting }) {
  const blurb = storyCount === 1 ? "One thread that shaped the world today." : `${storyCount} threads that shaped the world today.`;
  return '<section class="page cover"><div class="meta-top"><span class="brand">' + logoRef({ size: 48 }) + `<span class="mono">WorldMonitor</span></span><span class="mono">Issue \u2116 ${escapeHtml(issue)}</span></div><div class="hero"><div class="kicker">${escapeHtml(dateLong)}</div><h1>WorldMonitor<br/>Brief.</h1><p class="blurb">${escapeHtml(blurb)}</p></div><div class="meta-bottom"><span class="mono">${escapeHtml(coverGreeting(greeting))}</span><span class="mono">Swipe / \u2194 to begin</span></div><div class="page-number mono">${pad2(pageIndex)} / ${pad2(totalPages)}</div></section>`;
}
function renderDigestGreeting({ greeting, lead, dateShort, pageIndex, totalPages }) {
  const blockquote = typeof lead === "string" && lead.length > 0 ? `<blockquote>${escapeHtml(lead)}</blockquote>` : "";
  return '<section class="page digest">' + digestRunningHead(dateShort, "Digest / 01") + `<div class="body"><div class="label mono">At The Top Of The Hour</div><h2>${escapeHtml(greeting)}</h2>` + blockquote + `<hr class="rule" /></div><div class="page-number mono">${pad2(pageIndex)} / ${pad2(totalPages)}</div></section>`;
}
function renderDigestNumbers({ numbers, date, dateShort, pageIndex, totalPages }) {
  const rows = [
    { n: numbers.clusters, label: "story clusters ingested in the last 24 hours" },
    { n: numbers.multiSource, label: "multi-source confirmed events" },
    { n: numbers.surfaced, label: "threads surfaced in this brief" }
  ].map(
    (row) => `<div class="stat-row"><div class="stat-num">${pad2(row.n)}</div><div class="stat-label">${escapeHtml(row.label)}</div></div>`
  ).join("");
  return '<section class="page digest">' + digestRunningHead(dateShort, "Digest / 02 \u2014 At A Glance") + `<div class="body"><div class="label mono">The Numbers Today</div><div class="stats">${rows}</div><div class="footer-caption mono">Signal Window \xB7 ${escapeHtml(date)}</div></div><div class="page-number mono">${pad2(pageIndex)} / ${pad2(totalPages)}</div></section>`;
}
function renderDigestThreadsPage({
  threads,
  dateShort,
  label,
  heading,
  includeEndMarker,
  pageIndex,
  totalPages
}) {
  const rows = threads.map(
    (t) => `<p class="thread"><span class="tag">${escapeHtml(t.tag)} \u2014</span>${escapeHtml(t.teaser)}</p>`
  ).join("");
  const endMarker = includeEndMarker ? '<div class="end-marker"><hr /><span class="mono">Stories follow \u2192</span></div>' : "";
  return '<section class="page digest">' + digestRunningHead(dateShort, label) + `<div class="body"><div class="label mono">Today\u2019s Threads</div><h2>${escapeHtml(heading)}</h2><div class="threads">${rows}</div>` + endMarker + `</div><div class="page-number mono">${pad2(pageIndex)} / ${pad2(totalPages)}</div></section>`;
}
function renderDigestSignals({ signals, dateShort, pageIndex, totalPages }) {
  const paragraphs = signals.map((s) => `<p class="signal">${escapeHtml(s)}</p>`).join("");
  return '<section class="page digest">' + digestRunningHead(dateShort, "Digest / 04 \u2014 Signals") + `<div class="body"><div class="label mono">Signals To Watch</div><h2>What would change the story.</h2><div class="signals">${paragraphs}</div><div class="end-marker"><hr /><span class="mono">End of digest \xB7 Stories follow \u2192</span></div></div><div class="page-number mono">${pad2(pageIndex)} / ${pad2(totalPages)}</div></section>`;
}
function buildTrackedSourceUrl(raw, issueDate, rank) {
  try {
    const u = new URL(raw);
    if (!u.searchParams.has("utm_source")) u.searchParams.set("utm_source", "worldmonitor");
    if (!u.searchParams.has("utm_medium")) u.searchParams.set("utm_medium", "brief");
    if (!u.searchParams.has("utm_campaign")) u.searchParams.set("utm_campaign", issueDate);
    if (!u.searchParams.has("utm_content")) u.searchParams.set("utm_content", `story-${pad2(rank)}`);
    return u.toString();
  } catch {
    return raw;
  }
}
function extractIso2Tokens(country) {
  if (typeof country !== "string" || country.length === 0) return [];
  const out = [];
  for (const raw of country.split(/[\s/]+/)) {
    if (raw.length === 2 && /^[a-zA-Z]{2}$/.test(raw)) {
      out.push(raw.toUpperCase());
    }
  }
  return out;
}
function renderStoryPage({ story, rank, palette, pageIndex, totalPages, issueDate, followedSet }) {
  const threatClass = HIGHLIGHTED_LEVELS.has(story.threatLevel) ? " crit" : "";
  const threatLabel = THREAT_LABELS[story.threatLevel];
  const iso2Tokens = extractIso2Tokens(story.country);
  const primaryCountry = iso2Tokens[0] ?? "";
  const followed = iso2Tokens.some((c) => followedSet.has(c));
  const dataAttrs = ' data-thread-open="1"' + (primaryCountry ? ` data-country="${escapeHtml(primaryCountry)}"` : "") + ` data-severity="${escapeHtml(story.threatLevel)}" data-followed="${followed ? "1" : "0"}"`;
  const sourceBlock = story.sourceUrl ? `<a class="source-link" href="${escapeHtml(buildTrackedSourceUrl(story.sourceUrl, issueDate, rank))}" target="_blank" rel="noopener noreferrer"${dataAttrs}>${escapeHtml(story.source)}</a>` : escapeHtml(story.source);
  return `<section class="page story ${palette}"><div class="left"><div class="rank-ghost">${pad2(rank)}</div><div class="left-content"><div class="tag-row"><span class="tag">${escapeHtml(story.category)}</span><span class="tag">${escapeHtml(story.country)}</span><span class="tag${threatClass}">${escapeHtml(threatLabel)}</span></div><h3>${escapeHtml(story.headline)}</h3><p class="desc">${escapeHtml(story.description)}</p><div class="source">Source \xB7 ${sourceBlock}</div></div></div><div class="right"><div class="callout"><div class="label">Why this is important</div><p class="note">${escapeHtml(story.whyMatters)}</p></div></div><div class="logo-chrome">` + logoRef({ size: 28 }) + `<span class="mono">WorldMonitor Brief</span></div><div class="page-number mono">${pad2(pageIndex)} / ${pad2(totalPages)}</div></section>`;
}
function renderBackCover({ tz, pageIndex, totalPages, publicMode, refCode }) {
  const ctaHref = publicMode ? `https://worldmonitor.app/pro${refCode ? `?ref=${encodeURIComponent(refCode)}` : ""}` : "https://worldmonitor.app";
  const kicker = publicMode ? "You\u2019re reading a shared brief" : "Thank you for reading";
  const headline = publicMode ? "Get your own<br/>daily brief." : "End of<br/>Transmission.";
  const metaLeft = publicMode ? `<a href="${escapeHtml(ctaHref)}" class="mono back-cta" target="_blank" rel="noopener">Subscribe \u2192</a>` : '<span class="mono">worldmonitor.app</span>';
  const metaRight = publicMode ? '<span class="mono">worldmonitor.app</span>' : `<span class="mono">Next brief \xB7 08:00 ${escapeHtml(tz)}</span>`;
  return '<section class="page cover back"><div class="hero"><div class="centered-logo">' + logoRef({ size: 80, color: "var(--bone)" }) + `</div><div class="kicker">${kicker}</div><h1>${headline}</h1></div><div class="meta-bottom">` + metaLeft + metaRight + `</div><div class="page-number mono">${pad2(pageIndex)} / ${pad2(totalPages)}</div></section>`;
}
var STYLE_BLOCK = `<style>
  :root {
    /* WorldMonitor brand palette \u2014 aligned with /pro landing + dashboard.
       Previous sienna rust (#8b3a1f) was the only off-brand color in the
       product; swapped to WM mint at two strengths so the accent harmonises
       on both light and dark pages. Paper unified to a single crisp white
       (#fafafa) rather than warm cream so the brief reads as a sibling of
       /pro rather than a separate editorial product. */
    --ink: #0a0a0a;
    --bone: #f2ede4;
    --cream: #fafafa;           /* was #f1e9d8 \u2014 unified with --paper */
    --cream-ink: #0a0a0a;       /* was #1a1612 \u2014 crisper contrast on white */
    /* --sienna is kept as the variable name for backwards compat (every
       .digest rule below references it) but the VALUE is now a dark
       mint sized for WCAG AA 4.5:1 on #fafafa. The earlier #3ab567 hit
       only ~2.3:1, which failed accessibility for the mono running
       heads + source lines even at their 13-18 px sizes. #1f7a3f lands
       at ~4.90:1 \u2014 passes AA for normal text, still reads as mint-
       family (green hue dominant), and sits close enough to the brand
       #4ade80 that a reader recognises the relationship. */
    --sienna: #1f7a3f;          /* dark mint for light-page accents \u2014 WCAG AA on #fafafa */
    --mint: #4ade80;            /* bright WM brand mint for dark-page accents (AAA on #0a0a0a) */
    --paper: #fafafa;
    --paper-ink: #0a0a0a;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body {
    width: 100vw; height: 100vh; overflow: hidden;
    background: #000;
    font-family: 'Source Serif 4', Georgia, serif;
    -webkit-font-smoothing: antialiased;
  }
  .deck {
    width: 100vw; height: 100vh; display: flex;
    transition: transform 620ms cubic-bezier(0.77, 0, 0.175, 1);
    will-change: transform;
  }
  .page {
    flex: 0 0 100vw; width: 100vw; height: 100vh;
    padding: 6vh 6vw 10vh;
    /* overflow-y: auto so pages whose content exceeds 100vh become
       internally scrollable instead of silently clipping (user-reported
       on desktop where vw-scaled body copy can be ~10-20% taller than
       viewport; iPhone Pro Max responsive mode "worked" because narrow
       viewport scaled the vw text down until it fit). overflow-x stays
       hidden so the deck-level horizontal carousel isn't fought by a
       per-page horizontal scrollbar. Pair with the wheel handler in
       NAV_SCRIPT which now defers to native scroll when the current
       page has remaining scroll in the wheel direction. */
    position: relative; overflow-x: hidden; overflow-y: auto;
    /* Smooth out the deck-level transform vs in-page scroll interaction
       on touch + trackpad: contain scroll within the page so a fast
       trackpad flick doesn't bubble to the body (body has overflow:hidden
       anyway, but overscroll-behavior also disables the iOS rubber-band
       effect that visually fights the deck transform). */
    overscroll-behavior: contain;
    display: flex; flex-direction: column;
  }
  .mono {
    font-family: 'IBM Plex Mono', monospace;
    font-weight: 500; letter-spacing: 0.18em;
    text-transform: uppercase; font-size: max(11px, 0.85vw);
  }
  .wm-logo { display: block; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; }
  .wm-logo .wm-ekg { stroke-width: 2.4; }
  .wm-logo .wm-ekg-dot { fill: currentColor; stroke: none; }
  .logo-chrome {
    position: absolute; bottom: 5vh; left: 6vw;
    display: flex; align-items: center; gap: 0.8vw; opacity: 0.7;
  }
  .cover { background: var(--ink); color: var(--bone); }
  .cover .meta-top, .cover .meta-bottom {
    display: flex; justify-content: space-between; align-items: center; opacity: 0.75;
  }
  .cover .meta-top .brand { display: flex; align-items: center; gap: 1vw; }
  .cover .hero {
    flex: 1; display: flex; flex-direction: column; justify-content: center;
  }
  .cover .hero h1 {
    font-family: 'Playfair Display', serif; font-weight: 900;
    font-size: clamp(72px, 10vw, 156px); line-height: 0.92; letter-spacing: -0.03em;
    margin-bottom: 6vh;
    overflow-wrap: anywhere;
  }
  .cover .hero .kicker {
    font-family: 'IBM Plex Mono', monospace;
    font-size: max(13px, 1.1vw); letter-spacing: 0.3em;
    text-transform: uppercase; opacity: 0.75; margin-bottom: 4vh;
  }
  .cover .hero .blurb {
    font-family: 'Source Serif 4', serif; font-style: italic;
    font-size: max(18px, 1.7vw); max-width: 48ch; opacity: 0.82; line-height: 1.4;
  }
  .cover.back { align-items: center; justify-content: center; text-align: center; }
  .cover.back .hero { align-items: center; flex: 0; }
  .cover.back .centered-logo { margin-bottom: 5vh; opacity: 0.9; }
  .cover.back .hero h1 { font-size: clamp(64px, 8vw, 132px); }
  .cover.back .meta-bottom {
    width: 100%; position: absolute; bottom: 6vh; left: 0; padding: 0 6vw;
  }
  .digest { background: var(--cream); color: var(--cream-ink); }
  .digest .running-head {
    display: flex; justify-content: space-between; align-items: center;
    padding-bottom: 2vh; border-bottom: 1px solid rgba(26, 22, 18, 0.18);
  }
  .digest .running-head .left {
    display: flex; align-items: center; gap: 0.8vw;
    color: var(--sienna); font-weight: 600;
  }
  .digest .body {
    flex: 1; display: flex; flex-direction: column;
    justify-content: center; padding-top: 4vh;
  }
  .digest .label { color: var(--sienna); margin-bottom: 5vh; }
  .digest h2 {
    font-family: 'Playfair Display', serif; font-weight: 900;
    font-size: clamp(54px, 7vw, 112px); line-height: 0.98; letter-spacing: -0.02em;
    margin-bottom: 6vh; max-width: 18ch;
    overflow-wrap: anywhere;
  }
  .digest blockquote {
    font-family: 'Source Serif 4', serif; font-style: italic;
    font-size: clamp(20px, 2vw, 34px); line-height: 1.38; max-width: 32ch;
    margin-bottom: 5vh; padding-left: 2vw;
    border-left: 3px solid var(--sienna);
    overflow-wrap: anywhere;
  }
  .digest .rule {
    border: none; height: 2px; background: var(--sienna);
    width: 8vw; margin-top: 5vh;
  }
  .digest .stats { display: flex; flex-direction: column; gap: 3vh; }
  .digest .stat-row {
    display: grid; grid-template-columns: 22vw 1fr;
    align-items: baseline; gap: 3vw;
    padding-bottom: 3vh; border-bottom: 1px solid rgba(26, 22, 18, 0.14);
  }
  .digest .stat-row:last-child { border-bottom: none; }
  .digest .stat-num {
    font-family: 'Playfair Display', serif; font-weight: 900;
    font-size: clamp(84px, 11vw, 168px); line-height: 0.9; color: var(--cream-ink);
  }
  .digest .stat-label {
    font-family: 'Source Serif 4', serif; font-style: italic;
    font-size: max(18px, 1.7vw); line-height: 1.3;
    color: var(--cream-ink); opacity: 0.85;
    overflow-wrap: anywhere;
  }
  .digest .footer-caption { margin-top: 4vh; color: var(--sienna); opacity: 0.85; }
  .digest .threads { display: flex; flex-direction: column; gap: 3.2vh; max-width: 62ch; }
  .digest .thread {
    font-family: 'Source Serif 4', serif;
    font-size: clamp(17px, 1.55vw, 28px); line-height: 1.45;
    color: var(--cream-ink);
    overflow-wrap: anywhere;
  }
  .digest .thread .tag {
    font-family: 'IBM Plex Mono', monospace; font-weight: 600;
    letter-spacing: 0.2em; color: var(--sienna); margin-right: 0.6em;
  }
  .digest .signals { display: flex; flex-direction: column; gap: 3.5vh; max-width: 60ch; }
  .digest .signal {
    font-family: 'Source Serif 4', serif;
    font-size: clamp(18px, 1.65vw, 30px); line-height: 1.45;
    color: var(--cream-ink); padding-left: 2vw;
    border-left: 2px solid var(--sienna);
    overflow-wrap: anywhere;
  }
  .digest .end-marker {
    margin-top: 5vh; display: flex; align-items: center; gap: 1.5vw;
  }
  .digest .end-marker hr {
    flex: 0 0 10vw; border: none; height: 2px; background: var(--sienna);
  }
  .digest .end-marker .mono { color: var(--sienna); }
  .story { display: grid; grid-template-columns: 55fr 45fr; gap: 4vw; }
  .story.light { background: var(--paper); color: var(--paper-ink); }
  .story.dark { background: var(--ink); color: var(--bone); }
  .story .left {
    display: flex; flex-direction: column; justify-content: center;
    position: relative; padding-right: 2vw;
  }
  .story .rank-ghost {
    font-family: 'Playfair Display', serif; font-weight: 900;
    font-size: 38vw; line-height: 0.8;
    position: absolute; top: 50%; left: -1vw;
    transform: translateY(-50%); opacity: 0.07;
    pointer-events: none; letter-spacing: -0.04em;
  }
  .story.dark .rank-ghost { opacity: 0.1; }
  .story .left-content { position: relative; z-index: 2; }
  .story .tag-row {
    display: flex; gap: 1.2vw; margin-bottom: 4vh; flex-wrap: wrap;
  }
  .story .tag {
    font-family: 'IBM Plex Mono', monospace;
    font-size: max(11px, 0.85vw); font-weight: 600;
    letter-spacing: 0.22em; text-transform: uppercase;
    padding: 0.5em 1em; border: 1px solid currentColor; opacity: 0.82;
    max-width: 100%; overflow-wrap: anywhere;
  }
  .story .tag.crit { background: currentColor; color: var(--paper); }
  .story.dark .tag.crit { background: var(--bone); color: var(--ink); border-color: var(--bone); }
  .story h3 {
    font-family: 'Playfair Display', serif; font-weight: 900;
    font-size: clamp(44px, 5vw, 86px); line-height: 0.98; letter-spacing: -0.02em;
    margin-bottom: 5vh; max-width: 18ch;
    overflow-wrap: anywhere;
  }
  .story .desc {
    font-family: 'Source Serif 4', serif;
    font-size: clamp(17px, 1.55vw, 28px); line-height: 1.45;
    max-width: 40ch; margin-bottom: 4vh; opacity: 0.88;
    overflow-wrap: anywhere;
  }
  .story.dark .desc { opacity: 0.85; }
  /* Source line \u2014 the one editorial accent on story pages. Sits at
     two-strength mint to match the brand (Option B): muted on light,
     bright on dark. Opacity removed so mint reads as a deliberate
     accent, not a muted bone/ink. */
  .story .source {
    font-family: 'IBM Plex Mono', monospace;
    font-size: max(11px, 0.9vw); letter-spacing: 0.2em;
    text-transform: uppercase;
    overflow-wrap: anywhere;
  }
  .story.light .source { color: var(--sienna); }
  .story.dark  .source { color: var(--mint); }
  /* Outgoing source anchor \u2014 inherit the palette colour from .source,
     underline for affordance. rel=noopener noreferrer and target=_blank
     are set in HTML; this is purely visual. */
  .story .source-link {
    color: inherit;
    text-decoration: underline;
    text-decoration-thickness: 1px;
    text-underline-offset: 0.18em;
    transition: text-decoration-thickness 160ms ease;
  }
  .story .source-link:hover { text-decoration-thickness: 2px; }
  /* Logo ekg dot: mint on every page so the brand "signal" pulse
     shows across the whole magazine. Light pages use the muted mint
     so it doesn't glare against #fafafa. */
  /* Bright mint on DARK backgrounds only (ink cover + dark stories).
     Digest pages are light (#fafafa) so they need the dark-mint
     variant \u2014 bright mint would read as a neon dot on white. */
  .cover .wm-logo .wm-ekg-dot,
  .story.dark .wm-logo .wm-ekg-dot { fill: var(--mint); }
  .digest .wm-logo .wm-ekg-dot,
  .story.light .wm-logo .wm-ekg-dot { fill: var(--sienna); }
  .story .right { display: flex; flex-direction: column; justify-content: center; }
  .story .callout {
    background: rgba(0, 0, 0, 0.05);
    border-left: 4px solid currentColor;
    padding: 5vh 3vw 5vh 3vw;
  }
  .story.dark .callout {
    background: rgba(242, 237, 228, 0.06);
    border-left-color: var(--bone);
  }
  .story .callout .label {
    font-family: 'IBM Plex Mono', monospace;
    font-size: max(11px, 0.85vw); font-weight: 600;
    letter-spacing: 0.22em; text-transform: uppercase;
    margin-bottom: 3vh; opacity: 0.75;
  }
  .story .callout .note {
    font-family: 'Source Serif 4', serif;
    font-size: clamp(17px, 1.55vw, 28px); line-height: 1.5; opacity: 0.82;
    overflow-wrap: anywhere;
  }
  .nav-dots {
    position: fixed; bottom: 3.5vh; left: 50%;
    transform: translateX(-50%);
    display: flex; gap: 0.9vw; z-index: 20;
    padding: 0.9vh 1.4vw;
    background: rgba(20, 20, 20, 0.55);
    backdrop-filter: blur(8px); border-radius: 999px;
  }
  .nav-dots button {
    width: 9px; height: 9px; border-radius: 50%; border: none;
    background: rgba(255, 255, 255, 0.3);
    cursor: pointer; padding: 0;
    transition: all 220ms ease;
  }
  .nav-dots button.digest-dot { background: rgba(139, 58, 31, 0.55); }
  .nav-dots button.active {
    background: rgba(255, 255, 255, 0.95);
    width: 26px; border-radius: 5px;
  }
  .nav-dots button.active.digest-dot { background: var(--sienna); }
  .hint {
    position: fixed; bottom: 3.5vh; right: 3vw;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 10px; letter-spacing: 0.2em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.5);
    z-index: 20; mix-blend-mode: difference;
  }
  .page-number {
    position: absolute; top: 5vh; right: 4vw;
    font-family: 'IBM Plex Mono', monospace;
    font-size: max(11px, 0.85vw);
    letter-spacing: 0.2em; opacity: 0.55;
  }
  @media (max-width: 640px) {
    .page { padding: 5vh 6vw 8vh; }
    /* padding-right must clear the absolute .page-number block on the
       right. "09 / 12" in IBM Plex Mono at 11px is ~65-70px wide and
       .page-number sits at right:5vw; on a 360px Android ~19px + 70px
       = ~89px of occupied space. 22vw \u2248 79px at 360px AND \u2248 86px at
       393px \u2014 enough headroom with a one-vw safety margin. 18vw left
       ~0 clearance on iPhone SE (Greptile P2). */
    .digest .running-head {
      flex-direction: column; align-items: flex-start;
      gap: 1vh; padding-right: 22vw;
    }
    .page-number { top: 4vh; right: 5vw; opacity: 0.6; }
    .digest h2 { font-size: 10vw; max-width: 22ch; margin-bottom: 4vh; }
    .digest blockquote {
      font-size: max(17px, 4.6vw); line-height: 1.35;
      max-width: 40ch; padding-left: 4vw;
    }
    .digest .rule { width: 14vw; margin-top: 4vh; }
    .digest .stat-row { grid-template-columns: 1fr; gap: 1.5vh; }
    .digest .stat-num { font-size: 18vw; }
    /* Keep px floors at or above the base-rule floors (17px / 18px)
       so very narrow viewports (<375px) never render smaller than
       desktop. vw term still scales up on typical phones (4vw \u2248 15.7px
       at 393px so the max() picks the px floor). Greptile P2. */
    .digest .stat-label { font-size: max(17px, 4vw); }
    .digest .thread { font-size: max(17px, 4vw); line-height: 1.5; }
    .digest .signal { font-size: max(18px, 4vw); padding-left: 4vw; }
    .story { display: flex; flex-direction: column; gap: 4vh; }
    .story .left { padding-right: 0; }
    .story .rank-ghost { font-size: 62vw; left: -4vw; top: 30%; }
    .story h3 { font-size: 9.5vw; max-width: none; margin-bottom: 3vh; }
    .story .desc {
      font-size: max(16px, 4.4vw); max-width: none;
      margin-bottom: 3vh; line-height: 1.5;
    }
    .story .tag-row { gap: 2vw; margin-bottom: 3vh; }
    .story .tag { font-size: 11px; padding: 0.4em 0.8em; }
    .story .source { font-size: 11px; }
    .story .right { justify-content: flex-start; }
    .story .callout { padding: 3vh 4vw; border-left-width: 3px; }
    .story .callout .label { font-size: 11px; margin-bottom: 1.5vh; opacity: 0.7; }
    .story .callout .note { font-size: max(16px, 4.2vw); line-height: 1.5; }
  }

  /* \u2500\u2500 Share button (non-public views) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
     Floating action pill in the top-right chrome. Separate from the
     page-number so it doesn't disappear during mobile stacking
     overrides. Hidden entirely in public views because a public
     reader shouldn't see a "Share" UI (the button relies on the
     authenticated /api/brief/share-url endpoint). */
  .wm-share {
    position: fixed;
    top: 3vh; right: 3vw;
    z-index: 30;
    display: inline-flex; align-items: center; gap: 0.5em;
    padding: 0.55em 1em;
    background: rgba(20, 20, 20, 0.65);
    color: var(--bone);
    border: 1px solid rgba(242, 237, 228, 0.25);
    border-radius: 999px;
    font-family: 'IBM Plex Mono', monospace;
    font-size: max(11px, 0.8vw);
    letter-spacing: 0.18em;
    text-transform: uppercase;
    cursor: pointer;
    backdrop-filter: blur(8px);
    transition: transform 160ms ease, background 160ms ease;
    mix-blend-mode: normal;
  }
  .wm-share:hover { background: rgba(20, 20, 20, 0.85); transform: translateY(-1px); }
  .wm-share[data-state="sharing"] { opacity: 0.6; cursor: progress; }
  .wm-share[data-state="copied"]::after { content: ' \xB7 copied'; opacity: 0.75; }
  .wm-share[data-state="error"]::after { content: ' \xB7 error'; opacity: 0.75; color: #ff9b9b; }

  /* \u2500\u2500 Public view: Subscribe banner \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
  .wm-public-strip {
    position: fixed;
    top: 0; left: 0; right: 0;
    z-index: 30;
    display: flex; align-items: center; justify-content: center;
    gap: 1em;
    padding: 0.8em 1.2em;
    background: var(--ink);
    color: var(--bone);
    border-bottom: 1px solid rgba(242, 237, 228, 0.2);
    font-family: 'IBM Plex Mono', monospace;
    font-size: max(11px, 0.75vw);
    letter-spacing: 0.15em;
    text-transform: uppercase;
  }
  .wm-public-strip a {
    color: var(--mint, #4ade80);
    text-decoration: none;
    border-bottom: 1px solid currentColor;
  }
  @media (max-width: 640px) {
    .wm-public-strip { font-size: 11px; padding: 0.7em 1em; gap: 0.6em; flex-wrap: wrap; }
  }
</style>`;
var SHARE_SCRIPT = `<script>
(function() {
  var btn = document.querySelector('.wm-share');
  if (!btn) return;
  var shareUrl = btn.dataset.shareUrl;
  if (!shareUrl) return;
  btn.addEventListener('click', async function() {
    if (btn.dataset.state === 'sharing') return;
    btn.dataset.state = 'sharing';
    try {
      var shareTitle = 'WorldMonitor Brief';
      var shareText = 'My WorldMonitor Brief for today:';
      if (navigator.share) {
        try {
          await navigator.share({ title: shareTitle, text: shareText, url: shareUrl });
          btn.dataset.state = 'copied';
          return;
        } catch (err) {
          if (err && (err.name === 'AbortError' || /abort/i.test(String(err.message)))) {
            btn.dataset.state = '';
            return;
          }
          // Fall through to clipboard on non-abort share errors.
        }
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        btn.dataset.state = 'copied';
      } else {
        // Ancient browser. Show the URL so the user can copy manually.
        window.prompt('Copy the link below:', shareUrl);
        btn.dataset.state = 'copied';
      }
    } catch (err) {
      btn.dataset.state = 'error';
      try { console.warn('[brief] share failed:', err); } catch (_) {}
    } finally {
      setTimeout(function() { if (btn.dataset.state !== 'sharing') btn.dataset.state = ''; }, 2400);
    }
  });
})();
</script>`;
var UMAMI_LOADER = '<script async src="https://abacus.worldmonitor.app/script.js" data-website-id="e8800335-c853-46a8-8497-c993ed2f58bc" data-domains="worldmonitor.app,tech.worldmonitor.app,finance.worldmonitor.app,commodity.worldmonitor.app,happy.worldmonitor.app"></script>';
var BRIEF_THREAD_OPEN_SCRIPT = `<script>
(function() {
  function emit(el) {
    try {
      if (!window.umami || typeof window.umami.track !== 'function') return;
      var country = el.dataset.country || null;
      var severity = el.dataset.severity || null;
      var followed = el.dataset.followed === '1';
      window.umami.track('brief-thread-open', {
        country: country,
        followed: followed,
        severity: severity,
        source: 'magazine',
      });
    } catch (e) { /* swallow \u2014 never break navigation */ }
  }
  document.addEventListener('click', function(ev) {
    var el = ev.target;
    while (el && el.nodeType === 1) {
      if (el.dataset && el.dataset.threadOpen === '1') {
        emit(el);
        return;
      }
      el = el.parentNode;
    }
  }, { capture: true });
})();
</script>`;
var NAV_SCRIPT = `<script>
(function() {
  var deck = document.getElementById('deck');
  if (!deck) return;
  var pages = deck.querySelectorAll('.page');
  var dotsContainer = document.getElementById('navDots');
  var total = pages.length;
  var current = 0;
  var wheelLock = false;
  var touchStartX = 0;
  // digest-indexes attribute is a server-built JSON number array.
  var digestIndexes = new Set(JSON.parse(deck.dataset.digestIndexes || '[]'));
  for (var i = 0; i < total; i++) {
    var b = document.createElement('button');
    b.setAttribute('aria-label', 'Go to page ' + (i + 1));
    if (digestIndexes.has(i)) b.classList.add('digest-dot');
    (function(idx) { b.addEventListener('click', function() { go(idx); }); })(i);
    dotsContainer.appendChild(b);
  }
  var dots = dotsContainer.querySelectorAll('button');
  function render() {
    deck.style.transform = 'translateX(-' + (current * 100) + 'vw)';
    for (var i = 0; i < dots.length; i++) {
      if (i === current) dots[i].classList.add('active');
      else dots[i].classList.remove('active');
    }
  }
  function go(i) { current = Math.max(0, Math.min(total - 1, i)); render(); }
  function next() { go(current + 1); }
  function prev() { go(current - 1); }
  window.addEventListener('keydown', function(e) {
    // ArrowRight/Left are the deck axis \u2014 always paginate, no scroll
    // conflict. PageDown/PageUp/Space conventionally scroll a long page
    // in normal browsers; defer to native page scroll when the current
    // page has remaining scroll in that direction, paginate only at the
    // scroll edge. Matches the wheel-handler behaviour so keyboard and
    // mouse users see the same model.
    if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
    else if (e.key === 'PageDown' || e.key === ' ') {
      if (pageCanScrollVertical(pages[current], 1)) return;
      e.preventDefault(); next();
    } else if (e.key === 'PageUp') {
      if (pageCanScrollVertical(pages[current], -1)) return;
      e.preventDefault(); prev();
    }
    else if (e.key === 'Home') { e.preventDefault(); go(0); }
    else if (e.key === 'End') { e.preventDefault(); go(total - 1); }
  });
  // Wheel handler defers to per-page native scroll first. The page CSS
  // is overflow-y: auto, so content longer than 100vh scrolls inside the
  // page. Only advance/retreat the deck when the user is wheeling
  // PAST the scroll edge in that direction \u2014 otherwise a long page is
  // unreachable past 100vh because every wheel tick paginates instead
  // of scrolling (user-reported: "if I try to scroll down to read it,
  // it just goes to the next page instead"). Vertical wheel falls
  // through to the page; horizontal wheel still paginates immediately
  // (the deck axis IS horizontal, no scroll conflict to resolve).
  function pageCanScrollVertical(page, deltaY) {
    if (!page) return false;
    var maxScroll = page.scrollHeight - page.clientHeight;
    if (maxScroll <= 0) return false;   // page content fits \u2014 paginate
    if (deltaY > 0) return page.scrollTop < maxScroll - 1;   // room to scroll down
    if (deltaY < 0) return page.scrollTop > 1;               // room to scroll up
    return false;
  }
  window.addEventListener('wheel', function(e) {
    if (wheelLock) return;
    var isVertical = Math.abs(e.deltaY) > Math.abs(e.deltaX);
    var delta = isVertical ? e.deltaY : e.deltaX;
    if (Math.abs(delta) < 12) return;
    if (isVertical && pageCanScrollVertical(pages[current], e.deltaY)) {
      // Let the native scroll on .page take this wheel event.
      return;
    }
    wheelLock = true;
    if (delta > 0) next(); else prev();
    setTimeout(function() { wheelLock = false; }, 620);
  }, { passive: true });
  window.addEventListener('touchstart', function(e) { touchStartX = e.touches[0].clientX; }, { passive: true });
  window.addEventListener('touchend', function(e) {
    var dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) < 50) return;
    if (dx < 0) next(); else prev();
  }, { passive: true });
  render();
})();
</script>`;
function redactForPublic(data) {
  const safeLead = typeof data.digest?.publicLead === "string" && data.digest.publicLead.length > 0 ? data.digest.publicLead : "";
  const safeSignals = Array.isArray(data.digest?.publicSignals) && data.digest.publicSignals.length > 0 ? data.digest.publicSignals : [];
  const safeThreads = Array.isArray(data.digest?.publicThreads) && data.digest.publicThreads.length > 0 ? data.digest.publicThreads : derivePublicThreadsStub(data.stories);
  return {
    ...data,
    user: { ...data.user, name: "WorldMonitor" },
    digest: {
      ...data.digest,
      lead: safeLead,
      signals: safeSignals,
      threads: safeThreads
    },
    stories: data.stories.map((s) => ({
      ...s,
      whyMatters: "Subscribe to WorldMonitor Brief to see the full editorial on this story."
    }))
  };
}
function derivePublicThreadsStub(stories) {
  if (!Array.isArray(stories) || stories.length === 0) {
    return [{ tag: "World", teaser: "One thread on the desk today." }];
  }
  const byCategory = /* @__PURE__ */ new Map();
  for (const s of stories) {
    const tag = typeof s?.category === "string" && s.category.length > 0 ? s.category : "World";
    byCategory.set(tag, (byCategory.get(tag) ?? 0) + 1);
  }
  const sorted = [...byCategory.entries()].sort((a, b) => b[1] - a[1]);
  return sorted.slice(0, 6).map(([tag, count]) => ({
    tag,
    teaser: count === 1 ? "One thread on the desk today." : `${count} threads on the desk today.`
  }));
}
function renderBriefMagazine(envelope, options = {}) {
  assertBriefEnvelope(envelope);
  const publicMode = options.publicMode === true;
  const refCode = typeof options.refCode === "string" ? options.refCode : "";
  const shareUrl = !publicMode && typeof options.shareUrl === "string" && options.shareUrl.length > 0 ? options.shareUrl : "";
  const rawFollowed = Array.isArray(options.followedCountries) ? options.followedCountries : [];
  const followedSet = /* @__PURE__ */ new Set();
  if (!publicMode) {
    for (const entry of rawFollowed) {
      if (typeof entry === "string" && entry.length > 0) {
        followedSet.add(entry.toUpperCase());
      }
    }
  }
  const rawData = publicMode ? redactForPublic(envelope.data) : envelope.data;
  const { user, issue, date, dateLong, digest, stories } = rawData;
  const [, month, day] = date.split("-");
  const dateShort = `${day}.${month}`;
  const threads = digest.threads;
  const hasSignals = digest.signals.length > 0;
  const splitThreads = threads.length > MAX_THREADS_PER_PAGE;
  const totalPages = 1 + 1 + 1 + (splitThreads ? 2 : 1) + (hasSignals ? 1 : 0) + stories.length + 1;
  const pagesHtml = [];
  const digestIndexes = [];
  let p = 0;
  pagesHtml.push(
    renderCover({
      dateLong,
      issue,
      storyCount: stories.length,
      pageIndex: ++p,
      totalPages,
      greeting: digest.greeting
    })
  );
  digestIndexes.push(p);
  pagesHtml.push(
    renderDigestGreeting({
      greeting: digest.greeting,
      lead: digest.lead,
      dateShort,
      pageIndex: ++p,
      totalPages
    })
  );
  digestIndexes.push(p);
  pagesHtml.push(
    renderDigestNumbers({
      numbers: digest.numbers,
      date,
      dateShort,
      pageIndex: ++p,
      totalPages
    })
  );
  const threadsPages = splitThreads ? [threads.slice(0, Math.ceil(threads.length / 2)), threads.slice(Math.ceil(threads.length / 2))] : [threads];
  threadsPages.forEach((slice, i) => {
    const label = threadsPages.length === 1 ? "Digest / 03 \u2014 On The Desk" : `Digest / 03${i === 0 ? "a" : "b"} \u2014 On The Desk`;
    const heading = i === 0 ? "What the desk is watching." : "\u2026 continued.";
    digestIndexes.push(p);
    pagesHtml.push(
      renderDigestThreadsPage({
        threads: slice,
        dateShort,
        label,
        heading,
        includeEndMarker: i === threadsPages.length - 1 && !hasSignals,
        pageIndex: ++p,
        totalPages
      })
    );
  });
  if (hasSignals) {
    digestIndexes.push(p);
    pagesHtml.push(
      renderDigestSignals({
        signals: digest.signals,
        dateShort,
        pageIndex: ++p,
        totalPages
      })
    );
  }
  stories.forEach((story, i) => {
    pagesHtml.push(
      renderStoryPage({
        story,
        rank: i + 1,
        palette: i % 2 === 0 ? "light" : "dark",
        pageIndex: ++p,
        totalPages,
        issueDate: date,
        followedSet
      })
    );
  });
  pagesHtml.push(
    renderBackCover({
      tz: user.tz,
      pageIndex: ++p,
      totalPages,
      publicMode,
      refCode
    })
  );
  const title = `WorldMonitor Brief \xB7 ${escapeHtml(dateLong)}`;
  const publicStripHref = `https://worldmonitor.app/pro${refCode ? `?ref=${encodeURIComponent(refCode)}` : ""}`;
  const publicStripHtml = publicMode ? `<div class="wm-public-strip"><span>WorldMonitor Brief \xB7 shared issue</span><a href="${escapeHtml(publicStripHref)}" target="_blank" rel="noopener">Subscribe \u2192</a></div>` : "";
  const shareButtonHtml = shareUrl ? `<button class="wm-share" type="button" data-share-url="${escapeHtml(shareUrl)}" data-issue-date="${escapeHtml(date)}" aria-label="Share this brief">Share</button>` : "";
  const headMeta = publicMode ? '<meta name="robots" content="noindex,nofollow">' : "";
  return '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" />' + headMeta + `<title>${title}</title><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="${FONTS_HREF}" rel="stylesheet">` + UMAMI_LOADER + STYLE_BLOCK + "</head><body>" + LOGO_SYMBOL + publicStripHtml + shareButtonHtml + `<div class="deck" id="deck" data-digest-indexes='${JSON.stringify(digestIndexes)}'>` + pagesHtml.join("") + '</div><div class="nav-dots" id="navDots"></div><div class="hint">\u2190 \u2192 / swipe / scroll</div>' + (shareUrl ? SHARE_SCRIPT : "") + BRIEF_THREAD_OPEN_SCRIPT + NAV_SCRIPT + "</body></html>";
}

// server/_shared/brief-share-url.ts
var USER_ID_RE = /^[A-Za-z0-9_-]{1,128}$/;
var ISSUE_DATE_RE = /^\d{4}-\d{2}-\d{2}-\d{4}$/;
var HASH_RE = /^[A-Za-z0-9_-]{12}$/;
var BriefShareUrlError = class extends Error {
  code;
  constructor(code, message) {
    super(message);
    this.code = code;
    this.name = "BriefShareUrlError";
  }
};
function assertShape(userId, issueDate) {
  if (!USER_ID_RE.test(userId)) {
    throw new BriefShareUrlError("invalid_user_id", "userId must match [A-Za-z0-9_-]{1,128}");
  }
  if (!ISSUE_DATE_RE.test(issueDate)) {
    throw new BriefShareUrlError("invalid_issue_date", "issueDate must match YYYY-MM-DD-HHMM");
  }
}
function isValidShareHashShape(hash) {
  return typeof hash === "string" && HASH_RE.test(hash);
}
function decodePublicPointer(raw) {
  if (typeof raw !== "string") return null;
  const idx = raw.indexOf(":");
  if (idx <= 0) return null;
  const userId = raw.slice(0, idx);
  const issueDate = raw.slice(idx + 1);
  try {
    assertShape(userId, issueDate);
  } catch {
    return null;
  }
  return { userId, issueDate };
}
var BRIEF_PUBLIC_POINTER_PREFIX = "brief:public:";

// api/brief/public/[hash].ts
var config = { runtime: "edge" };
var HTML_HEADERS = {
  "Content-Type": "text/html; charset=utf-8",
  // Short edge cache — a shared brief rarely changes within the same
  // day and we want CDN absorption for viral traffic, but not so long
  // that a composer re-write (unusual) gets stuck.
  "Cache-Control": "public, max-age=0, s-maxage=300, must-revalidate",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  // Critical: keep shared briefs out of public indexes. A per-user
  // mirror leaking into Google search would be both a privacy
  // regression (shared ≠ public forever) and a UX embarrassment.
  "X-Robots-Tag": "noindex, nofollow"
};
function htmlResponse(req, status, body, extraHeaders = {}) {
  const isHead = req.method === "HEAD";
  return new Response(isHead ? null : body, {
    status,
    headers: { ...HTML_HEADERS, ...extraHeaders }
  });
}
var ERROR_PAGE_STYLES = "body { margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center; font-family: Georgia, serif; background: #0a0a0a; color: #f2ede4; text-align: center; padding: 2rem; } h1 { font-size: clamp(28px, 5vw, 64px); margin: 0 0 1rem; font-weight: 900; letter-spacing: -0.02em; } p { max-width: 48ch; opacity: 0.8; line-height: 1.5; font-size: clamp(16px, 2vw, 20px); } a { color: inherit; text-decoration: underline; }";
function renderErrorPage(heading, body) {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${heading} \xB7 WorldMonitor</title><style>${ERROR_PAGE_STYLES}</style></head><body><div><h1>${heading}</h1><p>${body}</p><p><a href="https://worldmonitor.app/pro">Start your own WorldMonitor Brief</a></p></div></body></html>`;
}
var NOT_FOUND_PAGE = renderErrorPage(
  "This brief is no longer available.",
  "Shared briefs are kept for up to seven days. The sender can generate a fresh link to today's issue."
);
var UNAVAILABLE_PAGE = renderErrorPage(
  "Service temporarily unavailable.",
  "The brief service is having trouble right now. Please try again shortly."
);
async function handler(req, ctx) {
  if (isDisallowedOrigin(req)) {
    return new Response("Origin not allowed", { status: 403 });
  }
  const cors = getCorsHeaders(req, "GET, OPTIONS");
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors });
  }
  if (req.method !== "GET" && req.method !== "HEAD") {
    return new Response("Method not allowed", { status: 405, headers: cors });
  }
  const url = new URL(req.url);
  const parts = url.pathname.split("/").filter(Boolean);
  if (parts.length !== 4 || parts[0] !== "api" || parts[1] !== "brief" || parts[2] !== "public") {
    return htmlResponse(req, 404, NOT_FOUND_PAGE);
  }
  const rawHash = decodeURIComponent(parts[3] ?? "");
  if (!isValidShareHashShape(rawHash)) {
    return htmlResponse(req, 404, NOT_FOUND_PAGE);
  }
  const refCodeRaw = url.searchParams.get("ref");
  const refCode = refCodeRaw && /^[A-Za-z0-9_-]{1,32}$/.test(refCodeRaw) ? refCodeRaw : void 0;
  const pointerKey = `${BRIEF_PUBLIC_POINTER_PREFIX}${rawHash}`;
  let pointerRaw;
  try {
    pointerRaw = await readRawJsonFromUpstash(pointerKey);
  } catch (err) {
    console.error("[api/brief/public] pointer read failed:", err.message);
    captureSilentError(err, { tags: { route: "api/brief/public", step: "pointer-read" }, ctx });
    return htmlResponse(req, 503, UNAVAILABLE_PAGE);
  }
  let pointerInput = pointerRaw;
  if (pointerRaw != null && typeof pointerRaw === "object") {
    const pointerObj = pointerRaw;
    pointerInput = `${pointerObj.userId}:${pointerObj.issueSlot ?? pointerObj.issueDate}`;
  }
  const pointer = decodePublicPointer(pointerInput);
  if (!pointer) {
    return htmlResponse(req, 404, NOT_FOUND_PAGE);
  }
  let envelope;
  try {
    envelope = await readRawJsonFromUpstash(`brief:${pointer.userId}:${pointer.issueDate}`);
  } catch (err) {
    console.error("[api/brief/public] envelope read failed:", err.message);
    captureSilentError(err, { tags: { route: "api/brief/public", step: "envelope-read" }, ctx });
    return htmlResponse(req, 503, UNAVAILABLE_PAGE);
  }
  if (!envelope) {
    return htmlResponse(req, 404, NOT_FOUND_PAGE);
  }
  let html;
  try {
    html = renderBriefMagazine(
      envelope,
      { publicMode: true, refCode }
    );
  } catch (err) {
    console.error("[api/brief/public] malformed envelope:", err.message);
    captureSilentError(err, { tags: { route: "api/brief/public", step: "render" }, ctx });
    return htmlResponse(req, 404, NOT_FOUND_PAGE);
  }
  return htmlResponse(req, 200, html);
}
export {
  config,
  handler as default
};
