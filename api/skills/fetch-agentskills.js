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

// api/skills/fetch-agentskills.ts
var config = { runtime: "edge" };
var ALLOWED_AGENTSKILLS_HOSTS = /* @__PURE__ */ new Set(["agentskills.io", "www.agentskills.io", "api.agentskills.io"]);
async function handler(req) {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: { ...corsHeaders } });
  }
  if (req.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405, headers: corsHeaders });
  }
  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400, headers: corsHeaders });
  }
  const rawUrl = body.url ?? (body.id ? `https://agentskills.io/skills/${body.id}` : null);
  if (!rawUrl) {
    return Response.json({ error: "Provide url or id" }, { status: 400, headers: corsHeaders });
  }
  let skillUrl;
  try {
    skillUrl = new URL(rawUrl);
  } catch {
    return Response.json({ error: "Invalid URL" }, { status: 400, headers: corsHeaders });
  }
  if (!ALLOWED_AGENTSKILLS_HOSTS.has(skillUrl.hostname)) {
    return Response.json({ error: "Only agentskills.io URLs are supported." }, { status: 400, headers: corsHeaders });
  }
  let skillData;
  try {
    const res = await fetch(skillUrl.toString(), {
      headers: { "Accept": "application/json", "User-Agent": "WorldMonitor/1.0" },
      redirect: "manual",
      signal: AbortSignal.timeout(8e3)
    });
    if (res.type === "opaqueredirect" || res.status >= 300 && res.status < 400) {
      return Response.json({ error: "Redirects are not allowed." }, { status: 400, headers: corsHeaders });
    }
    if (!res.ok) {
      return Response.json({ error: "Could not reach agentskills.io. Check your connection." }, { status: 502, headers: corsHeaders });
    }
    skillData = await res.json();
  } catch {
    return Response.json({ error: "Could not reach agentskills.io. Check your connection." }, { status: 502, headers: corsHeaders });
  }
  const instructions = typeof skillData.instructions === "string" ? skillData.instructions : null;
  if (!instructions) {
    return Response.json({ error: "This skill has no instructions \u2014 it may use tools only (not supported)." }, { status: 422, headers: corsHeaders });
  }
  const MAX_LEN = 2e3;
  const truncated = instructions.length > MAX_LEN;
  const name = typeof skillData.name === "string" ? skillData.name : "Imported Skill";
  const description = typeof skillData.description === "string" ? skillData.description : "";
  return Response.json({
    name,
    description,
    instructions: truncated ? instructions.slice(0, MAX_LEN) : instructions,
    truncated
  }, { headers: corsHeaders });
}
export {
  config,
  handler as default
};
