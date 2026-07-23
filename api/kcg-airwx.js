// api/kcg-airwx.js
// KCG fork(07-24 사장님 지시): 공항 기상 프록시 (기상청 API허브 항공기상).
//   ?type=metar            → 국내 주요 공항 METAR 정규화 JSON
//   ?type=hazards          → 공항경보 + SIGMET + AIRMET (발효 중 특보)
//   ?type=taf&icao=RKSI    → 공항 TAF 전문
//   ?type=amos             → 7개 공항 분단위 활주로 실황(RVR·최저운고·순간풍)
//   ?type=lowwind          → 저고도(1k~10k ft) 공항 상공 바람·기온 (WINTEM)
//
// 데이터 출처 2원화(BizRouter 패턴 — env 키만 넣으면 전환):
//   - KMA_APIHUB_KEY 있으면: 기상청 API허브 항공기상 (07-24 사장님 활용신청 완료)
//   - 없으면: METAR 는 NOAA aviationweather.gov (무키) 폴백, 나머지는 빈 응답
// 브라우저 직접 호출 불가(CORS) + 키 은닉을 위해 서버 프록시로 둔다.
// ⚠기상청 API허브는 병렬 버스트 시 단기 차단(APPLICATION_ERROR) — 항상 순차 호출.
const config = { runtime: "edge" };

const cache = /* @__PURE__ */ new Map();
const METAR_TTL_MS = 3e5;    // 5분
const HAZARDS_TTL_MS = 6e5;  // 10분(특보)
const TAF_TTL_MS = 18e5;     // 30분(발표 주기 6시간)
const AMOS_TTL_MS = 6e4;     // 60초(분단위 실황)
const LOWWIND_TTL_MS = 36e5; // 1시간(발표 주기 6시간)
const CACHE_MAX = 60;

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
  let visM = iwxxmNum(xml, "prevailingVisibility");
  // CAVOK 이면 IWXXM 이 시정 요소를 생략한다 — 10km+ 로 간주.
  if (visM === null && /cloudAndVisibilityOK="true"/.test(xml)) visM = 10000;
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

// ── 특보(공항경보·SIGMET·AIRMET) — AmmService, NO_DATA(03)=발효 없음 ──────
// ⚠API허브 openApi 는 간헐적으로 resultCode 01(APPLICATION_ERROR)을 튕긴다
// (07-24 실측: 같은 순간 한쪽 성공·한쪽 실패 — 상류 플래핑). 짧은 재시도 필수.
async function fetchAmmItems(key, path, extraQs) {
  const url = "https://apihub.kma.go.kr/api/typ02/openApi/AmmService/" + path
    + "?pageNo=1&numOfRows=20&dataType=JSON" + (extraQs || "")
    + "&authKey=" + encodeURIComponent(key);
  let lastErr = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) await new Promise((r) => setTimeout(r, 350));
    try {
      const resp = await fetch(url, { signal: AbortSignal.timeout(8e3) });
      if (!resp.ok) { lastErr = new Error("kma " + resp.status); continue; }
      const data = await resp.json();
      const header = data && data.response && data.response.header;
      if (header && header.resultCode === "03") return []; // NO_DATA = 발효 없음
      if (!header || header.resultCode !== "00") { lastErr = new Error("kma " + (header && header.resultCode)); continue; }
      const items = data.response.body && data.response.body.items && data.response.body.items.item;
      return Array.isArray(items) ? items : items ? [items] : [];
    } catch (e) { lastErr = e; }
  }
  throw lastErr || new Error("kma flaky");
}

async function fetchAmmList(key, path, mapItem) {
  const arr = await fetchAmmItems(key, path, "");
  return arr.map(mapItem).filter(Boolean);
}

async function fetchHazards(key) {
  // 순차 3콜 — 병렬 버스트 금지.
  const warnings = await fetchAmmList(key, "getWarning", (it) => ({
    kind: "warning",
    airport: it.airportName || it.icaoCode || "",
    icao: it.icaoCode || "",
    type: it.wrngType || "공항경보",
    from: it.validTm1 || "",
    to: it.validTm2 || "",
    msg: it.wrngMsg || "",
  }));
  await new Promise((r) => setTimeout(r, 250));
  const sigmet = await fetchAmmList(key, "getSigmet", (it) => ({
    kind: "sigmet",
    airport: it.airportName || "",
    icao: it.icaoCode || "",
    from: it.stTm || "",
    to: it.edTm || "",
    msg: it.sigmetMsg || "",
  }));
  await new Promise((r) => setTimeout(r, 250));
  const airmet = await fetchAmmList(key, "getAirmet", (it) => ({
    kind: "airmet",
    airport: it.airportName || "",
    icao: it.icaoCode || "",
    from: it.stTm || "",
    to: it.edTm || "",
    msg: it.airmetMsg || "",
  }));
  return { warnings, sigmet, airmet };
}

