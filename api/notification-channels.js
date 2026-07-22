// api/notification-channels.js
var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res, err) => function __init() {
  if (err) throw err[0];
  try {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  } catch (e) {
    throw err = [e], e;
  }
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var sidecar_cache_exports = {};
__export(sidecar_cache_exports, {
  sidecarCacheGet: () => sidecarCacheGet,
  sidecarCacheSet: () => sidecarCacheSet,
  sidecarCacheStats: () => sidecarCacheStats
});
function startSweepIfNeeded() {
  if (sweepTimer) return;
  sweepTimer = setInterval(() => {
    const now = Date.now();
    for (const [k, entry] of store) {
      if (entry.expiresAt <= now) {
        totalBytes -= entry.size;
        store.delete(k);
      }
    }
  }, SWEEP_INTERVAL_MS);
  if (typeof sweepTimer === "object" && "unref" in sweepTimer) {
    sweepTimer.unref();
  }
}
function evictLRU(incomingSize = 0) {
  const keysToEvict = [];
  for (const [k, entry] of store) {
    const nextEntryCount = store.size - keysToEvict.length + 1;
    const nextTotalBytes = totalBytes + incomingSize;
    if (nextEntryCount <= MAX_ENTRIES && nextTotalBytes <= MAX_BYTES) break;
    keysToEvict.push(k);
    totalBytes -= entry.size;
  }
  for (const k of keysToEvict) store.delete(k);
}
function sidecarCacheGet(key) {
  const entry = store.get(key);
  if (!entry) {
    missCount++;
    return null;
  }
  if (entry.expiresAt <= Date.now()) {
    totalBytes -= entry.size;
    store.delete(key);
    missCount++;
    return null;
  }
  store.delete(key);
  store.set(key, entry);
  hitCount++;
  return JSON.parse(entry.value);
}
function sidecarCacheSet(key, value, ttlSeconds) {
  const clamped = Math.max(MIN_TTL_S, Math.min(MAX_TTL_S, ttlSeconds));
  const json2 = JSON.stringify(value);
  const size = json2.length * 2;
  if (size > MAX_SINGLE_VALUE_BYTES) {
    console.warn(`[sidecar-cache] rejecting key "${key}": ${(size / 1024 / 1024).toFixed(1)} MB exceeds 2 MB limit`);
    return;
  }
  const existing = store.get(key);
  if (existing) {
    totalBytes -= existing.size;
    store.delete(key);
  }
  if (store.size >= MAX_ENTRIES || totalBytes + size > MAX_BYTES) {
    evictLRU(size);
  }
  store.set(key, {
    value: json2,
    expiresAt: Date.now() + clamped * 1e3,
    size
  });
  totalBytes += size;
  startSweepIfNeeded();
}
function sidecarCacheStats() {
  return { entries: store.size, bytes: totalBytes, hits: hitCount, misses: missCount };
}
var MAX_ENTRIES;
var MAX_BYTES;
var MAX_SINGLE_VALUE_BYTES;
var MIN_TTL_S;
var MAX_TTL_S;
var SWEEP_INTERVAL_MS;
var store;
var totalBytes;
var sweepTimer;
var hitCount;
var missCount;
var init_sidecar_cache = __esm({
  "server/_shared/sidecar-cache.ts"() {
    "use strict";
    MAX_ENTRIES = 500;
    MAX_BYTES = 50 * 1024 * 1024;
    MAX_SINGLE_VALUE_BYTES = 2 * 1024 * 1024;
    MIN_TTL_S = 10;
    MAX_TTL_S = 86400;
    SWEEP_INTERVAL_MS = 6e4;
    store = /* @__PURE__ */ new Map();
    totalBytes = 0;
    sweepTimer = null;
    hitCount = 0;
    missCount = 0;
  }
});
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
  const errMsg2 = err instanceof Error ? err.message : String(err);
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
          value: errMsg2,
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
var captureSilentError = makeCaptureSilentError({
  runtime: "edge",
  platform: "javascript",
  logPrefix: "[sentry-edge]"
});
async function captureEdgeException(err, context = {}, vctx = void 0) {
  await captureSilentError(err, { extra: context, ctx: vctx });
}
function getRedisCredentials() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return { url, token };
}
async function redisPipeline(commands, timeoutMs = 5e3) {
  const creds = getRedisCredentials();
  if (!creds) return null;
  try {
    const resp = await fetch(`${creds.url}/pipeline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${creds.token}`, "Content-Type": "application/json" },
      body: JSON.stringify(commands),
      signal: AbortSignal.timeout(timeoutMs)
    });
    if (!resp.ok) return null;
    return await resp.json();
  } catch {
    return null;
  }
}
var IDEMPOTENCY_HEADER = "Idempotency-Key";
var IDEMPOTENT_REPLAYED_HEADER = "Idempotent-Replayed";
var KEY_MAX_LENGTH = 255;
var KEY_PATTERN = /^[\x21-\x7e]{1,255}$/;
var PROCESSING_TTL_SECONDS = 180;
var DEFAULT_COMPLETED_TTL_SECONDS = 24 * 60 * 60;
var MAX_STORED_BODY_BYTES = 256 * 1024;
var PROCESSING_MARKER = JSON.stringify({ state: "processing" });
function isValidIdempotencyKey(key) {
  return typeof key === "string" && key.length <= KEY_MAX_LENGTH && KEY_PATTERN.test(key);
}
async function sha256Hex(input) {
  const data = typeof input === "string" ? new TextEncoder().encode(input) : input;
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
function anonScope(request) {
  const ip = request.headers.get("cf-connecting-ip") || request.headers.get("x-real-ip") || (request.headers.get("x-forwarded-for") || "").split(",")[0]?.trim() || "unknown";
  return `ip:${ip}`;
}
function jsonResponse(status, body, corsHeaders, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      ...corsHeaders,
      ...extraHeaders
    }
  });
}
function isReplayableTextBody(contentType) {
  if (!contentType) return false;
  const ct = contentType.toLowerCase();
  return ct.includes("json") || ct.startsWith("text/");
}
function isRetryableStatus(status) {
  return status === 408 || status === 409 || status === 429 || status >= 500;
}
async function getRequestHashAndRedisKey(request, pathname, scope, idempotencyKey) {
  try {
    const bodyBuf = await request.clone().arrayBuffer();
    const reqHash = await sha256Hex(bodyBuf);
    const effectiveScope = scope || anonScope(request);
    const redisKey = `idem:v1:${await sha256Hex(`${effectiveScope}
${pathname}
${idempotencyKey}`)}`;
    return { reqHash, redisKey };
  } catch {
    return null;
  }
}
function outcomeFromStoredRecord(raw, reqHash, idempotencyKey, corsHeaders) {
  if (raw == null) return { kind: "miss" };
  let record = null;
  if (typeof raw === "string") {
    try {
      record = JSON.parse(raw);
    } catch {
      record = null;
    }
  }
  if (!record || typeof record !== "object") return { kind: "disabled" };
  if (record.state === "processing") {
    return {
      kind: "conflict",
      response: jsonResponse(
        409,
        {
          error: "idempotency_conflict",
          message: `A request with this ${IDEMPOTENCY_HEADER} is still being processed. Retry shortly.`
        },
        corsHeaders,
        { "Retry-After": "2", [IDEMPOTENCY_HEADER]: idempotencyKey }
      )
    };
  }
  if (record.state !== "completed") return { kind: "disabled" };
  if (record.reqHash !== reqHash) {
    return {
      kind: "mismatch",
      response: jsonResponse(
        422,
        {
          error: "idempotency_key_reused",
          message: `This ${IDEMPOTENCY_HEADER} was already used with a different request body.`
        },
        corsHeaders,
        { [IDEMPOTENCY_HEADER]: idempotencyKey }
      )
    };
  }
  return {
    kind: "replay",
    response: new Response(record.body, {
      status: record.status,
      headers: {
        "Content-Type": record.contentType ?? "application/json",
        "Cache-Control": "no-store",
        ...corsHeaders,
        [IDEMPOTENCY_HEADER]: idempotencyKey,
        [IDEMPOTENT_REPLAYED_HEADER]: "true"
      }
    })
  };
}
async function releaseProcessingLock(redisKey) {
  await redisPipeline([["DEL", redisKey]]);
}
async function beginStandaloneIdempotency({
  request,
  pathname,
  scope,
  idempotencyKey,
  corsHeaders,
  completedTtlSeconds = DEFAULT_COMPLETED_TTL_SECONDS
}) {
  if (!isValidIdempotencyKey(idempotencyKey)) {
    return {
      kind: "invalid",
      response: jsonResponse(
        400,
        {
          error: "invalid_idempotency_key",
          message: `The ${IDEMPOTENCY_HEADER} header must be 1-${KEY_MAX_LENGTH} printable ASCII characters.`
        },
        corsHeaders
      )
    };
  }
  const resolved = await getRequestHashAndRedisKey(request, pathname, scope, idempotencyKey);
  if (!resolved) return { kind: "disabled" };
  const pipeline = await redisPipeline([
    ["SET", resolved.redisKey, PROCESSING_MARKER, "NX", "EX", String(PROCESSING_TTL_SECONDS)],
    ["GET", resolved.redisKey]
  ]);
  if (!pipeline || pipeline.length < 2) return { kind: "disabled" };
  const claim = pipeline[0];
  if (claim?.error) return { kind: "disabled" };
  if (claim?.result === "OK") {
    return {
      kind: "proceed",
      key: idempotencyKey,
      store: (status, body, contentType) => storeStandaloneResult(resolved.redisKey, status, body, contentType, resolved.reqHash, completedTtlSeconds)
    };
  }
  const outcome = outcomeFromStoredRecord(pipeline[1]?.result, resolved.reqHash, idempotencyKey, corsHeaders);
  return outcome.kind === "miss" ? { kind: "disabled" } : outcome;
}
function getIdempotencyKey(request) {
  return request.headers.get(IDEMPOTENCY_HEADER);
}
async function completeStandaloneIdempotency(idempotency, response) {
  if (!idempotency || idempotency.kind !== "proceed") return response;
  const body = await response.arrayBuffer();
  await idempotency.store(response.status, body, response.headers.get("content-type"));
  const headers = new Headers(response.headers);
  headers.set(IDEMPOTENCY_HEADER, idempotency.key);
  headers.set(IDEMPOTENT_REPLAYED_HEADER, "false");
  return new Response(body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}
async function storeStandaloneResult(redisKey, status, body, contentType, reqHash, completedTtlSeconds) {
  try {
    if (isRetryableStatus(status) || body.byteLength > MAX_STORED_BODY_BYTES || !isReplayableTextBody(contentType)) {
      await releaseProcessingLock(redisKey);
      return;
    }
    const record = {
      state: "completed",
      status,
      contentType,
      reqHash,
      body: new TextDecoder().decode(body)
    };
    const pipeline = await redisPipeline([
      ["SET", redisKey, JSON.stringify(record), "EX", String(completedTtlSeconds)]
    ]);
    const setResult = pipeline?.[0];
    if (setResult?.error || setResult?.result !== "OK") await releaseProcessingLock(redisKey);
  } catch {
    try {
      await releaseProcessingLock(redisKey);
    } catch {
    }
  }
}
var BLOCKED_METADATA_HOSTNAMES = /* @__PURE__ */ new Set([
  "localhost",
  "169.254.169.254",
  "metadata.google.internal",
  "metadata.internal",
  "instance-data",
  "metadata",
  "computemetadata",
  "link-local.s3.amazonaws.com"
]);
var DNS_RESOLUTION_TIMEOUT_MS = 3e3;
var DNS_JSON_ENDPOINT = "https://cloudflare-dns.com/dns-query";
function isIpLiteral(hostname) {
  return hostname.includes(":") || /^(?:\d{1,3}\.){3}\d{1,3}$/.test(hostname);
}
function ipv4Parts(value) {
  const parts = value.split(".");
  if (parts.length !== 4) return null;
  const nums = parts.map((part) => Number(part));
  if (nums.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return null;
  }
  return nums;
}
function ipv4FromMappedIpv6(value) {
  const dotted = value.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
  const dottedAddress = dotted?.[1];
  if (dottedAddress && ipv4Parts(dottedAddress)) return dottedAddress;
  const hex = value.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/i);
  if (!hex) return null;
  const hi = Number.parseInt(hex[1], 16);
  const lo = Number.parseInt(hex[2], 16);
  if (!Number.isInteger(hi) || !Number.isInteger(lo) || hi < 0 || hi > 65535 || lo < 0 || lo > 65535) {
    return null;
  }
  return `${hi >> 8}.${hi & 255}.${lo >> 8}.${lo & 255}`;
}
function ipv6ToHextets(value) {
  if (typeof value !== "string" || !value.includes(":")) return null;
  if ((value.match(/::/g) || []).length > 1) return null;
  const parseSide = (side) => {
    if (side === "") return [];
    const tokens = side.split(":");
    const hextets = [];
    for (let i = 0; i < tokens.length; i += 1) {
      const token = tokens[i];
      if (token.includes(".")) {
        if (i !== tokens.length - 1) return null;
        const parts = ipv4Parts(token);
        if (!parts) return null;
        hextets.push(parts[0] << 8 | parts[1]);
        hextets.push(parts[2] << 8 | parts[3]);
      } else {
        if (!/^[0-9a-f]{1,4}$/i.test(token)) return null;
        hextets.push(Number.parseInt(token, 16));
      }
    }
    return hextets;
  };
  const compressionIndex = value.indexOf("::");
  if (compressionIndex === -1) {
    const groups = parseSide(value);
    if (!groups || groups.length !== 8) return null;
    return groups;
  }
  const head = parseSide(value.slice(0, compressionIndex));
  const tail = parseSide(value.slice(compressionIndex + 2));
  if (!head || !tail) return null;
  const missing = 8 - head.length - tail.length;
  if (missing < 1) return null;
  return [...head, ...new Array(missing).fill(0), ...tail];
}
function embeddedIpv4FromIpv6(hextets) {
  const [h0, h1, h2, h3, h4, h5, h6, h7] = hextets;
  const toDotted = (hi, lo) => `${hi >> 8}.${hi & 255}.${lo >> 8}.${lo & 255}`;
  if (h0 === 0 && h1 === 0 && h2 === 0 && h3 === 0 && h4 === 0 && h5 === 65535) {
    return toDotted(h6, h7);
  }
  if (h0 === 100 && h1 === 65435 && h2 === 0 && h3 === 0 && h4 === 0 && h5 === 0) {
    return toDotted(h6, h7);
  }
  if (h0 === 8194) {
    return toDotted(h1, h2);
  }
  if (h0 === 0 && h1 === 0 && h2 === 0 && h3 === 0 && h4 === 0 && h5 === 0) {
    return toDotted(h6, h7);
  }
  return null;
}
function ipv4FromIpv6(value) {
  const hextets = ipv6ToHextets(value);
  if (hextets) {
    const embedded = embeddedIpv4FromIpv6(hextets);
    if (embedded) return embedded;
  }
  return ipv4FromMappedIpv6(value);
}
function isBlockedNotificationResolvedAddress(address) {
  const normalized = address.trim().toLowerCase().replace(/^\[|\]$/g, "");
  const mappedIpv4 = ipv4FromIpv6(normalized);
  const addr = mappedIpv4 ?? normalized;
  if (addr === "::" || addr === "::1") return true;
  if (/^f[cd][0-9a-f]{2}:/i.test(addr)) return true;
  if (/^fe[89ab][0-9a-f]:/i.test(addr)) return true;
  if (/^fe[c-f][0-9a-f]:/i.test(addr)) return true;
  if (/^ff[0-9a-f]{2}:/i.test(addr)) return true;
  if (/^2001:0?db8:/i.test(addr)) return true;
  const parts = ipv4Parts(addr);
  if (!parts) return false;
  const [a, b, c] = parts;
  if (a === 0) return true;
  if (a === 10) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  if (a === 127) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 0 && c === 0) return true;
  if (a === 192 && b === 0 && c === 2) return true;
  if (a === 192 && b === 88 && c === 99) return true;
  if (a === 192 && b === 168) return true;
  if (a === 198 && (b === 18 || b === 19)) return true;
  if (a === 198 && b === 51 && c === 100) return true;
  if (a === 203 && b === 0 && c === 113) return true;
  if (a >= 224) return true;
  return false;
}
function blockedNotificationWebhookUrlReason(rawUrl) {
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return "Webhook URL is not a valid URL";
  }
  if (parsed.protocol !== "https:") {
    return "Webhook URL must use HTTPS";
  }
  const hostname = parsed.hostname.toLowerCase();
  if (BLOCKED_METADATA_HOSTNAMES.has(hostname)) {
    return "Webhook URL must not point to a metadata endpoint";
  }
  if (isBlockedNotificationResolvedAddress(hostname)) {
    return "Webhook URL must not point to a private/local address";
  }
  return null;
}
async function resolveDnsJson(hostname, recordType) {
  const url = new URL(DNS_JSON_ENDPOINT);
  url.searchParams.set("name", hostname);
  url.searchParams.set("type", recordType);
  const response = await fetch(url, {
    headers: {
      Accept: "application/dns-json",
      "User-Agent": "WorldMonitor-Notification-Webhooks/1.0"
    },
    signal: AbortSignal.timeout(DNS_RESOLUTION_TIMEOUT_MS)
  });
  if (!response.ok) throw new Error(`DNS ${recordType} lookup failed: HTTP ${response.status}`);
  const data = await response.json();
  if (data.Status !== 0) throw new Error(`DNS ${recordType} lookup failed: status ${data.Status}`);
  const expectedType = recordType === "A" ? 1 : 28;
  return (data.Answer ?? []).filter((answer) => answer.type === expectedType && typeof answer.data === "string").map((answer) => answer.data);
}
async function defaultResolveHostname(hostname) {
  const records = await Promise.all([
    resolveDnsJson(hostname, "A"),
    resolveDnsJson(hostname, "AAAA")
  ]);
  return records.flat();
}
async function assertNotificationWebhookRegistrationUrlSafe(rawUrl, resolveHostname = defaultResolveHostname) {
  const staticError = blockedNotificationWebhookUrlReason(rawUrl);
  if (staticError) throw new Error(staticError);
  const hostname = new URL(rawUrl).hostname.toLowerCase();
  if (isIpLiteral(hostname)) return;
  let resolvedAddresses;
  try {
    resolvedAddresses = await resolveHostname(hostname);
  } catch (error) {
    const message2 = error instanceof Error ? error.message : String(error);
    throw new Error(`Webhook URL DNS resolution failed: ${message2}`);
  }
  if (!resolvedAddresses.length) throw new Error("Webhook URL DNS resolution returned no addresses");
  if (resolvedAddresses.some(isBlockedNotificationResolvedAddress)) {
    throw new Error("Webhook URL must not point to a private/local address");
  }
}
var encoder = new TextEncoder();
var decoder = new TextDecoder();
var MAX_INT32 = 2 ** 32;
function concat(...buffers) {
  const size = buffers.reduce((acc, { length }) => acc + length, 0);
  const buf = new Uint8Array(size);
  let i = 0;
  for (const buffer of buffers) {
    buf.set(buffer, i);
    i += buffer.length;
  }
  return buf;
}
function encode(string) {
  const bytes = new Uint8Array(string.length);
  for (let i = 0; i < string.length; i++) {
    const code = string.charCodeAt(i);
    if (code > 127) {
      throw new TypeError("non-ASCII string encountered in encode()");
    }
    bytes[i] = code;
  }
  return bytes;
}
function decodeBase64(encoded) {
  if (Uint8Array.fromBase64) {
    return Uint8Array.fromBase64(encoded);
  }
  const binary = atob(encoded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
function decode(input) {
  if (Uint8Array.fromBase64) {
    return Uint8Array.fromBase64(typeof input === "string" ? input : decoder.decode(input), {
      alphabet: "base64url"
    });
  }
  let encoded = input;
  if (encoded instanceof Uint8Array) {
    encoded = decoder.decode(encoded);
  }
  encoded = encoded.replace(/-/g, "+").replace(/_/g, "/");
  try {
    return decodeBase64(encoded);
  } catch {
    throw new TypeError("The input to be decoded is not correctly encoded.");
  }
}
var unusable = (name, prop = "algorithm.name") => new TypeError(`CryptoKey does not support this operation, its ${prop} must be ${name}`);
var isAlgorithm = (algorithm, name) => algorithm.name === name;
function getHashLength(hash) {
  return parseInt(hash.name.slice(4), 10);
}
function checkHashLength(algorithm, expected) {
  const actual = getHashLength(algorithm.hash);
  if (actual !== expected)
    throw unusable(`SHA-${expected}`, "algorithm.hash");
}
function getNamedCurve(alg) {
  switch (alg) {
    case "ES256":
      return "P-256";
    case "ES384":
      return "P-384";
    case "ES512":
      return "P-521";
    default:
      throw new Error("unreachable");
  }
}
function checkUsage(key, usage) {
  if (usage && !key.usages.includes(usage)) {
    throw new TypeError(`CryptoKey does not support this operation, its usages must include ${usage}.`);
  }
}
function checkSigCryptoKey(key, alg, usage) {
  switch (alg) {
    case "HS256":
    case "HS384":
    case "HS512": {
      if (!isAlgorithm(key.algorithm, "HMAC"))
        throw unusable("HMAC");
      checkHashLength(key.algorithm, parseInt(alg.slice(2), 10));
      break;
    }
    case "RS256":
    case "RS384":
    case "RS512": {
      if (!isAlgorithm(key.algorithm, "RSASSA-PKCS1-v1_5"))
        throw unusable("RSASSA-PKCS1-v1_5");
      checkHashLength(key.algorithm, parseInt(alg.slice(2), 10));
      break;
    }
    case "PS256":
    case "PS384":
    case "PS512": {
      if (!isAlgorithm(key.algorithm, "RSA-PSS"))
        throw unusable("RSA-PSS");
      checkHashLength(key.algorithm, parseInt(alg.slice(2), 10));
      break;
    }
    case "Ed25519":
    case "EdDSA": {
      if (!isAlgorithm(key.algorithm, "Ed25519"))
        throw unusable("Ed25519");
      break;
    }
    case "ML-DSA-44":
    case "ML-DSA-65":
    case "ML-DSA-87": {
      if (!isAlgorithm(key.algorithm, alg))
        throw unusable(alg);
      break;
    }
    case "ES256":
    case "ES384":
    case "ES512": {
      if (!isAlgorithm(key.algorithm, "ECDSA"))
        throw unusable("ECDSA");
      const expected = getNamedCurve(alg);
      const actual = key.algorithm.namedCurve;
      if (actual !== expected)
        throw unusable(expected, "algorithm.namedCurve");
      break;
    }
    default:
      throw new TypeError("CryptoKey does not support this operation");
  }
  checkUsage(key, usage);
}
function message(msg, actual, ...types) {
  types = types.filter(Boolean);
  if (types.length > 2) {
    const last = types.pop();
    msg += `one of type ${types.join(", ")}, or ${last}.`;
  } else if (types.length === 2) {
    msg += `one of type ${types[0]} or ${types[1]}.`;
  } else {
    msg += `of type ${types[0]}.`;
  }
  if (actual == null) {
    msg += ` Received ${actual}`;
  } else if (typeof actual === "function" && actual.name) {
    msg += ` Received function ${actual.name}`;
  } else if (typeof actual === "object" && actual != null) {
    if (actual.constructor?.name) {
      msg += ` Received an instance of ${actual.constructor.name}`;
    }
  }
  return msg;
}
var invalidKeyInput = (actual, ...types) => message("Key must be ", actual, ...types);
var withAlg = (alg, actual, ...types) => message(`Key for the ${alg} algorithm must be `, actual, ...types);
var JOSEError = class extends Error {
  static code = "ERR_JOSE_GENERIC";
  code = "ERR_JOSE_GENERIC";
  constructor(message2, options) {
    super(message2, options);
    this.name = this.constructor.name;
    Error.captureStackTrace?.(this, this.constructor);
  }
};
var JWTClaimValidationFailed = class extends JOSEError {
  static code = "ERR_JWT_CLAIM_VALIDATION_FAILED";
  code = "ERR_JWT_CLAIM_VALIDATION_FAILED";
  claim;
  reason;
  payload;
  constructor(message2, payload, claim = "unspecified", reason = "unspecified") {
    super(message2, { cause: { claim, reason, payload } });
    this.claim = claim;
    this.reason = reason;
    this.payload = payload;
  }
};
var JWTExpired = class extends JOSEError {
  static code = "ERR_JWT_EXPIRED";
  code = "ERR_JWT_EXPIRED";
  claim;
  reason;
  payload;
  constructor(message2, payload, claim = "unspecified", reason = "unspecified") {
    super(message2, { cause: { claim, reason, payload } });
    this.claim = claim;
    this.reason = reason;
    this.payload = payload;
  }
};
var JOSEAlgNotAllowed = class extends JOSEError {
  static code = "ERR_JOSE_ALG_NOT_ALLOWED";
  code = "ERR_JOSE_ALG_NOT_ALLOWED";
};
var JOSENotSupported = class extends JOSEError {
  static code = "ERR_JOSE_NOT_SUPPORTED";
  code = "ERR_JOSE_NOT_SUPPORTED";
};
var JWSInvalid = class extends JOSEError {
  static code = "ERR_JWS_INVALID";
  code = "ERR_JWS_INVALID";
};
var JWTInvalid = class extends JOSEError {
  static code = "ERR_JWT_INVALID";
  code = "ERR_JWT_INVALID";
};
var JWKSInvalid = class extends JOSEError {
  static code = "ERR_JWKS_INVALID";
  code = "ERR_JWKS_INVALID";
};
var JWKSNoMatchingKey = class extends JOSEError {
  static code = "ERR_JWKS_NO_MATCHING_KEY";
  code = "ERR_JWKS_NO_MATCHING_KEY";
  constructor(message2 = "no applicable key found in the JSON Web Key Set", options) {
    super(message2, options);
  }
};
var JWKSMultipleMatchingKeys = class extends JOSEError {
  [Symbol.asyncIterator];
  static code = "ERR_JWKS_MULTIPLE_MATCHING_KEYS";
  code = "ERR_JWKS_MULTIPLE_MATCHING_KEYS";
  constructor(message2 = "multiple matching keys found in the JSON Web Key Set", options) {
    super(message2, options);
  }
};
var JWKSTimeout = class extends JOSEError {
  static code = "ERR_JWKS_TIMEOUT";
  code = "ERR_JWKS_TIMEOUT";
  constructor(message2 = "request timed out", options) {
    super(message2, options);
  }
};
var JWSSignatureVerificationFailed = class extends JOSEError {
  static code = "ERR_JWS_SIGNATURE_VERIFICATION_FAILED";
  code = "ERR_JWS_SIGNATURE_VERIFICATION_FAILED";
  constructor(message2 = "signature verification failed", options) {
    super(message2, options);
  }
};
var isCryptoKey = (key) => {
  if (key?.[Symbol.toStringTag] === "CryptoKey")
    return true;
  try {
    return key instanceof CryptoKey;
  } catch {
    return false;
  }
};
var isKeyObject = (key) => key?.[Symbol.toStringTag] === "KeyObject";
var isKeyLike = (key) => isCryptoKey(key) || isKeyObject(key);
function decodeBase64url(value, label, ErrorClass) {
  try {
    return decode(value);
  } catch {
    throw new ErrorClass(`Failed to base64url decode the ${label}`);
  }
}
var isObjectLike = (value) => typeof value === "object" && value !== null;
function isObject(input) {
  if (!isObjectLike(input) || Object.prototype.toString.call(input) !== "[object Object]") {
    return false;
  }
  if (Object.getPrototypeOf(input) === null) {
    return true;
  }
  let proto = input;
  while (Object.getPrototypeOf(proto) !== null) {
    proto = Object.getPrototypeOf(proto);
  }
  return Object.getPrototypeOf(input) === proto;
}
function isDisjoint(...headers) {
  const sources = headers.filter(Boolean);
  if (sources.length === 0 || sources.length === 1) {
    return true;
  }
  let acc;
  for (const header of sources) {
    const parameters = Object.keys(header);
    if (!acc || acc.size === 0) {
      acc = new Set(parameters);
      continue;
    }
    for (const parameter of parameters) {
      if (acc.has(parameter)) {
        return false;
      }
      acc.add(parameter);
    }
  }
  return true;
}
var isJWK = (key) => isObject(key) && typeof key.kty === "string";
var isPrivateJWK = (key) => key.kty !== "oct" && (key.kty === "AKP" && typeof key.priv === "string" || typeof key.d === "string");
var isPublicJWK = (key) => key.kty !== "oct" && key.d === void 0 && key.priv === void 0;
var isSecretJWK = (key) => key.kty === "oct" && typeof key.k === "string";
function checkKeyLength(alg, key) {
  if (alg.startsWith("RS") || alg.startsWith("PS")) {
    const { modulusLength } = key.algorithm;
    if (typeof modulusLength !== "number" || modulusLength < 2048) {
      throw new TypeError(`${alg} requires key modulusLength to be 2048 bits or larger`);
    }
  }
}
function subtleAlgorithm(alg, algorithm) {
  const hash = `SHA-${alg.slice(-3)}`;
  switch (alg) {
    case "HS256":
    case "HS384":
    case "HS512":
      return { hash, name: "HMAC" };
    case "PS256":
    case "PS384":
    case "PS512":
      return { hash, name: "RSA-PSS", saltLength: parseInt(alg.slice(-3), 10) >> 3 };
    case "RS256":
    case "RS384":
    case "RS512":
      return { hash, name: "RSASSA-PKCS1-v1_5" };
    case "ES256":
    case "ES384":
    case "ES512":
      return { hash, name: "ECDSA", namedCurve: algorithm.namedCurve };
    case "Ed25519":
    case "EdDSA":
      return { name: "Ed25519" };
    case "ML-DSA-44":
    case "ML-DSA-65":
    case "ML-DSA-87":
      return { name: alg };
    default:
      throw new JOSENotSupported(`alg ${alg} is not supported either by JOSE or your javascript runtime`);
  }
}
async function getSigKey(alg, key, usage) {
  if (key instanceof Uint8Array) {
    if (!alg.startsWith("HS")) {
      throw new TypeError(invalidKeyInput(key, "CryptoKey", "KeyObject", "JSON Web Key"));
    }
    return crypto.subtle.importKey("raw", key, { hash: `SHA-${alg.slice(-3)}`, name: "HMAC" }, false, [usage]);
  }
  checkSigCryptoKey(key, alg, usage);
  return key;
}
async function verify(alg, key, signature, data) {
  const cryptoKey = await getSigKey(alg, key, "verify");
  checkKeyLength(alg, cryptoKey);
  const algorithm = subtleAlgorithm(alg, cryptoKey.algorithm);
  try {
    return await crypto.subtle.verify(algorithm, cryptoKey, signature, data);
  } catch {
    return false;
  }
}
var unsupportedAlg = 'Invalid or unsupported JWK "alg" (Algorithm) Parameter value';
function subtleMapping(jwk) {
  let algorithm;
  let keyUsages;
  switch (jwk.kty) {
    case "AKP": {
      switch (jwk.alg) {
        case "ML-DSA-44":
        case "ML-DSA-65":
        case "ML-DSA-87":
          algorithm = { name: jwk.alg };
          keyUsages = jwk.priv ? ["sign"] : ["verify"];
          break;
        default:
          throw new JOSENotSupported(unsupportedAlg);
      }
      break;
    }
    case "RSA": {
      switch (jwk.alg) {
        case "PS256":
        case "PS384":
        case "PS512":
          algorithm = { name: "RSA-PSS", hash: `SHA-${jwk.alg.slice(-3)}` };
          keyUsages = jwk.d ? ["sign"] : ["verify"];
          break;
        case "RS256":
        case "RS384":
        case "RS512":
          algorithm = { name: "RSASSA-PKCS1-v1_5", hash: `SHA-${jwk.alg.slice(-3)}` };
          keyUsages = jwk.d ? ["sign"] : ["verify"];
          break;
        case "RSA-OAEP":
        case "RSA-OAEP-256":
        case "RSA-OAEP-384":
        case "RSA-OAEP-512":
          algorithm = {
            name: "RSA-OAEP",
            hash: `SHA-${parseInt(jwk.alg.slice(-3), 10) || 1}`
          };
          keyUsages = jwk.d ? ["decrypt", "unwrapKey"] : ["encrypt", "wrapKey"];
          break;
        default:
          throw new JOSENotSupported(unsupportedAlg);
      }
      break;
    }
    case "EC": {
      switch (jwk.alg) {
        case "ES256":
        case "ES384":
        case "ES512":
          algorithm = {
            name: "ECDSA",
            namedCurve: { ES256: "P-256", ES384: "P-384", ES512: "P-521" }[jwk.alg]
          };
          keyUsages = jwk.d ? ["sign"] : ["verify"];
          break;
        case "ECDH-ES":
        case "ECDH-ES+A128KW":
        case "ECDH-ES+A192KW":
        case "ECDH-ES+A256KW":
          algorithm = { name: "ECDH", namedCurve: jwk.crv };
          keyUsages = jwk.d ? ["deriveBits"] : [];
          break;
        default:
          throw new JOSENotSupported(unsupportedAlg);
      }
      break;
    }
    case "OKP": {
      switch (jwk.alg) {
        case "Ed25519":
        case "EdDSA":
          algorithm = { name: "Ed25519" };
          keyUsages = jwk.d ? ["sign"] : ["verify"];
          break;
        case "ECDH-ES":
        case "ECDH-ES+A128KW":
        case "ECDH-ES+A192KW":
        case "ECDH-ES+A256KW":
          algorithm = { name: jwk.crv };
          keyUsages = jwk.d ? ["deriveBits"] : [];
          break;
        default:
          throw new JOSENotSupported(unsupportedAlg);
      }
      break;
    }
    default:
      throw new JOSENotSupported('Invalid or unsupported JWK "kty" (Key Type) Parameter value');
  }
  return { algorithm, keyUsages };
}
async function jwkToKey(jwk) {
  if (!jwk.alg) {
    throw new TypeError('"alg" argument is required when "jwk.alg" is not present');
  }
  const { algorithm, keyUsages } = subtleMapping(jwk);
  const keyData = { ...jwk };
  if (keyData.kty !== "AKP") {
    delete keyData.alg;
  }
  delete keyData.use;
  return crypto.subtle.importKey("jwk", keyData, algorithm, jwk.ext ?? (jwk.d || jwk.priv ? false : true), jwk.key_ops ?? keyUsages);
}
var unusableForAlg = "given KeyObject instance cannot be used for this algorithm";
var cache;
var handleJWK = async (key, jwk, alg, freeze = false) => {
  cache ||= /* @__PURE__ */ new WeakMap();
  let cached = cache.get(key);
  if (cached?.[alg]) {
    return cached[alg];
  }
  const cryptoKey = await jwkToKey({ ...jwk, alg });
  if (freeze)
    Object.freeze(key);
  if (!cached) {
    cache.set(key, { [alg]: cryptoKey });
  } else {
    cached[alg] = cryptoKey;
  }
  return cryptoKey;
};
var handleKeyObject = (keyObject, alg) => {
  cache ||= /* @__PURE__ */ new WeakMap();
  let cached = cache.get(keyObject);
  if (cached?.[alg]) {
    return cached[alg];
  }
  const isPublic = keyObject.type === "public";
  const extractable = isPublic ? true : false;
  let cryptoKey;
  if (keyObject.asymmetricKeyType === "x25519") {
    switch (alg) {
      case "ECDH-ES":
      case "ECDH-ES+A128KW":
      case "ECDH-ES+A192KW":
      case "ECDH-ES+A256KW":
        break;
      default:
        throw new TypeError(unusableForAlg);
    }
    cryptoKey = keyObject.toCryptoKey(keyObject.asymmetricKeyType, extractable, isPublic ? [] : ["deriveBits"]);
  }
  if (keyObject.asymmetricKeyType === "ed25519") {
    if (alg !== "EdDSA" && alg !== "Ed25519") {
      throw new TypeError(unusableForAlg);
    }
    cryptoKey = keyObject.toCryptoKey(keyObject.asymmetricKeyType, extractable, [
      isPublic ? "verify" : "sign"
    ]);
  }
  switch (keyObject.asymmetricKeyType) {
    case "ml-dsa-44":
    case "ml-dsa-65":
    case "ml-dsa-87": {
      if (alg !== keyObject.asymmetricKeyType.toUpperCase()) {
        throw new TypeError(unusableForAlg);
      }
      cryptoKey = keyObject.toCryptoKey(keyObject.asymmetricKeyType, extractable, [
        isPublic ? "verify" : "sign"
      ]);
    }
  }
  if (keyObject.asymmetricKeyType === "rsa") {
    let hash;
    switch (alg) {
      case "RSA-OAEP":
        hash = "SHA-1";
        break;
      case "RS256":
      case "PS256":
      case "RSA-OAEP-256":
        hash = "SHA-256";
        break;
      case "RS384":
      case "PS384":
      case "RSA-OAEP-384":
        hash = "SHA-384";
        break;
      case "RS512":
      case "PS512":
      case "RSA-OAEP-512":
        hash = "SHA-512";
        break;
      default:
        throw new TypeError(unusableForAlg);
    }
    if (alg.startsWith("RSA-OAEP")) {
      return keyObject.toCryptoKey({
        name: "RSA-OAEP",
        hash
      }, extractable, isPublic ? ["encrypt"] : ["decrypt"]);
    }
    cryptoKey = keyObject.toCryptoKey({
      name: alg.startsWith("PS") ? "RSA-PSS" : "RSASSA-PKCS1-v1_5",
      hash
    }, extractable, [isPublic ? "verify" : "sign"]);
  }
  if (keyObject.asymmetricKeyType === "ec") {
    const nist = /* @__PURE__ */ new Map([
      ["prime256v1", "P-256"],
      ["secp384r1", "P-384"],
      ["secp521r1", "P-521"]
    ]);
    const namedCurve = nist.get(keyObject.asymmetricKeyDetails?.namedCurve);
    if (!namedCurve) {
      throw new TypeError(unusableForAlg);
    }
    const expectedCurve = { ES256: "P-256", ES384: "P-384", ES512: "P-521" };
    if (expectedCurve[alg] && namedCurve === expectedCurve[alg]) {
      cryptoKey = keyObject.toCryptoKey({
        name: "ECDSA",
        namedCurve
      }, extractable, [isPublic ? "verify" : "sign"]);
    }
    if (alg.startsWith("ECDH-ES")) {
      cryptoKey = keyObject.toCryptoKey({
        name: "ECDH",
        namedCurve
      }, extractable, isPublic ? [] : ["deriveBits"]);
    }
  }
  if (!cryptoKey) {
    throw new TypeError(unusableForAlg);
  }
  if (!cached) {
    cache.set(keyObject, { [alg]: cryptoKey });
  } else {
    cached[alg] = cryptoKey;
  }
  return cryptoKey;
};
async function normalizeKey(key, alg) {
  if (key instanceof Uint8Array) {
    return key;
  }
  if (isCryptoKey(key)) {
    return key;
  }
  if (isKeyObject(key)) {
    if (key.type === "secret") {
      return key.export();
    }
    if ("toCryptoKey" in key && typeof key.toCryptoKey === "function") {
      try {
        return handleKeyObject(key, alg);
      } catch (err) {
        if (err instanceof TypeError) {
          throw err;
        }
      }
    }
    let jwk = key.export({ format: "jwk" });
    return handleJWK(key, jwk, alg);
  }
  if (isJWK(key)) {
    if (key.k) {
      return decode(key.k);
    }
    return handleJWK(key, key, alg, true);
  }
  throw new Error("unreachable");
}
async function importJWK(jwk, alg, options) {
  if (!isObject(jwk)) {
    throw new TypeError("JWK must be an object");
  }
  let ext;
  alg ??= jwk.alg;
  ext ??= options?.extractable ?? jwk.ext;
  switch (jwk.kty) {
    case "oct":
      if (typeof jwk.k !== "string" || !jwk.k) {
        throw new TypeError('missing "k" (Key Value) Parameter value');
      }
      return decode(jwk.k);
    case "RSA":
      if ("oth" in jwk && jwk.oth !== void 0) {
        throw new JOSENotSupported('RSA JWK "oth" (Other Primes Info) Parameter value is not supported');
      }
      return jwkToKey({ ...jwk, alg, ext });
    case "AKP": {
      if (typeof jwk.alg !== "string" || !jwk.alg) {
        throw new TypeError('missing "alg" (Algorithm) Parameter value');
      }
      if (alg !== void 0 && alg !== jwk.alg) {
        throw new TypeError("JWK alg and alg option value mismatch");
      }
      return jwkToKey({ ...jwk, ext });
    }
    case "EC":
    case "OKP":
      return jwkToKey({ ...jwk, alg, ext });
    default:
      throw new JOSENotSupported('Unsupported "kty" (Key Type) Parameter value');
  }
}
function validateCrit(Err, recognizedDefault, recognizedOption, protectedHeader, joseHeader) {
  if (joseHeader.crit !== void 0 && protectedHeader?.crit === void 0) {
    throw new Err('"crit" (Critical) Header Parameter MUST be integrity protected');
  }
  if (!protectedHeader || protectedHeader.crit === void 0) {
    return /* @__PURE__ */ new Set();
  }
  if (!Array.isArray(protectedHeader.crit) || protectedHeader.crit.length === 0 || protectedHeader.crit.some((input) => typeof input !== "string" || input.length === 0)) {
    throw new Err('"crit" (Critical) Header Parameter MUST be an array of non-empty strings when present');
  }
  let recognized;
  if (recognizedOption !== void 0) {
    recognized = new Map([...Object.entries(recognizedOption), ...recognizedDefault.entries()]);
  } else {
    recognized = recognizedDefault;
  }
  for (const parameter of protectedHeader.crit) {
    if (!recognized.has(parameter)) {
      throw new JOSENotSupported(`Extension Header Parameter "${parameter}" is not recognized`);
    }
    if (joseHeader[parameter] === void 0) {
      throw new Err(`Extension Header Parameter "${parameter}" is missing`);
    }
    if (recognized.get(parameter) && protectedHeader[parameter] === void 0) {
      throw new Err(`Extension Header Parameter "${parameter}" MUST be integrity protected`);
    }
  }
  return new Set(protectedHeader.crit);
}
function validateAlgorithms(option, algorithms) {
  if (algorithms !== void 0 && (!Array.isArray(algorithms) || algorithms.some((s) => typeof s !== "string"))) {
    throw new TypeError(`"${option}" option must be an array of strings`);
  }
  if (!algorithms) {
    return void 0;
  }
  return new Set(algorithms);
}
var tag = (key) => key?.[Symbol.toStringTag];
var jwkMatchesOp = (alg, key, usage) => {
  if (key.use !== void 0) {
    let expected;
    switch (usage) {
      case "sign":
      case "verify":
        expected = "sig";
        break;
      case "encrypt":
      case "decrypt":
        expected = "enc";
        break;
    }
    if (key.use !== expected) {
      throw new TypeError(`Invalid key for this operation, its "use" must be "${expected}" when present`);
    }
  }
  if (key.alg !== void 0 && key.alg !== alg) {
    throw new TypeError(`Invalid key for this operation, its "alg" must be "${alg}" when present`);
  }
  if (Array.isArray(key.key_ops)) {
    let expectedKeyOp;
    switch (true) {
      case (usage === "sign" || usage === "verify"):
      case alg === "dir":
      case alg.includes("CBC-HS"):
        expectedKeyOp = usage;
        break;
      case alg.startsWith("PBES2"):
        expectedKeyOp = "deriveBits";
        break;
      case /^A\d{3}(?:GCM)?(?:KW)?$/.test(alg):
        if (!alg.includes("GCM") && alg.endsWith("KW")) {
          expectedKeyOp = usage === "encrypt" ? "wrapKey" : "unwrapKey";
        } else {
          expectedKeyOp = usage;
        }
        break;
      case (usage === "encrypt" && alg.startsWith("RSA")):
        expectedKeyOp = "wrapKey";
        break;
      case usage === "decrypt":
        expectedKeyOp = alg.startsWith("RSA") ? "unwrapKey" : "deriveBits";
        break;
    }
    if (expectedKeyOp && key.key_ops?.includes?.(expectedKeyOp) === false) {
      throw new TypeError(`Invalid key for this operation, its "key_ops" must include "${expectedKeyOp}" when present`);
    }
  }
  return true;
};
var symmetricTypeCheck = (alg, key, usage) => {
  if (key instanceof Uint8Array)
    return;
  if (isJWK(key)) {
    if (isSecretJWK(key) && jwkMatchesOp(alg, key, usage))
      return;
    throw new TypeError(`JSON Web Key for symmetric algorithms must have JWK "kty" (Key Type) equal to "oct" and the JWK "k" (Key Value) present`);
  }
  if (!isKeyLike(key)) {
    throw new TypeError(withAlg(alg, key, "CryptoKey", "KeyObject", "JSON Web Key", "Uint8Array"));
  }
  if (key.type !== "secret") {
    throw new TypeError(`${tag(key)} instances for symmetric algorithms must be of type "secret"`);
  }
};
var asymmetricTypeCheck = (alg, key, usage) => {
  if (isJWK(key)) {
    switch (usage) {
      case "decrypt":
      case "sign":
        if (isPrivateJWK(key) && jwkMatchesOp(alg, key, usage))
          return;
        throw new TypeError(`JSON Web Key for this operation must be a private JWK`);
      case "encrypt":
      case "verify":
        if (isPublicJWK(key) && jwkMatchesOp(alg, key, usage))
          return;
        throw new TypeError(`JSON Web Key for this operation must be a public JWK`);
    }
  }
  if (!isKeyLike(key)) {
    throw new TypeError(withAlg(alg, key, "CryptoKey", "KeyObject", "JSON Web Key"));
  }
  if (key.type === "secret") {
    throw new TypeError(`${tag(key)} instances for asymmetric algorithms must not be of type "secret"`);
  }
  if (key.type === "public") {
    switch (usage) {
      case "sign":
        throw new TypeError(`${tag(key)} instances for asymmetric algorithm signing must be of type "private"`);
      case "decrypt":
        throw new TypeError(`${tag(key)} instances for asymmetric algorithm decryption must be of type "private"`);
    }
  }
  if (key.type === "private") {
    switch (usage) {
      case "verify":
        throw new TypeError(`${tag(key)} instances for asymmetric algorithm verifying must be of type "public"`);
      case "encrypt":
        throw new TypeError(`${tag(key)} instances for asymmetric algorithm encryption must be of type "public"`);
    }
  }
};
function checkKeyType(alg, key, usage) {
  switch (alg.substring(0, 2)) {
    case "A1":
    case "A2":
    case "di":
    case "HS":
    case "PB":
      symmetricTypeCheck(alg, key, usage);
      break;
    default:
      asymmetricTypeCheck(alg, key, usage);
  }
}
async function flattenedVerify(jws, key, options) {
  if (!isObject(jws)) {
    throw new JWSInvalid("Flattened JWS must be an object");
  }
  if (jws.protected === void 0 && jws.header === void 0) {
    throw new JWSInvalid('Flattened JWS must have either of the "protected" or "header" members');
  }
  if (jws.protected !== void 0 && typeof jws.protected !== "string") {
    throw new JWSInvalid("JWS Protected Header incorrect type");
  }
  if (jws.payload === void 0) {
    throw new JWSInvalid("JWS Payload missing");
  }
  if (typeof jws.signature !== "string") {
    throw new JWSInvalid("JWS Signature missing or incorrect type");
  }
  if (jws.header !== void 0 && !isObject(jws.header)) {
    throw new JWSInvalid("JWS Unprotected Header incorrect type");
  }
  let parsedProt = {};
  if (jws.protected) {
    try {
      const protectedHeader = decode(jws.protected);
      parsedProt = JSON.parse(decoder.decode(protectedHeader));
    } catch {
      throw new JWSInvalid("JWS Protected Header is invalid");
    }
  }
  if (!isDisjoint(parsedProt, jws.header)) {
    throw new JWSInvalid("JWS Protected and JWS Unprotected Header Parameter names must be disjoint");
  }
  const joseHeader = {
    ...parsedProt,
    ...jws.header
  };
  const extensions = validateCrit(JWSInvalid, /* @__PURE__ */ new Map([["b64", true]]), options?.crit, parsedProt, joseHeader);
  let b64 = true;
  if (extensions.has("b64")) {
    b64 = parsedProt.b64;
    if (typeof b64 !== "boolean") {
      throw new JWSInvalid('The "b64" (base64url-encode payload) Header Parameter must be a boolean');
    }
  }
  const { alg } = joseHeader;
  if (typeof alg !== "string" || !alg) {
    throw new JWSInvalid('JWS "alg" (Algorithm) Header Parameter missing or invalid');
  }
  const algorithms = options && validateAlgorithms("algorithms", options.algorithms);
  if (algorithms && !algorithms.has(alg)) {
    throw new JOSEAlgNotAllowed('"alg" (Algorithm) Header Parameter value not allowed');
  }
  if (b64) {
    if (typeof jws.payload !== "string") {
      throw new JWSInvalid("JWS Payload must be a string");
    }
  } else if (typeof jws.payload !== "string" && !(jws.payload instanceof Uint8Array)) {
    throw new JWSInvalid("JWS Payload must be a string or an Uint8Array instance");
  }
  let resolvedKey = false;
  if (typeof key === "function") {
    key = await key(parsedProt, jws);
    resolvedKey = true;
  }
  checkKeyType(alg, key, "verify");
  const data = concat(jws.protected !== void 0 ? encode(jws.protected) : new Uint8Array(), encode("."), typeof jws.payload === "string" ? b64 ? encode(jws.payload) : encoder.encode(jws.payload) : jws.payload);
  const signature = decodeBase64url(jws.signature, "signature", JWSInvalid);
  const k = await normalizeKey(key, alg);
  const verified = await verify(alg, k, signature, data);
  if (!verified) {
    throw new JWSSignatureVerificationFailed();
  }
  let payload;
  if (b64) {
    payload = decodeBase64url(jws.payload, "payload", JWSInvalid);
  } else if (typeof jws.payload === "string") {
    payload = encoder.encode(jws.payload);
  } else {
    payload = jws.payload;
  }
  const result = { payload };
  if (jws.protected !== void 0) {
    result.protectedHeader = parsedProt;
  }
  if (jws.header !== void 0) {
    result.unprotectedHeader = jws.header;
  }
  if (resolvedKey) {
    return { ...result, key: k };
  }
  return result;
}
async function compactVerify(jws, key, options) {
  if (jws instanceof Uint8Array) {
    jws = decoder.decode(jws);
  }
  if (typeof jws !== "string") {
    throw new JWSInvalid("Compact JWS must be a string or Uint8Array");
  }
  const { 0: protectedHeader, 1: payload, 2: signature, length } = jws.split(".");
  if (length !== 3) {
    throw new JWSInvalid("Invalid Compact JWS");
  }
  const verified = await flattenedVerify({ payload, protected: protectedHeader, signature }, key, options);
  const result = { payload: verified.payload, protectedHeader: verified.protectedHeader };
  if (typeof key === "function") {
    return { ...result, key: verified.key };
  }
  return result;
}
var epoch = (date) => Math.floor(date.getTime() / 1e3);
var minute = 60;
var hour = minute * 60;
var day = hour * 24;
var week = day * 7;
var year = day * 365.25;
var REGEX = /^(\+|\-)? ?(\d+|\d+\.\d+) ?(seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)(?: (ago|from now))?$/i;
function secs(str) {
  const matched = REGEX.exec(str);
  if (!matched || matched[4] && matched[1]) {
    throw new TypeError("Invalid time period format");
  }
  const value = parseFloat(matched[2]);
  const unit = matched[3].toLowerCase();
  let numericDate;
  switch (unit) {
    case "sec":
    case "secs":
    case "second":
    case "seconds":
    case "s":
      numericDate = Math.round(value);
      break;
    case "minute":
    case "minutes":
    case "min":
    case "mins":
    case "m":
      numericDate = Math.round(value * minute);
      break;
    case "hour":
    case "hours":
    case "hr":
    case "hrs":
    case "h":
      numericDate = Math.round(value * hour);
      break;
    case "day":
    case "days":
    case "d":
      numericDate = Math.round(value * day);
      break;
    case "week":
    case "weeks":
    case "w":
      numericDate = Math.round(value * week);
      break;
    default:
      numericDate = Math.round(value * year);
      break;
  }
  if (matched[1] === "-" || matched[4] === "ago") {
    return -numericDate;
  }
  return numericDate;
}
var normalizeTyp = (value) => {
  if (value.includes("/")) {
    return value.toLowerCase();
  }
  return `application/${value.toLowerCase()}`;
};
var checkAudiencePresence = (audPayload, audOption) => {
  if (typeof audPayload === "string") {
    return audOption.includes(audPayload);
  }
  if (Array.isArray(audPayload)) {
    return audOption.some(Set.prototype.has.bind(new Set(audPayload)));
  }
  return false;
};
function validateClaimsSet(protectedHeader, encodedPayload, options = {}) {
  let payload;
  try {
    payload = JSON.parse(decoder.decode(encodedPayload));
  } catch {
  }
  if (!isObject(payload)) {
    throw new JWTInvalid("JWT Claims Set must be a top-level JSON object");
  }
  const { typ } = options;
  if (typ && (typeof protectedHeader.typ !== "string" || normalizeTyp(protectedHeader.typ) !== normalizeTyp(typ))) {
    throw new JWTClaimValidationFailed('unexpected "typ" JWT header value', payload, "typ", "check_failed");
  }
  const { requiredClaims = [], issuer, subject, audience, maxTokenAge } = options;
  const presenceCheck = [...requiredClaims];
  if (maxTokenAge !== void 0)
    presenceCheck.push("iat");
  if (audience !== void 0)
    presenceCheck.push("aud");
  if (subject !== void 0)
    presenceCheck.push("sub");
  if (issuer !== void 0)
    presenceCheck.push("iss");
  for (const claim of new Set(presenceCheck.reverse())) {
    if (!(claim in payload)) {
      throw new JWTClaimValidationFailed(`missing required "${claim}" claim`, payload, claim, "missing");
    }
  }
  if (issuer && !(Array.isArray(issuer) ? issuer : [issuer]).includes(payload.iss)) {
    throw new JWTClaimValidationFailed('unexpected "iss" claim value', payload, "iss", "check_failed");
  }
  if (subject && payload.sub !== subject) {
    throw new JWTClaimValidationFailed('unexpected "sub" claim value', payload, "sub", "check_failed");
  }
  if (audience && !checkAudiencePresence(payload.aud, typeof audience === "string" ? [audience] : audience)) {
    throw new JWTClaimValidationFailed('unexpected "aud" claim value', payload, "aud", "check_failed");
  }
  let tolerance;
  switch (typeof options.clockTolerance) {
    case "string":
      tolerance = secs(options.clockTolerance);
      break;
    case "number":
      tolerance = options.clockTolerance;
      break;
    case "undefined":
      tolerance = 0;
      break;
    default:
      throw new TypeError("Invalid clockTolerance option type");
  }
  const { currentDate } = options;
  const now = epoch(currentDate || /* @__PURE__ */ new Date());
  if ((payload.iat !== void 0 || maxTokenAge) && typeof payload.iat !== "number") {
    throw new JWTClaimValidationFailed('"iat" claim must be a number', payload, "iat", "invalid");
  }
  if (payload.nbf !== void 0) {
    if (typeof payload.nbf !== "number") {
      throw new JWTClaimValidationFailed('"nbf" claim must be a number', payload, "nbf", "invalid");
    }
    if (payload.nbf > now + tolerance) {
      throw new JWTClaimValidationFailed('"nbf" claim timestamp check failed', payload, "nbf", "check_failed");
    }
  }
  if (payload.exp !== void 0) {
    if (typeof payload.exp !== "number") {
      throw new JWTClaimValidationFailed('"exp" claim must be a number', payload, "exp", "invalid");
    }
    if (payload.exp <= now - tolerance) {
      throw new JWTExpired('"exp" claim timestamp check failed', payload, "exp", "check_failed");
    }
  }
  if (maxTokenAge) {
    const age = now - payload.iat;
    const max = typeof maxTokenAge === "number" ? maxTokenAge : secs(maxTokenAge);
    if (age - tolerance > max) {
      throw new JWTExpired('"iat" claim timestamp check failed (too far in the past)', payload, "iat", "check_failed");
    }
    if (age < 0 - tolerance) {
      throw new JWTClaimValidationFailed('"iat" claim timestamp check failed (it should be in the past)', payload, "iat", "check_failed");
    }
  }
  return payload;
}
async function jwtVerify(jwt, key, options) {
  const verified = await compactVerify(jwt, key, options);
  if (verified.protectedHeader.crit?.includes("b64") && verified.protectedHeader.b64 === false) {
    throw new JWTInvalid("JWTs MUST NOT use unencoded payload");
  }
  const payload = validateClaimsSet(verified.protectedHeader, verified.payload, options);
  const result = { payload, protectedHeader: verified.protectedHeader };
  if (typeof key === "function") {
    return { ...result, key: verified.key };
  }
  return result;
}
function getKtyFromAlg(alg) {
  switch (typeof alg === "string" && alg.slice(0, 2)) {
    case "RS":
    case "PS":
      return "RSA";
    case "ES":
      return "EC";
    case "Ed":
      return "OKP";
    case "ML":
      return "AKP";
    default:
      throw new JOSENotSupported('Unsupported "alg" value for a JSON Web Key Set');
  }
}
function isJWKSLike(jwks) {
  return jwks && typeof jwks === "object" && Array.isArray(jwks.keys) && jwks.keys.every(isJWKLike);
}
function isJWKLike(key) {
  return isObject(key);
}
var LocalJWKSet = class {
  #jwks;
  #cached = /* @__PURE__ */ new WeakMap();
  constructor(jwks) {
    if (!isJWKSLike(jwks)) {
      throw new JWKSInvalid("JSON Web Key Set malformed");
    }
    this.#jwks = structuredClone(jwks);
  }
  jwks() {
    return this.#jwks;
  }
  async getKey(protectedHeader, token) {
    const { alg, kid } = { ...protectedHeader, ...token?.header };
    const kty = getKtyFromAlg(alg);
    const candidates = this.#jwks.keys.filter((jwk2) => {
      let candidate = kty === jwk2.kty;
      if (candidate && typeof kid === "string") {
        candidate = kid === jwk2.kid;
      }
      if (candidate && (typeof jwk2.alg === "string" || kty === "AKP")) {
        candidate = alg === jwk2.alg;
      }
      if (candidate && typeof jwk2.use === "string") {
        candidate = jwk2.use === "sig";
      }
      if (candidate && Array.isArray(jwk2.key_ops)) {
        candidate = jwk2.key_ops.includes("verify");
      }
      if (candidate) {
        switch (alg) {
          case "ES256":
            candidate = jwk2.crv === "P-256";
            break;
          case "ES384":
            candidate = jwk2.crv === "P-384";
            break;
          case "ES512":
            candidate = jwk2.crv === "P-521";
            break;
          case "Ed25519":
          case "EdDSA":
            candidate = jwk2.crv === "Ed25519";
            break;
        }
      }
      return candidate;
    });
    const { 0: jwk, length } = candidates;
    if (length === 0) {
      throw new JWKSNoMatchingKey();
    }
    if (length !== 1) {
      const error = new JWKSMultipleMatchingKeys();
      const _cached = this.#cached;
      error[Symbol.asyncIterator] = async function* () {
        for (const jwk2 of candidates) {
          try {
            yield await importWithAlgCache(_cached, jwk2, alg);
          } catch {
          }
        }
      };
      throw error;
    }
    return importWithAlgCache(this.#cached, jwk, alg);
  }
};
async function importWithAlgCache(cache2, jwk, alg) {
  const cached = cache2.get(jwk) || cache2.set(jwk, {}).get(jwk);
  if (cached[alg] === void 0) {
    const key = await importJWK({ ...jwk, ext: true }, alg);
    if (key instanceof Uint8Array || key.type !== "public") {
      throw new JWKSInvalid("JSON Web Key Set members must be public keys");
    }
    cached[alg] = key;
  }
  return cached[alg];
}
function createLocalJWKSet(jwks) {
  const set = new LocalJWKSet(jwks);
  const localJWKSet = async (protectedHeader, token) => set.getKey(protectedHeader, token);
  Object.defineProperties(localJWKSet, {
    jwks: {
      value: () => structuredClone(set.jwks()),
      enumerable: false,
      configurable: false,
      writable: false
    }
  });
  return localJWKSet;
}
function isCloudflareWorkers() {
  return typeof WebSocketPair !== "undefined" || typeof navigator !== "undefined" && navigator.userAgent === "Cloudflare-Workers" || typeof EdgeRuntime !== "undefined" && EdgeRuntime === "vercel";
}
var USER_AGENT;
if (typeof navigator === "undefined" || !navigator.userAgent?.startsWith?.("Mozilla/5.0 ")) {
  const NAME = "jose";
  const VERSION = "v6.2.2";
  USER_AGENT = `${NAME}/${VERSION}`;
}
var customFetch = /* @__PURE__ */ Symbol();
async function fetchJwks(url, headers, signal, fetchImpl = fetch) {
  const response = await fetchImpl(url, {
    method: "GET",
    signal,
    redirect: "manual",
    headers
  }).catch((err) => {
    if (err.name === "TimeoutError") {
      throw new JWKSTimeout();
    }
    throw err;
  });
  if (response.status !== 200) {
    throw new JOSEError("Expected 200 OK from the JSON Web Key Set HTTP response");
  }
  try {
    return await response.json();
  } catch {
    throw new JOSEError("Failed to parse the JSON Web Key Set HTTP response as JSON");
  }
}
var jwksCache = /* @__PURE__ */ Symbol();
function isFreshJwksCache(input, cacheMaxAge) {
  if (typeof input !== "object" || input === null) {
    return false;
  }
  if (!("uat" in input) || typeof input.uat !== "number" || Date.now() - input.uat >= cacheMaxAge) {
    return false;
  }
  if (!("jwks" in input) || !isObject(input.jwks) || !Array.isArray(input.jwks.keys) || !Array.prototype.every.call(input.jwks.keys, isObject)) {
    return false;
  }
  return true;
}
var RemoteJWKSet = class {
  #url;
  #timeoutDuration;
  #cooldownDuration;
  #cacheMaxAge;
  #jwksTimestamp;
  #pendingFetch;
  #headers;
  #customFetch;
  #local;
  #cache;
  constructor(url, options) {
    if (!(url instanceof URL)) {
      throw new TypeError("url must be an instance of URL");
    }
    this.#url = new URL(url.href);
    this.#timeoutDuration = typeof options?.timeoutDuration === "number" ? options?.timeoutDuration : 5e3;
    this.#cooldownDuration = typeof options?.cooldownDuration === "number" ? options?.cooldownDuration : 3e4;
    this.#cacheMaxAge = typeof options?.cacheMaxAge === "number" ? options?.cacheMaxAge : 6e5;
    this.#headers = new Headers(options?.headers);
    if (USER_AGENT && !this.#headers.has("User-Agent")) {
      this.#headers.set("User-Agent", USER_AGENT);
    }
    if (!this.#headers.has("accept")) {
      this.#headers.set("accept", "application/json");
      this.#headers.append("accept", "application/jwk-set+json");
    }
    this.#customFetch = options?.[customFetch];
    if (options?.[jwksCache] !== void 0) {
      this.#cache = options?.[jwksCache];
      if (isFreshJwksCache(options?.[jwksCache], this.#cacheMaxAge)) {
        this.#jwksTimestamp = this.#cache.uat;
        this.#local = createLocalJWKSet(this.#cache.jwks);
      }
    }
  }
  pendingFetch() {
    return !!this.#pendingFetch;
  }
  coolingDown() {
    return typeof this.#jwksTimestamp === "number" ? Date.now() < this.#jwksTimestamp + this.#cooldownDuration : false;
  }
  fresh() {
    return typeof this.#jwksTimestamp === "number" ? Date.now() < this.#jwksTimestamp + this.#cacheMaxAge : false;
  }
  jwks() {
    return this.#local?.jwks();
  }
  async getKey(protectedHeader, token) {
    if (!this.#local || !this.fresh()) {
      await this.reload();
    }
    try {
      return await this.#local(protectedHeader, token);
    } catch (err) {
      if (err instanceof JWKSNoMatchingKey) {
        if (this.coolingDown() === false) {
          await this.reload();
          return this.#local(protectedHeader, token);
        }
      }
      throw err;
    }
  }
  async reload() {
    if (this.#pendingFetch && isCloudflareWorkers()) {
      this.#pendingFetch = void 0;
    }
    this.#pendingFetch ||= fetchJwks(this.#url.href, this.#headers, AbortSignal.timeout(this.#timeoutDuration), this.#customFetch).then((json2) => {
      this.#local = createLocalJWKSet(json2);
      if (this.#cache) {
        this.#cache.uat = Date.now();
        this.#cache.jwks = json2;
      }
      this.#jwksTimestamp = Date.now();
      this.#pendingFetch = void 0;
    }).catch((err) => {
      this.#pendingFetch = void 0;
      throw err;
    });
    await this.#pendingFetch;
  }
};
function createRemoteJWKSet(url, options) {
  const set = new RemoteJWKSet(url, options);
  const remoteJWKSet = async (protectedHeader, token) => set.getKey(protectedHeader, token);
  Object.defineProperties(remoteJWKSet, {
    coolingDown: {
      get: () => set.coolingDown(),
      enumerable: true,
      configurable: false
    },
    fresh: {
      get: () => set.fresh(),
      enumerable: true,
      configurable: false
    },
    reload: {
      value: () => set.reload(),
      enumerable: true,
      configurable: false,
      writable: false
    },
    reloading: {
      get: () => set.pendingFetch(),
      enumerable: true,
      configurable: false
    },
    jwks: {
      value: () => set.jwks(),
      enumerable: true,
      configurable: false,
      writable: false
    }
  });
  return remoteJWKSet;
}
var CLERK_JWT_ISSUER_DOMAIN = process.env.CLERK_JWT_ISSUER_DOMAIN ?? "";
var CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY ?? "";
var _jwks = null;
function getJWKS() {
  if (!_jwks) {
    const issuerDomain = process.env.CLERK_JWT_ISSUER_DOMAIN;
    if (issuerDomain) {
      const jwksUrl = new URL("/.well-known/jwks.json", issuerDomain);
      _jwks = createRemoteJWKSet(jwksUrl);
    }
  }
  return _jwks;
}
function getAllowedAudiences() {
  const configured = [
    process.env.CLERK_JWT_AUDIENCE,
    process.env.CLERK_PUBLISHABLE_KEY
  ].flatMap((value) => (value ?? "").split(",")).map((value) => value.trim()).filter(Boolean);
  return Array.from(/* @__PURE__ */ new Set(["convex", ...configured]));
}
function getClerkJwtVerifyOptions() {
  return {
    issuer: CLERK_JWT_ISSUER_DOMAIN,
    audience: getAllowedAudiences(),
    algorithms: ["RS256"]
  };
}
function extractOrgId(payload) {
  const orgClaim = payload.org;
  return (typeof orgClaim?.id === "string" ? orgClaim.id : null) ?? (typeof payload.org_id === "string" ? payload.org_id : null);
}
var _planCache = /* @__PURE__ */ new Map();
var PLAN_CACHE_TTL_MS = 5 * 60 * 1e3;
async function lookupPlanFromClerk(userId) {
  const cached = _planCache.get(userId);
  if (cached && Date.now() < cached.expiresAt) return cached.role;
  if (!CLERK_SECRET_KEY) return "free";
  try {
    const resp = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
      headers: { Authorization: `Bearer ${CLERK_SECRET_KEY}` }
    });
    if (!resp.ok) return "free";
    const user = await resp.json();
    const role = user.public_metadata?.plan === "pro" ? "pro" : "free";
    _planCache.set(userId, { role, expiresAt: Date.now() + PLAN_CACHE_TTL_MS });
    return role;
  } catch {
    return "free";
  }
}
async function validateBearerToken(token) {
  const jwks = getJWKS();
  if (!jwks) return { valid: false };
  try {
    let payload;
    try {
      ({ payload } = await jwtVerify(token, jwks, getClerkJwtVerifyOptions()));
    } catch (audErr) {
      if (audErr.message?.includes('missing required "aud"')) {
        ({ payload } = await jwtVerify(token, jwks, {
          issuer: CLERK_JWT_ISSUER_DOMAIN,
          algorithms: ["RS256"]
        }));
      } else {
        throw audErr;
      }
    }
    const userId = payload.sub;
    if (!userId) return { valid: false };
    const rawPlan = payload.plan;
    const role = rawPlan !== void 0 ? rawPlan === "pro" ? "pro" : "free" : await lookupPlanFromClerk(userId);
    const email = typeof payload.email === "string" ? payload.email : void 0;
    const givenName = typeof payload.given_name === "string" ? payload.given_name : void 0;
    const familyName = typeof payload.family_name === "string" ? payload.family_name : void 0;
    const name = [givenName, familyName].filter(Boolean).join(" ") || void 0;
    const orgId = extractOrgId(payload);
    return { valid: true, userId, orgId, role, email, name };
  } catch {
    return { valid: false };
  }
}
function unwrapEnvelope2(raw) {
  if (raw == null) return { _seed: null, data: null };
  let value = raw;
  if (typeof value === "string") {
    try {
      value = JSON.parse(value);
    } catch {
      return { _seed: null, data: raw };
    }
  }
  if (typeof value !== "object" || Array.isArray(value)) {
    return { _seed: null, data: value };
  }
  const seed = value._seed;
  if (seed && typeof seed === "object" && typeof seed.fetchedAt === "number") {
    return { _seed: seed, data: value.data };
  }
  return { _seed: null, data: value };
}
var AXIOM_DATASET = "wm_api_usage";
var AXIOM_INGEST_URL = `https://api.axiom.co/v1/datasets/${AXIOM_DATASET}/ingest`;
var CB_WINDOW_MS = 5 * 60 * 1e3;
function parseTimeoutEnv(raw, defaultMs) {
  const parsed = Number.parseInt(raw ?? "", 10);
  return parsed > 0 ? parsed : defaultMs;
}
var REDIS_OP_TIMEOUT_MS = parseTimeoutEnv(process.env.REDIS_OP_TIMEOUT_MS, 1500);
var REDIS_PIPELINE_TIMEOUT_MS = parseTimeoutEnv(process.env.REDIS_PIPELINE_TIMEOUT_MS, 5e3);
function errMsg(err) {
  return err instanceof Error ? err.message : String(err);
}
function getKeyPrefix() {
  const env = process.env.VERCEL_ENV;
  if (!env || env === "production") return "";
  const sha = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 8) || "dev";
  return `${env}:${sha}:`;
}
var cachedPrefix;
function prefixKey(key) {
  if (cachedPrefix === void 0) cachedPrefix = getKeyPrefix();
  if (!cachedPrefix) return key;
  return `${cachedPrefix}${key}`;
}
async function readCachedJson(key, raw = false) {
  if (process.env.LOCAL_API_MODE === "tauri-sidecar") {
    try {
      const { sidecarCacheGet: sidecarCacheGet2 } = await Promise.resolve().then(() => (init_sidecar_cache(), sidecar_cache_exports));
      const value = sidecarCacheGet2(key);
      return value == null ? { status: "miss" } : { status: "hit", value };
    } catch (error) {
      return { status: "error", error };
    }
  }
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return { status: "miss" };
  try {
    const finalKey = raw ? key : prefixKey(key);
    const resp = await fetch(`${url}/get/${encodeURIComponent(finalKey)}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(REDIS_OP_TIMEOUT_MS)
    });
    if (!resp.ok) throw new Error(`Redis HTTP ${resp.status}`);
    const data = await resp.json();
    if (!data.result) return { status: "miss" };
    return {
      status: "hit",
      value: unwrapEnvelope2(JSON.parse(data.result)).data
    };
  } catch (error) {
    return { status: "error", error };
  }
}
function logCacheReadError(key, err) {
  const isTimeout = err instanceof Error && (err.name === "TimeoutError" || err.name === "AbortError");
  if (isTimeout) {
    console.error(`[REDIS-TIMEOUT] getCachedJson key=${key} timeoutMs=${REDIS_OP_TIMEOUT_MS}`);
  } else {
    console.warn("[redis] getCachedJson failed:", errMsg(err));
  }
}
async function getCachedJson(key, raw = false) {
  const read = await readCachedJson(key, raw);
  if (read.status === "hit") return read.value;
  if (read.status === "error") logCacheReadError(key, read.error);
  return null;
}
async function setCachedJson(key, value, ttlSeconds, raw = false) {
  if (process.env.LOCAL_API_MODE === "tauri-sidecar") {
    const { sidecarCacheSet: sidecarCacheSet2 } = await Promise.resolve().then(() => (init_sidecar_cache(), sidecar_cache_exports));
    sidecarCacheSet2(key, value, ttlSeconds);
    return true;
  }
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return false;
  try {
    const finalKey = raw ? key : prefixKey(key);
    const resp = await fetch(`${url}/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(["SET", finalKey, JSON.stringify(value), "EX", String(ttlSeconds)]),
      signal: AbortSignal.timeout(REDIS_PIPELINE_TIMEOUT_MS)
    });
    const data = await resp.json().catch(() => null);
    if (!resp.ok || data?.error) {
      console.warn(`[redis] setCachedJson failed:`, data?.error ?? `HTTP ${resp.status}`);
      return false;
    }
    return true;
  } catch (err) {
    console.warn("[redis] setCachedJson failed:", errMsg(err));
    return false;
  }
}
var CONVEX_INTERNAL_ENTITLEMENTS_PATH = "/api/internal-entitlements";
var _didWarnMissingConvexSharedSecret = false;
function getConvexSharedSecret() {
  const secret = process.env.CONVEX_SERVER_SHARED_SECRET ?? "";
  if (!secret && !_didWarnMissingConvexSharedSecret) {
    _didWarnMissingConvexSharedSecret = true;
    console.warn("[entitlement-check] CONVEX_SERVER_SHARED_SECRET not set; Convex fallback disabled");
  }
  return secret;
}
var _inFlight = /* @__PURE__ */ new Map();
var ENV_PREFIX = process.env.DODO_PAYMENTS_ENVIRONMENT === "live_mode" ? "live" : "test";
var ENTITLEMENT_CACHE_TTL_SECONDS = 900;
async function getEntitlements(userId) {
  const existing = _inFlight.get(userId);
  if (existing) return existing;
  const promise = _getEntitlementsImpl(userId);
  _inFlight.set(userId, promise);
  try {
    return await promise;
  } finally {
    _inFlight.delete(userId);
  }
}
async function _getEntitlementsImpl(userId) {
  try {
    const cached = await getCachedJson(`entitlements:${ENV_PREFIX}:${userId}`, true);
    if (cached && typeof cached === "object") {
      const ent = cached;
      if (ent.validUntil >= Date.now() && typeof ent.features.mcpAccess === "boolean") {
        return ent;
      }
    }
    const convexSiteUrl = process.env.CONVEX_SITE_URL;
    const convexSharedSecret = getConvexSharedSecret();
    if (!convexSiteUrl || !convexSharedSecret) return null;
    const response = await fetch(`${convexSiteUrl}${CONVEX_INTERNAL_ENTITLEMENTS_PATH}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "worldmonitor-gateway/1.0",
        "x-convex-shared-secret": convexSharedSecret
      },
      body: JSON.stringify({ userId }),
      signal: AbortSignal.timeout(3e3)
    });
    if (!response.ok) return null;
    const result = await response.json();
    if (result) {
      try {
        await setCachedJson(`entitlements:${ENV_PREFIX}:${userId}`, result, ENTITLEMENT_CACHE_TTL_SECONDS, true);
      } catch (cacheErr) {
        console.warn("[entitlement-check] cache write failed (non-fatal):", cacheErr instanceof Error ? cacheErr.message : String(cacheErr));
      }
      return result;
    }
    return null;
  } catch (err) {
    console.warn("[entitlement-check] getEntitlements failed:", err instanceof Error ? err.message : String(err));
    return null;
  }
}
var config = { runtime: "edge" };
var CONVEX_SITE_URL = process.env.CONVEX_SITE_URL ?? (process.env.CONVEX_URL ?? "").replace(".convex.cloud", ".convex.site");
var RELAY_SHARED_SECRET = process.env.RELAY_SHARED_SECRET ?? "";
var UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL ?? "";
var UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN ?? "";
async function encryptSlackWebhook(webhookUrl) {
  const rawKey = process.env.NOTIFICATION_ENCRYPTION_KEY;
  if (!rawKey) throw new Error("NOTIFICATION_ENCRYPTION_KEY not set");
  const keyBytes = Uint8Array.from(atob(rawKey), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey("raw", keyBytes, "AES-GCM", false, ["encrypt"]);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(webhookUrl);
  const result = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv, tagLength: 128 }, key, encoded));
  const ciphertext = result.slice(0, -16);
  const tag2 = result.slice(-16);
  const payload = new Uint8Array(12 + 16 + ciphertext.length);
  payload.set(iv, 0);
  payload.set(tag2, 12);
  payload.set(ciphertext, 28);
  const binary = Array.from(payload, (b) => String.fromCharCode(b)).join("");
  return `v1:${btoa(binary)}`;
}
function isAllowedPushEndpointHost(host) {
  const h = host.toLowerCase();
  if (h === "fcm.googleapis.com") return true;
  if (h === "updates.push.services.mozilla.com") return true;
  if (h === "web.push.apple.com") return true;
  if (h.endsWith(".web.push.apple.com")) return true;
  if (h.endsWith(".notify.windows.com")) return true;
  return false;
}
async function publishWelcome(userId, channelType) {
  if (!UPSTASH_URL || !UPSTASH_TOKEN) {
    console.error("[notification-channels] publishWelcome: UPSTASH env vars missing \u2014 welcome not queued");
    return;
  }
  console.log(`[notification-channels] publishWelcome: queuing ${channelType} for ${userId}`);
  const msg = JSON.stringify({ eventType: "channel_welcome", userId, channelType });
  try {
    const res = await fetch(`${UPSTASH_URL}/lpush/wm:events:queue/${encodeURIComponent(msg)}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${UPSTASH_TOKEN}`,
        "User-Agent": "worldmonitor-edge/1.0"
      },
      signal: AbortSignal.timeout(5e3)
    });
    const data = await res.json().catch(() => null);
    console.log(`[notification-channels] publishWelcome LPUSH: status=${res.status} result=${JSON.stringify(data?.result)}`);
  } catch (err) {
    console.error("[notification-channels] publishWelcome LPUSH failed:", err.message);
    await captureSilentError(err, {
      tags: { route: "api/notification-channels", step: "publish-welcome" }
    });
  }
}
async function publishFlushHeld(userId, variant) {
  if (!UPSTASH_URL || !UPSTASH_TOKEN) return;
  const msg = JSON.stringify({ eventType: "flush_quiet_held", userId, variant });
  try {
    await fetch(`${UPSTASH_URL}/lpush/wm:events:queue/${encodeURIComponent(msg)}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${UPSTASH_TOKEN}`, "User-Agent": "worldmonitor-edge/1.0" },
      signal: AbortSignal.timeout(5e3)
    });
  } catch (err) {
    console.warn("[notification-channels] publishFlushHeld LPUSH failed:", err.message);
    await captureSilentError(err, {
      tags: { route: "api/notification-channels", step: "publish-flush-held", severity: "warn" }
    });
  }
}
function json(body, status, cors, noCache = false) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...noCache ? { "Cache-Control": "no-store" } : {},
      ...cors
    }
  });
}
async function convexRelay(body) {
  return fetch(`${CONVEX_SITE_URL}/relay/notification-channels`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${RELAY_SHARED_SECRET}`
    },
    body: JSON.stringify(body)
  });
}
async function handler(req, ctx) {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        ...corsHeaders,
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, Idempotency-Key"
      }
    });
  }
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token) return json({ error: "Unauthorized" }, 401, corsHeaders);
  const session = await validateBearerToken(token);
  if (!session.valid || !session.userId) return json({ error: "Unauthorized" }, 401, corsHeaders);
  const idempotencyRequest = req.method === "POST" ? req.clone() : null;
  if (!CONVEX_SITE_URL || !RELAY_SHARED_SECRET) {
    return json({ error: "Service unavailable" }, 503, corsHeaders);
  }
  if (req.method === "GET") {
    try {
      const resp = await convexRelay({ action: "get", userId: session.userId });
      if (!resp.ok) {
        const errText = await resp.text();
        console.error("[notification-channels] GET relay error:", resp.status, errText);
        return json({ error: "Failed to fetch" }, 500, corsHeaders);
      }
      const data = await resp.json();
      return json(data, 200, corsHeaders, true);
    } catch (err) {
      console.error("[notification-channels] GET error:", err);
      captureEdgeException(err, { handler: "notification-channels", method: "GET" }, ctx);
      return json({ error: "Failed to fetch" }, 500, corsHeaders);
    }
  }
  if (req.method === "POST") {
    const ent = await getEntitlements(session.userId);
    if (!ent || ent.features.tier < 1) {
      return json({
        error: "pro_required",
        message: "Real-time alerts are available on the Pro plan.",
        upgradeUrl: "https://worldmonitor.app/pro"
      }, 403, corsHeaders);
    }
    let body;
    try {
      body = await req.json();
    } catch {
      return json({ error: "Invalid JSON body" }, 400, corsHeaders);
    }
    const idempotencyKey = getIdempotencyKey(req);
    const idempotency = idempotencyKey ? await beginStandaloneIdempotency({
      request: idempotencyRequest ?? req,
      pathname: "/api/notification-channels",
      scope: `user:${session.userId}`,
      idempotencyKey,
      corsHeaders
    }) : null;
    if (idempotency && idempotency.kind !== "proceed" && idempotency.kind !== "disabled") {
      return idempotency.response;
    }
    const finish = (response) => completeStandaloneIdempotency(idempotency, response);
    const { action } = body;
    try {
      if (action === "create-pairing-token") {
        const relayBody = { action: "create-pairing-token", userId: session.userId };
        if (body.variant) relayBody.variant = body.variant;
        const resp = await convexRelay(relayBody);
        if (!resp.ok) {
          console.error("[notification-channels] POST create-pairing-token relay error:", resp.status);
          return finish(json({ error: "Operation failed" }, 500, corsHeaders));
        }
        return finish(json(await resp.json(), 200, corsHeaders));
      }
      if (action === "set-channel") {
        const { channelType, email, webhookEnvelope, webhookLabel } = body;
        if (!channelType) return finish(json({ error: "channelType required" }, 400, corsHeaders));
        if (webhookEnvelope) {
          try {
            await assertNotificationWebhookRegistrationUrlSafe(webhookEnvelope);
          } catch (error) {
            const message2 = error instanceof Error ? error.message : "Webhook URL is not allowed";
            return finish(json({ error: message2 }, 400, corsHeaders));
          }
        }
        const relayBody = { action: "set-channel", userId: session.userId, channelType };
        if (email !== void 0) relayBody.email = email;
        if (webhookLabel !== void 0) relayBody.webhookLabel = String(webhookLabel).slice(0, 100);
        if (webhookEnvelope !== void 0) {
          try {
            relayBody.webhookEnvelope = await encryptSlackWebhook(webhookEnvelope);
          } catch {
            return finish(json({ error: "Encryption unavailable" }, 503, corsHeaders));
          }
        }
        const resp = await convexRelay(relayBody);
        if (!resp.ok) {
          console.error("[notification-channels] POST set-channel relay error:", resp.status);
          return finish(json({ error: "Operation failed" }, 500, corsHeaders));
        }
        const setResult = await resp.json();
        console.log(`[notification-channels] set-channel ${channelType}: isNew=${setResult.isNew}`);
        if (setResult.isNew) ctx.waitUntil(publishWelcome(session.userId, channelType));
        return finish(json({ ok: true }, 200, corsHeaders));
      }
      if (action === "set-web-push") {
        const { endpoint, p256dh, auth, userAgent } = body;
        if (!endpoint || !p256dh || !auth) {
          return finish(json({ error: "endpoint, p256dh, auth required" }, 400, corsHeaders));
        }
        try {
          const u = new URL(endpoint);
          if (u.protocol !== "https:") {
            return finish(json({ error: "endpoint must be https" }, 400, corsHeaders));
          }
          if (!isAllowedPushEndpointHost(u.hostname)) {
            return finish(json(
              { error: "endpoint host is not a recognised push service" },
              400,
              corsHeaders
            ));
          }
        } catch {
          return finish(json({ error: "invalid endpoint" }, 400, corsHeaders));
        }
        const resp = await convexRelay({
          action: "set-web-push",
          userId: session.userId,
          endpoint,
          p256dh,
          auth,
          // Trim user agent; it's cosmetic for the settings UI, not identity.
          userAgent: typeof userAgent === "string" ? userAgent.slice(0, 200) : void 0
        });
        if (!resp.ok) {
          console.error("[notification-channels] POST set-web-push relay error:", resp.status);
          return finish(json({ error: "Operation failed" }, 500, corsHeaders));
        }
        const wpResult = await resp.json();
        if (wpResult.isNew) ctx.waitUntil(publishWelcome(session.userId, "web_push"));
        return finish(json({ ok: true }, 200, corsHeaders));
      }
      if (action === "delete-channel") {
        const { channelType } = body;
        if (!channelType) return finish(json({ error: "channelType required" }, 400, corsHeaders));
        const resp = await convexRelay({ action: "delete-channel", userId: session.userId, channelType });
        if (!resp.ok) {
          console.error("[notification-channels] POST delete-channel relay error:", resp.status);
          return finish(json({ error: "Operation failed" }, 500, corsHeaders));
        }
        return finish(json({ ok: true }, 200, corsHeaders));
      }
      if (action === "set-alert-rules") {
        const { variant, enabled, eventTypes, sensitivity, channels, aiDigestEnabled, countries, tickers } = body;
        if (tickers !== void 0 && !Array.isArray(tickers)) {
          return finish(json({ error: "TICKERS_MUST_BE_ARRAY" }, 400, corsHeaders));
        }
        const resp = await convexRelay({
          action: "set-alert-rules",
          userId: session.userId,
          variant,
          enabled,
          eventTypes,
          sensitivity,
          channels,
          aiDigestEnabled,
          countries,
          tickers
        });
        if (!resp.ok) {
          if (resp.status === 400 || resp.status === 402) {
            const text = await resp.text().catch(() => "");
            let payload = { error: "Validation failed" };
            if (text) {
              try {
                payload = JSON.parse(text);
              } catch {
              }
            }
            return finish(json(payload, resp.status, corsHeaders));
          }
          console.error("[notification-channels] POST set-alert-rules relay error:", resp.status);
          return finish(json({ error: "Operation failed" }, 500, corsHeaders));
        }
        return finish(json({ ok: true }, 200, corsHeaders));
      }
      if (action === "set-quiet-hours") {
        const VALID_OVERRIDE = /* @__PURE__ */ new Set(["critical_only", "silence_all", "batch_on_wake"]);
        const { variant, quietHoursEnabled, quietHoursStart, quietHoursEnd, quietHoursTimezone, quietHoursOverride, countries } = body;
        if (!variant || quietHoursEnabled === void 0) {
          return finish(json({ error: "variant and quietHoursEnabled required" }, 400, corsHeaders));
        }
        if (quietHoursOverride !== void 0 && !VALID_OVERRIDE.has(quietHoursOverride)) {
          return finish(json({ error: "invalid quietHoursOverride" }, 400, corsHeaders));
        }
        const resp = await convexRelay({
          action: "set-quiet-hours",
          userId: session.userId,
          variant,
          quietHoursEnabled,
          quietHoursStart,
          quietHoursEnd,
          quietHoursTimezone,
          quietHoursOverride,
          countries
        });
        if (!resp.ok) {
          console.error("[notification-channels] POST set-quiet-hours relay error:", resp.status);
          return finish(json({ error: "Operation failed" }, 500, corsHeaders));
        }
        const abandonsBatch = !quietHoursEnabled || quietHoursOverride !== "batch_on_wake";
        if (abandonsBatch) ctx.waitUntil(publishFlushHeld(session.userId, variant));
        return finish(json({ ok: true }, 200, corsHeaders));
      }
      if (action === "set-digest-settings") {
        const VALID_DIGEST_MODE = /* @__PURE__ */ new Set(["realtime", "daily", "twice_daily", "weekly"]);
        const { variant, digestMode, digestHour, digestTimezone, countries } = body;
        if (!variant || !digestMode || !VALID_DIGEST_MODE.has(digestMode)) {
          return finish(json({ error: "variant and valid digestMode required" }, 400, corsHeaders));
        }
        const resp = await convexRelay({
          action: "set-digest-settings",
          userId: session.userId,
          variant,
          digestMode,
          digestHour,
          digestTimezone,
          countries
        });
        if (!resp.ok) {
          console.error("[notification-channels] POST set-digest-settings relay error:", resp.status);
          return finish(json({ error: "Operation failed" }, 500, corsHeaders));
        }
        return finish(json({ ok: true }, 200, corsHeaders));
      }
      if (action === "set-notification-config") {
        const VALID_SENSITIVITY = /* @__PURE__ */ new Set(["all", "high", "critical"]);
        const VALID_DIGEST_MODE = /* @__PURE__ */ new Set(["realtime", "daily", "twice_daily", "weekly"]);
        const { variant, enabled, eventTypes, sensitivity, channels, aiDigestEnabled, digestMode, digestHour, digestTimezone, countries, tickers } = body;
        if (!variant) return finish(json({ error: "variant required" }, 400, corsHeaders));
        if (sensitivity !== void 0 && !VALID_SENSITIVITY.has(sensitivity)) {
          return finish(json({ error: "invalid sensitivity" }, 400, corsHeaders));
        }
        if (digestMode !== void 0 && !VALID_DIGEST_MODE.has(digestMode)) {
          return finish(json({ error: "invalid digestMode" }, 400, corsHeaders));
        }
        if (countries !== void 0 && !Array.isArray(countries)) {
          return finish(json({ error: "COUNTRIES_MUST_BE_ARRAY" }, 400, corsHeaders));
        }
        if (tickers !== void 0 && !Array.isArray(tickers)) {
          return finish(json({ error: "TICKERS_MUST_BE_ARRAY" }, 400, corsHeaders));
        }
        const resp = await convexRelay({
          action: "set-notification-config",
          userId: session.userId,
          variant,
          enabled,
          eventTypes,
          sensitivity,
          channels,
          aiDigestEnabled,
          digestMode,
          digestHour,
          digestTimezone,
          countries,
          tickers
        });
        if (!resp.ok) {
          if (resp.status === 400 || resp.status === 402) {
            const text = await resp.text().catch(() => "");
            let payload = { error: "Validation failed" };
            if (text) {
              try {
                payload = JSON.parse(text);
              } catch {
              }
            }
            return finish(json(payload, resp.status, corsHeaders));
          }
          console.error("[notification-channels] POST set-notification-config relay error:", resp.status);
          return finish(json({ error: "Operation failed" }, 500, corsHeaders));
        }
        return finish(json({ ok: true }, 200, corsHeaders));
      }
      return finish(json({ error: "Unknown action" }, 400, corsHeaders));
    } catch (err) {
      console.error("[notification-channels] POST error:", err);
      captureEdgeException(err, { handler: "notification-channels", method: "POST" }, ctx);
      return finish(json({ error: "Operation failed" }, 500, corsHeaders));
    }
  }
  return json({ error: "Method not allowed" }, 405, corsHeaders);
}
export {
  config,
  handler as default
};
