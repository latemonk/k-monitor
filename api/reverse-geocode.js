// api/reverse-geocode.js
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
async function readJsonFromUpstash(key, timeoutMs = 3e3) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  const resp = await fetch(`${url}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(timeoutMs)
  });
  if (!resp.ok) return null;
  const data = await resp.json();
  if (!data.result) return null;
  try {
    return unwrapEnvelope(JSON.parse(data.result)).data;
  } catch {
    return null;
  }
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
async function setCachedData(key, value, ttlSeconds) {
  const results = await redisPipeline([
    ["SET", key, JSON.stringify(value), "EX", String(ttlSeconds)]
  ]);
  return results !== null;
}
var config = { runtime: "edge" };
var NOMINATIM_BASE = "https://nominatim.openstreetmap.org/reverse";
var CHROME_UA = "WorldMonitor/2.0 (https://worldmonitor.app)";
async function handler(req, ctx) {
  if (isDisallowedOrigin(req))
    return new Response("Forbidden", { status: 403 });
  const cors = getCorsHeaders(req);
  if (req.method === "OPTIONS")
    return new Response(null, { status: 204, headers: cors });
  const url = new URL(req.url);
  const lat = url.searchParams.get("lat");
  const lon = url.searchParams.get("lon");
  const latN = Number(lat);
  const lonN = Number(lon);
  if (!lat || !lon || Number.isNaN(latN) || Number.isNaN(lonN) || latN < -90 || latN > 90 || lonN < -180 || lonN > 180) {
    return jsonResponse({ error: "valid lat (-90..90) and lon (-180..180) required" }, 400, cors);
  }
  const cacheKey = `geocode:${latN.toFixed(1)},${lonN.toFixed(1)}`;
  const cached = await readJsonFromUpstash(cacheKey, 1500);
  if (cached) {
    return new Response(JSON.stringify(cached), {
      status: 200,
      headers: {
        ...cors,
        "Content-Type": "application/json",
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=3600"
      }
    });
  }
  try {
    const resp = await fetch(
      `${NOMINATIM_BASE}?lat=${latN}&lon=${lonN}&format=json&zoom=3&accept-language=en`,
      {
        headers: { "User-Agent": CHROME_UA, Accept: "application/json" },
        signal: AbortSignal.timeout(8e3)
      }
    );
    if (!resp.ok) {
      return jsonResponse({ error: `Nominatim ${resp.status}` }, 502, cors);
    }
    const data = await resp.json();
    const country = data.address?.country;
    const code = data.address?.country_code?.toUpperCase();
    const result = { country: country || null, code: code || null, displayName: data.display_name || country || "" };
    const body = JSON.stringify(result);
    if (country && code) {
      ctx.waitUntil(setCachedData(cacheKey, result, 604800));
    }
    return new Response(body, {
      status: 200,
      headers: {
        ...cors,
        "Content-Type": "application/json",
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=3600"
      }
    });
  } catch (err) {
    return jsonResponse({ error: "Nominatim request failed" }, 502, cors);
  }
}
export {
  config,
  handler as default
};
