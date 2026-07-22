// api/cache-purge.js
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
async function timingSafeIncludes(candidate, validKeys) {
  if (!candidate || !validKeys.length) return false;
  const enc = new TextEncoder();
  const candidateHash = await crypto.subtle.digest("SHA-256", enc.encode(candidate));
  const candidateBytes = new Uint8Array(candidateHash);
  let found = false;
  for (const k of validKeys) {
    const kHash = await crypto.subtle.digest("SHA-256", enc.encode(k));
    const kBytes = new Uint8Array(kHash);
    let diff = 0;
    for (let i = 0; i < kBytes.length; i++) diff |= candidateBytes[i] ^ kBytes[i];
    if (diff === 0) found = true;
  }
  return found;
}
async function timingSafeEqualSecret(candidate, expected) {
  if (!candidate || !expected) return false;
  return timingSafeIncludes(candidate, [expected]);
}
function getRedisCredentials() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return { url, token };
}
var config = { runtime: "edge" };
var MAX_EXPLICIT_KEYS = 20;
var MAX_PATTERNS = 3;
var MAX_DELETIONS = 200;
var MAX_SCAN_ITERATIONS = 5;
var BLOCKLIST_PREFIXES = ["rl:", "__"];
var DURABLE_DATA_PREFIXES = ["military:bases:", "conflict:iran-events:", "conflict:ucdp-events:"];
function getKeyPrefix() {
  const env = process.env.VERCEL_ENV;
  if (!env || env === "production") return "";
  const sha = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 8) || "dev";
  return `${env}:${sha}:`;
}
function isBlocklisted(key) {
  return BLOCKLIST_PREFIXES.some((p) => key.startsWith(p));
}
function isDurableData(key) {
  return DURABLE_DATA_PREFIXES.some((p) => key.startsWith(p));
}
async function redisPipeline(commands) {
  const creds = getRedisCredentials();
  if (!creds) throw new Error("Redis not configured");
  const resp = await fetch(`${creds.url}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${creds.token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(commands),
    signal: AbortSignal.timeout(1e4)
  });
  if (!resp.ok) throw new Error(`Redis pipeline HTTP ${resp.status}`);
  return resp.json();
}
async function redisScan(pattern, maxIterations) {
  const creds = getRedisCredentials();
  if (!creds) throw new Error("Redis not configured");
  const keys = [];
  let cursor = "0";
  let truncated = false;
  for (let i = 0; i < maxIterations; i++) {
    const resp = await fetch(
      `${creds.url}/scan/${encodeURIComponent(cursor)}/MATCH/${encodeURIComponent(pattern)}/COUNT/100`,
      {
        headers: { Authorization: `Bearer ${creds.token}` },
        signal: AbortSignal.timeout(5e3)
      }
    );
    if (!resp.ok) throw new Error(`Redis SCAN HTTP ${resp.status}`);
    const data = await resp.json();
    const [nextCursor, batch] = data.result;
    if (batch?.length) keys.push(...batch);
    cursor = String(nextCursor);
    if (cursor === "0") break;
    if (i === maxIterations - 1) truncated = true;
  }
  return { keys, truncated };
}
async function handler(req) {
  const corsHeaders = getCorsHeaders(req, "POST, OPTIONS");
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405, corsHeaders);
  }
  const auth = req.headers.get("authorization") || "";
  const secret = process.env.RELAY_SHARED_SECRET;
  if (!secret || !await timingSafeEqualSecret(auth, `Bearer ${secret}`)) {
    return jsonResponse({ error: "Unauthorized" }, 401, corsHeaders);
  }
  let body;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 422, corsHeaders);
  }
  const { keys: explicitKeys, patterns, dryRun = false } = body || {};
  const hasKeys = Array.isArray(explicitKeys) && explicitKeys.length > 0;
  const hasPatterns = Array.isArray(patterns) && patterns.length > 0;
  if (!hasKeys && !hasPatterns) {
    return jsonResponse({ error: 'At least one of "keys" or "patterns" required' }, 422, corsHeaders);
  }
  if (hasKeys && explicitKeys.length > MAX_EXPLICIT_KEYS) {
    return jsonResponse({ error: `"keys" exceeds max of ${MAX_EXPLICIT_KEYS}` }, 422, corsHeaders);
  }
  if (hasPatterns && patterns.length > MAX_PATTERNS) {
    return jsonResponse({ error: `"patterns" exceeds max of ${MAX_PATTERNS}` }, 422, corsHeaders);
  }
  if (hasPatterns) {
    for (const p of patterns) {
      if (typeof p !== "string" || !p.endsWith("*") || p === "*") {
        return jsonResponse({ error: `Invalid pattern "${p}": must end with "*" and cannot be bare "*"` }, 422, corsHeaders);
      }
    }
  }
  const prefix = getKeyPrefix();
  const allKeys = /* @__PURE__ */ new Set();
  let truncated = false;
  if (hasKeys) {
    for (const k of explicitKeys) {
      if (typeof k !== "string" || !k) continue;
      if (isBlocklisted(k)) continue;
      allKeys.add(k);
    }
  }
  if (hasPatterns) {
    for (const p of patterns) {
      const prefixedPattern = prefix ? `${prefix}${p}` : p;
      const scan = await redisScan(prefixedPattern, MAX_SCAN_ITERATIONS);
      if (scan.truncated) truncated = true;
      for (const rawKey of scan.keys) {
        const unprefixed = prefix && rawKey.startsWith(prefix) ? rawKey.slice(prefix.length) : rawKey;
        if (isBlocklisted(unprefixed)) continue;
        if (isDurableData(unprefixed)) continue;
        allKeys.add(unprefixed);
      }
    }
  }
  const keyList = [...allKeys].slice(0, MAX_DELETIONS);
  if (keyList.length < allKeys.size) truncated = true;
  const ip = req.headers.get("x-real-ip") || req.headers.get("cf-connecting-ip") || "unknown";
  const ts = (/* @__PURE__ */ new Date()).toISOString();
  if (dryRun) {
    console.log("[cache-purge]", { mode: "dry-run", matched: keyList.length, deleted: 0, truncated, dryRun: true, ip, ts });
    return jsonResponse({ matched: keyList.length, deleted: 0, keys: keyList, dryRun: true, truncated }, 200, corsHeaders);
  }
  if (keyList.length === 0) {
    console.log("[cache-purge]", { mode: "purge", matched: 0, deleted: 0, truncated, dryRun: false, ip, ts });
    return jsonResponse({ matched: 0, deleted: 0, keys: [], dryRun: false, truncated }, 200, corsHeaders);
  }
  let deleted = 0;
  try {
    const commands = keyList.map((k) => ["DEL", prefix ? `${prefix}${k}` : k]);
    const results = await redisPipeline(commands);
    deleted = results.reduce((sum, r) => sum + (r.result || 0), 0);
  } catch (err) {
    console.log("[cache-purge]", { mode: "purge-error", matched: keyList.length, error: err.message, ip, ts });
    return jsonResponse({ error: "Redis pipeline failed" }, 502, corsHeaders);
  }
  console.log("[cache-purge]", { mode: "purge", matched: keyList.length, deleted, truncated, dryRun: false, ip, ts });
  return jsonResponse({ matched: keyList.length, deleted, keys: keyList, dryRun: false, truncated }, 200, corsHeaders);
}
export {
  config,
  handler as default
};
