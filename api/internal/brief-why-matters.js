var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res, err) => function __init() {
  if (err) throw err[0];
  try {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  } catch (e) {
    throw err = [e], e;
  }
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/_shared/sidecar-cache.ts
var sidecar_cache_exports = {};
__export(sidecar_cache_exports, {
  sidecarCacheGet: () => sidecarCacheGet,
  sidecarCacheSet: () => sidecarCacheSet,
  sidecarCacheStats: () => sidecarCacheStats
});
function startSweepIfNeeded() {
  if (sweepTimer) return;
  sweepTimer = setInterval(() => {
    const now = Date.now();
    for (const [k, entry] of store) {
      if (entry.expiresAt <= now) {
        totalBytes -= entry.size;
        store.delete(k);
      }
    }
  }, SWEEP_INTERVAL_MS);
  if (typeof sweepTimer === "object" && "unref" in sweepTimer) {
    sweepTimer.unref();
  }
}
function evictLRU(incomingSize = 0) {
  const keysToEvict = [];
  for (const [k, entry] of store) {
    const nextEntryCount = store.size - keysToEvict.length + 1;
    const nextTotalBytes = totalBytes + incomingSize;
    if (nextEntryCount <= MAX_ENTRIES && nextTotalBytes <= MAX_BYTES) break;
    keysToEvict.push(k);
    totalBytes -= entry.size;
  }
  for (const k of keysToEvict) store.delete(k);
}
function sidecarCacheGet(key) {
  const entry = store.get(key);
  if (!entry) {
    missCount++;
    return null;
  }
  if (entry.expiresAt <= Date.now()) {
    totalBytes -= entry.size;
    store.delete(key);
    missCount++;
    return null;
  }
  store.delete(key);
  store.set(key, entry);
  hitCount++;
  return JSON.parse(entry.value);
}
function sidecarCacheSet(key, value, ttlSeconds) {
  const clamped = Math.max(MIN_TTL_S, Math.min(MAX_TTL_S, ttlSeconds));
  const json2 = JSON.stringify(value);
  const size = json2.length * 2;
  if (size > MAX_SINGLE_VALUE_BYTES) {
    console.warn(`[sidecar-cache] rejecting key "${key}": ${(size / 1024 / 1024).toFixed(1)} MB exceeds 2 MB limit`);
    return;
  }
  const existing = store.get(key);
  if (existing) {
    totalBytes -= existing.size;
    store.delete(key);
  }
  if (store.size >= MAX_ENTRIES || totalBytes + size > MAX_BYTES) {
    evictLRU(size);
  }
  store.set(key, {
    value: json2,
    expiresAt: Date.now() + clamped * 1e3,
    size
  });
  totalBytes += size;
  startSweepIfNeeded();
}
function sidecarCacheStats() {
  return { entries: store.size, bytes: totalBytes, hits: hitCount, misses: missCount };
}
var MAX_ENTRIES, MAX_BYTES, MAX_SINGLE_VALUE_BYTES, MIN_TTL_S, MAX_TTL_S, SWEEP_INTERVAL_MS, store, totalBytes, sweepTimer, hitCount, missCount;
var init_sidecar_cache = __esm({
  "server/_shared/sidecar-cache.ts"() {
    "use strict";
    MAX_ENTRIES = 500;
    MAX_BYTES = 50 * 1024 * 1024;
    MAX_SINGLE_VALUE_BYTES = 2 * 1024 * 1024;
    MIN_TTL_S = 10;
    MAX_TTL_S = 86400;
    SWEEP_INTERVAL_MS = 6e4;
    store = /* @__PURE__ */ new Map();
    totalBytes = 0;
    sweepTimer = null;
    hitCount = 0;
    missCount = 0;
  }
});

// server/_shared/internal-auth.ts
async function timingSafeEqual(a, b) {
  const encoder = new TextEncoder();
  const aHash = new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(a)));
  const bHash = new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(b)));
  const n = bHash.length;
  let diff = 0;
  for (let i = 0; i < n; i++) {
    diff |= aHash[i] ^ bHash[i];
  }
  return diff === 0;
}
async function authenticateInternalRequest(req, secretEnvVar, extraHeaders = {}) {
  const auth = req.headers.get("authorization") || "";
  const secret = process.env[secretEnvVar];
  if (!secret || !await timingSafeEqual(auth, `Bearer ${secret}`)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json", ...extraHeaders }
    });
  }
  return null;
}

// shared/country-names.json
var country_names_default = {
  afghanistan: "AF",
  aland: "AX",
  albania: "AL",
  algeria: "DZ",
  "american samoa": "AS",
  andorra: "AD",
  angola: "AO",
  anguilla: "AI",
  antarctica: "AQ",
  "antigua and barbuda": "AG",
  argentina: "AR",
  armenia: "AM",
  aruba: "AW",
  australia: "AU",
  austria: "AT",
  azerbaijan: "AZ",
  bahamas: "BS",
  "bahamas the": "BS",
  bahrain: "BH",
  bangladesh: "BD",
  barbados: "BB",
  belarus: "BY",
  belgium: "BE",
  belize: "BZ",
  benin: "BJ",
  bermuda: "BM",
  bhutan: "BT",
  "bolivarian republic of venezuela": "VE",
  bolivia: "BO",
  "bosnia and herzegovina": "BA",
  botswana: "BW",
  brazil: "BR",
  "british indian ocean territory": "IO",
  "british virgin islands": "VG",
  brunei: "BN",
  "brunei darussalam": "BN",
  bulgaria: "BG",
  "burkina faso": "BF",
  burma: "MM",
  burundi: "BI",
  "cabo verde": "CV",
  cambodia: "KH",
  cameroon: "CM",
  canada: "CA",
  "cape verde": "CV",
  "cayman islands": "KY",
  "central african republic": "CF",
  chad: "TD",
  chile: "CL",
  china: "CN",
  colombia: "CO",
  comoros: "KM",
  congo: "CG",
  "congo brazzaville": "CG",
  "congo dem rep": "CD",
  "congo kinshasa": "CD",
  "congo rep": "CG",
  "cook islands": "CK",
  "costa rica": "CR",
  "cote d ivoire": "CI",
  "cote divoire": "CI",
  croatia: "HR",
  cuba: "CU",
  curacao: "CW",
  cyprus: "CY",
  "czech republic": "CZ",
  czechia: "CZ",
  "democratic peoples republic of korea": "KP",
  "democratic republic of korea": "KP",
  "democratic republic of the congo": "CD",
  denmark: "DK",
  djibouti: "DJ",
  dominica: "DM",
  "dominican republic": "DO",
  "dr congo": "CD",
  drc: "CD",
  "east timor": "TL",
  ecuador: "EC",
  egypt: "EG",
  "egypt arab rep": "EG",
  "el salvador": "SV",
  "equatorial guinea": "GQ",
  eritrea: "ER",
  estonia: "EE",
  eswatini: "SZ",
  ethiopia: "ET",
  "falkland islands": "FK",
  "faroe islands": "FO",
  "federated states of micronesia": "FM",
  fiji: "FJ",
  finland: "FI",
  france: "FR",
  "french polynesia": "PF",
  "french southern and antarctic lands": "TF",
  gabon: "GA",
  gambia: "GM",
  "gambia the": "GM",
  gaza: "PS",
  georgia: "GE",
  germany: "DE",
  ghana: "GH",
  gibraltar: "GI",
  greece: "GR",
  greenland: "GL",
  grenada: "GD",
  guam: "GU",
  guatemala: "GT",
  guernsey: "GG",
  guinea: "GN",
  "guinea bissau": "GW",
  guyana: "GY",
  haiti: "HT",
  "heard island and mcdonald islands": "HM",
  honduras: "HN",
  "hong kong": "HK",
  "hong kong s a r": "HK",
  "hong kong sar china": "HK",
  hungary: "HU",
  iceland: "IS",
  india: "IN",
  indonesia: "ID",
  iran: "IR",
  "iran islamic rep": "IR",
  iraq: "IQ",
  ireland: "IE",
  "isle of man": "IM",
  israel: "IL",
  italy: "IT",
  "ivory coast": "CI",
  jamaica: "JM",
  japan: "JP",
  jersey: "JE",
  jordan: "JO",
  kazakhstan: "KZ",
  kenya: "KE",
  kiribati: "KI",
  "korea dem peoples rep": "KP",
  "korea rep": "KR",
  kosovo: "XK",
  kuwait: "KW",
  "kyrgyz republic": "KG",
  kyrgyzstan: "KG",
  "lao pdr": "LA",
  laos: "LA",
  latvia: "LV",
  lebanon: "LB",
  lesotho: "LS",
  liberia: "LR",
  libya: "LY",
  liechtenstein: "LI",
  lithuania: "LT",
  luxembourg: "LU",
  "macao s a r": "MO",
  "macao sar china": "MO",
  madagascar: "MG",
  malawi: "MW",
  malaysia: "MY",
  maldives: "MV",
  mali: "ML",
  malta: "MT",
  "marshall islands": "MH",
  mauritania: "MR",
  mauritius: "MU",
  mexico: "MX",
  micronesia: "FM",
  "micronesia fed sts": "FM",
  moldova: "MD",
  monaco: "MC",
  mongolia: "MN",
  montenegro: "ME",
  montserrat: "MS",
  morocco: "MA",
  "morocco western sahara": "MA",
  mozambique: "MZ",
  myanmar: "MM",
  namibia: "NA",
  nauru: "NR",
  nepal: "NP",
  netherlands: "NL",
  "new caledonia": "NC",
  "new zealand": "NZ",
  nicaragua: "NI",
  niger: "NE",
  nigeria: "NG",
  niue: "NU",
  "norfolk island": "NF",
  "north korea": "KP",
  "north macedonia": "MK",
  "northern mariana islands": "MP",
  norway: "NO",
  "occupied palestinian territory": "PS",
  oman: "OM",
  pakistan: "PK",
  palau: "PW",
  palestine: "PS",
  "palestine state of": "PS",
  "palestinian territories": "PS",
  panama: "PA",
  "papua new guinea": "PG",
  paraguay: "PY",
  peru: "PE",
  philippines: "PH",
  "pitcairn islands": "PN",
  "plurinational state of bolivia": "BO",
  poland: "PL",
  portugal: "PT",
  "puerto rico": "PR",
  qatar: "QA",
  "republic of korea": "KR",
  "republic of serbia": "RS",
  "republic of the congo": "CG",
  romania: "RO",
  russia: "RU",
  "russian federation": "RU",
  rwanda: "RW",
  "saint barthelemy": "BL",
  "saint helena": "SH",
  "saint kitts and nevis": "KN",
  "saint lucia": "LC",
  "saint martin": "MF",
  "saint pierre and miquelon": "PM",
  "saint vincent and the grenadines": "VC",
  samoa: "WS",
  "san marino": "SM",
  "sao tome": "ST",
  "sao tome and principe": "ST",
  "saudi arabia": "SA",
  senegal: "SN",
  serbia: "RS",
  seychelles: "SC",
  "sierra leone": "SL",
  singapore: "SG",
  "sint maarten": "SX",
  "slovak republic": "SK",
  slovakia: "SK",
  slovenia: "SI",
  "solomon islands": "SB",
  somalia: "SO",
  "south africa": "ZA",
  "south georgia and the islands": "GS",
  "south korea": "KR",
  "south sudan": "SS",
  spain: "ES",
  "sri lanka": "LK",
  "st kitts and nevis": "KN",
  "st lucia": "LC",
  "st vincent and the grenadines": "VC",
  sudan: "SD",
  suriname: "SR",
  swaziland: "SZ",
  sweden: "SE",
  switzerland: "CH",
  syria: "SY",
  "syrian arab republic": "SY",
  taiwan: "TW",
  tajikistan: "TJ",
  tanzania: "TZ",
  thailand: "TH",
  "the bahamas": "BS",
  "the comoros": "KM",
  "the gambia": "GM",
  "the maldives": "MV",
  "the netherlands": "NL",
  "the philippines": "PH",
  "the seychelles": "SC",
  "timor leste": "TL",
  togo: "TG",
  tonga: "TO",
  "trinidad and tobago": "TT",
  tunisia: "TN",
  turkey: "TR",
  turkiye: "TR",
  turkmenistan: "TM",
  "turks and caicos": "TC",
  "turks and caicos islands": "TC",
  tuvalu: "TV",
  "u s virgin islands": "VI",
  uae: "AE",
  uganda: "UG",
  uk: "GB",
  ukraine: "UA",
  "united arab emirates": "AE",
  "united kingdom": "GB",
  "united republic of tanzania": "TZ",
  "united states": "US",
  "united states minor outlying islands": "UM",
  "united states of america": "US",
  "united states virgin islands": "VI",
  uruguay: "UY",
  usa: "US",
  uzbekistan: "UZ",
  vanuatu: "VU",
  vatican: "VA",
  venezuela: "VE",
  "venezuela rb": "VE",
  "viet nam": "VN",
  vietnam: "VN",
  "virgin islands uk": "VG",
  "wallis and futuna": "WF",
  "west bank": "PS",
  "west bank and gaza": "PS",
  "western sahara": "EH",
  yemen: "YE",
  "yemen rep": "YE",
  zambia: "ZM",
  zimbabwe: "ZW"
};

