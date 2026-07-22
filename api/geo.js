// api/geo.js
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
var config = { runtime: "edge" };
function handler(req) {
  const cfCountry = req.headers.get("cf-ipcountry");
  const country = (cfCountry && cfCountry !== "T1" ? cfCountry : null) || req.headers.get("x-vercel-ip-country") || "XX";
  return jsonResponse({ country }, 200, {
    "Cache-Control": "public, max-age=300, s-maxage=3600, stale-if-error=3600",
    "Access-Control-Allow-Origin": "*"
  });
}
export {
  config,
  handler as default
};
