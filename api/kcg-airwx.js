// api/kcg-airwx.js
// KCG fork(07-24 사장님 지시): 공항 기상(METAR) 프록시.
//   ?type=metar → 국내 주요 공항 METAR 정규화 JSON
//
// 데이터 출처 2원화(BizRouter 패턴 — env 키만 넣으면 전환):
//   - KMA_APIHUB_KEY 있으면: 기상청 API허브 항공기상 (신청 API 활성화 후)
//   - 없으면: NOAA aviationweather.gov (무키·전세계 METAR) — 즉시 동작
// 브라우저 직접 호출 불가(CORS) + 키 은닉을 위해 서버 프록시로 둔다.
// 캐시 5분(METAR 정시 관측 주기 30분~1시간, 특별관측 감안 여유).
const config = { runtime: "edge" };

const cache = /* @__PURE__ */ new Map();
const METAR_TTL_MS = 3e5; // 5분
const CACHE_MAX = 20;

// 국내 주요 공항 (ICAO · 한글명 · 좌표 — 지도 포커스용)
const AIRPORTS = [
  { icao: "RKSI", nameKo: "인천", lat: 37.469, lon: 126.451 },
  { icao: "RKSS", nameKo: "김포", lat: 37.558, lon: 126.791 },
  { icao: "RKPC", nameKo: "제주", lat: 33.511, lon: 126.493 },
  { icao: "RKPK", nameKo: "김해", lat: 35.179, lon: 128.938 },
  { icao: "RKTU", nameKo: "청주", lat: 36.717, lon: 127.499 },
  { icao: "RKTN", nameKo: "대구", lat: 35.894, lon: 128.659 },
  { icao: "RKJJ", nameKo: "광주", lat: 35.126, lon: 126.809 },
  { icao: "RKJB", nameKo: "무안", lat: 34.991, lon: 126.383 },
  { icao: "RKNY", nameKo: "양양", lat: 38.061, lon: 128.669 },
  { icao: "RKPU", nameKo: "울산", lat: 35.594, lon: 129.352 }
];

function json(status, body, maxAge) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": maxAge ? "public, max-age=" + maxAge : "no-store"
    }
  });
}

function cacheGet(key, ttl) {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < ttl) return hit.data;
  return null;
}

function cacheGetStale(key) {
  const hit = cache.get(key);
  return hit ? hit.data : null;
}

function cacheSet(key, data) {
  if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value);
  cache.set(key, { data, at: Date.now() });
}

// 표준 비행 카테고리(시정 m·운고 ft 기준) — 상류가 안 주면 직접 계산.
function flightCategory(visM, ceilFt) {
  const v = Number.isFinite(visM) ? visM : Infinity;
  const c = Number.isFinite(ceilFt) ? ceilFt : Infinity;
  if (v < 1600 || c < 500) return "LIFR";
  if (v < 4800 || c < 1000) return "IFR";
  if (v <= 8000 || c <= 3000) return "MVFR";
  return "VFR";
}

// NOAA aviationweather.gov METAR JSON → 정규화.
function normalizeNoaa(rows) {
  const byIcao = new Map();
  for (const r of Array.isArray(rows) ? rows : []) {
    const icao = String(r.icaoId || "").toUpperCase();
    if (!icao) continue;
    // visib: 숫자(SM) 또는 "10+" 같은 문자열.
    let visM = null;
    const visRaw = r.visib;
    if (typeof visRaw === "number") visM = Math.round(visRaw * 1609);
    else if (typeof visRaw === "string") {
      const n = parseFloat(visRaw);
      if (Number.isFinite(n)) visM = Math.round(n * 1609);
    }
    // 운고 = BKN/OVC 최저운저.
    let ceilFt = null;
    let cloudsText = "";
    if (Array.isArray(r.clouds)) {
      const parts = [];
      for (const c of r.clouds) {
        if (!c || !c.cover) continue;
        parts.push(String(c.cover) + (Number.isFinite(c.base) ? String(c.base) : ""));
        if ((c.cover === "BKN" || c.cover === "OVC") && Number.isFinite(c.base)) {
          if (ceilFt === null || c.base < ceilFt) ceilFt = c.base;
        }
      }
      cloudsText = parts.join(" ");
    }
    byIcao.set(icao, {
      icao,
      obsTime: r.reportTime || r.obsTime || null,
      wdirDeg: Number.isFinite(r.wdir) ? r.wdir : null,
      wspdKt: Number.isFinite(r.wspd) ? r.wspd : null,
      gustKt: Number.isFinite(r.wgst) ? r.wgst : null,
      visM,
      ceilFt,
      clouds: cloudsText,
      wx: r.wxString || "",
      tempC: Number.isFinite(r.temp) ? r.temp : null,
      dewC: Number.isFinite(r.dewp) ? r.dewp : null,
      qnhHpa: Number.isFinite(r.altim) ? Math.round(r.altim) : null,
      fltCat: r.fltCat || flightCategory(visM, ceilFt),
      raw: r.rawOb || ""
    });
  }
  return byIcao;
}

async function fetchNoaaMetar() {
  const ids = AIRPORTS.map((a) => a.icao).join(",");
  const resp = await fetch(
    "https://aviationweather.gov/api/data/metar?ids=" + ids + "&format=json",
    { signal: AbortSignal.timeout(1e4), headers: { "User-Agent": "k-monitor-airwx" } }
  );
  if (!resp.ok) throw new Error("noaa " + resp.status);
  return normalizeNoaa(await resp.json());
}