// server/_shared/country-normalize.ts
var COUNTRY_NAMES = country_names_default;
var ISO2_SET = new Set(Object.values(COUNTRY_NAMES));
function normalizeCountryToIso2(raw) {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  if (trimmed.toLowerCase() === "global") return null;
  if (/^[A-Za-z]{2}$/.test(trimmed)) {
    const upper = trimmed.toUpperCase();
    return ISO2_SET.has(upper) ? upper : null;
  }
  const lookup = COUNTRY_NAMES[trimmed.toLowerCase()];
  return typeof lookup === "string" ? lookup : null;
}

// server/_shared/seed-envelope.ts
function unwrapEnvelope(raw) {
  if (raw == null) return { _seed: null, data: null };
  let value = raw;
  if (typeof value === "string") {
    try {
      value = JSON.parse(value);
    } catch {
      return { _seed: null, data: raw };
    }
  }
  if (typeof value !== "object" || Array.isArray(value)) {
    return { _seed: null, data: value };
  }
  const seed = value._seed;
  if (seed && typeof seed === "object" && typeof seed.fetchedAt === "number") {
    return { _seed: seed, data: value.data };
  }
  return { _seed: null, data: value };
}

// server/_shared/usage.ts
var AXIOM_DATASET = "wm_api_usage";
var AXIOM_INGEST_URL = `https://api.axiom.co/v1/datasets/${AXIOM_DATASET}/ingest`;
var TELEMETRY_TIMEOUT_MS = 1500;
var CB_WINDOW_MS = 5 * 60 * 1e3;
var CB_TRIP_FAILURE_RATIO = 0.05;
var CB_MIN_SAMPLES = 20;
var SAMPLED_DROP_LOG_RATE = 0.01;
function isUsageEnabled() {
  return process.env.USAGE_TELEMETRY === "1";
}
function buildLlmCallEvent(p) {
  return {
    _time: (/* @__PURE__ */ new Date()).toISOString(),
    event_type: "llm_call",
    provider: p.provider,
    model: p.model,
    stage: p.stage,
    ok: p.ok,
    duration_ms: Math.round(p.durationMs),
    tokens_total: p.tokensTotal ?? 0,
    tokens_prompt: p.tokensPrompt ?? 0,
    tokens_completion: p.tokensCompletion ?? 0,
    prompt_chars: p.promptChars,
    max_tokens: p.maxTokens,
    fallback_index: p.fallbackIndex,
    reason: p.reason ?? ""
  };
}
var breakerSamples = [];
var breakerTripped = false;
var breakerLastNotifyTs = 0;
function pruneOldSamples(now) {
  while (breakerSamples.length > 0 && now - breakerSamples[0].ts > CB_WINDOW_MS) {
    breakerSamples.shift();
  }
}
function recordSample(ok) {
  const now = Date.now();
  pruneOldSamples(now);
  breakerSamples.push({ ts: now, ok });
  if (breakerSamples.length < CB_MIN_SAMPLES) {
    breakerTripped = false;
    return;
  }
  let failures = 0;
  for (const s of breakerSamples) if (!s.ok) failures++;
  const ratio = failures / breakerSamples.length;
  const wasTripped = breakerTripped;
  breakerTripped = ratio > CB_TRIP_FAILURE_RATIO;
  if (breakerTripped && !wasTripped && now - breakerLastNotifyTs > CB_WINDOW_MS) {
    breakerLastNotifyTs = now;
    console.error("[usage-telemetry] circuit breaker tripped", {
      ratio: ratio.toFixed(3),
      samples: breakerSamples.length
    });
  }
}
async function sendToAxiom(events) {
  if (!isUsageEnabled()) return;
  if (events.length === 0) return;
  const token = process.env.AXIOM_API_TOKEN;
  if (!token) {
    if (Math.random() < SAMPLED_DROP_LOG_RATE) {
      console.warn("[usage-telemetry] drop", { reason: "no-token" });
    }
    return;
  }
  if (breakerTripped) {
    if (Math.random() < SAMPLED_DROP_LOG_RATE) {
      console.warn("[usage-telemetry] drop", { reason: "breaker-open" });
    }
    return;
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TELEMETRY_TIMEOUT_MS);
  try {
    const resp = await fetch(AXIOM_INGEST_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(events),
      signal: controller.signal
    });
    if (!resp.ok) {
      recordSample(false);
      if (Math.random() < SAMPLED_DROP_LOG_RATE) {
        console.warn("[usage-telemetry] drop", { reason: `http-${resp.status}` });
      }
      return;
    }
    recordSample(true);
  } catch (err) {
    recordSample(false);
    if (Math.random() < SAMPLED_DROP_LOG_RATE) {
      const reason = err instanceof Error && err.name === "AbortError" ? "timeout" : "fetch-error";
      console.warn("[usage-telemetry] drop", { reason });
    }
  } finally {
    clearTimeout(timer);
  }
}
function deliverUsageEvents(events) {
  if (!isUsageEnabled() || events.length === 0) return Promise.resolve();
  return sendToAxiom(events);
}

