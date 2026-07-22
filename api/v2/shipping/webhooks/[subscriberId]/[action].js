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

// api/_session.js
var SESSION_TTL_MS = 12 * 60 * 60 * 1e3;
var PREFIX = "wms_";
var enc = new TextEncoder();
function getSecret() {
  const s = process.env.WM_SESSION_SECRET;
  if (!s || s.length < 32) {
    throw new Error("WM_SESSION_SECRET must be set (min 32 chars)");
  }
  return s;
}
async function importHmacKey() {
  return crypto.subtle.importKey(
    "raw",
    enc.encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
}
function bufferToBase64Url(buf) {
  const bytes = new Uint8Array(buf);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function base64UrlToBytes(s) {
  const pad = (4 - s.length % 4) % 4;
  const b64 = (s + "=".repeat(pad)).replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}
function base64UrlToString(s) {
  const bytes = base64UrlToBytes(s);
  return new TextDecoder().decode(bytes);
}
function isSessionTokenShape(token) {
  return typeof token === "string" && token.startsWith(PREFIX);
}
async function validateSessionToken(token) {
  if (!isSessionTokenShape(token)) return false;
  const tail = token.slice(PREFIX.length);
  const dot = tail.indexOf(".");
  if (dot < 0) return false;
  const body = tail.slice(0, dot);
  const sig = tail.slice(dot + 1);
  if (!body || !sig) return false;
  let key;
  try {
    key = await importHmacKey();
  } catch {
    return false;
  }
  let expectedBuf;
  try {
    expectedBuf = await crypto.subtle.sign("HMAC", key, enc.encode(body));
  } catch {
    return false;
  }
  let providedBytes;
  try {
    providedBytes = base64UrlToBytes(sig);
  } catch {
    return false;
  }
  if (bufferToBase64Url(providedBytes.buffer) !== sig) return false;
  const expected = new Uint8Array(expectedBuf);
  if (expected.length !== providedBytes.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected[i] ^ providedBytes[i];
  if (diff !== 0) return false;
  let payload;
  try {
    payload = JSON.parse(base64UrlToString(body));
  } catch {
    return false;
  }
  if (typeof payload.exp !== "number") return false;
  if (!Number.isFinite(payload.exp)) return false;
  if (Date.now() >= payload.exp) return false;
  return true;
}

// api/_crypto.js
async function timingSafeIncludes(candidate, validKeys) {
  if (!candidate || !validKeys.length) return false;
  const enc2 = new TextEncoder();
  const candidateHash = await crypto.subtle.digest("SHA-256", enc2.encode(candidate));
  const candidateBytes = new Uint8Array(candidateHash);
  let found = false;
  for (const k of validKeys) {
    const kHash = await crypto.subtle.digest("SHA-256", enc2.encode(k));
    const kBytes = new Uint8Array(kHash);
    let diff = 0;
    for (let i = 0; i < kBytes.length; i++) diff |= candidateBytes[i] ^ kBytes[i];
    if (diff === 0) found = true;
  }
  return found;
}

// api/_api-key.js
var USER_API_KEY_GATEWAY_VALIDATION_ERROR = "User API key requires gateway validation";
var DESKTOP_ORIGIN_PATTERNS = [
  /^https?:\/\/tauri\.localhost(:\d+)?$/,
  /^https?:\/\/[a-z0-9-]+\.tauri\.localhost(:\d+)?$/i,
  /^tauri:\/\/localhost$/,
  /^asset:\/\/localhost$/
];
function isDesktopOrigin(origin) {
  return Boolean(origin) && DESKTOP_ORIGIN_PATTERNS.some((p) => p.test(origin));
}
function getHeaderApiKey(req) {
  return req.headers.get("X-WorldMonitor-Key") || req.headers.get("X-Api-Key") || "";
}
async function isValidEnterpriseKey(key) {
  if (!key) return false;
  const validKeys = (process.env.WORLDMONITOR_VALID_KEYS || "").split(",").filter(Boolean);
  return timingSafeIncludes(key, validKeys);
}
function getCookie(req, name) {
  const raw = req.headers.get("Cookie") || req.headers.get("cookie") || "";
  if (!raw) return "";
  const prefix = `${name}=`;
  for (const part of raw.split(";")) {
    const trimmed = part.trim();
    if (!trimmed.startsWith(prefix)) continue;
    try {
      return decodeURIComponent(trimmed.slice(prefix.length));
    } catch {
      return trimmed.slice(prefix.length);
    }
  }
  return "";
}
async function validateApiKey(req, options = {}) {
  const forceKey = options.forceKey === true;
  const headerKey = getHeaderApiKey(req);
  const sessionCookie = getCookie(req, "wm-session");
  const testerCookie = getCookie(req, "wm-pro-key") || getCookie(req, "wm-widget-key");
  const key = headerKey || testerCookie || sessionCookie;
  const origin = req.headers.get("Origin") || "";
  if (isDesktopOrigin(origin)) {
    if (!headerKey) return { valid: false, required: true, error: "API key required for desktop access" };
    if (!await isValidEnterpriseKey(headerKey)) return { valid: false, required: true, error: "Invalid API key" };
    return { valid: true, required: true, kind: "enterprise" };
  }
  if (isSessionTokenShape(key)) {
    if (forceKey) {
      return { valid: false, required: true, error: "Pro authentication required" };
    }
    if (await validateSessionToken(key)) {
      return { valid: true, required: false, kind: "session" };
    }
    return { valid: false, required: true, error: "Invalid session token" };
  }
  if (key && await isValidEnterpriseKey(key)) {
    return { valid: true, required: true, kind: "enterprise" };
  }
  if (key && key.startsWith("wm_")) {
    return { valid: false, required: true, error: USER_API_KEY_GATEWAY_VALIDATION_ERROR };
  }
  if (key) {
    return { valid: false, required: true, error: "Invalid API key" };
  }
  return { valid: false, required: true, error: "API key required" };
}

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

// server/auth-session.ts
var CLERK_JWT_ISSUER_DOMAIN = process.env.CLERK_JWT_ISSUER_DOMAIN ?? "";
var CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY ?? "";
var PLAN_CACHE_TTL_MS = 5 * 60 * 1e3;

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
var ENV_PREFIX = process.env.DODO_PAYMENTS_ENVIRONMENT === "live_mode" ? "live" : "test";

// server/_shared/mcp-internal-hmac.ts
var INTERNAL_MCP_TIMESTAMP_WINDOW_SECONDS = 30;
var INTERNAL_MCP_REPLAY_CACHE_TTL_SECONDS = 2 * INTERNAL_MCP_TIMESTAMP_WINDOW_SECONDS + 5;

// server/_shared/premium-check.ts
async function isCallerPremium(_request) {
  return true;
}

// server/_shared/chokepoint-registry.ts
var CHOKEPOINT_REGISTRY = [
  {
    id: "suez",
    displayName: "Suez Canal",
    geoId: "suez",
    relayName: "Suez Canal",
    portwatchName: "Suez Canal",
    corridorRiskName: "Suez",
    baselineId: "suez",
    shockModelSupported: true,
    routeIds: ["china-europe-suez", "china-us-east-suez", "gulf-europe-oil", "qatar-europe-lng", "singapore-med", "india-europe"],
    lat: 30.5,
    lon: 32.3
  },
  {
    id: "malacca_strait",
    displayName: "Strait of Malacca",
    geoId: "malacca_strait",
    relayName: "Malacca Strait",
    portwatchName: "Malacca Strait",
    corridorRiskName: "Malacca",
    baselineId: "malacca",
    shockModelSupported: true,
    routeIds: ["china-europe-suez", "china-us-east-suez", "gulf-asia-oil", "qatar-asia-lng", "india-se-asia", "china-africa", "cpec-route"],
    lat: 2.5,
    lon: 101.5
  },
  {
    id: "hormuz_strait",
    displayName: "Strait of Hormuz",
    geoId: "hormuz_strait",
    relayName: "Strait of Hormuz",
    portwatchName: "Strait of Hormuz",
    corridorRiskName: "Hormuz",
    baselineId: "hormuz",
    shockModelSupported: true,
    routeIds: ["gulf-europe-oil", "gulf-asia-oil", "qatar-europe-lng", "qatar-asia-lng", "gulf-americas-cape"],
    lat: 26.5,
    lon: 56.5
  },
  {
    id: "bab_el_mandeb",
    displayName: "Bab el-Mandeb",
    geoId: "bab_el_mandeb",
    relayName: "Bab el-Mandeb Strait",
    portwatchName: "Bab el-Mandeb Strait",
    corridorRiskName: "Bab el-Mandeb",
    baselineId: "babelm",
    shockModelSupported: true,
    routeIds: ["china-europe-suez", "china-us-east-suez", "gulf-europe-oil", "qatar-europe-lng", "singapore-med", "india-europe"],
    lat: 12.5,
    lon: 43.3
  },
  {
    id: "panama",
    displayName: "Panama Canal",
    geoId: "panama",
    relayName: "Panama Canal",
    portwatchName: "Panama Canal",
    corridorRiskName: "Panama",
    baselineId: "panama",
    shockModelSupported: false,
    routeIds: ["china-us-east-panama", "panama-transit"],
    lat: 9.1,
    lon: -79.7
  },
  {
    id: "taiwan_strait",
    displayName: "Taiwan Strait",
    geoId: "taiwan_strait",
    relayName: "Taiwan Strait",
    portwatchName: "Taiwan Strait",
    corridorRiskName: "Taiwan",
    baselineId: null,
    shockModelSupported: false,
    routeIds: ["china-us-west", "intra-asia-container"],
    lat: 24,
    lon: 119.5
  },
  {
    id: "cape_of_good_hope",
    displayName: "Cape of Good Hope",
    geoId: "cape_of_good_hope",
    relayName: "Cape of Good Hope",
    portwatchName: "Cape of Good Hope",
    corridorRiskName: "Cape of Good Hope",
    baselineId: null,
    shockModelSupported: false,
    routeIds: ["brazil-china-bulk", "gulf-americas-cape", "asia-europe-cape"],
    lat: -34.36,
    lon: 18.49
  },
  {
    id: "gibraltar",
    displayName: "Strait of Gibraltar",
    geoId: "gibraltar",
    relayName: "Gibraltar Strait",
    portwatchName: "Gibraltar Strait",
    corridorRiskName: null,
    baselineId: null,
    shockModelSupported: false,
    routeIds: ["gulf-europe-oil", "singapore-med", "india-europe", "asia-europe-cape"],
    lat: 35.9,
    lon: -5.6
  },
  {
    id: "bosphorus",
    displayName: "Bosporus Strait",
    geoId: "bosphorus",
    relayName: "Bosporus Strait",
    portwatchName: "Bosporus Strait",
    corridorRiskName: null,
    baselineId: "turkish",
    shockModelSupported: false,
    routeIds: ["russia-med-oil"],
    lat: 41.1,
    lon: 29
  },
  {
    id: "korea_strait",
    displayName: "Korea Strait",
    geoId: "korea_strait",
    relayName: "Korea Strait",
    portwatchName: "Korea Strait",
    corridorRiskName: null,
    baselineId: null,
    shockModelSupported: false,
    routeIds: [],
    lat: 34,
    lon: 129
  },
  {
    id: "dover_strait",
    displayName: "Dover Strait",
    geoId: "dover_strait",
    relayName: "Dover Strait",
    portwatchName: "Dover Strait",
    corridorRiskName: null,
    baselineId: "danish",
    shockModelSupported: false,
    routeIds: [],
    lat: 51,
    lon: 1.5
  },
  {
    id: "kerch_strait",
    displayName: "Kerch Strait",
    geoId: "kerch_strait",
    relayName: "Kerch Strait",
    portwatchName: "Kerch Strait",
    corridorRiskName: null,
    baselineId: null,
    shockModelSupported: false,
    routeIds: [],
    lat: 45.3,
    lon: 36.6
  },
  {
    id: "lombok_strait",
    displayName: "Lombok Strait",
    geoId: "lombok_strait",
    relayName: "Lombok Strait",
    portwatchName: "Lombok Strait",
    corridorRiskName: null,
    baselineId: null,
    shockModelSupported: false,
    routeIds: [],
    lat: -8.5,
    lon: 115.7
  }
];
var CANONICAL_CHOKEPOINT_IDS = new Set(CHOKEPOINT_REGISTRY.map((c) => c.id));
var SHOCK_MODEL_CHOKEPOINTS = CHOKEPOINT_REGISTRY.filter((c) => c.shockModelSupported);

// server/worldmonitor/shipping/v2/webhook-shared.ts
var WEBHOOK_TTL = 86400 * 30;
var VALID_CHOKEPOINT_IDS = new Set(CHOKEPOINT_REGISTRY.map((c) => c.id));
async function generateSecret() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}
function webhookKey(subscriberId) {
  return `webhook:sub:${subscriberId}:v1`;
}
async function callerFingerprint(req) {
  const key = req.headers.get("X-WorldMonitor-Key") ?? req.headers.get("X-Api-Key") ?? "";
  if (!key) return "anon";
  const encoded = new TextEncoder().encode(key);
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(hashBuffer)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

// api/v2/shipping/webhooks/[subscriberId]/[action].ts
var config = { runtime: "edge" };
async function handler(req) {
  const cors = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...cors, "Content-Type": "application/json" }
    });
  }
  const apiKeyResult = await validateApiKey(req, { forceKey: true });
  if (apiKeyResult.required && !apiKeyResult.valid) {
    return new Response(JSON.stringify({ error: apiKeyResult.error ?? "API key required" }), {
      status: 401,
      headers: { ...cors, "Content-Type": "application/json" }
    });
  }
  const isPro = await isCallerPremium(req);
  if (!isPro) {
    return new Response(JSON.stringify({ error: "PRO subscription required" }), {
      status: 403,
      headers: { ...cors, "Content-Type": "application/json" }
    });
  }
  const url = new URL(req.url);
  const parts = url.pathname.replace(/\/+$/, "").split("/");
  const action = parts[parts.length - 1];
  const subscriberId = parts[parts.length - 2];
  if (!subscriberId || !subscriberId.startsWith("wh_")) {
    return new Response(JSON.stringify({ error: "Webhook not found" }), {
      status: 404,
      headers: { ...cors, "Content-Type": "application/json" }
    });
  }
  if (action !== "rotate-secret" && action !== "reactivate") {
    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { ...cors, "Content-Type": "application/json" }
    });
  }
  const record = await getCachedJson(webhookKey(subscriberId)).catch(() => null);
  if (!record) {
    return new Response(JSON.stringify({ error: "Webhook not found" }), {
      status: 404,
      headers: { ...cors, "Content-Type": "application/json" }
    });
  }
  const ownerHash = await callerFingerprint(req);
  if (record.ownerTag !== ownerHash) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { ...cors, "Content-Type": "application/json" }
    });
  }
  if (action === "rotate-secret") {
    const newSecret = await generateSecret();
    await setCachedJson(webhookKey(subscriberId), { ...record, secret: newSecret }, WEBHOOK_TTL);
    return new Response(
      JSON.stringify({ subscriberId, secret: newSecret, rotatedAt: (/* @__PURE__ */ new Date()).toISOString() }),
      { status: 200, headers: { ...cors, "Content-Type": "application/json" } }
    );
  }
  await setCachedJson(webhookKey(subscriberId), { ...record, active: true }, WEBHOOK_TTL);
  return new Response(JSON.stringify({ subscriberId, active: true }), {
    status: 200,
    headers: { ...cors, "Content-Type": "application/json" }
  });
}
export {
  config,
  handler as default
};