// 기상청 API허브 항공기상전문(AmmIwxxmService/getMetar) — 07-24 사장님
// 활용신청 완료·실측 확정. 응답은 JSON 안에 IWXXM XML 전문이 들어 있어
// 필요한 요소만 정규식으로 추출한다(공항당 1콜 × 10공항 / 5분 캐시).
function iwxxmNum(xml, tag) {
  const m = xml.match(new RegExp("<iwxxm:" + tag + "[^>]*>\\s*([-0-9.]+)"));
  if (!m) return null;
  const n = parseFloat(m[1]);
  return Number.isFinite(n) ? n : null;
}

function parseIwxxmMetar(icao, xml) {
  const visM = iwxxmNum(xml, "prevailingVisibility");
  // 운고 = BKN/OVC 최저운저. CloudLayer 블록에서 amount 코드와 base 를 짝지음.
  let ceilFt = null;
  const parts = [];
  const layerRe = /<iwxxm:CloudLayer>([\s\S]*?)<\/iwxxm:CloudLayer>/g;
  let lm = layerRe.exec(xml);
  while (lm) {
    const block = lm[1];
    const amount = (block.match(/CloudAmountReportedAtAerodrome\/([A-Z]+)/) || [])[1] || "";
    const base = parseFloat((block.match(/<iwxxm:base[^>]*>\s*([-0-9.]+)/) || [])[1]);
    if (amount) parts.push(amount + (Number.isFinite(base) ? String(base) : ""));
    if ((amount === "BKN" || amount === "OVC") && Number.isFinite(base)) {
      if (ceilFt === null || base < ceilFt) ceilFt = base;
    }
    lm = layerRe.exec(xml);
  }
  const wx = (xml.match(/presentWeather[^>]*href="[^"]*\/([A-Z+-]+)"/) || [])[1] || "";
  const obsTime = (xml.match(/<gml:timePosition>\s*([0-9T:.Z-]+)/) || [])[1] || null;
  const gust = iwxxmNum(xml, "windGustSpeed");
  return {
    icao,
    obsTime,
    wdirDeg: iwxxmNum(xml, "meanWindDirection"),
    wspdKt: iwxxmNum(xml, "meanWindSpeed"),
    gustKt: gust,
    visM,
    ceilFt,
    clouds: parts.join(" "),
    wx,
    tempC: iwxxmNum(xml, "airTemperature"),
    dewC: iwxxmNum(xml, "dewpointTemperature"),
    qnhHpa: iwxxmNum(xml, "qnh"),
    fltCat: flightCategory(visM, ceilFt),
    raw: ""
  };
}

async function fetchKmaMetar(key) {
  const byIcao = new Map();
  // 순차 호출 + 짧은 간격 — 병렬 버스트가 API허브 단기 차단(APPLICATION_ERROR)을
  // 유발하는 것을 실측(07-24). 첫 공항이 연속 실패하면 즉시 포기하고 NOAA 폴백.
  let consecutiveFail = 0;
  for (const a of AIRPORTS) {
    try {
      const resp = await fetch(
        "https://apihub.kma.go.kr/api/typ02/openApi/AmmIwxxmService/getMetar?pageNo=1&numOfRows=1&dataType=JSON&icao="
          + a.icao + "&authKey=" + encodeURIComponent(key),
        { signal: AbortSignal.timeout(8e3) }
      );
      if (!resp.ok) throw new Error("kma " + resp.status);
      const data = await resp.json();
      const items = data && data.response && data.response.body && data.response.body.items && data.response.body.items.item;
      const msg = Array.isArray(items) && items[0] && items[0].metarMsg;
      if (!msg || typeof msg !== "string") throw new Error("kma no metar");
      byIcao.set(a.icao, parseIwxxmMetar(a.icao, msg));
      consecutiveFail = 0;
    } catch {
      consecutiveFail++;
      if (consecutiveFail >= 2 && byIcao.size === 0) break;
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  if (byIcao.size === 0) throw new Error("kma empty");
  return byIcao;
}

async function handler(req) {
  const url = new URL(req.url);
  const type = url.searchParams.get("type") || "metar";
  if (type !== "metar") return json(400, { error: "unknown type" });

  const cacheKey = "metar:v1";
  const cached = cacheGet(cacheKey, METAR_TTL_MS);
  if (cached) return json(200, cached, 60);

  let byIcao = null;
  let source = "";
  const kmaKey = process.env.KMA_APIHUB_KEY || "";
  if (kmaKey) {
    try {
      byIcao = await fetchKmaMetar(kmaKey);
      source = "kma";
    } catch { /* NOAA 폴백 */ }
  }
  if (!byIcao) {
    try {
      byIcao = await fetchNoaaMetar();
      source = "noaa";
    } catch {
      const stale = cacheGetStale(cacheKey);
      if (stale) return json(200, stale, 60);
      return json(502, { error: "upstream unavailable" });
    }
  }

  const airports = AIRPORTS.map((a) => {
    const m = byIcao.get(a.icao) || null;
    return { icao: a.icao, nameKo: a.nameKo, lat: a.lat, lon: a.lon, metar: m };
  });
  const body = { source, fetchedAt: Date.now(), airports };
  cacheSet(cacheKey, body);
  return json(200, body, 60);
}

export { config, handler as default };