async function fetchTaf(key, icao) {
  const items = await fetchAmmListIcao(key, "getTaf", icao);
  // AmmService getTaf 는 전문 필드명이 metarMsg 로 온다(실측 07-24).
  const first = items[0] || null;
  return first ? { icao, msg: String(first.metarMsg || first.tafMsg || "").trim() } : { icao, msg: "" };
}

async function fetchAmmListIcao(key, path, icao) {
  return fetchAmmItems(key, path, "&icao=" + encodeURIComponent(icao));
}

// ── AMOS 분단위 활주로 실황 — 7개 공항, 0.1 단위 스케일 필드 주의 ─────────
const AMOS_STN_ICAO = { "92": "RKNY", "110": "RKSS", "113": "RKSI", "151": "RKPU", "163": "RKJB", "167": "RKJY", "182": "RKPC" };

async function fetchAmos(key) {
  const resp = await fetch(
    "https://apihub.kma.go.kr/api/typ01/url/amos.php?dtm=2&stn=&help=0&authKey=" + encodeURIComponent(key),
    { signal: AbortSignal.timeout(9e3) }
  );
  if (!resp.ok) throw new Error("kma " + resp.status);
  const text = await resp.text();
  const latest = new Map(); // stn -> row (마지막 = 최신)
  for (const line of text.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const f = t.split(/\s+/);
    if (f.length < 27) continue;
    latest.set(f[0], f);
  }
  const num = (v, scale) => {
    const n = parseFloat(v);
    if (!Number.isFinite(n) || n <= -9999 || n === -9) return null;
    return scale ? n / scale : n;
  };
  const out = [];
  for (const [stn, f] of latest) {
    const icao = AMOS_STN_ICAO[stn];
    if (!icao) continue;
    out.push({
      icao,
      obsTime: f[1] || null,               // KST YYYYMMDDHHMI
      visM: num(f[2]),
      rvrM: num(f[4]),                     // 활주로 가시거리(상한 2,000m 표기)
      ceilingM: num(f[6]),                 // 최저운고 (m)
      tempC: num(f[7], 10),
      dewC: num(f[8], 10),
      humidity: num(f[9]),
      qnhHpa: num(f[10], 10),
      wd2mDeg: num(f[15]),
      ws2mKt: num(f[18], 10) != null ? Math.round(num(f[18], 10) * 1.94384 * 10) / 10 : null,  // m/s→kt
      ws2mMaxKt: num(f[19], 10) != null ? Math.round(num(f[19], 10) * 1.94384 * 10) / 10 : null,
      wd10mDeg: num(f[21]),
      ws10mKt: num(f[24], 10) != null ? Math.round(num(f[24], 10) * 1.94384 * 10) / 10 : null,
      ws10mMaxKt: num(f[25], 10) != null ? Math.round(num(f[25], 10) * 1.94384 * 10) / 10 : null,
    });
  }
  if (out.length === 0) throw new Error("amos empty");
  return out;
}

// ── WINTEM 저고도 바람·기온 — 공항별 최근접 격자 (발표 00/06/12/18 UTC) ────
const LOWWIND_HEIGHTS = [
  { ht: "010", label: "1,000ft" },
  { ht: "020", label: "2,000ft" },
  { ht: "050", label: "5,000ft" },
  { ht: "100", label: "10,000ft" },
];

function parseWintemGrids(xml) {
  const grids = [];
  const re = /<grid lat="([-0-9.]+)" lon="([-0-9.]+)"><wd>([-0-9.]+)<\/wd><ws>([-0-9.]+)<\/ws><temp>([-0-9.]+)<\/temp><\/grid>/g;
  let m = re.exec(xml);
  while (m) {
    grids.push({ lat: parseFloat(m[1]), lon: parseFloat(m[2]), wd: parseFloat(m[3]), ws: parseFloat(m[4]), temp: parseFloat(m[5]) });
    m = re.exec(xml);
  }
  return grids;
}