// server/_shared/redis.ts
function parseTimeoutEnv(raw, defaultMs) {
  const parsed = Number.parseInt(raw ?? "", 10);
  return parsed > 0 ? parsed : defaultMs;
}
var REDIS_OP_TIMEOUT_MS = parseTimeoutEnv(process.env.REDIS_OP_TIMEOUT_MS, 1500);
var REDIS_PIPELINE_TIMEOUT_MS = parseTimeoutEnv(process.env.REDIS_PIPELINE_TIMEOUT_MS, 5e3);
function errMsg(err) {
  return err instanceof Error ? err.message : String(err);
}
function getKeyPrefix() {
  const env = process.env.VERCEL_ENV;
  if (!env || env === "production") return "";
  const sha = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 8) || "dev";
  return `${env}:${sha}:`;
}
var cachedPrefix;
function prefixKey(key) {
  if (cachedPrefix === void 0) cachedPrefix = getKeyPrefix();
  if (!cachedPrefix) return key;
  return `${cachedPrefix}${key}`;
}
async function readCachedJson(key, raw = false) {
  if (process.env.LOCAL_API_MODE === "tauri-sidecar") {
    try {
      const { sidecarCacheGet: sidecarCacheGet2 } = await Promise.resolve().then(() => (init_sidecar_cache(), sidecar_cache_exports));
      const value = sidecarCacheGet2(key);
      return value == null ? { status: "miss" } : { status: "hit", value };
    } catch (error) {
      return { status: "error", error };
    }
  }
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return { status: "miss" };
  try {
    const finalKey = raw ? key : prefixKey(key);
    const resp = await fetch(`${url}/get/${encodeURIComponent(finalKey)}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(REDIS_OP_TIMEOUT_MS)
    });
    if (!resp.ok) throw new Error(`Redis HTTP ${resp.status}`);
    const data = await resp.json();
    if (!data.result) return { status: "miss" };
    return {
      status: "hit",
      value: unwrapEnvelope(JSON.parse(data.result)).data
    };
  } catch (error) {
    return { status: "error", error };
  }
}
function logCacheReadError(key, err) {
  const isTimeout = err instanceof Error && (err.name === "TimeoutError" || err.name === "AbortError");
  if (isTimeout) {
    console.error(`[REDIS-TIMEOUT] getCachedJson key=${key} timeoutMs=${REDIS_OP_TIMEOUT_MS}`);
  } else {
    console.warn("[redis] getCachedJson failed:", errMsg(err));
  }
}
async function getCachedJson(key, raw = false) {
  const read = await readCachedJson(key, raw);
  if (read.status === "hit") return read.value;
  if (read.status === "error") logCacheReadError(key, read.error);
  return null;
}

// shared/bootstrap-tier-keys.js
var BOOTSTRAP_CACHE_KEYS = Object.freeze({
  earthquakes: "seismology:earthquakes:v1",
  outages: "infra:outages:v1",
  serviceStatuses: "infra:service-statuses:v1",
  ddosAttacks: "cf:radar:ddos:v1",
  trafficAnomalies: "cf:radar:traffic-anomalies:v1",
  marketQuotes: "market:stocks-bootstrap:v1",
  commodityQuotes: "market:commodities-bootstrap:v1",
  sectors: "market:sectors:v2",
  etfFlows: "market:etf-flows:v1",
  macroSignals: "economic:macro-signals:v1",
  bisPolicy: "economic:bis:policy:v1",
  bisExchange: "economic:bis:eer:v1",
  bisCredit: "economic:bis:credit:v1",
  bisDsr: "economic:bis:dsr:v1",
  bisPropertyResidential: "economic:bis:property-residential:v1",
  bisPropertyCommercial: "economic:bis:property-commercial:v1",
  imfMacro: "economic:imf:macro:v2",
  imfGrowth: "economic:imf:growth:v1",
  imfLabor: "economic:imf:labor:v1",
  imfExternal: "economic:imf:external:v1",
  chinaMacro: "economic:china:macro:v1",
  chinaReleaseCalendar: "economic:china:release-calendar:v1",
  shippingRates: "supply_chain:shipping:v2",
  chokepoints: "supply_chain:chokepoints:v4",
  minerals: "supply_chain:minerals:v2",
  giving: "giving:summary:v1",
  climateAnomalies: "climate:anomalies:v2",
  climateDisasters: "climate:disasters:v1",
  co2Monitoring: "climate:co2-monitoring:v1",
  oceanIce: "climate:ocean-ice:v1",
  climateNews: "climate:news-intelligence:v1",
  radiationWatch: "radiation:observations:v1",
  thermalEscalation: "thermal:escalation-bootstrap:v1",
  crossSourceSignals: "intelligence:cross-source-signals:v1",
  wildfires: "wildfire:fires-bootstrap:v1",
  cyberThreats: "cyber:threats-bootstrap:v2",
  techReadiness: "economic:worldbank-techreadiness:v1",
  progressData: "economic:worldbank-progress:v1",
  renewableEnergy: "economic:worldbank-renewable:v1",
  positiveGeoEvents: "positive_events:geo-bootstrap:v1",
  theaterPosture: "theater_posture:sebuf:stale:v1",
  riskScores: "risk:scores:sebuf:stale:v8",
  naturalEvents: "natural:events:v1",
  flightDelays: "aviation:delays-bootstrap:v2",
  insights: "news:insights:v1",
  predictions: "prediction:markets-bootstrap:v1",
  cryptoQuotes: "market:crypto:v1",
  cryptoSectors: "market:crypto-sectors:v1",
  defiTokens: "market:defi-tokens:v1",
  aiTokens: "market:ai-tokens:v1",
  otherTokens: "market:other-tokens:v1",
  gulfQuotes: "market:gulf-quotes:v1",
  stablecoinMarkets: "market:stablecoins:v1",
  unrestEvents: "unrest:events:v1",
  iranEvents: "conflict:iran-events:v1",
  ucdpEvents: "conflict:ucdp-events-bootstrap:v1",
  temporalAnomalies: "temporal:anomalies:v1",
  weatherAlerts: "weather:alerts:v1",
  spending: "economic:spending:v1",
  techEvents: "research:tech-events-bootstrap:v1",
  gdeltIntel: "intelligence:gdelt-intel:v1",
  correlationCards: "correlation:cards-bootstrap:v1",
  forecasts: "forecast:predictions-bootstrap:v1",
  securityAdvisories: "intelligence:advisories-bootstrap:v1",
  customsRevenue: "trade:customs-revenue:v1",
  sanctionsPressure: "sanctions:pressure:v1",
  consumerPricesOverview: "consumer-prices:overview:ae",
  consumerPricesCategories: "consumer-prices:categories:ae:30d",
  consumerPricesMovers: "consumer-prices:movers:ae:30d",
  consumerPricesSpread: "consumer-prices:retailer-spread:ae:essentials-ae",
  groceryBasket: "economic:grocery-basket:v1",
  bigmac: "economic:bigmac:v1",
  fuelPrices: "economic:fuel-prices:v1",
  faoFoodPriceIndex: "economic:fao-ffpi:v1",
  nationalDebt: "economic:national-debt:v1",
  euGasStorage: "economic:eu-gas-storage:v1",
  eurostatCountryData: "economic:eurostat-country-data:v1",
  eurostatHousePrices: "economic:eurostat:house-prices:v1",
  eurostatGovDebtQ: "economic:eurostat:gov-debt-q:v1",
  eurostatIndProd: "economic:eurostat:industrial-production:v1",
  marketImplications: "intelligence:market-implications:v1",
  fearGreedIndex: "market:fear-greed:v1",
  hyperliquidFlow: "market:hyperliquid:flow:v1",
  crudeInventories: "economic:crude-inventories:v1",
  natGasStorage: "economic:nat-gas-storage:v1",
  ecbFxRates: "economic:ecb-fx-rates:v1",
  euFsi: "economic:fsi-eu:v1",
  shippingStress: "supply_chain:shipping_stress:v1",
  socialVelocity: "intelligence:social:reddit:v1",
  wsbTickers: "intelligence:wsb-tickers:v1",
  pizzint: "intelligence:pizzint:seed:v1",
  diseaseOutbreaks: "health:disease-outbreaks:v1",
  economicStress: "economic:stress-index:v1",
  electricityPrices: "energy:electricity:v1:index",
  jodiOil: "energy:jodi-oil:v1:_countries",
  chokepointBaselines: "energy:chokepoint-baselines:v1",
  portwatchChokepointsRef: "portwatch:chokepoints:ref:v1",
  portwatchPortActivity: "supply_chain:portwatch-ports:v1:_countries",
  oilStocksAnalysis: "energy:oil-stocks-analysis:v1",
  lngVulnerability: "energy:lng-vulnerability:v1",
  sprPolicies: "energy:spr-policies:v1",
  pipelinesGas: "energy:pipelines:gas:v1",
  pipelinesOil: "energy:pipelines:oil:v1",
  storageFacilities: "energy:storage-facilities:v1",
  fuelShortages: "energy:fuel-shortages:v1",
  energyDisruptions: "energy:disruptions:v1",
  energyCrisisPolicies: "energy:crisis-policies:v1",
  aaiiSentiment: "market:aaii-sentiment:v1",
  breadthHistory: "market:breadth-history:v1"
});
var SLOW_KEY_NAMES = /* @__PURE__ */ new Set([
  "bisPolicy",
  "bisExchange",
  "bisCredit",
  "chinaMacro",
  "chinaReleaseCalendar",
  "minerals",
  "giving",
  "sectors",
  "etfFlows",
  "wildfires",
  "climateAnomalies",
  "climateDisasters",
  "co2Monitoring",
  "oceanIce",
  "climateNews",
  "radiationWatch",
  "thermalEscalation",
  "crossSourceSignals",
  "techReadiness",
  "progressData",
  "renewableEnergy",
  "naturalEvents",
  "cryptoQuotes",
  "cryptoSectors",
  "defiTokens",
  "aiTokens",
  "otherTokens",
  "gulfQuotes",
  "stablecoinMarkets",
  "unrestEvents",
  "ucdpEvents",
  "techEvents",
  "securityAdvisories",
  "customsRevenue",
  "sanctionsPressure",
  "consumerPricesOverview",
  "consumerPricesCategories",
  "consumerPricesMovers",
  "consumerPricesSpread",
  "groceryBasket",
  "bigmac",
  "fuelPrices",
  "faoFoodPriceIndex",
  "nationalDebt",
  "euGasStorage",
  "eurostatCountryData",
  "marketImplications",
  "fearGreedIndex",
  "hyperliquidFlow",
  "crudeInventories",
  "natGasStorage",
  "ecbFxRates",
  "euFsi",
  "diseaseOutbreaks",
  "economicStress",
  "pizzint",
  "oilStocksAnalysis",
  "lngVulnerability",
  "pipelinesGas",
  "pipelinesOil",
  "storageFacilities",
  "fuelShortages",
  "energyCrisisPolicies",
  "aaiiSentiment",
  "breadthHistory"
]);
var FAST_KEY_NAMES = /* @__PURE__ */ new Set([
  "earthquakes",
  "outages",
  "serviceStatuses",
  "ddosAttacks",
  "trafficAnomalies",
  "macroSignals",
  "chokepoints",
  "marketQuotes",
  "commodityQuotes",
  "positiveGeoEvents",
  "riskScores",
  "flightDelays",
  "insights",
  "predictions",
  "iranEvents",
  "temporalAnomalies",
  "weatherAlerts",
  "spending",
  "theaterPosture",
  "gdeltIntel",
  "correlationCards",
  "forecasts",
  "shippingRates",
  "shippingStress",
  "socialVelocity",
  "wsbTickers"
]);
var ON_DEMAND_KEY_NAMES = /* @__PURE__ */ new Set([
  "cyberThreats",
  "bisDsr",
  "bisPropertyResidential",
  "bisPropertyCommercial",
  "imfMacro",
  "imfGrowth",
  "imfLabor",
  "imfExternal",
  "eurostatHousePrices",
  "eurostatGovDebtQ",
  "eurostatIndProd",
  "electricityPrices",
  "jodiOil",
  "chokepointBaselines",
  "portwatchChokepointsRef",
  "portwatchPortActivity",
  "sprPolicies",
  "energyDisruptions"
]);
function tierForKey(name) {
  if (FAST_KEY_NAMES.has(name)) return "fast";
  if (SLOW_KEY_NAMES.has(name)) return "slow";
  if (ON_DEMAND_KEY_NAMES.has(name)) return "on-demand";
  throw new Error(`Bootstrap cache key "${name}" has no tier assignment`);
}
var BOOTSTRAP_TIERS = Object.freeze(Object.fromEntries(
  Object.keys(BOOTSTRAP_CACHE_KEYS).map((name) => [name, tierForKey(name)])
));

// server/_shared/cache-keys.ts
var CII_RISK_SCORE_CACHE_KEYS = {
  live: "risk:scores:sebuf:v8",
  stale: "risk:scores:sebuf:stale:v8",
  trendHistoryPrefix: "risk:scores:sebuf:trend-history:v8"
};

// server/_shared/llm-sanitize.js
var INJECTION_PATTERNS = [
  // Model-specific delimiter tokens
  /<\|(?:im_start|im_end|begin_of_text|end_of_text|eot_id|start_header_id|end_header_id)\|>/gi,
  /<\|(?:endoftext|fim_prefix|fim_middle|fim_suffix|pad)\|>/gi,
  /\[(?:INST|\/INST|SYS|\/SYS)\]/gi,
  /<\/?(system|user|assistant|prompt|context|instruction)\b[^>]*>/gi,
  // Role override markers at line start
  /(?:^|\n)\s*(?:#{1,4}\s*)?(?:\[|\()?\s*(?:system|human|gpt|claude|llm|model|prompt)\s*(?:\]|\))?\s*:/gim,
  // Explicit instruction-override phrases
  /ignore\s+(?:all\s+)?(?:previous|above|prior|earlier|the\s+above)\s+instructions?\b/gi,
  /(?:disregard|forget|bypass|override|overwrite|skip)\s+(?:all\s+)?(?:previous|above|prior|earlier|your|the)\s+(?:instructions?|prompt|rules?|guidelines?|constraints?|training)\b/gi,
  /(?:you\s+are\s+now|act\s+as|pretend\s+(?:to\s+be|you\s+are)|roleplay\s+as|simulate\s+(?:being\s+)?a)\s+(?:a\s+|an\s+)?(?:(?:different|new|another|unrestricted|jailbroken|evil|helpful)\s+)?(?:ai|assistant|model|chatbot|llm|bot|gpt|claude)\b/gi,
  /do\s+not\s+(?:follow|obey|adhere\s+to|comply\s+with)\s+(?:the\s+)?(?:previous|above|system|original)\s+(?:instructions?|rules?|prompt)\b/gi,
  /(?:output|print|display|reveal|show|repeat|recite|write\s+out)\s+(?:your\s+)?(?:system\s+prompt|instructions?|initial\s+prompt|original\s+prompt|context)\b/gi,
  // Prompt boundary separator lines
  /^[-=]{3,}$/gm,
  /^#{3,}\s/gm
];
var ROLE_PREFIX_RE = /^\s*(?:#{1,4}\s*)?(?:\[|\()?\s*(?:user|assistant|bot)\s*(?:\]|\))?\s*:\s*/i;
var ROLE_OVERRIDE_STRONG_RE = /\b(?:you\s+are\s+now|act\s+as|pretend\s+(?:to\s+be|you\s+are)|roleplay\s+as|simulate\s+(?:being\s+)?a|from\s+now\s+on|do\s+not\s+(?:follow|obey|adhere\s+to|comply\s+with))\b/i;
var ROLE_OVERRIDE_COMMAND_RE = /\b(?:ignore|disregard|forget|bypass|override|overwrite|skip|reveal|output|print|display|show|repeat|recite|write\s+out)\b/i;
var ROLE_OVERRIDE_FOLLOW_RE = /\b(?:follow|obey)\s+(?:all\s+)?(?:the\s+|my\s+|your\s+)?(?:instructions?|prompt|rules?|guidelines?|constraints?)\b/i;
var ROLE_OVERRIDE_TARGET_RE = /\b(?:instructions?|prompt|system|rules?|guidelines?|constraints?|training|context|developer\s+message)\b/i;
function isRolePrefixedInjectionLine(line) {
  if (!ROLE_PREFIX_RE.test(line)) return false;
  if (ROLE_OVERRIDE_STRONG_RE.test(line)) return true;
  if (ROLE_OVERRIDE_FOLLOW_RE.test(line)) return true;
  return ROLE_OVERRIDE_COMMAND_RE.test(line) && ROLE_OVERRIDE_TARGET_RE.test(line);
}
var CONTROL_CHARS_RE = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F\xAD\u200B-\u200D\u2028\u2029\uFEFF]/g;
function sanitizeForPrompt(input) {
  if (typeof input !== "string") return "";
  let s = input;
  s = s.replace(CONTROL_CHARS_RE, "");
  s = s.split("\n").filter((line) => !isRolePrefixedInjectionLine(line)).join("\n");
  for (const pattern of INJECTION_PATTERNS) {
    pattern.lastIndex = 0;
    s = s.replace(pattern, " ");
  }
  s = s.replace(/\s{2,}/g, " ").trim();
  return s;
}

// server/_shared/constants.ts
var CHROME_UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
var yahooQueue = Promise.resolve();
var finnhubQueue = Promise.resolve();

// server/worldmonitor/intelligence/v1/chat-analyst-context.ts
function safeStr(v) {
  return typeof v === "string" ? v : "";
}
function safeNum(v) {
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}
function formatPct(n) {
  return `${Math.round(n)}%`;
}
function formatChange(n) {
  return `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
}
function buildWorldBrief(data) {
  if (!data || typeof data !== "object") return "";
  const d = data;
  const lines = [];
  const briefText = sanitizeForPrompt(safeStr(d.worldBrief || d.brief || d.summary || d.content || d.text));
  if (briefText) lines.push(briefText.slice(0, 600));
  const stories = Array.isArray(d.topStories) ? d.topStories : Array.isArray(d.stories) ? d.stories : [];
  if (stories.length > 0) {
    lines.push("Top Events:");
    for (const s of stories.slice(0, 12)) {
      const story = s;
      const title = sanitizeForPrompt(safeStr(story.primaryTitle || story.headline || story.title || s));
      if (title) lines.push(`- ${title}`);
    }
  }
  return lines.join("\n");
}
function buildRiskScores(data) {
  if (!data || typeof data !== "object") return "";
  const d = data;
  const scores = Array.isArray(d.scores) ? d.scores : Array.isArray(d.countries) ? d.countries : [];
  if (!scores.length) return "";
  const top15 = scores.slice().sort((a, b) => {
    const sa = safeNum(a?.score ?? a?.cii);
    const sb = safeNum(b?.score ?? b?.cii);
    return sb - sa;
  }).slice(0, 15);
  const lines = top15.map((s) => {
    const sc = s;
    const country = safeStr(sc.countryName || sc.name || sc.country);
    const score = safeNum(sc.score ?? sc.cii ?? sc.value);
    if (!country) return null;
    return `- ${country}: ${score.toFixed(1)}`;
  }).filter((l) => l !== null);
  return lines.length ? `Top Risk Countries:
${lines.join("\n")}` : "";
}
function buildForecasts(data) {
  if (!data || typeof data !== "object") return "";
  const d = data;
  const predictions = Array.isArray(d.predictions) ? d.predictions : [];
  if (!predictions.length) return "";
  const lines = predictions.slice(0, 8).map((p) => {
    const pred = p;
    const title = safeStr(pred.title || pred.event);
    const domain = safeStr(pred.domain || pred.category);
    const prob = safeNum(pred.probability ?? pred.prob);
    if (!title) return null;
    const probStr = prob > 0 ? ` \u2014 ${formatPct(prob > 1 ? prob : prob * 100)}` : "";
    return `- [${domain || "General"}] ${title}${probStr}`;
  }).filter((l) => l !== null);
  return lines.length ? `Active Forecasts:
${lines.join("\n")}` : "";
}
function buildMarketData(stocks, commodities) {
  const parts = [];
  if (stocks && typeof stocks === "object") {
    const d = stocks;
    const quotes = Array.isArray(d.quotes) ? d.quotes : [];
    const stockLines = quotes.slice(0, 6).map((q) => {
      const quote = q;
      const sym = safeStr(quote.symbol || quote.ticker);
      const price = safeNum(quote.price ?? quote.regularMarketPrice);
      const chg = safeNum(quote.changePercent ?? quote.regularMarketChangePercent);
      if (!sym || !price) return null;
      return `${sym} $${price.toFixed(2)} (${formatChange(chg)})`;
    }).filter((l) => l !== null);
    if (stockLines.length) parts.push(`Equities: ${stockLines.join(", ")}`);
  }
  if (commodities && typeof commodities === "object") {
    const d = commodities;
    const quotes = Array.isArray(d.quotes) ? d.quotes : [];
    const commLines = quotes.slice(0, 4).map((q) => {
      const quote = q;
      const sym = safeStr(quote.symbol || quote.ticker || quote.name);
      const price = safeNum(quote.price ?? quote.regularMarketPrice);
      const chg = safeNum(quote.changePercent ?? quote.regularMarketChangePercent);
      if (!sym || !price) return null;
      return `${sym} $${price.toFixed(2)} (${formatChange(chg)})`;
    }).filter((l) => l !== null);
    if (commLines.length) parts.push(`Commodities: ${commLines.join(", ")}`);
  }
  return parts.length ? `Market Data:
${parts.join("\n")}` : "";
}
function buildMacroSignals(data) {
  if (!data || typeof data !== "object") return "";
  const d = data;
  const verdict = safeStr(d.verdict || d.regime || d.signal);
  const active = Array.isArray(d.activeSignals) ? d.activeSignals : Array.isArray(d.signals) ? d.signals : [];
  const lines = [];
  if (verdict) lines.push(`Regime: ${verdict}`);
  for (const s of active.slice(0, 4)) {
    const sig = s;
    const name = safeStr(sig.name || sig.label);
    if (name) lines.push(`- ${name}`);
  }
  return lines.length ? `Macro Signals:
${lines.join("\n")}` : "";
}
function buildCountryBrief(data) {
  if (!data || typeof data !== "object") return "";
  const d = data;
  const brief = safeStr(d.brief || d.analysis || d.content || d.summary);
  const country = safeStr(d.countryName || d.country || d.name);
  if (!brief) return "";
  return `Country Focus${country ? ` \u2014 ${country}` : ""}:
${brief.slice(0, 500)}`;
}

// server/worldmonitor/intelligence/v1/brief-story-context.ts
async function assembleBriefStoryContext(args) {
  const iso2 = args.iso2;
  const countryKey = iso2 ? `intelligence:country-brief:v1:${iso2}` : null;
  const [
    insightsResult,
    riskResult,
    forecastsResult,
    stocksResult,
    commoditiesResult,
    macroResult,
    countryResult
  ] = await Promise.allSettled([
    getCachedJson("news:insights:v1", true),
    getCachedJson(CII_RISK_SCORE_CACHE_KEYS.stale, true),
    getCachedJson("forecast:predictions:v2", true),
    getCachedJson("market:stocks-bootstrap:v1", true),
    getCachedJson("market:commodities-bootstrap:v1", true),
    getCachedJson("economic:macro-signals:v1", true),
    countryKey ? getCachedJson(countryKey, true) : Promise.resolve(null)
  ]);
  const get = (r) => r.status === "fulfilled" ? r.value : null;
  const coreResults = [
    insightsResult,
    riskResult,
    forecastsResult,
    stocksResult,
    commoditiesResult,
    macroResult
  ];
  const failCount = coreResults.filter(
    (r) => r.status === "rejected" || r.value === null || r.value === void 0
  ).length;
  return {
    worldBrief: buildWorldBrief(get(insightsResult)),
    countryBrief: buildCountryBrief(get(countryResult)),
    riskScores: buildRiskScores(get(riskResult)),
    forecasts: buildForecasts(get(forecastsResult)),
    marketData: buildMarketData(get(stocksResult), get(commoditiesResult)),
    macroSignals: buildMacroSignals(get(macroResult)),
    degraded: failCount > 2
  };
}

// shared/brief-llm-core.js
var WHY_MATTERS_SYSTEM = 'You are the editor of WorldMonitor Brief, a geopolitical intelligence magazine. For each story below, write ONE concise sentence (18\u201330 words) explaining the regional or global stakes. Editorial, impersonal, serious. No preamble ("This matters because\u2026"), no questions, no calls to action, no markdown, no quotes. One sentence only.';
var WHY_MATTERS_V1_MIN_CHARS = 30;
var WHY_MATTERS_V1_MAX_CHARS = 400;
var WHY_MATTERS_V2_MIN_CHARS = 100;
var WHY_MATTERS_V2_MAX_CHARS = 500;
function briefDateLine(todayIso) {
  const iso = typeof todayIso === "string" && /^\d{4}-\d{2}-\d{2}$/.test(todayIso) ? todayIso : (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  return `Today is ${iso}. Do not state any year or date that contradicts the dates in the stories below; when a date is not given, omit it rather than guess.`;
}
function buildWhyMattersUserPrompt(story, todayIso) {
  const user = [
    `Headline: ${story.headline}`,
    `Source: ${story.source}`,
    `Severity: ${story.threatLevel}`,
    `Category: ${story.category}`,
    `Country: ${story.country}`,
    "",
    "One editorial sentence on why this matters:"
  ].join("\n");
  return { system: `${WHY_MATTERS_SYSTEM}
${briefDateLine(todayIso)}`, user };
}
function hasTerminalPunctuation(text) {
  if (typeof text !== "string") return false;
  const s = text.trim();
  const prose = s.replace(/["'\u2019\u201D]+$/, "");
  if (/(?:\.\.\.|\u2026)$/.test(prose)) return false;
  return /[.!?]$/.test(prose);
}
function parseWhyMatters(text) {
  if (typeof text !== "string") return null;
  let s = text.trim();
  if (!s) return null;
  s = s.replace(/^[\u201C"']+/, "").replace(/[\u201D"']+$/, "").trim();
  if (!hasTerminalPunctuation(s)) return null;
  if (s.length < WHY_MATTERS_V1_MIN_CHARS || s.length > WHY_MATTERS_V1_MAX_CHARS) return null;
  if (/^story flagged by your sensitivity/i.test(s)) return null;
  return s;
}
async function hashBriefStory(story) {
  const material = [
    story.headline ?? "",
    story.source ?? "",
    story.threatLevel ?? "",
    story.category ?? "",
    story.country ?? "",
    // New in v5: description is a prompt input on the analyst path,
    // so MUST be part of cache identity. Absent on legacy paths →
    // empty string → deterministic; same-story-same-description pairs
    // still collide on purpose, different descriptions don't.
    story.description ?? ""
  ].join("||");
  const bytes = new TextEncoder().encode(material);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  let hex = "";
  const view = new Uint8Array(digest);
  for (let i = 0; i < view.length; i++) {
    hex += view[i].toString(16).padStart(2, "0");
  }
  return hex.slice(0, 16);
}
var WHY_MATTERS_ANALYST_SYSTEM_V2 = `You are the lead analyst at WorldMonitor Brief, a geopolitical intelligence magazine. Using the story as the primary source and the optional Live WorldMonitor Context only when it is materially connected, write 1\u20132 sentences (25\u201340 words total) on why the story matters.

VOICE:
- Be concise: high signal density, every word earns its place. Do not pad to fill the range or restate the headline.
- Vary sentence structure and emphasis across stories; choose the natural angle for this story rather than following a fixed sequence.
- Do not default to a second sentence beginning "This\u2026" or a "Watch for\u2026" closing construction.
- Ground the prose in a SPECIFIC named actor, metric, date, or place relevant to this story.

HARD CONSTRAINTS:
- Total length 25\u201340 words across 1\u20132 sentences.
- MUST reference at least ONE specific: named person / country / organization / number / percentage / date / city.
- No preamble ("This matters because\u2026", "The importance of\u2026").
- No markdown, no bullet points, no section labels in the output \u2014 plain prose.
- Editorial, impersonal, serious. No calls to action, no questions, no quotes.

RELEVANCE RULE (critical, read carefully):
- The context block may contain facts from world-brief, country-brief, risk scores, forecasts, macro signals, and market data. These are optional BACKGROUND, not a mandatory narrative \u2014 most stories should not mention the global context. Only cite what is directly relevant to this story's category and country.
- If NO context fact clearly fits, ground instead in a named actor, place, date, or figure drawn from the headline or description. That is a VALID grounding \u2014 do NOT invent a market reading, VIX value, or forecast probability to satisfy the rule.
- Treat internal forecast figures as private reasoning input. Do not quote raw forecast probabilities or present a WorldMonitor forecast as a user-facing fact.
- NEVER drag an off-topic market metric, FX reading, or probability into a humanitarian, aviation, diplomacy, or cyber story. A story about a refugee flow does not need a VIX number; a story about a drone incursion does not need an FX stress reading. If it isn't editorially connected to the story, leave it out.`;
function parseWhyMattersV2(text, provenance) {
  if (typeof text !== "string") return null;
  let s = text.trim();
  if (!s) return null;
  s = s.replace(/^[\u201C"']+/, "").replace(/[\u201D"']+$/, "").trim();
  if (s.length < WHY_MATTERS_V2_MIN_CHARS || s.length > WHY_MATTERS_V2_MAX_CHARS) return null;
  if (!hasTerminalPunctuation(s)) return null;
  if (/^story flagged by your sensitivity/i.test(s)) return null;
  if (/^(this matters because|the importance of|it is important|importantly,|in summary,|to summarize)/i.test(s)) {
    return null;
  }
  if (/^(#|-|\*|\d+\.\s)/.test(s)) return null;
  if (/^(situation|analysis|watch)\s*[:\-–—]/i.test(s)) return null;
  const percentageValues = (value) => {
    if (typeof value !== "string" || value.length === 0) return /* @__PURE__ */ new Set();
    const values = /* @__PURE__ */ new Set();
    const percentage = /(?:^|[^\d.])(\d{1,3}(?:\.\d+)?)\s*(?:%|per\s*cent\b)/gi;
    for (const match of value.matchAll(percentage)) {
      const number = Number(match[1]);
      if (Number.isFinite(number)) values.add(String(number));
    }
    return values;
  };
  const privateValues = percentageValues(provenance?.privateForecasts);
  if (privateValues.size > 0) {
    const publicStory = provenance?.publicStory;
    const publicText = [publicStory?.headline, publicStory?.description, publicStory?.source].filter((value) => typeof value === "string").join("\n");
    const publicValues = percentageValues(publicText);
    const outputValues = percentageValues(s);
    for (const value of outputValues) {
      if (privateValues.has(value) && !publicValues.has(value)) return null;
    }
  }
  return s;
}
var ACRONYM_EXPANSIONS = [
  ["WHO", "World Health Organization"],
  ["UN", "United Nations"],
  ["US", "USA", "United States", "United States of America", "America"],
  ["UK", "United Kingdom", "Britain", "Great Britain"],
  ["EU", "European Union"],
  ["IDF", "Israel Defense Forces", "Israeli Defense Forces"],
  ["IMF", "International Monetary Fund"],
  ["WTO", "World Trade Organization"],
  ["NATO", "North Atlantic Treaty Organization"],
  ["OECD"],
  ["OPEC", "Organization of the Petroleum Exporting Countries"],
  ["IAEA", "International Atomic Energy Agency"],
  ["ASEAN"],
  ["ECOWAS"],
  ["BRICS"],
  ["DOJ", "Department of Justice", "Justice Department"],
  ["FBI", "Federal Bureau of Investigation"],
  ["SEC", "Securities and Exchange Commission"],
  ["CIA", "Central Intelligence Agency"],
  ["NSA", "National Security Agency"],
  ["DOD", "Department of Defense", "Defense Department", "Pentagon"],
  ["DR Congo", "Democratic Republic of Congo", "DRC"],
  ["UAE", "United Arab Emirates"]
];
var DEMONYM_TO_NATION = /* @__PURE__ */ new Map([
  ["Israeli", "Israel"],
  ["Israelis", "Israel"],
  ["American", "United States"],
  ["Americans", "United States"],
  ["Iranian", "Iran"],
  ["Iranians", "Iran"],
  ["Russian", "Russia"],
  ["Russians", "Russia"],
  ["Chinese", "China"],
  ["French", "France"],
  ["German", "Germany"],
  ["Germans", "Germany"],
  ["Japanese", "Japan"],
  ["Lebanese", "Lebanon"],
  ["Syrian", "Syria"],
  ["Syrians", "Syria"],
  ["Saudi", "Saudi Arabia"],
  ["Saudis", "Saudi Arabia"],
  ["Egyptian", "Egypt"],
  ["Egyptians", "Egypt"],
  ["Turkish", "Turkey"],
  ["Turks", "Turkey"],
  ["Indian", "India"],
  ["Indians", "India"],
  ["Pakistani", "Pakistan"],
  ["Pakistanis", "Pakistan"],
  ["British", "United Kingdom"],
  ["Briton", "United Kingdom"],
  ["Britons", "United Kingdom"],
  ["Ukrainian", "Ukraine"],
  ["Ukrainians", "Ukraine"],
  ["Palestinian", "Palestine"],
  ["Palestinians", "Palestine"],
  ["Yemeni", "Yemen"],
  ["Yemenis", "Yemen"],
  ["Iraqi", "Iraq"],
  ["Iraqis", "Iraq"],
  ["Afghan", "Afghanistan"],
  ["Afghans", "Afghanistan"],
  ["Spanish", "Spain"],
  ["Italian", "Italy"],
  ["Italians", "Italy"],
  ["Korean", "Korea"],
  ["Koreans", "Korea"],
  ["Vietnamese", "Vietnam"],
  ["Mexican", "Mexico"],
  ["Mexicans", "Mexico"],
  ["Brazilian", "Brazil"],
  ["Brazilians", "Brazil"],
  ["Canadian", "Canada"],
  ["Canadians", "Canada"],
  ["Australian", "Australia"],
  ["Australians", "Australia"],
  ["Cuban", "Cuba"],
  ["Cubans", "Cuba"],
  ["Venezuelan", "Venezuela"],
  ["Venezuelans", "Venezuela"],
  ["Argentine", "Argentina"],
  ["Argentinian", "Argentina"],
  ["Argentinians", "Argentina"],
  ["Polish", "Poland"],
  ["Dutch", "Netherlands"],
  ["Greek", "Greece"],
  ["Greeks", "Greece"],
  ["Portuguese", "Portugal"],
  ["Swiss", "Switzerland"],
  ["Swedish", "Sweden"],
  ["Swedes", "Sweden"],
  ["Norwegian", "Norway"],
  ["Norwegians", "Norway"],
  ["Finnish", "Finland"],
  ["Finns", "Finland"],
  ["Danish", "Denmark"],
  ["Danes", "Denmark"],
  ["Belgian", "Belgium"],
  ["Belgians", "Belgium"],
  ["Austrian", "Austria"],
  ["Austrians", "Austria"],
  ["Filipino", "Philippines"],
  ["Filipinos", "Philippines"],
  ["Thai", "Thailand"],
  ["Thais", "Thailand"],
  ["Indonesian", "Indonesia"],
  ["Indonesians", "Indonesia"],
  ["Nigerian", "Nigeria"],
  ["Nigerians", "Nigeria"],
  ["Ethiopian", "Ethiopia"],
  ["Ethiopians", "Ethiopia"],
  ["Kenyan", "Kenya"],
  ["Kenyans", "Kenya"],
  ["South Korean", "South Korea"],
  ["South Koreans", "South Korea"],
  ["North Korean", "North Korea"],
  ["North Koreans", "North Korea"]
]);
var ACRONYM_NORMALIZE = (() => {
  const map = /* @__PURE__ */ new Map();
  for (const group of ACRONYM_EXPANSIONS) {
    const canonical = group[0].toLowerCase();
    for (const variant of group) map.set(variant.toLowerCase(), canonical);
  }
  return map;
})();
var DEMONYM_NORMALIZE = (() => {
  const map = /* @__PURE__ */ new Map();
  for (const [demonym, nation] of DEMONYM_TO_NATION) {
    map.set(demonym.toLowerCase(), nation.toLowerCase());
  }
  return map;
})();

// server/worldmonitor/intelligence/v1/brief-why-matters-prompt.ts
function sanitizeStoryFields(story) {
  return {
    headline: sanitizeForPrompt(story.headline),
    source: sanitizeForPrompt(story.source),
    threatLevel: sanitizeForPrompt(story.threatLevel),
    category: sanitizeForPrompt(story.category),
    country: sanitizeForPrompt(story.country),
    ...typeof story.description === "string" && story.description.length > 0 ? { description: sanitizeForPrompt(story.description) } : {}
  };
}
var CONTEXT_BUDGET_CHARS = 1700;
var SECTION_CAPS = [
  { key: "worldBrief", label: "World Brief", cap: 500 },
  { key: "countryBrief", label: "Country Brief", cap: 400 },
  { key: "riskScores", label: "Risk Scores", cap: 250 },
  { key: "forecasts", label: "Forecasts", cap: 250 },
  { key: "macroSignals", label: "Macro Signals", cap: 200 },
  { key: "marketData", label: "Market Data", cap: 200 }
];
var DEFAULT_SECTIONS = [
  "worldBrief",
  "countryBrief",
  "riskScores",
  "forecasts",
  "macroSignals",
  "marketData"
];
var LOCAL_SECTIONS = ["countryBrief", "riskScores"];
var LOCAL_HISTORY_OR_HUMAN_INTEREST_RE = /\b(?:historical memory|anniversar(?:y|ies)|commemorat(?:e|es|ed|ing|ion|ions)|memorials?|retrospective|survivors?\s+of\s+(?:the\s+)?(?:19|20)\d{2}|human[\s-]?interest|obituar(?:y|ies)|celebrit(?:y|ies)|entertainment)\b/i;
var LOCAL_JUSTICE_RE = /\b(?:court|judge|judicial|plaintiffs?|defendants?|lawsuits?|rulings?|sentenc(?:e|es|ed|ing)|convict(?:ed|ion|ions)?|extradit(?:e|es|ed|ing|ion|ions)|guilty pleas?|pleads? guilty|prosecut(?:e|es|ed|ing|ion|ions|or|ors)|indict(?:ed|ment|ments)?|trials?|appeals?|reparations?)\b/i;
var ACTIVE_GEOPOLITICAL_RE = /\b(?:airstrikes?|missiles?|troops?|military|war|armed conflict|ceasefires?|invasion|bombing|drone strikes?|nuclear|hostages?|genocides?|ethnic cleansing|terror(?:ism|ists?| attacks?)?)\b/i;
function storyUsesLocalContext(story) {
  if (!/^(?:conflict|general)$/i.test(story.category)) return false;
  const text = `${story.headline} ${story.description ?? ""}`;
  if (LOCAL_HISTORY_OR_HUMAN_INTEREST_RE.test(text)) return true;
  return LOCAL_JUSTICE_RE.test(text) && !ACTIVE_GEOPOLITICAL_RE.test(text);
}
var CATEGORY_SECTION_POLICY = [
  // Energy / commodity / markets / financial — forecasts + markets matter.
  {
    label: "market",
    match: /\b(energy|commodit|market|financ|trade|oil|gas|fuel)/i,
    sections: ["worldBrief", "countryBrief", "forecasts", "macroSignals", "marketData"]
  },
  // Justice, history, and human-interest stories are usually local to the
  // reported event. Do not feed them the global narrative or forecasts: a
  // country-specific fact can still help, but a live conflict storyline
  // should not be shoehorned into a court ruling or historical commemoration.
  {
    label: "local",
    match: /\b(justice|court|legal|law\b|crime|criminal|history|historical|heritage|culture|human.?interest|obituar|celebrity|entertainment)/i,
    sections: LOCAL_SECTIONS
  },
  // Humanitarian / civil / social / rights — NO market, NO forecasts.
  // This is the #1 source of the "77% FX stress dragged into a Rwanda
  // story" pattern from the 2026-04-22 shadow review. Keep this after the
  // local rule so a combined label such as "Civil Rights Court Ruling"
  // receives the narrower court-story context.
  {
    label: "humanitarian",
    match: /\b(humanitarian|refuge|civil|social|rights|genocid|aid\b|migrat)/i,
    sections: ["worldBrief", "countryBrief", "riskScores"]
  },
  // Geopolitical risk / conflict / military / security — risk + forecasts
  // but not market data (the LLM would otherwise tack on a VIX reading to
  // every conflict story).
  {
    label: "geopolitical",
    match: /\b(geopolit|military|conflict|war\b|terror|securit|defen[cs]e|nuclear)/i,
    sections: ["worldBrief", "countryBrief", "riskScores", "forecasts"]
  },
  // Diplomacy / negotiations — risk + country framing, no market / macro.
  {
    label: "diplomacy",
    match: /\b(diplomac|negotia|summit|sanction)/i,
    sections: ["worldBrief", "countryBrief", "riskScores"]
  },
  // Technology / cyber — world narrative + risk, not markets.
  {
    label: "tech",
    match: /\b(tech|cyber|a\.?i\b|artificial|algorith|autonom)/i,
    sections: ["worldBrief", "countryBrief", "riskScores"]
  },
  // Aviation / airspace / drones — world narrative + risk, NO market /
  // forecasts / macro. Named explicitly in the RELEVANCE RULE (shared/
  // brief-llm-core.js WHY_MATTERS_ANALYST_SYSTEM_V2) — the prior revision
  // of this file only had the prompt-level guard, so aviation categories
  // still fell through to DEFAULT_SECTIONS and got all 6 bundles.
  // Structural fix ensures the LLM physically cannot cite a forecast
  // probability or VIX reading for an aviation story (PR #3281 review).
  {
    label: "aviation",
    match: /\b(aviation|airspace|flight\b|aircraft|plane\b|drone)/i,
    sections: ["worldBrief", "countryBrief", "riskScores"]
  }
];
function sectionsForCategory(category) {
  if (typeof category === "string" && category.length > 0) {
    for (const { match, sections, label } of CATEGORY_SECTION_POLICY) {
      if (match.test(category)) return { sections, policyLabel: label };
    }
  }
  return { sections: DEFAULT_SECTIONS, policyLabel: "default" };
}
function clip(s, cap) {
  if (typeof s !== "string" || s.length === 0) return "";
  if (s.length <= cap) return s;
  return `${s.slice(0, cap - 1).trimEnd()}\u2026`;
}
function buildContextBlock(context, allowedSections) {
  if (!context) return "";
  const allow = allowedSections ? new Set(allowedSections) : null;
  const parts = [];
  let used = 0;
  for (const { key, label, cap } of SECTION_CAPS) {
    if (allow && !allow.has(key)) continue;
    const raw = context[key];
    if (typeof raw !== "string" || raw.trim() === "") continue;
    const clipped = clip(raw, cap);
    const section = `## ${label}
${clipped}`;
    if (used + section.length + 2 > CONTEXT_BUDGET_CHARS) break;
    parts.push(section);
    used += section.length + 2;
  }
  return parts.join("\n\n");
}
function buildAnalystWhyMattersPrompt(story, context, todayIso) {
  const safe = sanitizeStoryFields(story);
  const { sections: allowedSections, policyLabel } = storyUsesLocalContext(safe) ? { sections: LOCAL_SECTIONS, policyLabel: "local" } : sectionsForCategory(safe.category);
  const contextBlock = buildContextBlock(context, allowedSections);
  const storyLineList = [
    `Headline: ${safe.headline}`,
    ...safe.description ? [`Description: ${safe.description}`] : [],
    `Source: ${safe.source}`,
    `Severity: ${safe.threatLevel}`,
    `Category: ${safe.category}`,
    `Country: ${safe.country}`
  ];
  const storyLines = storyLineList.join("\n");
  const parts = [];
  if (contextBlock) {
    parts.push("# Optional Live WorldMonitor Context", contextBlock);
  }
  parts.push("# Story", storyLines);
  parts.push(
    `Write 1\u20132 sentences (25\u201340 words) on why this ${safe.category || "story"} matters, grounded in at least ONE specific reference. Reference the global context only when materially connected to this story's category and country; most stories should not mention the global context. If no context fact is a clean fit, ground instead in a named actor, place, date, or figure from the headline or description. DO NOT force an off-topic market metric, VIX value, FX reading, or forecast probability into a story where it does not belong. Treat forecasts as private reasoning input: do not quote raw forecast probabilities or present them as user-facing facts. Be concise and vary sentence structure; avoid a stock "This\u2026" second-sentence opener or "Watch for\u2026" closer. Plain prose, no section labels in the output:`
  );
  return {
    system: `${WHY_MATTERS_ANALYST_SYSTEM_V2}
${briefDateLine(todayIso)}`,
    user: parts.join("\n\n"),
    policyLabel
  };
}

// server/_shared/llm-health.ts
var PROBE_TIMEOUT_MS = 2e3;
var CACHE_TTL_MS = 6e4;
var cache = /* @__PURE__ */ new Map();
var inFlight = /* @__PURE__ */ new Map();
async function probe(url) {
  try {
    const origin = new URL(url).origin;
    await fetch(origin, {
      method: "GET",
      signal: AbortSignal.timeout(PROBE_TIMEOUT_MS)
    });
    return true;
  } catch {
    return false;
  }
}
async function isProviderAvailable(apiUrl) {
  const origin = new URL(apiUrl).origin;
  const cached = cache.get(origin);
  if (cached && Date.now() - cached.checkedAt < CACHE_TTL_MS) {
    return cached.available;
  }
  const existing = inFlight.get(origin);
  if (existing) return existing;
  const promise = probe(apiUrl).then((available) => {
    cache.set(origin, { available, checkedAt: Date.now() });
    inFlight.delete(origin);
    if (!available) {
      console.warn(`[llm-health] Provider unreachable: ${origin}`);
    }
    return available;
  });
  inFlight.set(origin, promise);
  return promise;
}

// scripts/_llm-model-timeouts.mjs
var DEEPSEEK_V4_FLASH_MODEL_PREFIX = "deepseek/deepseek-v4-flash";
var OPENROUTER_BLOCKED_PROVIDERS = [
  "baidu",
  "alibaba",
  "deepseek",
  "siliconflow",
  "streamlake",
  "novita"
];
var OPENROUTER_PROVIDER_ROUTING = {
  ignore: OPENROUTER_BLOCKED_PROVIDERS,
  sort: "throughput"
};
var DEEPSEEK_V4_FLASH_COMPLETION_TIMEOUT_MS = 15e3;
function isDeepseekV4FlashModel(model) {
  return model.startsWith(DEEPSEEK_V4_FLASH_MODEL_PREFIX);
}
function getLlmAttemptTimeoutMs(model, requestedTimeoutMs, capMs = DEEPSEEK_V4_FLASH_COMPLETION_TIMEOUT_MS) {
  return isDeepseekV4FlashModel(model) ? Math.min(requestedTimeoutMs, capMs) : requestedTimeoutMs;
}

// server/_shared/llm.ts
function promptChars(messages) {
  return messages.reduce((sum, m) => sum + (m.content?.length ?? 0), 0);
}
async function flushLlmEvents(events) {
  if (events.length === 0) return;
  try {
    await deliverUsageEvents(events);
  } catch {
  }
}
var OLLAMA_HOST_ALLOWLIST = /* @__PURE__ */ new Set([
  "localhost",
  "127.0.0.1",
  "::1",
  "[::1]",
  "host.docker.internal"
]);
function isLocalDeployment() {
  const mode = typeof process !== "undefined" ? process.env?.LOCAL_API_MODE || "" : "";
  return mode.includes("sidecar") || mode.includes("docker");
}
function getProviderCredentials(provider, overrides = {}) {
  if (provider === "ollama") {
    const baseUrl = process.env.OLLAMA_API_URL;
    if (!baseUrl) return null;
    if (!isLocalDeployment()) {
      try {
        const hostname = new URL(baseUrl).hostname;
        if (!OLLAMA_HOST_ALLOWLIST.has(hostname)) {
          console.warn(`[llm] Ollama blocked: hostname "${hostname}" not in allowlist`);
          return null;
        }
      } catch {
        return null;
      }
    }
    const headers = { "Content-Type": "application/json" };
    const apiKey = process.env.OLLAMA_API_KEY;
    if (apiKey) headers.Authorization = `Bearer ${apiKey}`;
    return {
      apiUrl: new URL("/v1/chat/completions", baseUrl).toString(),
      model: overrides.model || process.env.OLLAMA_MODEL || "llama3.1:8b",
      headers,
      extraBody: { think: false }
    };
  }
  if (provider === "groq") {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return null;
    return {
      apiUrl: "https://api.groq.com/openai/v1/chat/completions",
      model: overrides.model || "llama-3.3-70b-versatile",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      }
    };
  }
  if (provider === "openrouter") {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) return null;
    return {
      apiUrl: "https://openrouter.ai/api/v1/chat/completions",
      model: overrides.model || "deepseek/deepseek-v4-flash",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://worldmonitor.app",
        "X-Title": "World Monitor"
      },
      // Hybrid-reasoning models (DeepSeek V4) reason by default via
      // OpenRouter's normalized `reasoning` param; utility calls must not
      // pay reasoning tokens. The reasoning profile opts back in, letting
      // the model's own default apply. `provider` routing is always sent —
      // the China-provider exclusion is not optional (see the constant).
      extraBody: {
        ...overrides.enableReasoning ? {} : { reasoning: { enabled: false } },
        provider: OPENROUTER_PROVIDER_ROUTING
      }
    };
  }
  if (provider === "generic") {
    const apiUrl = process.env.LLM_API_URL;
    const apiKey = process.env.LLM_API_KEY;
    if (!apiUrl || !apiKey) return null;
    return {
      apiUrl,
      model: overrides.model || process.env.LLM_MODEL || "gpt-3.5-turbo",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      }
    };
  }
  return null;
}
async function readBoundedErrorBody(resp, cap) {
  const body = resp.body;
  if (!body) return "";
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let out = "";
  try {
    while (out.length < cap) {
      const { done, value } = await reader.read();
      if (done) break;
      out += decoder.decode(value, { stream: true });
    }
  } catch {
  } finally {
    try {
      void reader.cancel();
    } catch {
    }
  }
  return out.slice(0, cap);
}
function stripThinkingTags(text) {
  let s = text.replace(/<think>[\s\S]*?<\/think>/gi, "").replace(/<\|thinking\|>[\s\S]*?<\|\/thinking\|>/gi, "").replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, "").replace(/<reflection>[\s\S]*?<\/reflection>/gi, "").replace(/<\|begin_of_thought\|>[\s\S]*?<\|end_of_thought\|>/gi, "").trim();
  s = s.replace(/<think>[\s\S]*/gi, "").replace(/<\|thinking\|>[\s\S]*/gi, "").replace(/<reasoning>[\s\S]*/gi, "").replace(/<reflection>[\s\S]*/gi, "").replace(/<\|begin_of_thought\|>[\s\S]*/gi, "").trim();
  return s;
}
var PROVIDER_CHAIN = ["ollama", "openrouter", "groq", "generic"];
var PROVIDER_SET = new Set(PROVIDER_CHAIN);
var TOKEN_LIMIT_FINISH_REASONS = /* @__PURE__ */ new Set([
  "length",
  "max_tokens",
  "max_output_tokens"
]);
var KNOWN_NON_LIMIT_FINISH_REASONS = /* @__PURE__ */ new Set([
  "stop",
  "end_turn",
  "tool_calls",
  "function_call",
  "content_filter",
  "safety",
  "recitation",
  "blocklist",
  "prohibited_content",
  "spii",
  "malformed_function_call",
  "image_safety"
]);
function normalizeFinishReason(finishReason) {
  if (typeof finishReason !== "string") return null;
  const normalized = finishReason.trim().toLowerCase().replace(/[\s-]+/g, "_");
  return normalized || null;
}
function isLengthLimitedCompletion(finishReason, completionTokens, maxTokens) {
  const normalized = normalizeFinishReason(finishReason);
  if (normalized && TOKEN_LIMIT_FINISH_REASONS.has(normalized)) return true;
  if (completionTokens < maxTokens) return false;
  return normalized === null || !KNOWN_NON_LIMIT_FINISH_REASONS.has(normalized);
}
function resolveProviderChain(opts) {
  if (opts.forcedProvider) return [opts.forcedProvider];
  if (!Array.isArray(opts.providerOrder) || opts.providerOrder.length === 0) {
    return [...PROVIDER_CHAIN];
  }
  const seen = /* @__PURE__ */ new Set();
  const providers = [];
  for (const provider of opts.providerOrder) {
    if (!PROVIDER_SET.has(provider) || seen.has(provider)) continue;
    seen.add(provider);
    providers.push(provider);
  }
  return providers.length > 0 ? providers : [...PROVIDER_CHAIN];
}
async function callLlm(opts) {
  const {
    messages: rawMessages,
    temperature = 0.3,
    maxTokens = 1500,
    timeoutMs = 25e3,
    provider: forcedProvider,
    providerOrder,
    modelOverrides,
    stripThinkingTags: shouldStrip = true,
    validate,
    systemAppend,
    enableReasoning = false,
    retryOnLengthLimit = false
  } = opts;
  let messages = rawMessages;
  const firstMsg = messages[0];
  if (systemAppend && firstMsg && firstMsg.role === "system") {
    const sanitized = sanitizeForPrompt(systemAppend);
    if (sanitized) {
      messages = [
        { role: "system", content: `${firstMsg.content}

---

${sanitized}` },
        ...messages.slice(1)
      ];
    }
  }
  const providers = resolveProviderChain({ forcedProvider, providerOrder });
  const stage = opts.stage || "unknown";
  const inputChars = promptChars(messages);
  const events = [];
  let attemptIndex = 0;
  try {
    for (const providerName of providers) {
      const creds = getProviderCredentials(providerName, {
        model: modelOverrides?.[providerName],
        enableReasoning
      });
      if (!creds) {
        if (forcedProvider) return null;
        continue;
      }
      if (!await isProviderAvailable(creds.apiUrl)) {
        console.warn(`[llm:${providerName}] Offline, skipping`);
        if (forcedProvider) return null;
        continue;
      }
      const t0 = Date.now();
      const fallbackIndex = attemptIndex;
      attemptIndex += 1;
      const record = (ok, extra = {}) => {
        events.push(buildLlmCallEvent({
          provider: providerName,
          model: creds.model,
          stage,
          ok,
          durationMs: Date.now() - t0,
          promptChars: inputChars,
          maxTokens,
          fallbackIndex,
          ...extra
        }));
      };
      try {
        const resp = await fetch(creds.apiUrl, {
          method: "POST",
          headers: { ...creds.headers, "User-Agent": CHROME_UA },
          body: JSON.stringify({
            ...creds.extraBody,
            model: creds.model,
            messages,
            temperature,
            max_tokens: maxTokens
          }),
          // #5246: DeepSeek V4 Flash is bimodal — healthy calls finish near 2s,
          // while stalled calls hang to the old 25s clamp. Cut only this model's
          // dead tail so the existing provider chain can reach its fallback.
          signal: AbortSignal.timeout(getLlmAttemptTimeoutMs(creds.model, timeoutMs))
        });
        if (!resp.ok) {
          const errBody = await readBoundedErrorBody(resp, 300).catch(() => "");
          console.warn(`[llm:${providerName}] HTTP ${resp.status} model=${creds.model} body=${errBody}`);
          record(false, { reason: `http_${resp.status}` });
          if (forcedProvider) return null;
          continue;
        }
        const data = await resp.json();
        const tokensExtra = {
          tokensTotal: data.usage?.total_tokens ?? 0,
          tokensPrompt: data.usage?.prompt_tokens ?? 0,
          tokensCompletion: data.usage?.completion_tokens ?? 0
        };
        const tokens = data.usage?.total_tokens ?? 0;
        const finishReason = typeof data.choices?.[0]?.finish_reason === "string" ? data.choices[0].finish_reason : null;
        if (retryOnLengthLimit && isLengthLimitedCompletion(
          finishReason,
          tokensExtra.tokensCompletion,
          maxTokens
        )) {
          console.warn(`[llm:${providerName}] Token-limited completion, trying next`);
          record(false, { ...tokensExtra, reason: "length" });
          if (forcedProvider) return null;
          continue;
        }
        let content = data.choices?.[0]?.message?.content?.trim() || "";
        if (!content) {
          record(false, { ...tokensExtra, reason: "empty" });
          if (forcedProvider) return null;
          continue;
        }
        if (shouldStrip) {
          content = stripThinkingTags(content);
          if (!content) {
            record(false, { ...tokensExtra, reason: "stripped_empty" });
            if (forcedProvider) return null;
            continue;
          }
        }
        content = content.replace(/^```(?:\w+)?\s*/m, "").replace(/\s*```\s*$/m, "").trim();
        if (validate && !validate(content)) {
          console.warn(`[llm:${providerName}] validate() rejected response, trying next`);
          record(false, { ...tokensExtra, reason: "validate_reject" });
          if (forcedProvider) return null;
          continue;
        }
        record(true, tokensExtra);
        return { content, model: creds.model, provider: providerName, tokens, finishReason };
      } catch (err) {
        const name = err.name;
        console.warn(`[llm:${providerName}] ${err.message}`);
        record(false, { reason: name === "TimeoutError" || name === "AbortError" ? "timeout" : "fetch_error" });
        if (forcedProvider) return null;
      }
    }
    return null;
  } finally {
    await flushLlmEvents(events);
  }
}

// api/_upstash-json.js
async function readRawJsonFromUpstash(key, timeoutMs = 3e3) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    throw new Error("readRawJsonFromUpstash: UPSTASH_REDIS_REST_URL/TOKEN not configured");
  }
  const resp = await fetch(`${url}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(timeoutMs)
  });
  if (!resp.ok) {
    throw new Error(`readRawJsonFromUpstash: Upstash GET ${key} returned HTTP ${resp.status}`);
  }
  const data = await resp.json();
  if (data.result == null) return null;
  try {
    return JSON.parse(data.result);
  } catch (err) {
    throw new Error(
      `readRawJsonFromUpstash: JSON.parse failed for ${key}: ${err instanceof Error ? err.message : String(err)}`
    );
  }
}
function getRedisCredentials() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return { url, token };
}
async function redisPipeline(commands, timeoutMs = 5e3) {
  const creds = getRedisCredentials();
  if (!creds) return null;
  try {
    const resp = await fetch(`${creds.url}/pipeline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${creds.token}`, "Content-Type": "application/json" },
      body: JSON.stringify(commands),
      signal: AbortSignal.timeout(timeoutMs)
    });
    if (!resp.ok) return null;
    return await resp.json();
  } catch {
    return null;
  }
}
async function setCachedData(key, value, ttlSeconds) {
  const results = await redisPipeline([
    ["SET", key, JSON.stringify(value), "EX", String(ttlSeconds)]
  ]);
  return results !== null;
}

// api/_sentry-common.js
var _key = "";
var _envelopeUrl = "";
(function parseDsn() {
  if (process.env.NODE_TEST_CONTEXT) return;
  const dsn = process.env.VITE_SENTRY_DSN ?? "";
  if (!dsn) return;
  try {
    const u = new URL(dsn);
    _key = u.username;
    const projectId = u.pathname.replace(/^\//, "");
    _envelopeUrl = `${u.protocol}//${u.host}/api/${projectId}/envelope/`;
  } catch {
  }
})();
function parseStack(stack) {
  const lines = stack.split("\n").slice(1, 30);
  const frames = [];
  for (const line of lines) {
    const m = line.match(/at\s+(?:(.+?)\s+\()?(.+?):(\d+):(\d+)\)?$/);
    if (!m) continue;
    frames.push({
      function: m[1] || "<anonymous>",
      filename: m[2],
      lineno: Number(m[3]),
      colno: Number(m[4])
    });
  }
  return frames.reverse();
}
function buildEnvelope(err, ctx, runtimeCfg) {
  const errMsg2 = err instanceof Error ? err.message : String(err);
  const errType = err instanceof Error ? err.constructor.name : "Error";
  const stack = err instanceof Error && err.stack ? err.stack : void 0;
  const eventId = crypto.randomUUID().replace(/-/g, "");
  const timestamp = (/* @__PURE__ */ new Date()).toISOString();
  const level = ctx?.level === "warning" || ctx?.level === "info" || ctx?.level === "fatal" ? ctx.level : "error";
  const event = {
    event_id: eventId,
    timestamp,
    level,
    platform: runtimeCfg.platform,
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "production",
    release: process.env.VERCEL_GIT_COMMIT_SHA,
    exception: {
      values: [
        {
          type: errType,
          value: errMsg2,
          ...stack ? { stacktrace: { frames: parseStack(stack) } } : {}
        }
      ]
    },
    tags: { surface: "api", runtime: runtimeCfg.runtime, ...ctx?.tags ?? {} },
    extra: ctx?.extra,
    // Caller-supplied fingerprint overrides Sentry's default grouping.
    // Use when the error message contains a high-cardinality token (request id,
    // ephemeral hash) that would otherwise split one logical issue into many.
    ...Array.isArray(ctx?.fingerprint) && ctx.fingerprint.length > 0 ? { fingerprint: ctx.fingerprint } : {}
  };
  const header = JSON.stringify({ event_id: eventId, sent_at: timestamp });
  const itemHeader = JSON.stringify({ type: "event" });
  const itemPayload = JSON.stringify(event);
  return `${header}
${itemHeader}
${itemPayload}
`;
}
async function deliver(body, logPrefix) {
  if (!_envelopeUrl || !_key) return;
  try {
    const res = await fetch(_envelopeUrl, {
      method: "POST",
      keepalive: true,
      signal: AbortSignal.timeout(2e3),
      headers: {
        "Content-Type": "application/x-sentry-envelope",
        "X-Sentry-Auth": `Sentry sentry_version=7, sentry_key=${_key}`
      },
      body
    });
    if (!res.ok) {
      const hint = res.status === 401 || res.status === 403 ? " \u2014 check VITE_SENTRY_DSN and auth key" : res.status === 429 ? " \u2014 rate limited by Sentry" : " \u2014 Sentry outage or transient error";
      console.warn(`${logPrefix} non-2xx response ${res.status}${hint}`);
    }
  } catch (fetchErr) {
    console.warn(
      `${logPrefix} failed to deliver event:`,
      fetchErr instanceof Error ? fetchErr.message : fetchErr
    );
  }
}
function makeCaptureSilentError({ runtime, platform, logPrefix }) {
  const runtimeCfg = { runtime, platform };
  return function captureSilentError2(err, opts) {
    if (!_envelopeUrl || !_key) return Promise.resolve();
    const promise = deliver(buildEnvelope(err, opts, runtimeCfg), logPrefix);
    if (opts?.ctx && typeof opts.ctx.waitUntil === "function") {
      opts.ctx.waitUntil(promise);
    } else {
      promise.catch(() => {
      });
    }
    return promise;
  };
}

// api/_sentry-edge.js
var captureSilentError = makeCaptureSilentError({
  runtime: "edge",
  platform: "javascript",
  logPrefix: "[sentry-edge]"
});

// api/internal/brief-why-matters.ts
var config = { runtime: "edge", regions: ["iad1", "lhr1", "fra1", "sfo1"] };
function readConfig(env = process.env) {
  const rawPrimary = (env.BRIEF_WHY_MATTERS_PRIMARY ?? "").trim().toLowerCase();
  let primary;
  let invalidPrimaryRaw = null;
  if (rawPrimary === "" || rawPrimary === "analyst") {
    primary = "analyst";
  } else if (rawPrimary === "gemini") {
    primary = "gemini";
  } else {
    primary = "gemini";
    invalidPrimaryRaw = rawPrimary;
  }
  const shadowEnabled = env.BRIEF_WHY_MATTERS_SHADOW === "1";
  const rawSample = env.BRIEF_WHY_MATTERS_SHADOW_SAMPLE_PCT;
  let samplePct = 100;
  let invalidSamplePctRaw = null;
  if (rawSample !== void 0 && rawSample !== "") {
    const parsed = Number.parseInt(rawSample, 10);
    if (Number.isInteger(parsed) && parsed >= 0 && parsed <= 100 && String(parsed) === rawSample.trim()) {
      samplePct = parsed;
    } else {
      invalidSamplePctRaw = rawSample;
    }
  }
  const sampleHardRoll = (hash16) => {
    if (samplePct >= 100) return true;
    if (samplePct <= 0) return false;
    const bucket = Number.parseInt(hash16.slice(0, 8), 16) % 100;
    return bucket < samplePct;
  };
  return { primary, invalidPrimaryRaw, shadowEnabled, sampleHardRoll, invalidSamplePctRaw };
}
var WHY_MATTERS_TTL_SEC = 6 * 60 * 60;
var SHADOW_TTL_SEC = 7 * 24 * 60 * 60;
var WHY_MATTERS_PROVIDER_ORDER = ["openrouter", "groq"];
var WHY_MATTERS_MODEL_OVERRIDES = { openrouter: "deepseek/deepseek-v4-flash" };
var VALID_THREAT_LEVELS = /* @__PURE__ */ new Set(["critical", "high", "medium", "low"]);
var MAX_BODY_BYTES = 8192;
var CAPS = {
  headline: 400,
  source: 120,
  category: 80,
  country: 80,
  description: 1e3
};
function json(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}
function validateStoryBody(raw) {
  if (!raw || typeof raw !== "object") {
    return { ok: false, status: 400, error: "body must be an object" };
  }
  const storyRaw = raw.story;
  if (!storyRaw || typeof storyRaw !== "object") {
    return { ok: false, status: 400, error: "body.story must be an object" };
  }
  const s = storyRaw;
  for (const field of ["headline", "source", "category"]) {
    const v = s[field];
    if (typeof v !== "string" || v.length === 0) {
      return { ok: false, status: 400, error: `story.${field} must be a non-empty string` };
    }
    if (v.length > CAPS[field]) {
      return { ok: false, status: 400, error: `story.${field} exceeds ${CAPS[field]} chars` };
    }
  }
  if (typeof s.threatLevel !== "string" || !VALID_THREAT_LEVELS.has(s.threatLevel)) {
    return {
      ok: false,
      status: 400,
      error: `story.threatLevel must be one of critical|high|medium|low`
    };
  }
  let country = "";
  if (s.country !== void 0 && s.country !== null) {
    if (typeof s.country !== "string") {
      return { ok: false, status: 400, error: "story.country must be a string" };
    }
    if (s.country.length > CAPS.country) {
      return { ok: false, status: 400, error: `story.country exceeds ${CAPS.country} chars` };
    }
    country = s.country;
  }
  let description;
  if (s.description !== void 0 && s.description !== null) {
    if (typeof s.description !== "string") {
      return { ok: false, status: 400, error: "story.description must be a string" };
    }
    if (s.description.length > CAPS.description) {
      return { ok: false, status: 400, error: `story.description exceeds ${CAPS.description} chars` };
    }
    if (s.description.length > 0) description = s.description;
  }
  return {
    ok: true,
    story: {
      headline: s.headline,
      source: s.source,
      threatLevel: s.threatLevel,
      category: s.category,
      country,
      ...description ? { description } : {}
    }
  };
}
function rejectLengthLimitedCompletion(path, finishReason) {
  if (finishReason !== "length") return false;
  console.warn(`[brief-why-matters] ${path} completion_reject reason=length`);
  return true;
}
async function runAnalystPath(story, iso2) {
  try {
    const context = await assembleBriefStoryContext({ iso2, category: story.category });
    const { system, user, policyLabel } = buildAnalystWhyMattersPrompt(story, context);
    console.log(
      `[brief-why-matters] analyst gate policy=${policyLabel} category="${story.category}" promptLen=${user.length}`
    );
    const result = await callLlm({
      messages: [
        { role: "system", content: system },
        { role: "user", content: user }
      ],
      // v2 prompt is 1–2 sentences / 25–40 words. maxTokens stays generous
      // (well above the ~60 tokens a 40-word blurb needs) as deliberate
      // headroom so a completion is never clipped mid-sentence (#5168).
      maxTokens: 260,
      temperature: 0.4,
      timeoutMs: 15e3,
      stage: "brief-why-matters-analyst",
      // Fast utility model (deepseek-v4-flash), reasoning off — see the
      // WHY_MATTERS_* constants above. Decoupled from LLM_REASONING_MODEL.
      providerOrder: WHY_MATTERS_PROVIDER_ORDER,
      modelOverrides: WHY_MATTERS_MODEL_OVERRIDES,
      // A provider's explicit token-limit signal is deterministic, so retry
      // the next provider in-request. The parser remains post-call because
      // parse rejection is ambiguous and should not trigger duplicate spend.
      retryOnLengthLimit: true
      // Note: no `validate` option. The post-call parseWhyMattersV2
      // check below handles rejection. Using validate inside
      // callLlm would walk the provider chain on parse-reject,
      // causing duplicate openrouter billings (see todo 245).
    });
    if (!result) return null;
    if (rejectLengthLimitedCompletion("analyst", result.finishReason)) return null;
    return parseWhyMattersV2(result.content, {
      publicStory: {
        headline: story.headline,
        description: story.description,
        source: story.source
      },
      privateForecasts: context.forecasts
    });
  } catch (err) {
    console.warn(`[brief-why-matters] analyst path failed: ${err instanceof Error ? err.message : String(err)}`);
    await captureSilentError(err, { tags: { route: "api/internal/brief-why-matters", step: "analyst-path", severity: "warn" } });
    return null;
  }
}
async function runGeminiPath(story) {
  try {
    const { system, user } = buildWhyMattersUserPrompt(sanitizeStoryFields(story));
    const result = await callLlm({
      messages: [
        { role: "system", content: system },
        { role: "user", content: user }
      ],
      maxTokens: 120,
      temperature: 0.4,
      timeoutMs: 1e4,
      stage: "brief-why-matters-gemini",
      // Fast utility model (deepseek-v4-flash), reasoning off — see the
      // WHY_MATTERS_* constants above. Decoupled from LLM_REASONING_MODEL.
      providerOrder: WHY_MATTERS_PROVIDER_ORDER,
      modelOverrides: WHY_MATTERS_MODEL_OVERRIDES,
      // Match the analyst path: retry only deterministic token-limit signals,
      // while leaving prose-shape validation outside the provider loop.
      retryOnLengthLimit: true
      // Note: no `validate` option. The post-call parseWhyMatters check
      // below handles rejection by returning null. Using validate inside
      // callLlm would walk the provider chain on parse-reject,
      // causing duplicate openrouter billings when only one provider is
      // configured in prod. See todo 245.
    });
    if (!result) return null;
    if (rejectLengthLimitedCompletion("gemini", result.finishReason)) return null;
    return parseWhyMatters(result.content);
  } catch (err) {
    console.warn(`[brief-why-matters] gemini path failed: ${err instanceof Error ? err.message : String(err)}`);
    await captureSilentError(err, { tags: { route: "api/internal/brief-why-matters", step: "gemini-path", severity: "warn" } });
    return null;
  }
}
function isEnvelope(v) {
  if (!v || typeof v !== "object") return false;
  const e = v;
  return typeof e.whyMatters === "string" && hasTerminalPunctuation(e.whyMatters) && (e.producedBy === "analyst" || e.producedBy === "gemini") && typeof e.at === "string";
}
async function handler(req, ctx) {
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }
  const unauthorized = await authenticateInternalRequest(req, "RELAY_SHARED_SECRET");
  if (unauthorized) return unauthorized;
  const contentLengthRaw = req.headers.get("content-length");
  if (contentLengthRaw) {
    const cl = Number.parseInt(contentLengthRaw, 10);
    if (Number.isFinite(cl) && cl > MAX_BODY_BYTES) {
      return json({ error: `body exceeds ${MAX_BODY_BYTES} bytes` }, 400);
    }
  }
  let bodyText;
  try {
    bodyText = await req.text();
  } catch {
    return json({ error: "failed to read body" }, 400);
  }
  if (new TextEncoder().encode(bodyText).byteLength > MAX_BODY_BYTES) {
    return json({ error: `body exceeds ${MAX_BODY_BYTES} bytes` }, 400);
  }
  let bodyParsed;
  try {
    bodyParsed = JSON.parse(bodyText);
  } catch {
    return json({ error: "invalid JSON" }, 400);
  }
  const validation = validateStoryBody(bodyParsed);
  if (!validation.ok) {
    console.warn(`[brief-why-matters] validation_reject error=${validation.error}`);
    return json({ error: validation.error }, validation.status);
  }
  const story = validation.story;
  const iso2 = normalizeCountryToIso2(story.country);
  const cfg = readConfig();
  if (cfg.invalidPrimaryRaw !== null) {
    console.warn(
      `[brief-why-matters] unrecognised BRIEF_WHY_MATTERS_PRIMARY=${cfg.invalidPrimaryRaw} \u2014 falling back to gemini (safe path). Valid values: analyst | gemini.`
    );
  }
  if (cfg.invalidSamplePctRaw !== null) {
    console.warn(
      `[brief-why-matters] unrecognised BRIEF_WHY_MATTERS_SHADOW_SAMPLE_PCT=${cfg.invalidSamplePctRaw} \u2014 defaulting to 100. Must be integer 0-100.`
    );
  }
  const hash = await hashBriefStory(story);
  const cacheKey = `brief:llm:whymatters:v10:${hash}`;
  const shadowKey = `brief:llm:whymatters:shadow:v7:${hash}`;
  let cached = null;
  try {
    const raw = await readRawJsonFromUpstash(cacheKey);
    if (raw !== null && isEnvelope(raw)) {
      cached = raw;
    }
  } catch (err) {
    console.warn(`[brief-why-matters] cache read degraded: ${err instanceof Error ? err.message : String(err)}`);
    await captureSilentError(err, { tags: { route: "api/internal/brief-why-matters", step: "cache-read", severity: "warn" } });
  }
  if (cached) {
    return json({
      whyMatters: cached.whyMatters,
      source: "cache",
      producedBy: cached.producedBy,
      hash
    }, 200);
  }
  const runShadow = cfg.shadowEnabled && cfg.sampleHardRoll(hash);
  let analystResult = null;
  let geminiResult = null;
  let chosenProducer;
  let chosenValue;
  if (runShadow) {
    const [a, g] = await Promise.allSettled([
      runAnalystPath(story, iso2),
      runGeminiPath(story)
    ]);
    analystResult = a.status === "fulfilled" ? a.value : null;
    geminiResult = g.status === "fulfilled" ? g.value : null;
    if (cfg.primary === "analyst") {
      chosenProducer = analystResult !== null ? "analyst" : "gemini";
      chosenValue = analystResult ?? geminiResult;
    } else {
      chosenProducer = geminiResult !== null ? "gemini" : "analyst";
      chosenValue = geminiResult ?? analystResult;
    }
  } else if (cfg.primary === "analyst") {
    analystResult = await runAnalystPath(story, iso2);
    chosenProducer = "analyst";
    chosenValue = analystResult;
  } else {
    geminiResult = await runGeminiPath(story);
    chosenProducer = "gemini";
    chosenValue = geminiResult;
  }
  const now = (/* @__PURE__ */ new Date()).toISOString();
  if (chosenValue !== null) {
    const envelope = {
      whyMatters: chosenValue,
      producedBy: chosenProducer,
      at: now
    };
    try {
      await setCachedData(cacheKey, envelope, WHY_MATTERS_TTL_SEC);
    } catch (err) {
      console.warn(`[brief-why-matters] cache write degraded: ${err instanceof Error ? err.message : String(err)}`);
      await captureSilentError(err, { tags: { route: "api/internal/brief-why-matters", step: "cache-write", severity: "warn" } });
    }
  }
  if (runShadow) {
    const record = {
      analyst: analystResult,
      gemini: geminiResult,
      chosen: chosenProducer,
      at: now
    };
    const shadowWrite = redisPipeline([
      ["SET", shadowKey, JSON.stringify(record), "EX", String(SHADOW_TTL_SEC)]
    ]).then(() => void 0).catch(() => {
    });
    if (typeof ctx?.waitUntil === "function") {
      ctx.waitUntil(shadowWrite);
    }
  }
  const response = {
    whyMatters: chosenValue,
    source: chosenProducer,
    producedBy: chosenValue !== null ? chosenProducer : null,
    hash
  };
  if (runShadow) {
    response.shadow = { analyst: analystResult, gemini: geminiResult };
  }
  return json(response, 200);
}
export {
  config,
  handler as default
};
