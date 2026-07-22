// api/kcg-flight-info.js
var config = { runtime: "edge" };
var cache = /* @__PURE__ */ new Map();
var CACHE_TTL_MS = 60 * 60 * 1e3;
var CACHE_MAX = 2e3;
function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=1800" }
  });
}
function pickAirport(a) {
  if (!a) return null;
  return {
    iata: a.iata_code || "",
    icao: a.icao_code || "",
    name: a.name || "",
    city: a.municipality || "",
    country: a.country_name || "",
    countryIso: a.country_iso_name || ""
  };
}
async function handler(req) {
  const url = new URL(req.url);
  const callsign = String(url.searchParams.get("callsign") || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10);
  if (!callsign) return json(400, { error: "callsign required" });
  const hit = cache.get(callsign);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return json(200, hit.data);
  try {
    const resp = await fetch(`https://api.adsbdb.com/v0/callsign/${callsign}`, {
      signal: AbortSignal.timeout(8e3),
      headers: { "Accept": "application/json" }
    });
    let data = { found: false };
    if (resp.ok) {
      const body = await resp.json();
      const fr = body?.response?.flightroute;
      if (fr) {
        data = {
          found: true,
          airline: fr.airline?.name || "",
          airlineIata: fr.airline?.iata || "",
          airlineCountry: fr.airline?.country || "",
          callsignIata: fr.callsign_iata || "",
          origin: pickAirport(fr.origin),
          destination: pickAirport(fr.destination)
        };
      }
    } else if (resp.status !== 404) {
      return json(502, { error: "route lookup failed", upstreamStatus: resp.status });
    }
    if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value);
    cache.set(callsign, { data, at: Date.now() });
    return json(200, data);
  } catch {
    return json(502, { error: "route lookup failed" });
  }
}
export {
  config,
  handler as default
};
