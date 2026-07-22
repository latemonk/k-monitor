// api/oauth-authorization-server.js
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
    issuer: origin,
    authorization_endpoint: `${origin}/oauth/authorize`,
    token_endpoint: `${origin}/oauth/token`,
    registration_endpoint: `${origin}/oauth/register`,
    grant_types_supported: ["authorization_code", "refresh_token"],
    response_types_supported: ["code"],
    code_challenge_methods_supported: ["S256"],
    token_endpoint_auth_methods_supported: ["none"],
    scopes_supported: ["mcp"],
    agent_auth: {
      skill: `${origin}/auth.md`,
      register_uri: `${origin}/oauth/register`,
      claim_uri: `${origin}/oauth/authorize`,
      identity_types_supported: ["anonymous"],
      anonymous: {
        credential_types_supported: ["access_token"],
        claim_uri: `${origin}/oauth/authorize`
      }
    }
  });
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600",
      "Access-Control-Allow-Origin": "*",
      // Response body varies by Host (issuer/endpoints derived from it). Any
      // intermediate cache keying on path alone could serve wrong-origin
      // metadata across hosts. Belt-and-braces against downstream caches;
      // Vercel's own router is already per-host.
      "Vary": "Host"
    }
  });
}
export {
  config,
  handler as default
};
