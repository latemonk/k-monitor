// api/oauth-protected-resource.js
var ALLOWED_HOST = /^(?:[a-z0-9-]+\.)?worldmonitor\.app$/;
var FALLBACK_ORIGIN = "https://worldmonitor.app";
function resolveMetadataOrigin(req) {
  const url = new URL(req.url);
  const host = (req.headers.get("host") ?? url.host).toLowerCase();
  return ALLOWED_HOST.test(host) ? `https://${host}` : FALLBACK_ORIGIN;
}
function guardMetadataMethod(req) {
  if (req.method === "GET" || req.method === "HEAD") return null;
  const cors = { "Access-Control-Allow-Origin": "*" };
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: { ...cors, "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS" }
    });
  }
  return new Response(null, { status: 405, headers: { ...cors, Allow: "GET, HEAD, OPTIONS" } });
}
var config = { runtime: "edge" };
function handler(req) {
  const guarded = guardMetadataMethod(req);
  if (guarded) return guarded;
  const origin = resolveMetadataOrigin(req);
  const body = JSON.stringify({
    resource: origin,
    authorization_servers: [origin],
    bearer_methods_supported: ["header"],
    scopes_supported: ["mcp"]
  });
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600",
      "Access-Control-Allow-Origin": "*",
      // Response body varies by Host (resource/authorization_servers derived
      // from it). Any intermediate cache keying on path alone could serve
      // wrong-origin metadata across hosts. Vercel's own router is per-host,
      // but this is belt-and-braces against downstream caches.
      "Vary": "Host"
    }
  });
}
export {
  config,
  handler as default
};
