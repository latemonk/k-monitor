// api/http-message-signatures-directory.js
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
var ED25519_PUBLIC_KEY_X = "haxeg7usB7Giri_2DP_UNE0LcFhrPd1IkNZs9RDI0k4";
var CLOCK_SKEW_SECONDS = 3600;
var KEY_TTL_SECONDS = 86400;
function base64url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
var cachedKid = null;
async function jwkThumbprint(x) {
  if (cachedKid) return cachedKid;
  const canonical = `{"crv":"Ed25519","kty":"OKP","x":"${x}"}`;
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(canonical));
  cachedKid = base64url(new Uint8Array(digest));
  return cachedKid;
}
async function handler(req) {
  const guarded = guardMetadataMethod(req);
  if (guarded) return guarded;
  const notBefore = Math.floor(Date.now() / 1e3) - CLOCK_SKEW_SECONDS;
  const kid = await jwkThumbprint(ED25519_PUBLIC_KEY_X);
  const body = JSON.stringify({
    keys: [
      {
        kty: "OKP",
        crv: "Ed25519",
        x: ED25519_PUBLIC_KEY_X,
        kid,
        use: "sig",
        nbf: notBefore,
        exp: notBefore + KEY_TTL_SECONDS
      }
    ]
  });
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "application/http-message-signatures-directory+json",
      "Cache-Control": "public, max-age=3600",
      "Access-Control-Allow-Origin": "*"
    }
  });
}
export {
  config,
  handler as default
};
