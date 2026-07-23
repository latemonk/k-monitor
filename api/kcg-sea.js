// api/kcg-sea.js
// Marine weather / sea-surface-temperature zones, powered by the BluePin
// marine observation & forecast API (https://bluepin.ai — KHOA, KMA marine
// buoys, NIFS). The default public preview endpoint needs no key; set
// BLUEPIN_API_URL / BLUEPIN_API_KEY to use a dedicated BluePin API plan.
var config = { runtime: "edge" };
var UPSTREAM = (typeof process !== "undefined" && process.env && process.env.BLUEPIN_API_URL) || "https://bluepin.ai/api/map/risk";
var BLUEPIN_API_KEY = (typeof process !== "undefined" && process.env && process.env.BLUEPIN_API_KEY) || "";
var CACHE_TTL_MS = 10 * 60 * 1e3;
var ZONES = [
  { id: "kr_west_incheon", nameKo: "\uC11C\uD574 \uC911\uBD80(\uC778\uCC9C)", provinces: ["\uC778\uCC9C", "\uACBD\uAE30"], lat: 37.3, lon: 125.6 },
  { id: "kr_west_south", nameKo: "\uC11C\uD574 \uB0A8\uBD80(\uAD70\uC0B0\xB7\uBAA9\uD3EC)", provinces: ["\uC804\uBD81", "\uC804\uB0A8"], lat: 35.3, lon: 125.7 },
  { id: "kr_jeju", nameKo: "\uC81C\uC8FC \uD574\uC5ED", provinces: ["\uC81C\uC8FC"], lat: 33.2, lon: 126.5 },
  { id: "kr_korea_strait", nameKo: "\uB0A8\uD574\xB7\uB300\uD55C\uD574\uD611(\uBD80\uC0B0)", provinces: ["\uBD80\uC0B0", "\uACBD\uB0A8"], lat: 34.8, lon: 128.9 },
  { id: "kr_east_south", nameKo: "\uB3D9\uD574 \uB0A8\uBD80(\uC6B8\uC0B0\xB7\uD3EC\uD56D)", provinces: ["\uC6B8\uC0B0", "\uACBD\uBD81"], lat: 36.3, lon: 130.2 },
  { id: "kr_east_dokdo", nameKo: "\uB3D9\uD574 \uC911\uBD80(\uB3C5\uB3C4)", provinces: ["\uAC15\uC6D0"], lat: 37.6, lon: 131.2 }
];
var cache = { at: 0, body: null };
function dist2(a, b) {
  const dLat = a.lat - b.lat;
  const dLon = (a.lon - b.lon) * Math.cos(a.lat * Math.PI / 180);
  return dLat * dLat + dLon * dLon;
}
async function fetchHazard(hazard) {
  const headers = { Accept: "application/json" };
  if (BLUEPIN_API_KEY) headers["X-API-Key"] = BLUEPIN_API_KEY;
  const resp = await fetch(`${UPSTREAM}?hazard=${hazard}`, {
    headers,
    signal: AbortSignal.timeout(12e3)
  });
  if (!resp.ok) return null;
  const data = await resp.json();
  return Array.isArray(data?.points) ? { unit: data.unit || "", points: data.points } : null;
}
function pickForZone(zone, hazardData) {
  if (!hazardData) return null;
  const { unit, points } = hazardData;
  const valid = points.filter((p2) => Number.isFinite(Number(p2.value)) && Number.isFinite(Number(p2.lat)));
  if (valid.length === 0) return null;
  let cand = valid.filter((p2) => zone.provinces.includes(String(p2.province || "")));
  if (cand.length === 0) {
    cand = valid.filter((p2) => dist2(zone, { lat: Number(p2.lat), lon: Number(p2.lon) }) < 1.5 * 1.5).sort((a, b) => dist2(zone, a) - dist2(zone, b)).slice(0, 1);
  }
  if (cand.length === 0) return null;
  const rank = { danger: 3, warn: 2, watch: 1, none: 0 };
  cand.sort((a, b) => (rank[b.level] ?? 0) - (rank[a.level] ?? 0) || dist2(zone, a) - dist2(zone, b));
  const p = cand[0];
  return {
    value: Math.round(Number(p.value) * 10) / 10,
    unit,
    level: String(p.level || "none"),
    station: String(p.name || ""),
    obsAt: String(p.obs_at || "")
  };
}
async function handler(_req) {
  const now = Date.now();
  if (cache.body && now - cache.at < CACHE_TTL_MS) {
    return new Response(cache.body, { status: 200, headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=300" } });
  }
  const [temp, wave, gust] = await Promise.all([
    fetchHazard("high_temp").catch(() => null),
    fetchHazard("wave").catch(() => null),
    fetchHazard("work_safety").catch(() => null)
  ]);
  if (!temp && !wave && !gust) {
    return new Response(JSON.stringify({ error: "marine data unavailable" }), { status: 503, headers: { "Content-Type": "application/json" } });
  }
  const zones = ZONES.map((z) => ({
    id: z.id,
    nameKo: z.nameKo,
    temp: pickForZone(z, temp),
    wave: pickForZone(z, wave),
    gust: pickForZone(z, gust)
  }));
  const body = JSON.stringify({ fetchedAt: now, zones });
  cache = { at: now, body };
  return new Response(body, { status: 200, headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=300" } });
}
export {
  config,
  handler as default
};
