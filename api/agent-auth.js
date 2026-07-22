// api/agent-auth.js
var ALLOWED_HOST = /^(?:[a-z0-9-]+\.)?worldmonitor\.app$/;
var FALLBACK_ORIGIN = "https://worldmonitor.app";
function resolveMetadataOrigin(req) {
  const url = new URL(req.url);
  const host = (req.headers.get("host") ?? url.host).toLowerCase();
  return ALLOWED_HOST.test(host) ? `https://${host}` : FALLBACK_ORIGIN;
}
var config = { runtime: "edge" };
function handler(req) {
  const cors = { "Access-Control-Allow-Origin": "*" };
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        ...cors,
        "Access-Control-Allow-Methods": "GET, HEAD, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Authorization, X-WorldMonitor-Key"
      }
    });
  }
  const origin = resolveMetadataOrigin(req);
  const resourceMetadataUrl = `${origin}/.well-known/oauth-protected-resource`;
  const body = JSON.stringify({
    error: "unauthorized",
    error_description: "Authentication required. Discover the authorization server via the protected-resource metadata, then obtain a bearer token (OAuth 2.1 + PKCE) \u2014 or pass an API key via the X-WorldMonitor-Key header.",
    resource_metadata: resourceMetadataUrl,
    authorization_server: `${origin}/.well-known/oauth-authorization-server`,
    skill: `${origin}/auth.md`
  });
  return new Response(body, {
    status: 401,
    headers: {
      ...cors,
      "Content-Type": "application/json",
      "WWW-Authenticate": `Bearer realm="worldmonitor", resource_metadata="${resourceMetadataUrl}"`,
      "Cache-Control": "no-store",
      // Body varies by Host (resource_metadata derived from it). Belt-and-braces
      // against a downstream cache keying on path alone.
      "Vary": "Host"
    }
  });
}
export {
  config,
  handler as default
};
