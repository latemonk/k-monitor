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

// server/_shared/sidecar-cache.ts
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
  const json = JSON.stringify(value);
  const size = json.length * 2;
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
    value: json,
    expiresAt: Date.now() + clamped * 1e3,
    size
  });
  totalBytes += size;
  startSweepIfNeeded();
}
function sidecarCacheStats() {
  return { entries: store.size, bytes: totalBytes, hits: hitCount, misses: missCount };
}
var MAX_ENTRIES, MAX_BYTES, MAX_SINGLE_VALUE_BYTES, MIN_TTL_S, MAX_TTL_S, SWEEP_INTERVAL_MS, store, totalBytes, sweepTimer, hitCount, missCount;
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

// api/_mcp-grant-hmac.ts
var ENC = new TextEncoder();
var DEC = new TextDecoder();
var GrantConfigError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "GrantConfigError";
  }
};
function base64UrlDecode(s) {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - s.length % 4);
  const b64 = (s + pad).replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
async function importHmacKey(secret) {
  return crypto.subtle.importKey(
    "raw",
    ENC.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}
function readGrantSecret(env = process.env) {
  const secret = env.MCP_PRO_GRANT_HMAC_SECRET ?? "";
  if (!secret) {
    try {
      const mcpKeys = Object.keys(env).filter((k) => k.startsWith("MCP_")).sort();
      console.warn(
        `[mcp-grant-hmac] DIAGNOSTIC missing-secret: process.env MCP_* keys = ${mcpKeys.length === 0 ? "<NONE>" : mcpKeys.join(", ")}`
      );
    } catch {
    }
    throw new GrantConfigError("MCP_PRO_GRANT_HMAC_SECRET is not set");
  }
  return secret;
}
async function verifyGrant(token, secret, now = Date.now()) {
  if (typeof token !== "string" || token.length === 0) return { ok: false, reason: "malformed" };
  const dot = token.indexOf(".");
  if (dot <= 0 || dot === token.length - 1) return { ok: false, reason: "malformed" };
  const payloadB64 = token.slice(0, dot);
  const sigB64 = token.slice(dot + 1);
  if (!/^[A-Za-z0-9_-]+$/.test(payloadB64) || !/^[A-Za-z0-9_-]+$/.test(sigB64)) {
    return { ok: false, reason: "malformed" };
  }
  let payloadBytes;
  let sigBytes;
  try {
    payloadBytes = base64UrlDecode(payloadB64);
    sigBytes = base64UrlDecode(sigB64);
  } catch {
    return { ok: false, reason: "malformed" };
  }
  const sec = secret ?? readGrantSecret();
  const key = await importHmacKey(sec);
  const ok = await crypto.subtle.verify("HMAC", key, sigBytes, payloadBytes);
  if (!ok) return { ok: false, reason: "bad-signature" };
  let payload;
  try {
    payload = JSON.parse(DEC.decode(payloadBytes));
  } catch {
    return { ok: false, reason: "invalid-payload" };
  }
  if (!payload || typeof payload !== "object") return { ok: false, reason: "invalid-payload" };
  const p = payload;
  if (typeof p.userId !== "string" || p.userId.length === 0) return { ok: false, reason: "invalid-payload" };
  if (typeof p.nonce !== "string" || p.nonce.length === 0) return { ok: false, reason: "invalid-payload" };
  if (typeof p.exp !== "number" || !Number.isFinite(p.exp)) return { ok: false, reason: "invalid-payload" };
  if (p.exp <= now) return { ok: false, reason: "expired" };
  return { ok: true, payload: { userId: p.userId, nonce: p.nonce, exp: p.exp } };
}

// server/_shared/seed-envelope.ts
function unwrapEnvelope(raw) {
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

// server/_shared/usage.ts
var AXIOM_DATASET = "wm_api_usage";
var AXIOM_INGEST_URL = `https://api.axiom.co/v1/datasets/${AXIOM_DATASET}/ingest`;
var CB_WINDOW_MS = 5 * 60 * 1e3;

// server/_shared/redis.ts
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
      value: unwrapEnvelope(JSON.parse(data.result)).data
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

// server/_shared/entitlement-check.ts
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

// server/_shared/pro-mcp-token.ts
var NEG_TTL_SECONDS = 60;
var CONVEX_TIMEOUT_MS = 3e3;
var NEG_CACHE_KEY_PREFIX = "pro-mcp-token-neg:";
var NEG_SENTINEL_VALUE = "1";
var ProMcpIssueFailed = class extends Error {
  kind;
  status;
  constructor(kind, message, status) {
    super(message);
    this.name = "ProMcpIssueFailed";
    this.kind = kind;
    this.status = status;
  }
};
function getConvexEnv() {
  const siteUrl = process.env.CONVEX_SITE_URL;
  const sharedSecret = process.env.CONVEX_SERVER_SHARED_SECRET;
  if (!siteUrl || !sharedSecret) return null;
  return { siteUrl, sharedSecret };
}
function convexHeaders(sharedSecret) {
  return {
    "Content-Type": "application/json",
    "User-Agent": "worldmonitor-gateway/1.0",
    "x-convex-shared-secret": sharedSecret
  };
}
var REDIS_OP_TIMEOUT_MS2 = 1500;
function negCacheKey(tokenId) {
  return `${NEG_CACHE_KEY_PREFIX}${tokenId}`;
}
async function writeNegCache(tokenId) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return;
  try {
    await fetch(
      `${url}/set/${encodeURIComponent(negCacheKey(tokenId))}/${encodeURIComponent(NEG_SENTINEL_VALUE)}/EX/${NEG_TTL_SECONDS}`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(REDIS_OP_TIMEOUT_MS2)
      }
    );
  } catch (err) {
    console.warn("[pro-mcp-token] writeNegCache failed:", err instanceof Error ? err.message : String(err));
  }
}
async function issueProMcpTokenForUser(userId, clientId, name) {
  const env = getConvexEnv();
  if (!env) {
    throw new ProMcpIssueFailed(
      "config",
      "CONVEX_SITE_URL or CONVEX_SERVER_SHARED_SECRET not configured"
    );
  }
  let resp;
  try {
    resp = await fetch(`${env.siteUrl}/api/internal-issue-pro-mcp-token`, {
      method: "POST",
      headers: convexHeaders(env.sharedSecret),
      body: JSON.stringify({ userId, clientId, name }),
      signal: AbortSignal.timeout(CONVEX_TIMEOUT_MS)
    });
  } catch (err) {
    throw new ProMcpIssueFailed(
      "network",
      `Convex issue request failed: ${err instanceof Error ? err.message : String(err)}`
    );
  }
  if (resp.ok) {
    const data = await resp.json().catch(() => null);
    if (!data || typeof data.tokenId !== "string" || !data.tokenId) {
      throw new ProMcpIssueFailed("network", "Convex issue response missing tokenId", resp.status);
    }
    return { tokenId: data.tokenId };
  }
  if (resp.status === 403) {
    throw new ProMcpIssueFailed("pro-required", "Pro entitlement required to issue MCP token", 403);
  }
  if (resp.status === 400) {
    throw new ProMcpIssueFailed("invalid-user-id", "Invalid userId for Pro MCP token issue", 400);
  }
  throw new ProMcpIssueFailed(
    "network",
    `Convex issue returned HTTP ${resp.status}`,
    resp.status
  );
}
async function revokeProMcpToken(userId, tokenId) {
  if (!userId || !tokenId) return { ok: false, reason: "not-found" };
  const env = getConvexEnv();
  if (!env) return { ok: false, reason: "config" };
  let resp;
  try {
    resp = await fetch(`${env.siteUrl}/api/internal-revoke-pro-mcp-token`, {
      method: "POST",
      headers: convexHeaders(env.sharedSecret),
      body: JSON.stringify({ userId, tokenId }),
      signal: AbortSignal.timeout(CONVEX_TIMEOUT_MS)
    });
  } catch (err) {
    console.warn(
      "[pro-mcp-token] revokeProMcpToken Convex fetch failed:",
      err instanceof Error ? err.message : String(err)
    );
    return { ok: false, reason: "network" };
  }
  if (resp.ok) {
    await writeNegCache(tokenId);
    return { ok: true };
  }
  if (resp.status === 404) return { ok: false, reason: "not-found" };
  if (resp.status === 409) return { ok: false, reason: "already-revoked" };
  return { ok: false, reason: "network" };
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

// api/_sentry-edge.js
var captureSilentError = makeCaptureSilentError({
  runtime: "edge",
  platform: "javascript",
  logPrefix: "[sentry-edge]"
});

// api/oauth/authorize-pro.ts
var config = { runtime: "edge" };
var CODE_TTL_SECONDS = 600;
var PAGE_HEADERS = {
  "Content-Type": "text/html; charset=utf-8",
  "X-Frame-Options": "DENY",
  "Cache-Control": "no-store",
  Pragma: "no-cache"
};
var GLOBE_SVG = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>';
function escapeHtml(str) {
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;");
}
function htmlError(title, detail, status = 400) {
  return new Response(
    `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Error &#x2014; WorldMonitor MCP</title>
<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:ui-monospace,'SF Mono','Cascadia Code',monospace;background:#0a0a0a;color:#e8e8e8;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:1.5rem}.wm-logo{display:flex;align-items:center;gap:.5rem;margin-bottom:2rem;text-decoration:none}.wm-logo svg{color:#2d8a6e}.wm-logo-text{font-size:.75rem;color:#555;letter-spacing:.1em;text-transform:uppercase}.card{width:100%;max-width:420px;background:#111;border:1px solid #1e1e1e;padding:2rem}h1{font-size:.95rem;font-weight:600;color:#ef4444;margin-bottom:.75rem;letter-spacing:.02em}p{font-size:.85rem;color:#666;line-height:1.6}.back{display:inline-block;margin-top:1.5rem;font-size:.75rem;color:#444;text-decoration:none;letter-spacing:.03em}.back:hover{color:#888}.footer{margin-top:1.5rem;font-size:.7rem;color:#2a2a2a;text-align:center}.footer a{color:#333;text-decoration:none}.footer a:hover{color:#555}</style></head>
<body><a href="https://www.worldmonitor.app" class="wm-logo" target="_blank" rel="noopener">${GLOBE_SVG}<span class="wm-logo-text">WorldMonitor MCP</span></a>
<div class="card"><h1>${escapeHtml(title)}</h1><p>${escapeHtml(detail)}</p><a href="javascript:history.back()" class="back">&#8592; go back</a></div>
<p class="footer"><a href="https://www.worldmonitor.app" target="_blank" rel="noopener">worldmonitor.app</a></p>
</body></html>`,
    { status, headers: PAGE_HEADERS }
  );
}
async function rawRedisGetDel(key) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) throw new Error("Redis not configured");
  const resp = await fetch(`${url}/getdel/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(3e3)
  });
  if (!resp.ok) throw new Error(`Redis HTTP ${resp.status}`);
  const data = await resp.json();
  if (!data?.result) return null;
  try {
    return JSON.parse(data.result);
  } catch {
    return null;
  }
}
async function rawRedisGet(key) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) throw new Error("Redis not configured");
  const resp = await fetch(`${url}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(3e3)
  });
  if (!resp.ok) throw new Error(`Redis HTTP ${resp.status}`);
  const data = await resp.json();
  if (!data?.result) return null;
  try {
    return JSON.parse(data.result);
  } catch {
    return null;
  }
}
async function rawRedisSetEx(key, value, ttlSeconds) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return false;
  try {
    const resp = await fetch(`${url}/pipeline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify([["SET", key, JSON.stringify(value), "EX", ttlSeconds]]),
      signal: AbortSignal.timeout(3e3)
    });
    if (!resp.ok) return false;
    const results = await resp.json().catch(() => null);
    return Array.isArray(results) && results[0]?.result === "OK";
  } catch {
    return false;
  }
}
async function authorizeProHandler(req, deps) {
  if (req.method !== "GET") {
    return new Response(null, {
      status: 405,
      headers: { Allow: "GET", "Cache-Control": "no-store" }
    });
  }
  const url = new URL(req.url);
  const nonce = url.searchParams.get("nonce") ?? "";
  const grantToken = url.searchParams.get("grant") ?? "";
  if (!nonce || !grantToken) {
    return htmlError(
      "Invalid Authorization Request",
      "The authorization link is missing required parameters. Please start over from your dashboard."
    );
  }
  let verifyResult;
  try {
    verifyResult = await deps.verifyGrant(grantToken, void 0, deps.now());
  } catch (err) {
    if (err instanceof GrantConfigError) {
      console.warn("[authorize-pro] missing MCP_PRO_GRANT_HMAC_SECRET");
      return htmlError(
        "Service Unavailable",
        "Pro MCP authorization is temporarily unavailable. Please try again shortly.",
        500
      );
    }
    throw err;
  }
  if (!verifyResult.ok) {
    return htmlError(
      "Authorization Expired",
      "This authorization link is no longer valid. Please start over from your dashboard."
    );
  }
  const grantPayload = verifyResult.payload;
  if (grantPayload.nonce !== nonce) {
    return htmlError(
      "Authorization Mismatch",
      "This authorization link is no longer valid. Please start over from your dashboard."
    );
  }
  let grantRedis;
  try {
    grantRedis = await deps.redisGetDel(`mcp-grant:${nonce}`);
  } catch {
    return htmlError(
      "Service Unavailable",
      "Authorization service is temporarily unavailable. Please try again shortly.",
      503
    );
  }
  if (!grantRedis || typeof grantRedis.userId !== "string" || typeof grantRedis.exp !== "number") {
    return htmlError(
      "Authorization Expired",
      "This authorization link is no longer valid. Please start over from your dashboard."
    );
  }
  if (grantRedis.userId !== grantPayload.userId || grantRedis.exp !== grantPayload.exp) {
    return htmlError(
      "Authorization Mismatch",
      "This authorization link is no longer valid. Please start over from your dashboard."
    );
  }
  const userId = grantPayload.userId;
  let nonceData;
  try {
    nonceData = await deps.redisGetDel(`oauth:nonce:${nonce}`);
  } catch {
    return htmlError(
      "Service Unavailable",
      "Authorization service is temporarily unavailable. Please try again shortly.",
      503
    );
  }
  if (!nonceData || typeof nonceData.client_id !== "string" || typeof nonceData.redirect_uri !== "string" || typeof nonceData.code_challenge !== "string") {
    return htmlError(
      "Session Expired",
      "Your authorization session has expired. Please start over from your dashboard."
    );
  }
  const { client_id, redirect_uri, code_challenge } = nonceData;
  const state = typeof nonceData.state === "string" ? nonceData.state : "";
  let clientData;
  try {
    clientData = await deps.redisGet(`oauth:client:${client_id}`);
  } catch {
    return htmlError(
      "Service Unavailable",
      "Authorization service is temporarily unavailable. Please try again shortly.",
      503
    );
  }
  if (!clientData) {
    return htmlError(
      "Unknown Client",
      "The OAuth client registration has expired. Please re-register the client."
    );
  }
  const uris = Array.isArray(clientData.redirect_uris) ? clientData.redirect_uris : [];
  if (!uris.includes(redirect_uri)) {
    return htmlError(
      "Redirect URI Mismatch",
      "The redirect_uri does not match any registered redirect URI for this client."
    );
  }
  const ent = await deps.getEntitlements(userId);
  const now = deps.now();
  if (!ent || ent.features.tier < 1 || ent.features.mcpAccess !== true || ent.validUntil < now) {
    return htmlError(
      "Pro Subscription Required",
      "A WorldMonitor Pro subscription is required for this connection. Please subscribe and try again.",
      403
    );
  }
  const clientName = typeof clientData.client_name === "string" && clientData.client_name || "Unknown Client";
  let issueResult;
  try {
    issueResult = await deps.issueProMcpTokenForUser(userId, client_id, `Connected via ${clientName}`);
  } catch (err) {
    if (err instanceof ProMcpIssueFailed) {
      if (err.kind === "pro-required") {
        return htmlError(
          "Pro Subscription Required",
          "A WorldMonitor Pro subscription is required for this connection. Please subscribe and try again.",
          403
        );
      }
      if (err.kind === "invalid-user-id") {
        return htmlError(
          "Authorization Failed",
          "Could not complete authorization. Please sign out, sign in again, and try again.",
          400
        );
      }
      if (err.kind === "config") {
        console.warn("[authorize-pro] Convex config missing for issue helper");
        return htmlError(
          "Service Unavailable",
          "Pro MCP authorization is temporarily unavailable. Please try again shortly.",
          500
        );
      }
      return htmlError(
        "Service Unavailable",
        "Pro MCP authorization is temporarily unavailable. Please try again shortly.",
        503
      );
    }
    throw err;
  }
  const code = deps.randomCode();
  const codeData = {
    kind: "pro",
    userId,
    mcpTokenId: issueResult.tokenId,
    client_id,
    redirect_uri,
    code_challenge,
    scope: "mcp_pro"
  };
  let codeStored = false;
  try {
    codeStored = await deps.redisSetEx(`oauth:code:${code}`, codeData, CODE_TTL_SECONDS);
  } catch {
    codeStored = false;
  }
  if (!codeStored) {
    try {
      const rollback = await deps.revokeProMcpToken(userId, issueResult.tokenId);
      if (!rollback.ok) {
        console.warn(
          `[authorize-pro] orphaned mcpProTokens row ${issueResult.tokenId} for user ${userId}: revoke failed (${rollback.reason})`
        );
      }
    } catch (err) {
      console.warn(
        `[authorize-pro] revoke rollback unexpectedly threw for token ${issueResult.tokenId}:`,
        err instanceof Error ? err.message : String(err)
      );
      captureSilentError(err, {
        tags: { route: "api/oauth/authorize-pro", step: "rollback-revoke" }
      });
    }
    return htmlError(
      "Server Error",
      "Failed to store authorization code. Please try again.",
      500
    );
  }
  const redirectUrl = new URL(redirect_uri);
  redirectUrl.searchParams.set("code", code);
  if (state) redirectUrl.searchParams.set("state", state);
  return new Response(null, {
    status: 302,
    headers: {
      Location: redirectUrl.toString(),
      "Cache-Control": "no-store",
      Pragma: "no-cache"
    }
  });
}
async function handler(req) {
  return authorizeProHandler(req, {
    redisGetDel: rawRedisGetDel,
    redisGet: rawRedisGet,
    redisSetEx: rawRedisSetEx,
    verifyGrant,
    getEntitlements,
    issueProMcpTokenForUser,
    revokeProMcpToken,
    randomCode: () => crypto.randomUUID(),
    now: () => Date.now()
  });
}
export {
  authorizeProHandler,
  config,
  handler as default
};