async function fetchLowWind(key) {
  // 최신 발표 사이클부터 최대 4사이클 거슬러 시도. ef 는 사이클 나이에 맞춤(6~24h).
  const now = Date.now();
  const perAirport = new Map(); // icao -> [{label, wdDeg, wsKt, tempC}]
  let issued = null;
  for (let back = 1; back <= 4 && !issued; back++) {
    const cyc = new Date(Math.floor(now / (6 * 3600e3)) * 6 * 3600e3 - back * 6 * 3600e3);
    const tmfc = cyc.toISOString().slice(0, 13).replace(/[-T]/g, "");
    const efH = Math.min(24, Math.max(6, Math.round((now - cyc.getTime()) / 3600e3 / 3) * 3));
    const ef = String(efH).padStart(2, "0");
    const heightResults = [];
    for (const h of LOWWIND_HEIGHTS) {
      try {
        const resp = await fetch(
          "https://apihub.kma.go.kr/api/typ01/url/amo_wintem.php?tmfc=" + tmfc + "&ef=" + ef + "&ht=" + h.ht + "&authKey=" + encodeURIComponent(key),
          { signal: AbortSignal.timeout(9e3) }
        );
        if (!resp.ok) break;
        const grids = parseWintemGrids(await resp.text());
        if (grids.length === 0) break;
        heightResults.push({ label: h.label, grids });
      } catch { break; }
      await new Promise((r) => setTimeout(r, 200));
    }
    if (heightResults.length !== LOWWIND_HEIGHTS.length) continue;
    issued = tmfc + " +" + ef + "h";
    for (const a of AIRPORTS) {
      const rows = [];
      for (const hr of heightResults) {
        let best = null;
        let bestD = Infinity;
        for (const g of hr.grids) {
          const d = (g.lat - a.lat) * (g.lat - a.lat) + (g.lon - a.lon) * (g.lon - a.lon);
          if (d < bestD) { bestD = d; best = g; }
        }
        if (best) rows.push({ label: hr.label, wdDeg: Math.round(best.wd), wsKt: Math.round(best.ws), tempC: Math.round(best.temp) });
      }
      perAirport.set(a.icao, rows);
    }
  }
  if (!issued) throw new Error("wintem unavailable");
  return { issued, airports: AIRPORTS.map((a) => ({ icao: a.icao, nameKo: a.nameKo, levels: perAirport.get(a.icao) || [] })) };
}

// ── 캐시 공통 래퍼: 성공 캐시 + 실패 시 stale ─────────────────────────────
async function cachedJson(cacheKey, ttl, maxAge, build) {
  const cached = cacheGet(cacheKey, ttl);
  if (cached) return json(200, cached, maxAge);
  try {
    const body = await build();
    cacheSet(cacheKey, body);
    return json(200, body, maxAge);
  } catch {
    const stale = cacheGetStale(cacheKey);
    if (stale) return json(200, stale, maxAge);
    return json(502, { error: "upstream unavailable" });
  }
}

async function handler(req) {
  const url = new URL(req.url);
  const type = url.searchParams.get("type") || "metar";
  const kmaKey = process.env.KMA_APIHUB_KEY || "";

  if (type === "metar") {
    return cachedJson("metar:v1", METAR_TTL_MS, 60, async () => {
      let byIcao = null;
      let source = "";
      if (kmaKey) {
        try {
          byIcao = await fetchKmaMetar(kmaKey);
          source = "kma";
        } catch { /* NOAA 폴백 */ }
      }
      if (!byIcao) {
        byIcao = await fetchNoaaMetar();
        source = "noaa";
      }
      const airports = AIRPORTS.map((a) => {
        const m = byIcao.get(a.icao) || null;
        return { icao: a.icao, nameKo: a.nameKo, lat: a.lat, lon: a.lon, metar: m };
      });
      return { source, fetchedAt: Date.now(), airports };
    });
  }

  if (!kmaKey) return json(200, { available: false });

  if (type === "hazards") {
    return cachedJson("hazards:v1", HAZARDS_TTL_MS, 120, async () => {
      const h = await fetchHazards(kmaKey);
      return { available: true, fetchedAt: Date.now(), ...h };
    });
  }

  if (type === "taf") {
    const icao = String(url.searchParams.get("icao") || "").toUpperCase();
    if (!/^RK[A-Z]{2}$/.test(icao)) return json(400, { error: "bad icao" });
    return cachedJson("taf:v1:" + icao, TAF_TTL_MS, 300, async () => {
      const t = await fetchTaf(kmaKey, icao);
      return { available: true, fetchedAt: Date.now(), ...t };
    });
  }

  if (type === "amos") {
    return cachedJson("amos:v1", AMOS_TTL_MS, 30, async () => {
      const rows = await fetchAmos(kmaKey);
      return { available: true, fetchedAt: Date.now(), rows };
    });
  }

  if (type === "lowwind") {
    return cachedJson("lowwind:v1", LOWWIND_TTL_MS, 600, async () => {
      const lw = await fetchLowWind(kmaKey);
      return { available: true, fetchedAt: Date.now(), ...lw };
    });
  }

  return json(400, { error: "unknown type" });
}

export { config, handler as default };
