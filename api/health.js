// api/health.js
var ALLOWED_ORIGIN_PATTERNS = [
  /^https:\/\/(.*\.)?worldmonitor\.app$/,
  // Vercel preview deployments under the "eliewm" team scope, e.g.
  //   worldmonitor-git-<branch>-eliewm.vercel.app  (git-branch alias)
  //   worldmonitor-<hash>-eliewm.vercel.app        (deployment URL)
  // Tight on purpose: never a bare *.vercel.app (this is a security allowlist).
  /^https:\/\/worldmonitor-[a-z0-9-]+-eliewm\.vercel\.app$/,
  /^https?:\/\/tauri\.localhost(:\d+)?$/,
  /^https?:\/\/[a-z0-9-]+\.tauri\.localhost(:\d+)?$/i,
  /^tauri:\/\/localhost$/,
  /^asset:\/\/localhost$/,
  // Only allow bare localhost/127.0.0.1 in non-production (matches server/cors.ts)
  ...process.env.NODE_ENV === "production" ? [] : [
    /^https?:\/\/localhost(:\d+)?$/,
    /^https?:\/\/127\.0\.0\.1(:\d+)?$/
  ]
];
var ALLOWED_HEADERS = [
  "Content-Type",
  "Authorization",
  "X-WorldMonitor-Key",
  "X-Api-Key",
  "X-Widget-Key",
  "X-Pro-Key",
  "X-WorldMonitor-Desktop-Timestamp",
  "X-WorldMonitor-Desktop-Signature",
  "Idempotency-Key",
  "Mcp-Session-Id",
  "MCP-Protocol-Version",
  "Last-Event-ID"
].join(", ");
var EXPOSED_HEADERS = [
  "Mcp-Session-Id",
  "WWW-Authenticate",
  "Retry-After",
  "Idempotency-Key",
  "Idempotent-Replayed",
  // IETF RateLimit fields (draft-ietf-httpapi-ratelimit-headers): RateLimit-Policy
  // + RateLimit-Limit are advertised on every API response (vercel.json); the
  // combined RateLimit member and RateLimit-Remaining/Reset appear on a 429.
  // Exposed so browser-context agents can read them cross-origin and self-throttle.
  "RateLimit",
  "RateLimit-Policy",
  "RateLimit-Limit",
  "RateLimit-Remaining",
  "RateLimit-Reset",
  // Legacy X-RateLimit-* retained for back-compat with existing consumers.
  "X-RateLimit-Limit",
  "X-RateLimit-Remaining",
  "X-RateLimit-Reset",
  "X-WorldMonitor-Bbox",
  "X-WorldMonitor-Bbox-Missing",
  "X-WorldMonitor-Bbox-Invalid",
  "X-Military-Bbox"
].join(", ");
function isAllowedOrigin(origin) {
  return Boolean(origin) && ALLOWED_ORIGIN_PATTERNS.some((pattern) => pattern.test(origin));
}
function getCorsHeaders(req, methods = "GET, OPTIONS") {
  const origin = req.headers.get("origin") || "";
  const allowOrigin = isAllowedOrigin(origin) ? origin : "https://worldmonitor.app";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": methods,
    "Access-Control-Allow-Headers": ALLOWED_HEADERS,
    "Access-Control-Expose-Headers": EXPOSED_HEADERS,
    "Access-Control-Max-Age": "3600",
    "Vary": "Origin"
  };
}
function isDisallowedOrigin(req) {
  const origin = req.headers.get("origin");
  if (!origin) return false;
  return !isAllowedOrigin(origin);
}
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
var SESSION_TTL_MS = 12 * 60 * 60 * 1e3;
var PREFIX = "wms_";
var enc = new TextEncoder();
function getSecret() {
  const s = process.env.WM_SESSION_SECRET;
  if (!s || s.length < 32) {
    throw new Error("WM_SESSION_SECRET must be set (min 32 chars)");
  }
  return s;
}
async function importHmacKey() {
  return crypto.subtle.importKey(
    "raw",
    enc.encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
}
function bufferToBase64Url(buf) {
  const bytes = new Uint8Array(buf);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function base64UrlToBytes(s) {
  const pad = (4 - s.length % 4) % 4;
  const b64 = (s + "=".repeat(pad)).replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}
function base64UrlToString(s) {
  const bytes = base64UrlToBytes(s);
  return new TextDecoder().decode(bytes);
}
function isSessionTokenShape(token) {
  return typeof token === "string" && token.startsWith(PREFIX);
}
async function validateSessionToken(token) {
  if (!isSessionTokenShape(token)) return false;
  const tail = token.slice(PREFIX.length);
  const dot = tail.indexOf(".");
  if (dot < 0) return false;
  const body = tail.slice(0, dot);
  const sig = tail.slice(dot + 1);
  if (!body || !sig) return false;
  let key;
  try {
    key = await importHmacKey();
  } catch {
    return false;
  }
  let expectedBuf;
  try {
    expectedBuf = await crypto.subtle.sign("HMAC", key, enc.encode(body));
  } catch {
    return false;
  }
  let providedBytes;
  try {
    providedBytes = base64UrlToBytes(sig);
  } catch {
    return false;
  }
  if (bufferToBase64Url(providedBytes.buffer) !== sig) return false;
  const expected = new Uint8Array(expectedBuf);
  if (expected.length !== providedBytes.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected[i] ^ providedBytes[i];
  if (diff !== 0) return false;
  let payload;
  try {
    payload = JSON.parse(base64UrlToString(body));
  } catch {
    return false;
  }
  if (typeof payload.exp !== "number") return false;
  if (!Number.isFinite(payload.exp)) return false;
  if (Date.now() >= payload.exp) return false;
  return true;
}
async function timingSafeIncludes(candidate, validKeys) {
  if (!candidate || !validKeys.length) return false;
  const enc2 = new TextEncoder();
  const candidateHash = await crypto.subtle.digest("SHA-256", enc2.encode(candidate));
  const candidateBytes = new Uint8Array(candidateHash);
  let found = false;
  for (const k of validKeys) {
    const kHash = await crypto.subtle.digest("SHA-256", enc2.encode(k));
    const kBytes = new Uint8Array(kHash);
    let diff = 0;
    for (let i = 0; i < kBytes.length; i++) diff |= candidateBytes[i] ^ kBytes[i];
    if (diff === 0) found = true;
  }
  return found;
}
var USER_API_KEY_GATEWAY_VALIDATION_ERROR = "User API key requires gateway validation";
var DESKTOP_ORIGIN_PATTERNS = [
  /^https?:\/\/tauri\.localhost(:\d+)?$/,
  /^https?:\/\/[a-z0-9-]+\.tauri\.localhost(:\d+)?$/i,
  /^tauri:\/\/localhost$/,
  /^asset:\/\/localhost$/
];
function isDesktopOrigin(origin) {
  return Boolean(origin) && DESKTOP_ORIGIN_PATTERNS.some((p) => p.test(origin));
}
function getHeaderApiKey(req) {
  return req.headers.get("X-WorldMonitor-Key") || req.headers.get("X-Api-Key") || "";
}
async function isValidEnterpriseKey(key) {
  if (!key) return false;
  const validKeys = (process.env.WORLDMONITOR_VALID_KEYS || "").split(",").filter(Boolean);
  return timingSafeIncludes(key, validKeys);
}
function getCookie(req, name) {
  const raw = req.headers.get("Cookie") || req.headers.get("cookie") || "";
  if (!raw) return "";
  const prefix = `${name}=`;
  for (const part of raw.split(";")) {
    const trimmed = part.trim();
    if (!trimmed.startsWith(prefix)) continue;
    try {
      return decodeURIComponent(trimmed.slice(prefix.length));
    } catch {
      return trimmed.slice(prefix.length);
    }
  }
  return "";
}
async function validateApiKey(req, options = {}) {
  const forceKey = options.forceKey === true;
  const headerKey = getHeaderApiKey(req);
  const sessionCookie = getCookie(req, "wm-session");
  const testerCookie = getCookie(req, "wm-pro-key") || getCookie(req, "wm-widget-key");
  const key = headerKey || testerCookie || sessionCookie;
  const origin = req.headers.get("Origin") || "";
  if (isDesktopOrigin(origin)) {
    if (!headerKey) return { valid: false, required: true, error: "API key required for desktop access" };
    if (!await isValidEnterpriseKey(headerKey)) return { valid: false, required: true, error: "Invalid API key" };
    return { valid: true, required: true, kind: "enterprise" };
  }
  if (isSessionTokenShape(key)) {
    if (forceKey) {
      return { valid: false, required: true, error: "Pro authentication required" };
    }
    if (await validateSessionToken(key)) {
      return { valid: true, required: false, kind: "session" };
    }
    return { valid: false, required: true, error: "Invalid session token" };
  }
  if (key && await isValidEnterpriseKey(key)) {
    return { valid: true, required: true, kind: "enterprise" };
  }
  if (key && key.startsWith("wm_")) {
    return { valid: false, required: true, error: USER_API_KEY_GATEWAY_VALIDATION_ERROR };
  }
  if (key) {
    return { valid: false, required: true, error: "Invalid API key" };
  }
  return { valid: false, required: true, error: "API key required" };
}
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
var CII_RISK_SCORE_CACHE_KEYS = Object.freeze({
  live: "risk:scores:sebuf:v8",
  stale: "risk:scores:sebuf:stale:v8",
  trendHistoryPrefix: "risk:scores:sebuf:trend-history:v8"
});
var config = { runtime: "edge" };
var HEALTH_VERDICT_SNAPSHOT_BASE_KEY = "health:verdict:v1";
function healthVerdictRedisKey(baseKey, vercelEnv, commitSha) {
  if (!vercelEnv || vercelEnv === "production") return baseKey;
  return `${vercelEnv}:${commitSha?.slice(0, 8) || "dev"}:${baseKey}`;
}
var HEALTH_VERDICT_SNAPSHOT_KEY = healthVerdictRedisKey(
  HEALTH_VERDICT_SNAPSHOT_BASE_KEY,
  process.env.VERCEL_ENV,
  process.env.VERCEL_GIT_COMMIT_SHA
);
var HEALTH_VERDICT_COMPACT_SNAPSHOT_BASE_KEY = "health:verdict:compact:v1";
var HEALTH_VERDICT_COMPACT_SNAPSHOT_KEY = healthVerdictRedisKey(
  HEALTH_VERDICT_COMPACT_SNAPSHOT_BASE_KEY,
  process.env.VERCEL_ENV,
  process.env.VERCEL_GIT_COMMIT_SHA
);
var HEALTH_VERDICT_SNAPSHOT_TTL_SECONDS = 60;
var CHINA_COVERAGE_SUMMARY_KEY = "health:china-coverage:v1";
var HEALTH_VERDICT_SNAPSHOT_TTL_MS = HEALTH_VERDICT_SNAPSHOT_TTL_SECONDS * 1e3;
var HEALTH_VERDICT_REFRESH_LOCK_KEY = `${HEALTH_VERDICT_SNAPSHOT_KEY}:refresh-lock`;
var HEALTH_VERDICT_REFRESH_LOCK_TTL_SECONDS = 30;
var HEALTH_VERDICT_REFRESH_WAIT_ATTEMPTS = 45;
var HEALTH_VERDICT_REFRESH_WAIT_MS = 3e3;
var HEALTH_VERDICT_MIN_REDIS_TIMEOUT_MS = 100;
var HEALTH_VERDICT_RELEASE_LOCK_SCRIPT = [
  "if redis.call('get', KEYS[1]) == ARGV[1] then",
  "  return redis.call('del', KEYS[1])",
  "end",
  "return 0"
].join("\n");
var IRAN_EVENTS_ENABLED = (process.env.IRAN_EVENTS_ENABLED ?? "false").toLowerCase() === "true";
var BOOTSTRAP_KEYS = {
  earthquakes: "seismology:earthquakes:v1",
  outages: "infra:outages:v1",
  sectors: "market:sectors:v2",
  etfFlows: "market:etf-flows:v1",
  climateAnomalies: "climate:anomalies:v2",
  climateDisasters: "climate:disasters:v1",
  climateAirQuality: "climate:air-quality:v1",
  co2Monitoring: "climate:co2-monitoring:v1",
  oceanIce: "climate:ocean-ice:v1",
  wildfires: "wildfire:fires:v1",
  wildfiresBootstrap: "wildfire:fires-bootstrap:v1",
  marketQuotes: "market:stocks-bootstrap:v1",
  commodityQuotes: "market:commodities-bootstrap:v1",
  cyberThreats: "cyber:threats-bootstrap:v2",
  techReadiness: "economic:worldbank-techreadiness:v1",
  progressData: "economic:worldbank-progress:v1",
  renewableEnergy: "economic:worldbank-renewable:v1",
  positiveGeoEvents: "positive_events:geo-bootstrap:v1",
  riskScores: CII_RISK_SCORE_CACHE_KEYS.stale,
  naturalEvents: "natural:events:v1",
  flightDelays: "aviation:delays-bootstrap:v2",
  newsInsights: "news:insights:v1",
  predictionMarkets: "prediction:markets-bootstrap:v1",
  cryptoQuotes: "market:crypto:v1",
  gulfQuotes: "market:gulf-quotes:v1",
  stablecoinMarkets: "market:stablecoins:v1",
  unrestEvents: "unrest:events:v1",
  iranEvents: "conflict:iran-events:v1",
  ucdpEvents: "conflict:ucdp-events:v1",
  ucdpEventsBootstrap: "conflict:ucdp-events-bootstrap:v1",
  weatherAlerts: "weather:alerts:v1",
  spending: "economic:spending:v1",
  techEvents: "research:tech-events-bootstrap:v1",
  gdeltIntel: "intelligence:gdelt-intel:v1",
  correlationCards: "correlation:cards-bootstrap:v1",
  forecasts: "forecast:predictions:v2",
  forecastsBootstrap: "forecast:predictions-bootstrap:v1",
  securityAdvisories: "intelligence:advisories-bootstrap:v1",
  customsRevenue: "trade:customs-revenue:v1",
  comtradeFlows: "comtrade:flows:v1",
  blsSeries: "bls:series:v1",
  sanctionsPressure: "sanctions:pressure:v1",
  crossSourceSignals: "intelligence:cross-source-signals:v1",
  sanctionsEntities: "sanctions:entities:v1",
  radiationWatch: "radiation:observations:v1",
  consumerPricesOverview: "consumer-prices:overview:ae",
  consumerPricesCategories: "consumer-prices:categories:ae:30d",
  consumerPricesMovers: "consumer-prices:movers:ae:30d",
  consumerPricesSpread: "consumer-prices:retailer-spread:ae:essentials-ae",
  consumerPricesFreshness: "consumer-prices:freshness:ae",
  groceryBasket: "economic:grocery-basket:v1",
  bigmac: "economic:bigmac:v1",
  fuelPrices: "economic:fuel-prices:v1",
  faoFoodPriceIndex: "economic:fao-ffpi:v1",
  nationalDebt: "economic:national-debt:v1",
  defiTokens: "market:defi-tokens:v1",
  aiTokens: "market:ai-tokens:v1",
  otherTokens: "market:other-tokens:v1",
  fredBatch: "economic:fred:v1:FEDFUNDS:0",
  ecbEstr: "economic:fred:v1:ESTR:0",
  ecbEuribor3m: "economic:fred:v1:EURIBOR3M:0",
  ecbEuribor6m: "economic:fred:v1:EURIBOR6M:0",
  ecbEuribor1y: "economic:fred:v1:EURIBOR1Y:0",
  fearGreedIndex: "market:fear-greed:v1",
  breadthHistory: "market:breadth-history:v1",
  euYieldCurve: "economic:yield-curve-eu:v1",
  earningsCalendar: "market:earnings-calendar:v1",
  econCalendar: "economic:econ-calendar:v1",
  chinaMacro: "economic:china:macro:v1",
  chinaReleaseCalendar: "economic:china:release-calendar:v1",
  cotPositioning: "market:cot:v1",
  hyperliquidFlow: "market:hyperliquid:flow:v1",
  crudeInventories: "economic:crude-inventories:v1",
  natGasStorage: "economic:nat-gas-storage:v1",
  spr: "economic:spr:v1",
  refineryInputs: "economic:refinery-inputs:v1",
  ecbFxRates: "economic:ecb-fx-rates:v1",
  eurostatCountryData: "economic:eurostat-country-data:v1",
  eurostatHousePrices: "economic:eurostat:house-prices:v1",
  eurostatGovDebtQ: "economic:eurostat:gov-debt-q:v1",
  eurostatIndProd: "economic:eurostat:industrial-production:v1",
  euGasStorage: "economic:eu-gas-storage:v1",
  euFsi: "economic:fsi-eu:v1",
  shippingStress: "supply_chain:shipping_stress:v1",
  diseaseOutbreaks: "health:disease-outbreaks:v1",
  healthAirQuality: "health:air-quality:v1",
  socialVelocity: "intelligence:social:reddit:v1",
  wsbTickers: "intelligence:wsb-tickers:v1",
  vpdTrackerRealtime: "health:vpd-tracker:realtime:v1",
  vpdTrackerHistorical: "health:vpd-tracker:historical:v1",
  electricityPrices: "energy:electricity:v1:index",
  gasStorageCountries: "energy:gas-storage:v1:_countries",
  aaiiSentiment: "market:aaii-sentiment:v1",
  cryptoSectors: "market:crypto-sectors:v1",
  ddosAttacks: "cf:radar:ddos:v1",
  economicStress: "economic:stress-index:v1",
  trafficAnomalies: "cf:radar:traffic-anomalies:v1"
};
var STANDALONE_KEYS = {
  chinaCoverage: CHINA_COVERAGE_SUMMARY_KEY,
  hkoWarnings: "weather:hko-warnings:v1",
  // #4920 completeness measurement (daily GH Actions publishers) — ops
  // keys: health-monitored but NOT bootstrap-hydrated into page loads.
  newsFeedHealth: "news:feed-health:v1",
  newsRecallBenchmark: "news:recall-benchmark:v1",
  serviceStatuses: "infra:service-statuses:v1",
  macroSignals: "economic:macro-signals:v1",
  energyPrices: "economic:energy:v1:all",
  bisPolicy: "economic:bis:policy:v1",
  bisExchange: "economic:bis:eer:v1",
  fxYoy: "economic:fx:yoy:v1",
  sharedFxRates: "shared:fx-rates:v1",
  bisCredit: "economic:bis:credit:v1",
  bisDsr: "economic:bis:dsr:v1",
  bisPropertyResidential: "economic:bis:property-residential:v1",
  bisPropertyCommercial: "economic:bis:property-commercial:v1",
  imfMacro: "economic:imf:macro:v2",
  imfGrowth: "economic:imf:growth:v1",
  imfLabor: "economic:imf:labor:v1",
  imfExternal: "economic:imf:external:v1",
  // plan 2026-04-25-004 Phase 2: financialSystemExposure data keys.
  wbExternalDebt: "economic:wb-external-debt:v1",
  bisLbs: "economic:bis-lbs:v1",
  fatfListing: "economic:fatf-listing:v1",
  climateZoneNormals: "climate:zone-normals:v1",
  shippingRates: "supply_chain:shipping:v2",
  chokepoints: "supply_chain:chokepoints:v4",
  minerals: "supply_chain:minerals:v2",
  giving: "giving:summary:v1",
  gpsjam: "intelligence:gpsjam:v2",
  theaterPosture: "theater_posture:sebuf:stale:v1",
  theaterPostureLive: "theater-posture:sebuf:v1",
  theaterPostureBackup: "theater-posture:sebuf:backup:v1",
  riskScoresLive: CII_RISK_SCORE_CACHE_KEYS.live,
  usniFleet: "usni-fleet:sebuf:v1",
  usniFleetStale: "usni-fleet:sebuf:stale:v1",
  faaDelays: "aviation:delays:faa:v1",
  intlDelays: "aviation:delays:intl:v3",
  notamClosures: "aviation:notam:closures:v2",
  positiveEventsLive: "positive-events:geo:v1",
  cableHealth: "cable-health-v1",
  submarineCables: "infrastructure:submarine-cables:v1",
  cyberThreatsRpc: "cyber:threats:v2",
  militaryBases: "military:bases:active",
  militaryFlights: "military:flights:v1",
  militaryFlightsStale: "military:flights:stale:v1",
  // STANDALONE (not BOOTSTRAP) by design — value is a single keyed payload
  // (asOf + per-country aggregate), no per-record gating needed; health just
  // verifies existence + freshness via the matching SEED_META entry. Same
  // shape as militaryFlights above.
  militaryCii: "intelligence:military-cii:v1",
  globalTendersSam: "economic:global-tenders:v1:source:sam",
  globalTendersTed: "economic:global-tenders:v1:source:ted",
  globalTendersContractsFinder: "economic:global-tenders:v1:source:contracts-finder",
  globalTendersCanadaBuys: "economic:global-tenders:v1:source:canada-buys",
  globalTendersGets: "economic:global-tenders:v1:source:gets",
  globalTendersWorldBank: "economic:global-tenders:v1:source:world-bank",
  defensePatents: "patents:defense:latest",
  temporalAnomalies: "temporal:anomalies:v1",
  displacement: `displacement:summary:v1:${(/* @__PURE__ */ new Date()).getUTCFullYear()}`,
  displacementPrev: `displacement:summary:v1:${(/* @__PURE__ */ new Date()).getUTCFullYear() - 1}`,
  acledIntel: "conflict:acled:v1:all:0:0",
  satellites: "intelligence:satellites:tle:v1",
  portwatch: "supply_chain:portwatch:v1",
  portwatchDisruptions: "portwatch:disruptions:active:v1",
  portwatchPortActivity: "supply_chain:portwatch-ports:v1:_countries",
  corridorrisk: "supply_chain:corridorrisk:v1",
  chokepointTransits: "supply_chain:chokepoint_transits:v1",
  transitSummaries: "supply_chain:transit-summaries:v1",
  // Meta-only aggregate: payloads are sharded by country, so use the seed-meta
  // key as the probe target rather than pretending one country key is global.
  comtradeBilateralHs4: "seed-meta:comtrade:bilateral-hs4",
  thermalEscalation: "thermal:escalation:v1",
  thermalEscalationBootstrap: "thermal:escalation-bootstrap:v1",
  tariffTrendsUs: "trade:tariffs:v1:840:all:10",
  militaryForecastInputs: "military:forecast-inputs:stale:v1",
  gscpi: "economic:fred:v1:GSCPI:0",
  forecastFredWalcl: "economic:fred:v1:WALCL:0",
  forecastFredT10y2y: "economic:fred:v1:T10Y2Y:0",
  forecastFredUnrate: "economic:fred:v1:UNRATE:0",
  forecastFredCpiaucsl: "economic:fred:v1:CPIAUCSL:0",
  forecastFredDgs10: "economic:fred:v1:DGS10:0",
  forecastFredVixcls: "economic:fred:v1:VIXCLS:0",
  forecastFredGdp: "economic:fred:v1:GDP:0",
  forecastFredM2sl: "economic:fred:v1:M2SL:0",
  forecastFredDcoilwtico: "economic:fred:v1:DCOILWTICO:0",
  marketImplications: "intelligence:market-implications:v1",
  hormuzTracker: "supply_chain:hormuz_tracker:v1",
  simulationPackageLatest: "forecast:simulation-package:latest",
  simulationOutcomeLatest: "forecast:simulation-outcome:latest",
  newsThreatSummary: "news:threat:summary:v1",
  climateNews: "climate:news-intelligence:v1",
  pizzint: "intelligence:pizzint:seed:v1",
  resilienceStaticIndex: "resilience:static:index:v1",
  resilienceStaticFao: "resilience:static:fao",
  resilienceRanking: "resilience:ranking:v25",
  productCatalog: "product-catalog:v2",
  energySpineCountries: "energy:spine:v1:_countries",
  energyExposure: "energy:exposure:v1:index",
  energyMixAll: "energy:mix:v1:_all",
  regulatoryActions: "regulatory:actions:v1",
  energyIntelligence: "energy:intelligence:feed:v1",
  ieaOilStocks: "energy:iea-oil-stocks:v1:index",
  oilStocksAnalysis: "energy:oil-stocks-analysis:v1",
  eiaPetroleum: "energy:eia-petroleum:v1",
  jodiGas: "energy:jodi-gas:v1:_countries",
  lngVulnerability: "energy:lng-vulnerability:v1",
  jodiOil: "energy:jodi-oil:v1:_countries",
  chokepointBaselines: "energy:chokepoint-baselines:v1",
  portwatchChokepointsRef: "portwatch:chokepoints:ref:v1",
  chokepointFlows: "energy:chokepoint-flows:v1",
  emberElectricity: "energy:ember:v1:_all",
  resilienceIntervals: "resilience:intervals:v9:US",
  sprPolicies: "energy:spr-policies:v1",
  pipelinesGas: "energy:pipelines:gas:v1",
  pipelinesOil: "energy:pipelines:oil:v1",
  storageFacilities: "energy:storage-facilities:v1",
  fuelShortages: "energy:fuel-shortages:v1",
  energyDisruptions: "energy:disruptions:v1",
  energyCrisisPolicies: "energy:crisis-policies:v1",
  regionalSnapshots: "intelligence:regional-snapshots:summary:v1",
  regionalBriefs: "intelligence:regional-briefs:summary:v1",
  recoveryFiscalSpace: "resilience:recovery:fiscal-space:v1",
  recoveryReserveAdequacy: "resilience:recovery:reserve-adequacy:v1",
  recoveryExternalDebt: "resilience:recovery:external-debt:v1",
  recoveryImportHhi: "resilience:recovery:import-hhi:v1",
  // recoveryFuelStocks: probe removed. The seeder
  // (seed-recovery-fuel-stocks.mjs) still runs in seed-bundle-resilience-
  // recovery so the data is preserved for a future replacement dimension,
  // but `scoreFuelStockDays` in _dimension-scorers.ts is hard-wired to
  // return coverage=0/imputationClass=null (retired in PR 3 §3.5) and
  // never calls getCachedJson on this key. Probing it surfaced a green
  // STATUS:OK that meant "the cron ran", not "the data is used"; that's
  // an actively-misleading signal so it's gone. Re-add this slot if and
  // when a future PR wires scoreFuelStockDays to read real data again.
  recoveryReexportShare: "resilience:recovery:reexport-share:v1",
  recoverySovereignWealth: "resilience:recovery:sovereign-wealth:v1",
  // PR 1 v2 energy-construct seeds. STRICT SEED_META (not ON_DEMAND):
  // plan 2026-04-24-001 removed these from ON_DEMAND_KEYS so /api/health
  // reports CRIT (not WARN) when they are absent. This is the intended
  // alarm on the Railway bundle-not-provisioned state. See the ON_DEMAND_KEYS
  // comment block below for the full rationale.
  lowCarbonGeneration: "resilience:low-carbon-generation:v1",
  fossilElectricityShare: "resilience:fossil-electricity-share:v1",
  powerLosses: "resilience:power-losses:v1",
  goldExtended: "market:gold-extended:v1",
  goldEtfFlows: "market:gold-etf-flows:v1",
  goldCbReserves: "market:gold-cb-reserves:v1",
  // Relay-side loop heartbeats. ais-relay.cjs writes these on successful child
  // exit for the two execFile-spawned seeders (chokepoint-flows, climate-news).
  // A stale heartbeat means the relay loop itself is broken (child dying at
  // import, parent event-loop blocked, container in a restart loop, etc.)
  // and alarms earlier than the underlying seed-meta staleness window.
  chokepointFlowsRelayHeartbeat: "relay:heartbeat:chokepoint-flows",
  climateNewsRelayHeartbeat: "relay:heartbeat:climate-news",
  telegramFeed: "intelligence:telegram-feed:v1",
  digestNotifications: "digest:last-run",
  webcams: "webcam:cameras:active",
  forecastResolutions: "forecast:resolutions:v1",
  forecastScorecard: "forecast:scorecard:v1",
  forecastBets: "forecast:bets:history:v1",
  forecastFunnel: "forecast:funnel:health:v1",
  researchArxivHnTrending: "research:arxiv:v1:cs.AI::50"
};
var SEED_META = {
  chinaCoverage: { key: "seed-meta:health:china-coverage", maxStaleMin: 180 },
  earthquakes: { key: "seed-meta:seismology:earthquakes", maxStaleMin: 30 },
  wildfires: { key: "seed-meta:wildfire:fires", maxStaleMin: 360 },
  // FIRMS NRT resets at midnight UTC; new-day data takes 3-6h to accumulate
  wildfiresBootstrap: { key: "seed-meta:wildfire:fires-bootstrap", maxStaleMin: 360 },
  // Compact CDN payload is a distinct publish target; monitor it so canonical fallback cannot hide transform/write failures.
  outages: { key: "seed-meta:infra:outages", maxStaleMin: 30 },
  climateAnomalies: { key: "seed-meta:climate:anomalies", maxStaleMin: 540 },
  // bundled into seed-bundle-climate (cron `0 */3 * * *`, every 3h); 540 = 3× cron cadence per project convention. Prior 240 (1.33× cron) flipped to silent-EMPTY between minute 180 (TTL_DATA expiry) and 240 (alarm trigger) on every routine cron-jitter cycle — see scripts/seed-climate-anomalies.mjs CACHE_TTL comment.
  climateDisasters: { key: "seed-meta:climate:disasters", maxStaleMin: 720 },
  // runs every 6h; 720min = 2x interval
  climateAirQuality: { key: "seed-meta:health:air-quality", maxStaleMin: 180 },
  // hourly cron; 180 = 3x interval — shares meta key with healthAirQuality (same seeder run)
  climateZoneNormals: { key: "seed-meta:climate:zone-normals", maxStaleMin: 89280 },
  // monthly cron on the 1st; 62d = 2x 31-day cadence
  co2Monitoring: { key: "seed-meta:climate:co2-monitoring", maxStaleMin: 4320 },
  // daily cron at 06:00 UTC; 72h tolerates two missed runs
  oceanIce: { key: "seed-meta:climate:ocean-ice", maxStaleMin: 2880 },
  // daily cron at 08:00 UTC; 48h = 2× interval, tolerates one missed run
  climateNews: { key: "seed-meta:climate:news-intelligence", maxStaleMin: 90 },
  // relay loop every 30min; 90 = 3× interval
  unrestEvents: { key: "seed-meta:unrest:events", maxStaleMin: 120 },
  // 45min cron; 120 = 2h grace (was 75 = 30min buffer, too tight)
  cyberThreats: { key: "seed-meta:cyber:threats", maxStaleMin: 240 },
  // 2h interval; 240min = 2x interval
  cryptoQuotes: { key: "seed-meta:market:crypto", maxStaleMin: 30 },
  etfFlows: { key: "seed-meta:market:etf-flows", maxStaleMin: 60 },
  gulfQuotes: { key: "seed-meta:market:gulf-quotes", maxStaleMin: 30 },
  stablecoinMarkets: { key: "seed-meta:market:stablecoins", maxStaleMin: 60 },
  naturalEvents: { key: "seed-meta:natural:events", maxStaleMin: 540 },
  // 3h Railway climate bundle; 3x cadence preserves a full missed run.
  hkoWarnings: { key: "seed-meta:weather:hko-warnings", maxStaleMin: 540 },
  // successful HKO responses publish a snapshot even when no tropical-cyclone warning is active.
  flightDelays: { key: "seed-meta:aviation:faa", maxStaleMin: 90 },
  // CACHE_TTL=7200s; matches notamClosures from same cron
  notamClosures: { key: "seed-meta:aviation:notam", maxStaleMin: 240 },
  // 2h interval; 240min = 2x interval
  predictionMarkets: { key: "seed-meta:prediction:markets", maxStaleMin: 90 },
  newsInsights: { key: "seed-meta:news:insights", maxStaleMin: 30 },
  // #4920: daily GH Actions cadence; 2880 = 2x — one fully missed day alarms
  newsFeedHealth: { key: "seed-meta:news:feed-health", maxStaleMin: 2880 },
  newsRecallBenchmark: { key: "seed-meta:news:recall-benchmark", maxStaleMin: 2880 },
  marketQuotes: { key: "seed-meta:market:stocks", maxStaleMin: 30 },
  commodityQuotes: { key: "seed-meta:market:commodities", maxStaleMin: 30 },
  goldExtended: { key: "seed-meta:market:gold-extended", maxStaleMin: 30 },
  goldEtfFlows: { key: "seed-meta:market:gold-etf-flows", maxStaleMin: 2880 },
  // SPDR publishes daily; 2× = 48h tolerance
  goldCbReserves: { key: "seed-meta:market:gold-cb-reserves", maxStaleMin: 44640 },
  // IMF IFS is monthly w/ ~2-3mo lag; 31d tolerance
  // RPC/warm-ping keys — seed-meta written by relay loops or handlers
  // serviceStatuses: moved to ON_DEMAND — RPC-populated, no dedicated seed, goes stale when no users visit
  cableHealth: { key: "seed-meta:cable-health", maxStaleMin: 90 },
  // ais-relay warm-ping runs every 30min; 90min = 3× interval catches missed pings without false positives
  submarineCables: { key: "seed-meta:infrastructure:submarine-cables", maxStaleMin: 25200 },
  macroSignals: { key: "seed-meta:economic:macro-signals", maxStaleMin: 150 },
  // seed-economy afterPublish-derived stress/macro key
  chinaMacro: { key: "seed-meta:economic:china-macro", maxStaleMin: 4320 },
  // 36h gate; 72h tolerates one missed run
  chinaReleaseCalendar: { key: "seed-meta:economic:china-release-calendar", maxStaleMin: 4320 },
  energyPrices: { key: "seed-meta:economic:energy-prices", maxStaleMin: 150 },
  // seed-economy primary runSeed resource
  bisPolicy: { key: "seed-meta:economic:bis", maxStaleMin: 10080 },
  // runSeed('economic','bis',...) writes seed-meta:economic:bis
  // seed-bis-extended.mjs is a child-process section spawned by
  // scripts/seed-bundle-macro.mjs. The bundle's Railway cron fires more
  // often than the per-section `intervalMs: 12 * HOUR` gate (production
  // logs 2026-04-26T08:00:45 show "BIS-Extended Skipped, last seeded
  // 175min ago, interval: 720min" — gate actively load-bearing on every
  // bundle tick). So the EFFECTIVE write cadence is governed by the 12h
  // gate, not the bundle cron. Per-dataset seed-meta is only written when
  // THAT dataset published fresh entries — so a single-dataset BIS outage
  // (e.g. WS_DSR 500s) goes STALE in health without dragging down the
  // healthy ones.
  //
  // The previous 1440 (= 2× the 12h gate, but only 1× the actual rolled-up
  // cadence after typical cron drift) had ZERO grace. All three keys
  // flipped to STALE_SEED synchronously at minute 1442 on 2026-04-27
  // (gate-eligible run delayed by ~24h after one failed intermediate cron).
  // 2160min = 3× the 12h gate covers cron drift + one degraded-to-24h
  // cycle, fires within 36h on a real outage.
  bisDsr: { key: "seed-meta:economic:bis-dsr", maxStaleMin: 2160 },
  bisPropertyResidential: { key: "seed-meta:economic:bis-property-residential", maxStaleMin: 2160 },
  bisPropertyCommercial: { key: "seed-meta:economic:bis-property-commercial", maxStaleMin: 2160 },
  imfMacro: { key: "seed-meta:economic:imf-macro", maxStaleMin: 100800 },
  // monthly seed; 100800min = 70 days = 2× interval (absorbs one missed run)
  imfGrowth: { key: "seed-meta:economic:imf-growth", maxStaleMin: 100800 },
  // monthly seed; 70d threshold matches imfMacro (same WEO release cadence)
  imfLabor: { key: "seed-meta:economic:imf-labor", maxStaleMin: 100800 },
  // monthly seed; 70d threshold matches imfMacro
  imfExternal: { key: "seed-meta:economic:imf-external", maxStaleMin: 100800 },
  // monthly seed; 70d threshold matches imfMacro
  // plan 2026-04-25-004 Phase 2: financialSystemExposure component seeders.
  // Bundle: scripts/seed-bundle-macro.mjs (Codex R1 #5, Option A).
  wbExternalDebt: { key: "seed-meta:economic:wb-external-debt", maxStaleMin: 100800 },
  // annual WB IDS publication; 70d threshold matches IMF cadence pattern
  bisLbs: { key: "seed-meta:economic:bis-lbs", maxStaleMin: 14400 },
  // BIS LBS quarterly publication; 10d threshold = ~1× publish lag tolerance after macro bundle daily refresh
  fatfListing: { key: "seed-meta:economic:fatf-listing", maxStaleMin: 60480 },
  // FATF plenary 3×/year; 42d threshold = >1 plenary cycle (catches missed-update if cron silently fails)
  shippingRates: { key: "seed-meta:supply_chain:shipping", maxStaleMin: 420 },
  chokepoints: { key: "seed-meta:supply_chain:chokepoints", maxStaleMin: 60, minRecordCount: 13 },
  // 13 canonical chokepoints; get-chokepoint-status writes covered-count → < 13 = upstream partial (portwatch/ArcGIS dropped some)
  // minerals + giving: on-demand cachedFetchJson only, no seed-meta writer — freshness checked via TTL
  // bisExchange + bisCredit: extras written by same BIS script via writeExtraKey, no dedicated seed-meta
  fxYoy: { key: "seed-meta:economic:fx-yoy", maxStaleMin: 1500 },
  // daily cron; 25h tolerance + 1h drift
  sharedFxRates: { key: "seed-meta:shared:fx-rates", maxStaleMin: 3600 },
  // daily seed; 60h tolerance covers a missed 25h cache refresh
  gpsjam: { key: "seed-meta:intelligence:gpsjam", maxStaleMin: 1440 },
  // Wingbits API (scripts/fetch-gpsjam.mjs); 1440min = 24h tolerance gives operator headroom to handle upstream outages and monthly quota exhaustion (HTTP 402 observed 2026-04-29) without dashboard noise. Seeder catch-block extends TTL on fail without refreshing fetchedAt, so STALE_SEED via age is the only alarm path.
  positiveGeoEvents: { key: "seed-meta:positive-events:geo", maxStaleMin: 60 },
  riskScores: { key: "seed-meta:intelligence:risk-scores", maxStaleMin: 30, minRecordCount: 3 },
  // CII warm-ping every 8min; recordCount is realtime signal-density coverage for score-relevant conflict (ACLED or UCDP), news, and cyber families, not raw feed availability; quiet-but-fresh feeds may warn COVERAGE_PARTIAL.
  iranEvents: { key: "seed-meta:conflict:iran-events", maxStaleMin: 20160 },
  // manual seed from LiveUAMap; 20160 = 14d = 2× weekly cadence
  ucdpEvents: { key: "seed-meta:conflict:ucdp-events", maxStaleMin: 420 },
  ucdpEventsBootstrap: { key: "seed-meta:conflict:ucdp-events-bootstrap", maxStaleMin: 420 },
  // Same cron. Monitored separately because the bootstrap tier now hydrates from the compact projection, and a transform/write failure there must not hide behind a healthy canonical key (#5300).
  acledIntel: { key: "seed-meta:conflict:acled-intel", maxStaleMin: 38 },
  // conflict:acled:v1:all:0:0, now ACLED-or-GDELT fallback for the forecast EMA input (#5099).
  militaryFlights: { key: "seed-meta:military:flights", maxStaleMin: 30 },
  // cron ~10min (LIVE_TTL=600s); 30min = 3x interval,
  militaryCii: { key: "seed-meta:intelligence:military-cii", maxStaleMin: 45 },
  // seed-military-cii cron ~10min; 45 = generous grace (relay-dependent; preserve-last-good runs still refresh meta)
  defensePatents: { key: "seed-meta:military:defense-patents", maxStaleMin: 25200 },
  satellites: { key: "seed-meta:intelligence:satellites", maxStaleMin: 240 },
  // CelesTrak every 120min; 240min = absorbs one missed cycle
  temporalAnomalies: { key: "seed-meta:temporal:anomalies", maxStaleMin: 45 },
  // request-driven producer kept warm by seed-infra; data TTL is 60min so health reaches STALE_SEED before EMPTY
  weatherAlerts: { key: "seed-meta:weather:alerts", maxStaleMin: 45 },
  // relay loop every 15min; 45 = 3× interval (was 30 = 2×, too tight on relay hiccup)
  spending: { key: "seed-meta:economic:spending", maxStaleMin: 120 },
  globalTenders: { key: "seed-meta:economic:global-tenders", maxStaleMin: 180 },
  globalTendersSam: { key: "seed-meta:economic:global-tenders:sam", maxStaleMin: 180 },
  globalTendersTed: { key: "seed-meta:economic:global-tenders:ted", maxStaleMin: 180 },
  globalTendersContractsFinder: { key: "seed-meta:economic:global-tenders:contracts-finder", maxStaleMin: 180 },
  globalTendersCanadaBuys: { key: "seed-meta:economic:global-tenders:canada-buys", maxStaleMin: 180 },
  globalTendersGets: { key: "seed-meta:economic:global-tenders:gets", maxStaleMin: 180 },
  globalTendersWorldBank: { key: "seed-meta:economic:global-tenders:world-bank", maxStaleMin: 180 },
  techEvents: { key: "seed-meta:research:tech-events", maxStaleMin: 480 },
  researchArxivHnTrending: { key: "seed-meta:research:arxiv-hn-trending", maxStaleMin: 150 },
  gdeltIntel: { key: "seed-meta:intelligence:gdelt-intel", maxStaleMin: 720 },
  // 6h cron; 12h staleness = 2× cadence = 1 missed tick + cron jitter, alerts at 2 missed ticks. Bumped from 420 (1.16× cadence, virtually zero margin) on 2026-05-12 after the same Railway-deploy-preempted-tick pattern that hit resilienceIntervals on 2026-05-10 (PR #3652): seedAgeMin=467 vs maxStale=420 → ~1min UptimeRobot WARNING flip when a deploy preempted the 15:00 UTC tick. CACHE_TTL is 24h so per-topic merge always has a prior snapshot even at the upper end of the new budget.
  telegramFeed: { key: "seed-meta:intelligence:telegram-feed:v1", maxStaleMin: 10 },
  // 60s poll interval; 10min grace catches poll failures before they go stale in the panel
  digestNotifications: { key: "seed-meta:digest:last-run", maxStaleMin: 90 },
  // Railway digest-notifications cron runs every 30min; 90 = 3x cadence and detects a dead cron before daily digests are missed.
  forecasts: { key: "seed-meta:forecast:predictions", maxStaleMin: 90 },
  forecastsBootstrap: { key: "seed-meta:forecast:predictions-bootstrap", maxStaleMin: 90 },
  // Same cron. Monitored separately: the fast tier now hydrates from the dashboard list, and a transform/write failure there must not hide behind a healthy canonical key (#5300).
  forecastResolutions: { key: "seed-meta:forecast:resolutions", maxStaleMin: 2160 },
  // daily Bet-2 resolver; 36h catches a missed cron without flapping on normal daily jitter
  forecastScorecard: { key: "seed-meta:forecast:scorecard", maxStaleMin: 2160 },
  // scorecard extra key written by seed-forecast-resolutions
  forecastBets: { key: "seed-meta:forecast:bets", maxStaleMin: 2880 },
  // #5233 shadow bet-engine seeder; daily cron (05:00 UTC), 48h = 2× interval
  forecastFunnel: { key: "seed-meta:forecast:funnel:health:v1", maxStaleMin: 180 },
  // funnel-diversity guardrail (#5233); written by seed-forecasts afterPublish each hourly run (3× cadence). status:'error' → SEED_ERROR when the published funnel collapses (too few domains / mostly synthetic)
  sectors: { key: "seed-meta:market:sectors", maxStaleMin: 30 },
  techReadiness: { key: "seed-meta:economic:worldbank-techreadiness:v1", maxStaleMin: 10080 },
  progressData: { key: "seed-meta:economic:worldbank-progress:v1", maxStaleMin: 10080 },
  renewableEnergy: { key: "seed-meta:economic:worldbank-renewable:v1", maxStaleMin: 10080 },
  intlDelays: { key: "seed-meta:aviation:intl", maxStaleMin: 90 },
  // faaDelays shares seed-meta key with flightDelays — no duplicate entry needed here
  theaterPosture: { key: "seed-meta:theater-posture", maxStaleMin: 60 },
  correlationCards: { key: "seed-meta:correlation:cards", maxStaleMin: 30 },
  // 5min cron (seed-bundle-derived-signals); 30min = 6× interval. Was 15 (3× = gold-standard floor) — overnight UptimeRobot flips when bundle jitter spaced two consecutive runs ~9-10min apart, producing 15-19min gaps that tripped STALE_SEED briefly. See WM 2026-05-10 health:failure-log.
  portwatch: { key: "seed-meta:supply_chain:portwatch", maxStaleMin: 720 },
  portwatchDisruptions: { key: "seed-meta:portwatch:disruptions", maxStaleMin: 150 },
  portwatchPortActivity: { key: "seed-meta:supply_chain:portwatch-ports", maxStaleMin: 2160, minRecordCount: 174 },
  // 12h cron; 36h = 3x interval; #3613 requires full 174-country coverage before OK.
  corridorrisk: { key: "seed-meta:supply_chain:corridorrisk", maxStaleMin: 120 },
  chokepointTransits: { key: "seed-meta:supply_chain:chokepoint_transits", maxStaleMin: 30 },
  // relay every 10min; 30min = 3x interval,
  transitSummaries: { key: "seed-meta:supply_chain:transit-summaries", maxStaleMin: 30 },
  // relay every 10min; 30min = 3x interval,
  usniFleet: { key: "seed-meta:military:usni-fleet", maxStaleMin: 720 },
  // relay loop every 6h; 720 = 2× interval (was 480 = 1.3×, too tight)
  securityAdvisories: { key: "seed-meta:intelligence:advisories", maxStaleMin: 120 },
  customsRevenue: { key: "seed-meta:trade:customs-revenue", maxStaleMin: 1440 },
  comtradeFlows: { key: "seed-meta:trade:comtrade-flows", maxStaleMin: 2880 },
  // 24h cron; 2880min = 48h = 2x interval
  comtradeBilateralHs4: { key: "seed-meta:comtrade:bilateral-hs4", maxStaleMin: 34560 },
  // 24d freshness gate + 25d meta TTL; meta-only aggregate over sharded country keys
  blsSeries: { key: "seed-meta:economic:bls-series", maxStaleMin: 2880 },
  // daily seed; 2880min = 48h = 2x interval
  sanctionsPressure: { key: "seed-meta:sanctions:pressure", maxStaleMin: 720 },
  crossSourceSignals: { key: "seed-meta:intelligence:cross-source-signals", maxStaleMin: 30 },
  // 15min cron; 30min = 2x interval
  regionalSnapshots: { key: "seed-meta:intelligence:regional-snapshots", maxStaleMin: 720 },
  // 6h cron via seed-bundle-derived-signals; 720min = 12h = 2x interval
  regionalBriefs: { key: "seed-meta:intelligence:regional-briefs", maxStaleMin: 20160 },
  // weekly cron; 20160min = 14 days = 2x interval
  sanctionsEntities: { key: "seed-meta:sanctions:entities", maxStaleMin: 1440 },
  // 12h cron; 1440min = 24h = 2x interval
  radiationWatch: { key: "seed-meta:radiation:observations", maxStaleMin: 30 },
  groceryBasket: { key: "seed-meta:economic:grocery-basket", maxStaleMin: 10080 },
  // weekly seed; 10080 = 7 days
  bigmac: { key: "seed-meta:economic:bigmac", maxStaleMin: 10080 },
  // weekly seed; 10080 = 7 days
  fuelPrices: { key: "seed-meta:economic:fuel-prices", maxStaleMin: 10080 },
  // weekly seed; 10080 = 7 days
  faoFoodPriceIndex: { key: "seed-meta:economic:fao-ffpi", maxStaleMin: 86400 },
  // monthly seed; 86400 = 60 days (2x interval)
  thermalEscalation: { key: "seed-meta:thermal:escalation", maxStaleMin: 360 },
  // cron every 2h; 360 = 3x interval (was 240 = 2x)
  thermalEscalationBootstrap: { key: "seed-meta:thermal:escalation-bootstrap", maxStaleMin: 360 },
  // Same cron as above. Monitored separately because the bootstrap tier now hydrates from the compact projection, and a transform/write failure there must not hide behind a healthy canonical key (#5300).
  nationalDebt: { key: "seed-meta:economic:national-debt", maxStaleMin: 86400 },
  // monthly seed (seed-bundle-macro intervalMs: 30 * DAY); 60d = 2x interval absorbs one missed run. Prior 10080 (7d) was narrower than the cron interval so every cron past day 7 alarmed STALE_SEED.
  tariffTrendsUs: { key: "seed-meta:trade:tariffs:v1:840:all:10", maxStaleMin: 540 },
  // co-pinned to TARIFF_TTL (8h=480min) + 60min grace. Prior 900 (15h) created an 8h-15h silent window where data had expired but seed-meta was still considered fresh, masking real outages as status=EMPTY (not STALE_SEED). See scripts/seed-supply-chain-trade.mjs TARIFF_TTL.
  // publish.ts runs once daily (02:30 UTC); seed-meta TTL=52h — maxStaleMin must cover the full 24h cycle
  consumerPricesOverview: { key: "seed-meta:consumer-prices:overview:ae", maxStaleMin: 1500 },
  // 25h = 24h cadence + 1h grace
  consumerPricesCategories: { key: "seed-meta:consumer-prices:categories:ae:30d", maxStaleMin: 1500 },
  consumerPricesMovers: { key: "seed-meta:consumer-prices:movers:ae:30d", maxStaleMin: 1500 },
  consumerPricesSpread: { key: "seed-meta:consumer-prices:retailer-spread:ae:essentials-ae", maxStaleMin: 1500 },
  consumerPricesFreshness: { key: "seed-meta:consumer-prices:freshness:ae", maxStaleMin: 1500 },
  // defiTokens/aiTokens/otherTokens all share one seed run (seed-token-panels cron, every 30min)
  defiTokens: { key: "seed-meta:market:token-panels", maxStaleMin: 90 },
  aiTokens: { key: "seed-meta:market:token-panels", maxStaleMin: 90 },
  otherTokens: { key: "seed-meta:market:token-panels", maxStaleMin: 90 },
  fredBatch: { key: "seed-meta:economic:fred:v1:FEDFUNDS:0", maxStaleMin: 1500 },
  // daily cron
  forecastFredWalcl: { key: "seed-meta:economic:fred:v1:WALCL:0", maxStaleMin: 1500 },
  forecastFredT10y2y: { key: "seed-meta:economic:fred:v1:T10Y2Y:0", maxStaleMin: 1500 },
  forecastFredUnrate: { key: "seed-meta:economic:fred:v1:UNRATE:0", maxStaleMin: 1500 },
  forecastFredCpiaucsl: { key: "seed-meta:economic:fred:v1:CPIAUCSL:0", maxStaleMin: 1500 },
  forecastFredDgs10: { key: "seed-meta:economic:fred:v1:DGS10:0", maxStaleMin: 1500 },
  forecastFredVixcls: { key: "seed-meta:economic:fred:v1:VIXCLS:0", maxStaleMin: 1500 },
  forecastFredGdp: { key: "seed-meta:economic:fred:v1:GDP:0", maxStaleMin: 1500 },
  forecastFredM2sl: { key: "seed-meta:economic:fred:v1:M2SL:0", maxStaleMin: 1500 },
  forecastFredDcoilwtico: { key: "seed-meta:economic:fred:v1:DCOILWTICO:0", maxStaleMin: 1500 },
  ecbEstr: { key: "seed-meta:economic:ecb-short-rates", maxStaleMin: 4320 },
  // daily ECB publish; 4320min = 3d = TTL/interval
  ecbEuribor3m: { key: "seed-meta:economic:ecb-short-rates", maxStaleMin: 4320 },
  // shared meta key with ecbEstr
  ecbEuribor6m: { key: "seed-meta:economic:ecb-short-rates", maxStaleMin: 4320 },
  // shared meta key with ecbEstr
  ecbEuribor1y: { key: "seed-meta:economic:ecb-short-rates", maxStaleMin: 4320 },
  // shared meta key with ecbEstr
  gscpi: { key: "seed-meta:economic:gscpi", maxStaleMin: 2880 },
  // 24h interval; 2880min = 48h = 2x interval
  fearGreedIndex: { key: "seed-meta:market:fear-greed", maxStaleMin: 720 },
  // 6h cron; 720min = 12h = 2x interval
  breadthHistory: { key: "seed-meta:market:breadth-history", maxStaleMin: 5760 },
  // cron at 02:00 UTC, Tue-Sat (captures Mon-Fri market close); max gap Sat→Tue = 72h + 24h miss buffer = 96h = 5760min. 48h was wrong — alarmed every Monday morning when Sun+Mon are intentionally skipped.
  hormuzTracker: { key: "seed-meta:supply_chain:hormuz_tracker", maxStaleMin: 2880 },
  // daily cron; 2880min = 48h = 2x interval
  earningsCalendar: { key: "seed-meta:market:earnings-calendar", maxStaleMin: 1440 },
  // 12h cron; 1440min = 24h = 2x interval
  econCalendar: { key: "seed-meta:economic:econ-calendar", maxStaleMin: 1440 },
  // 12h cron; 1440min = 24h = 2x interval
  cotPositioning: { key: "seed-meta:market:cot", maxStaleMin: 14400 },
  // weekly CFTC release; 14400min = 10d = 1.4x interval (weekend + delay buffer)
  hyperliquidFlow: { key: "seed-meta:market:hyperliquid-flow", maxStaleMin: 30 },
  // 5min cron (bundled in seed-bundle-market-backup); 30min = 6× interval. Was 15 (3× = gold-standard floor with zero safety margin) — same exposure as correlationCards. Pre-fix comment said "Railway cron" but it's bundle-driven, so subject to the 80% skip-gate that produced 9-19min jitter under load.
  crudeInventories: { key: "seed-meta:economic:crude-inventories", maxStaleMin: 20160 },
  // weekly EIA data; 20160min = 14 days = 2x weekly cadence
  natGasStorage: { key: "seed-meta:economic:nat-gas-storage", maxStaleMin: 20160 },
  // weekly EIA data; 20160min = 14 days = 2x weekly cadence
  spr: { key: "seed-meta:economic:spr", maxStaleMin: 20160 },
  // weekly EIA data; 20160min = 14 days = 2x weekly cadence
  refineryInputs: { key: "seed-meta:economic:refinery-inputs", maxStaleMin: 20160 },
  // weekly EIA data; 20160min = 14 days = 2x weekly cadence
  ecbFxRates: { key: "seed-meta:economic:ecb-fx-rates", maxStaleMin: 5760 },
  // daily seed (weekdays + holidays); 5760min = 96h = covers Wed→Mon Easter gap
  eurostatCountryData: { key: "seed-meta:economic:eurostat-country-data", maxStaleMin: 4320 },
  // daily seed; 4320min = 3 days = 3x interval
  eurostatHousePrices: { key: "seed-meta:economic:eurostat-house-prices", maxStaleMin: 60 * 24 * 50 },
  // weekly cron, annual data; 50d threshold = 35d TTL + 15d buffer
  eurostatGovDebtQ: { key: "seed-meta:economic:eurostat-gov-debt-q", maxStaleMin: 60 * 24 * 14 },
  // 2d cron, quarterly data; 14d threshold matches TTL + quarterly release drift
  eurostatIndProd: { key: "seed-meta:economic:eurostat-industrial-production", maxStaleMin: 60 * 24 * 5 },
  // daily cron, monthly data; 5d threshold matches TTL
  euGasStorage: { key: "seed-meta:economic:eu-gas-storage", maxStaleMin: 2880 },
  // daily seed (T+1); 2880min = 48h = 2x interval
  euYieldCurve: { key: "seed-meta:economic:yield-curve-eu", maxStaleMin: 4320 },
  // daily seed (weekdays only); 4320min = 72h = covers Fri→Mon gap
  euFsi: { key: "seed-meta:economic:fsi-eu", maxStaleMin: 5760 },
  // daily seed (weekdays + holidays); 5760min = 96h = covers Wed→Mon Easter gap. Data freshness is tracked separately via content-age (STALE_CONTENT) — see seed-fsi-eu.mjs.
  newsThreatSummary: { key: "seed-meta:news:threat-summary", maxStaleMin: 60 },
  // relay classify every ~20min; 60min = 3x interval
  shippingStress: { key: "seed-meta:supply_chain:shipping_stress", maxStaleMin: 45 },
  // relay loop every 15min; 45 = 3x interval (was 30 = 2×, too tight on relay hiccup)
  diseaseOutbreaks: { key: "seed-meta:health:disease-outbreaks", maxStaleMin: 2880 },
  // daily seed; 2880 = 48h = 2x interval
  healthAirQuality: { key: "seed-meta:health:air-quality", maxStaleMin: 180 },
  // hourly cron; 180 = 3x interval for shared health/climate seed
  socialVelocity: { key: "seed-meta:intelligence:social-reddit", maxStaleMin: 540 },
  // relay loop every 180min (3h; was 60min, dropped now that ScrapeCreators handles Reddit); 540 = 3x interval. Co-pinned with SOCIAL_VELOCITY_TTL=43200 (ais-relay.cjs): the data-key TTL must STRICTLY exceed this (720min > 540min) so a dead relay shows STALE_SEED before the key expires to EMPTY.
  wsbTickers: { key: "seed-meta:intelligence:wsb-tickers", maxStaleMin: 540 },
  // relay loop every 180min (3h); 540 = 3x interval. Co-pinned with WSB_TICKERS_TTL=43200 (ais-relay.cjs); TTL strictly > maxStaleMin (see socialVelocity note).
  pizzint: { key: "seed-meta:intelligence:pizzint", maxStaleMin: 30 },
  // relay loop every 10min; 30 = 3x interval
  productCatalog: { key: "seed-meta:product-catalog", maxStaleMin: 1080 },
  // relay loop every 6h; 1080 = 18h = 3x interval
  vpdTrackerRealtime: { key: "seed-meta:health:vpd-tracker", maxStaleMin: 2880 },
  // daily seed (0 2 * * *); 2880min = 48h = 2x interval
  vpdTrackerHistorical: { key: "seed-meta:health:vpd-tracker", maxStaleMin: 2880 },
  // shares seed-meta key with vpdTrackerRealtime (same run)
  resilienceStaticIndex: { key: "seed-meta:resilience:static", maxStaleMin: 576e3 },
  // annual October snapshot; 400d threshold matches TTL and preserves prior-year data on source outages
  resilienceStaticFao: { key: "seed-meta:resilience:static", maxStaleMin: 576e3 },
  // same seeder + same heartbeat as resilienceStaticIndex; required so EMPTY_DATA_OK + missing data degrades to STALE_SEED instead of silent OK
  resilienceRanking: { key: "seed-meta:resilience:ranking", maxStaleMin: 840 },
  // RPC cache (12h TTL, refreshed every 6h by seed-resilience-scores cron); 14h budget tolerates 1 missed tick (12h gap) + ~2h jitter for in-flight deploys that preempt a scheduled tick; alerts at 2 missed ticks (18h gap). Bumped from 720 — see comment below.
  resilienceIntervals: { key: "seed-meta:resilience:intervals", maxStaleMin: 840 },
  // bundled into seed-bundle-resilience, written by the Resilience-Scores section. Real Railway cron is `0 */6 * * *` (every 6h on the hour, UTC) — empirically verified 2026-04-28 via Railway logs showing 6h gaps between successful runs (the prior `intervalMs=2h with hourly fires` claim did not match what's deployed; either the bundle interval gate or the Railway service schedule makes the effective cadence 6h). 840 = 14h staleness ≈ 2.33× cadence: tolerates 1 missed tick (12h gap) + ~2h jitter for in-flight deploys; alerts at 2 missed ticks (18h gap). Matches resilienceRanking above (same Resilience-Scores section writes both). Prior values: 20160 (14d, 168× — silent on real outage), 1080 (18h, 3× — over-permissive: masks a 12h outage), 720 (12h, 2× — exact floor; flipped UptimeRobot WARNING for ~1min on every Railway-deploy-preempted tick: 2026-05-10 incident at 18:02 UTC, seedAgeMin=722 vs maxStale=720 after the 12:00 UTC tick was skipped during an in-flight deploy), 360 (1× — false-positive on routine jitter, 2026-04-28: seedAgeMin=367 vs maxStale=360). Re-tighten ONLY if/when the actual Railway cron schedule is verified sub-6h.
  energyExposure: { key: "seed-meta:economic:owid-energy-mix", maxStaleMin: 50400 },
  // monthly cron on 1st; 50400min = 35d = TTL matches cron cadence + 5d buffer
  energyMixAll: { key: "seed-meta:economic:owid-energy-mix", maxStaleMin: 50400 },
  // same seed run as energyExposure; shares seed-meta key
  regulatoryActions: { key: "seed-meta:regulatory:actions", maxStaleMin: 360 },
  // 2h cron; 360min = 3x interval
  energySpineCountries: { key: "seed-meta:energy:spine", maxStaleMin: 2880 },
  // daily cron (06:00 UTC); 2880min = 48h = 2x interval
  electricityPrices: { key: "seed-meta:energy:electricity-prices", maxStaleMin: 2880 },
  // daily cron (14:00 UTC); 2880min = 48h = 2x interval
  gasStorageCountries: { key: "seed-meta:energy:gas-storage-countries", maxStaleMin: 2880 },
  // daily cron at 10:30 UTC; 2880min = 48h = 2x interval
  energyIntelligence: { key: "seed-meta:energy:intelligence", maxStaleMin: 720 },
  // 6h cron; 720min = 2x interval
  jodiOil: { key: "seed-meta:energy:jodi-oil", maxStaleMin: 60 * 24 * 40 },
  // monthly cron on 25th; 40d threshold matches 35d TTL + 5d buffer
  ieaOilStocks: { key: "seed-meta:energy:iea-oil-stocks", maxStaleMin: 60 * 24 * 40 },
  // monthly cron on 15th; 40d threshold = TTL_SECONDS
  oilStocksAnalysis: { key: "seed-meta:energy:oil-stocks-analysis", maxStaleMin: 60 * 24 * 50 },
  // afterPublish of ieaOilStocks; 50d = matches seed-meta TTL (exceeds 40d data TTL)
  eiaPetroleum: { key: "seed-meta:energy:eia-petroleum", maxStaleMin: 4320 },
  // daily bundle cron (seed-bundle-energy-sources); 72h = 3× interval, well under 7d data TTL
  jodiGas: { key: "seed-meta:energy:jodi-gas", maxStaleMin: 60 * 24 * 40 },
  // monthly cron on 25th; 40d threshold matches 35d TTL + 5d buffer
  lngVulnerability: { key: "seed-meta:energy:jodi-gas", maxStaleMin: 60 * 24 * 40 },
  // written by jodi-gas seeder afterPublish; shares seed-meta key
  chokepointBaselines: { key: "seed-meta:energy:chokepoint-baselines", maxStaleMin: 60 * 24 * 400 },
  // 400 days
  sprPolicies: { key: "seed-meta:energy:spr-policies", maxStaleMin: 60 * 24 * 400 },
  // 400 days; static registry, same cadence as chokepoint baselines
  pipelinesGas: { key: "seed-meta:energy:pipelines-gas", maxStaleMin: 20160 },
  // 14d — weekly cron (7d) × 2 headroom
  pipelinesOil: { key: "seed-meta:energy:pipelines-oil", maxStaleMin: 20160 },
  // 14d — same seed-pipelines.mjs publishes both keys
  storageFacilities: { key: "seed-meta:energy:storage-facilities", maxStaleMin: 20160 },
  // 14d — weekly cron (7d) × 2 headroom
  fuelShortages: { key: "seed-meta:energy:fuel-shortages", maxStaleMin: 2880 },
  // 2d — daily cron × 2 headroom (classifier-driven post-launch)
  energyDisruptions: { key: "seed-meta:energy:disruptions", maxStaleMin: 20160 },
  // 14d — weekly cron × 2 headroom
  energyCrisisPolicies: { key: "seed-meta:energy:crisis-policies", maxStaleMin: 60 * 24 * 400 },
  // static data, ~400d TTL matches seeder
  aaiiSentiment: { key: "seed-meta:market:aaii-sentiment", maxStaleMin: 20160 },
  // weekly cron; 20160min = 14 days = 2x weekly cadence
  portwatchChokepointsRef: { key: "seed-meta:portwatch:chokepoints-ref", maxStaleMin: 60 * 24 * 14 },
  // seed-bundle-portwatch runs this at WEEK cadence; 14d = 2× interval
  chokepointFlows: { key: "seed-meta:energy:chokepoint-flows", maxStaleMin: 720 },
  // 6h cron; 720min = 2x interval
  // Relay-side heartbeat written by ais-relay.cjs on successful child exit.
  // Detects "relay loop fires but child dies at import/runtime" failures
  // (e.g. ERR_MODULE_NOT_FOUND from a missing Dockerfile COPY) 4h earlier
  // than the 720min seed-meta threshold above. TTL is 18h on the writer.
  chokepointFlowsRelayHeartbeat: { key: "relay:heartbeat:chokepoint-flows", maxStaleMin: 480 },
  // 6h loop; 8h alarm
  climateNewsRelayHeartbeat: { key: "relay:heartbeat:climate-news", maxStaleMin: 60 },
  // 30m loop; 60m alarm
  emberElectricity: { key: "seed-meta:energy:ember", maxStaleMin: 2880 },
  // daily cron (08:00 UTC); 2880min = 48h = 2x interval
  cryptoSectors: { key: "seed-meta:market:crypto-sectors", maxStaleMin: 120 },
  // relay loop every ~30min; 120min = 2h = 4x interval
  ddosAttacks: { key: "seed-meta:cf:radar:ddos", maxStaleMin: 60 },
  // written by seed-internet-outages afterPublish; outages cron ~15min; 60 = 4x interval
  economicStress: { key: "seed-meta:economic:stress-index", maxStaleMin: 180 },
  // computed in seed-economy afterPublish; cron ~1h; 180min = 3x interval
  marketImplications: { key: "seed-meta:intelligence:market-implications", maxStaleMin: 120 },
  // LLM-generated in seed-forecasts; cron ~1h; 120min = 2x interval
  trafficAnomalies: { key: "seed-meta:cf:radar:traffic-anomalies", maxStaleMin: 60 },
  // written by seed-internet-outages afterPublish; outages cron ~15min; 60 = 4x interval
  chokepointExposure: { key: "seed-meta:supply_chain:chokepoint-exposure", maxStaleMin: 2880 },
  // daily cron; 2880min = 48h = 2x interval
  recoveryFiscalSpace: { key: "seed-meta:resilience:recovery:fiscal-space", maxStaleMin: 129600 },
  // monthly cron; 129600min = 90d = 3x interval (bumped from 86400/60d = 2x in PR #3669 for month-2 hiccup margin)
  recoveryReserveAdequacy: { key: "seed-meta:resilience:recovery:reserve-adequacy", maxStaleMin: 86400 },
  // monthly cron; 86400min = 60d = 2x interval
  recoveryExternalDebt: { key: "seed-meta:resilience:recovery:external-debt", maxStaleMin: 86400 },
  // monthly cron; 86400min = 60d = 2x interval
  recoveryImportHhi: { key: "seed-meta:resilience:recovery:import-hhi", maxStaleMin: 50400 },
  // monthly cron; 50400min = 35d catches missed import-HHI runs before stale country coverage lingers for 46d+
  // recoveryFuelStocks: probe removed (PR #3764). See STANDALONE_KEYS comment.
  recoveryReexportShare: { key: "seed-meta:resilience:recovery:reexport-share", maxStaleMin: 86400 },
  // monthly cron; 86400min = 60d = 2x interval
  recoverySovereignWealth: { key: "seed-meta:resilience:recovery:sovereign-wealth", maxStaleMin: 86400 },
  // monthly cron; 86400min = 60d = 2x interval
  // PR 1 v2 energy seeds — weekly cron (8d * 1440 = 11520min = 2x interval).
  // STRICT SEED_META (not ON_DEMAND): plan 2026-04-24-001 made /api/health
  // CRIT on absent/stale so operators see the Railway-bundle gap before
  // the flag flips. See the ON_DEMAND_KEYS "do not add back" note below.
  lowCarbonGeneration: { key: "seed-meta:resilience:low-carbon-generation", maxStaleMin: 11520 },
  fossilElectricityShare: { key: "seed-meta:resilience:fossil-electricity-share", maxStaleMin: 11520 },
  powerLosses: { key: "seed-meta:resilience:power-losses", maxStaleMin: 11520 },
  webcams: { key: "seed-meta:webcam:cameras:geo", maxStaleMin: 1440 }
  // seed-webcams writes 24h geo/meta keys plus a 30h active pointer; stale at 24h before the layer goes blank.
};
if (!IRAN_EVENTS_ENABLED) {
  delete BOOTSTRAP_KEYS.iranEvents;
  delete SEED_META.iranEvents;
}
var ON_DEMAND_KEYS = /* @__PURE__ */ new Set([
  // Deployment-order bridge: Vercel can ship this reader before Railway's
  // hourly bundle publishes the first summary. The seeder writes a durable
  // activation marker after its first successful publish; after that, a
  // missing/stale summary is strict forever.
  "chinaCoverage",
  "riskScoresLive",
  "usniFleetStale",
  "positiveEventsLive",
  "bisPolicy",
  "bisExchange",
  "bisCredit",
  // bisDsr/bisPropertyResidential/bisPropertyCommercial have dedicated SEED_META
  // entries (seed-bis-extended.mjs), so they are not on-demand.
  "macroSignals",
  "shippingRates",
  "chokepoints",
  "minerals",
  "giving",
  "cyberThreatsRpc",
  "militaryBases",
  "displacement",
  "corridorrisk",
  // intermediate key; data flows through transit-summaries:v1
  "serviceStatuses",
  // RPC-populated; seed-meta written on fresh fetch only, goes stale between visits
  "militaryForecastInputs",
  // intermediate seed-to-seed pipeline key; only populated after seed-military-flights runs
  // marketImplications removed 2026-05-01 — see policy block above. Homepage panel,
  // chronic LLM-provider failures must surface as CRIT.
  "simulationPackageLatest",
  // written by writeSimulationPackage after deep forecast runs; only present after first successful deep run
  "simulationOutcomeLatest",
  // written by writeSimulationOutcome after simulation runs; only present after first successful simulation
  // #4927 review P1: activation-gated on the operator adding UPSTASH_* as GH
  // Actions secrets — the publishers skip silently without them, so a
  // never-activated key must read as soft EMPTY_ON_DEMAND, not EMPTY/CRIT,
  // while the workflow stays green. On-demand softening is REVOKED once the
  // durable activation marker exists (see ACTIVATION_MARKERS): after the
  // first publish, missing data/meta is EMPTY/STALE_SEED like any other key.
  "newsFeedHealth",
  "newsRecallBenchmark",
  "newsThreatSummary",
  // relay classify loop — only written when mergedByCountry has entries; absent on quiet news periods
  "resilienceRanking",
  // on-demand RPC cache populated after ranking requests; missing before first Pro use is expected
  "recoveryFiscalSpace",
  "recoveryReserveAdequacy",
  "recoveryExternalDebt",
  // NOTE (2026-04-24, plan 2026-04-24-001): the PR 1 v2 energy seeds
  // (`lowCarbonGeneration`, `fossilElectricityShare`, `powerLosses`)
  // are INTENTIONALLY NOT listed in ON_DEMAND_KEYS. They stay strict
  // SEED_META so `/api/health` returns CRIT (not WARN) when they are
  // absent — which is the alarm a future operator needs before flipping
  // `RESILIENCE_ENERGY_V2_ENABLED=true`. The scorer fails closed via
  // ResilienceConfigurationError if the flag flips before the seeds
  // populate (server/worldmonitor/resilience/v1/_dimension-scorers.ts
  // #scoreEnergy). Do NOT add these labels back to ON_DEMAND_KEYS
  // without revisiting that plan.
  "displacementPrev",
  // covered by cascade onto current-year displacement; empty most of the year
  "fxYoy",
  // TRANSITIONAL (PR #3071): seed-fx-yoy Railway cron deployed manually after merge —
  // gate as on-demand so a deploy-order race or first-cron-run failure doesn't
  // fire a CRIT health alarm. Remove from this set after ~7 days of clean
  // production cron runs (verify via `seed-meta:economic:fx-yoy.fetchedAt`).
  "hyperliquidFlow",
  // TRANSITIONAL: seed-hyperliquid-flow runs inside seed-bundle-market-backup on
  // Railway; gate as on-demand so initial deploy-order race or first cold-start
  // snapshot doesn't CRIT. Remove after ~7 days of clean production cron runs.
  "chokepointFlowsRelayHeartbeat",
  // TRANSITIONAL (PR #3133): ais-relay.cjs writes this on the
  // first successful child exit after a deploy. Vercel deploys
  // api/health.js instantly, but Railway rebuild + 6h initial
  // loop interval means the key is absent for up to ~6h post-merge.
  // Gate as on-demand so the deploy window doesn't CRIT. Remove
  // after ~7 days of clean production runs (verify via
  // `relay:heartbeat:chokepoint-flows.fetchedAt`).
  "climateNewsRelayHeartbeat",
  // TRANSITIONAL (PR #3133): same deploy-order rationale.
  // 30min initial loop, so window is shorter but still present.
  // Remove after ~7 days alongside the chokepoint-flows entry.
  "digestNotifications",
  // TRANSITIONAL (PR #4253): seed-digest-notifications.mjs writes
  // `digest:last-run` on the first cron run after deploy. Vercel
  // can publish this health registry before Railway's 30min cron
  // ticks, so gate only the first absent-key window as WARN. Remove
  // after ~7 days of clean `seed-meta:digest:last-run` writes.
  "eiaPetroleum"
  // TRANSITIONAL: gold-standard migration of /api/eia/petroleum
  // from live Vercel fetch to Redis-reader (seed-bundle-energy-sources
  // daily cron). SEED_META entry above enforces 72h staleness — this
  // ON_DEMAND gate only softens the absent-on-deploy case (Vercel
  // deploys instantly; Railway EIA_API_KEY + first daily tick ~24h
  // behind). STALE_SEED still fires if data goes stale after first seed.
  // Remove from this set after ~7 days of clean cron runs so
  // never-provisioned Railway promotes EMPTY_ON_DEMAND → EMPTY (CRIT).
]);
var ACTIVATION_MARKERS = {
  chinaCoverage: "seed-activated:health:china-coverage",
  newsFeedHealth: "seed-activated:news:feed-health",
  newsRecallBenchmark: "seed-activated:news:recall-benchmark"
};
var EMPTY_DATA_OK_KEYS = /* @__PURE__ */ new Set([
  "notamClosures",
  "faaDelays",
  "intlDelays",
  "gpsjam",
  "positiveGeoEvents",
  "weatherAlerts",
  "earningsCalendar",
  "econCalendar",
  "cotPositioning",
  "usniFleet",
  // usniFleetStale covers the fallback; relay outages → WARN not CRIT
  "newsThreatSummary",
  // only written when classify produces country matches; quiet news periods = 0 countries, no write
  "recoveryFiscalSpace",
  "ddosAttacks",
  "trafficAnomalies",
  // zero events during quiet periods is valid, not critical
  "resilienceStaticFao",
  // empty aggregate = no IPC Phase 3+ countries this year (possible in theory); the key must exist but count=0 is fine
  "cableHealth",
  // `cables: {}` = no active subsea cable disruptions per NGA NAVAREA warnings — all cables implicitly healthy. Also covers NGA-upstream-down windows where get-cable-health writes back the fallback response (empty cables); without this, those would alarm EMPTY_DATA.
  "forecastBets",
  // #5233 shadow bet-engine stream; absent before the cron ships it and empty on weeks the energy feed yields no bet — tolerate as STALE_SEED (warn), not EMPTY (crit).
  "forecastFunnel",
  // #5233 funnel guardrail is a new afterPublish side-write; before the first seed-forecasts run ships it the key is absent — tolerate as STALE_SEED (warn), not EMPTY (crit). A COLLAPSED funnel still surfaces via seed-meta status:'error' → SEED_ERROR, which classifyKey checks before this branch.
  // Compact projections stay STALE_SEED before their first producer tick or
  // after metadata turns stale. Fresh metadata plus a missing payload is
  // deliberately strict: MISSING_DATA_IS_FAILURE_KEYS reports EMPTY (crit).
  "thermalEscalationBootstrap",
  "ucdpEventsBootstrap",
  "forecastsBootstrap",
  "wildfiresBootstrap"
]);
var MISSING_DATA_IS_FAILURE_KEYS = /* @__PURE__ */ new Set([
  "thermalEscalationBootstrap",
  "ucdpEventsBootstrap",
  "wildfiresBootstrap",
  "forecastsBootstrap",
  "positiveGeoEvents"
]);
var ZERO_RECORD_DATA_OK_KEYS = /* @__PURE__ */ new Set([
  ...EMPTY_DATA_OK_KEYS,
  "globalTendersSam",
  "globalTendersTed",
  "globalTendersContractsFinder",
  "globalTendersCanadaBuys",
  "globalTendersGets",
  "globalTendersWorldBank",
  // retailer-spread is SUPPRESSED to an explicit 0 by the aggregate job when a
  // market's retailers share < MIN_SPREAD_ITEMS (4) common basket items —
  // consumer-prices-core/src/jobs/aggregate.ts writes `retailer_spread_pct: 0`
  // ("prevent stale noisy value persisting") and logs "spread suppressed
  // (N/4 common items)". That is a valid data-coverage state, not a pipeline
  // outage: the AE basket's cross-retailer overlap shrank 2/4 → 1/4 → 0/4 over
  // late-May 2026 while the seeder kept running fresh (seedAgeMin well inside
  // maxStaleMin) and the sibling keys (overview/categories/movers/basket-series)
  // published normally. Treat 0 records as OK while fresh; STALE_SEED still
  // fires if the publish job itself stops.
  "consumerPricesSpread",
  // CF Radar curated outage annotations (seed-internet-outages, zeroIsValid)
  // are sparse — most 28d windows publish an empty {outages:[]} envelope with
  // recordCount=0 (hasData=true). NARROW set, not EMPTY_DATA_OK_KEYS: the
  // seeder always publishes the array, so a MISSING canonical key is a real
  // publish failure → still EMPTY (crit). Siblings ddosAttacks/trafficAnomalies
  // sit in the broad set because their data key can be wholly absent on quiet
  // (writeSeedMeta-only path).
  "outages"
]);
var CASCADE_GROUPS = {
  theaterPosture: ["theaterPosture", "theaterPostureLive", "theaterPostureBackup"],
  theaterPostureLive: ["theaterPosture", "theaterPostureLive", "theaterPostureBackup"],
  theaterPostureBackup: ["theaterPosture", "theaterPostureLive", "theaterPostureBackup"],
  militaryFlights: ["militaryFlights", "militaryFlightsStale"],
  militaryFlightsStale: ["militaryFlights", "militaryFlightsStale"],
  // Displacement key embeds UTC year — on Jan 1 the new-year key may be empty
  // for hours until the seed runs. Cascade onto the previous-year snapshot.
  displacement: ["displacement", "displacementPrev"],
  displacementPrev: ["displacement", "displacementPrev"]
};
var NEG_SENTINEL = "__WM_NEG__";
function parseRedisValue(raw) {
  if (!raw || raw === NEG_SENTINEL) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}
function strlenIsData(strlen) {
  return strlen > 0 && strlen !== NEG_SENTINEL.length;
}
var LIST_DATA_KEYS = /* @__PURE__ */ new Set([
  STANDALONE_KEYS.forecastBets
  // LPUSH/LTRIM — scripts/seed-forecast-bets.mjs
]);
function dataLenCommand(redisKey) {
  return [LIST_DATA_KEYS.has(redisKey) ? "LLEN" : "STRLEN", redisKey];
}
function keyHasData(redisKey, len) {
  return LIST_DATA_KEYS.has(redisKey) ? len > 0 : strlenIsData(len);
}
function readSeedMeta(seedCfg, keyMetaValues, keyMetaErrors, now) {
  if (!seedCfg) {
    return { hasMeta: false, seedAge: null, seedStale: null, seedError: false, sourceUnavailable: false, metaReadFailed: false, metaCount: null, contentAge: null };
  }
  if (keyMetaErrors.get(seedCfg.key)) {
    return { hasMeta: false, seedAge: null, seedStale: null, seedError: false, sourceUnavailable: false, metaReadFailed: true, metaCount: null, contentAge: null };
  }
  const meta = unwrapEnvelope(parseRedisValue(keyMetaValues.get(seedCfg.key))).data;
  if (meta?.status === "error") {
    return { hasMeta: true, seedAge: null, seedStale: true, seedError: true, sourceUnavailable: false, metaReadFailed: false, metaCount: null, contentAge: null };
  }
  let seedAge = null;
  let seedStale = true;
  if (meta?.fetchedAt) {
    seedAge = Math.round((now - meta.fetchedAt) / 6e4);
    seedStale = seedAge > seedCfg.maxStaleMin;
  }
  const metaCount = meta?.count ?? meta?.recordCount ?? null;
  const sourceUnavailable = meta?.sourceState === "unavailable";
  const sourceDegraded = typeof meta?.sourceState === "string" && meta.sourceState !== "ok" && !sourceUnavailable;
  let contentAge = null;
  if (meta && typeof meta.maxContentAgeMin === "number") {
    const newestItemAt = typeof meta.newestItemAt === "number" ? meta.newestItemAt : null;
    const contentAgeMin = newestItemAt == null ? null : Math.round((now - newestItemAt) / 6e4);
    const isFutureDated = contentAgeMin != null && contentAgeMin < 0;
    contentAge = {
      newestItemAt,
      oldestItemAt: typeof meta.oldestItemAt === "number" ? meta.oldestItemAt : null,
      maxContentAgeMin: meta.maxContentAgeMin,
      contentAgeMin,
      contentStale: contentAgeMin == null || isFutureDated || contentAgeMin > meta.maxContentAgeMin
    };
  }
  return { hasMeta: meta != null, seedAge, seedStale, seedError: sourceDegraded, sourceUnavailable, metaReadFailed: false, metaCount, contentAge };
}
function isCascadeCovered(name, hasData, keyStrens, keyErrors) {
  const siblings = CASCADE_GROUPS[name];
  if (!siblings || hasData) return false;
  for (const sibling of siblings) {
    if (sibling === name) continue;
    const sibKey = STANDALONE_KEYS[sibling] ?? BOOTSTRAP_KEYS[sibling];
    if (!sibKey) continue;
    if (keyErrors.get(sibKey)) continue;
    if (keyHasData(sibKey, keyStrens.get(sibKey) ?? 0)) return true;
  }
  return false;
}
function classifyKey(name, redisKey, opts, ctx) {
  const { keyStrens, keyErrors, keyMetaValues, keyMetaErrors, now } = ctx;
  const seedCfg = SEED_META[name];
  const isOnDemand = !!opts.allowOnDemand && ON_DEMAND_KEYS.has(name) && !(ctx.activatedNames && ctx.activatedNames.has(name));
  const meta = readSeedMeta(seedCfg, keyMetaValues, keyMetaErrors, now);
  if (keyErrors.get(redisKey) || meta.metaReadFailed) {
    const entry2 = { status: "REDIS_PARTIAL", records: null };
    if (seedCfg) entry2.maxStaleMin = seedCfg.maxStaleMin;
    return entry2;
  }
  const strlen = keyStrens.get(redisKey) ?? 0;
  const hasData = keyHasData(redisKey, strlen);
  const { hasMeta, seedAge, seedStale, seedError, sourceUnavailable, metaCount, contentAge } = meta;
  const records = hasData ? metaCount ?? 1 : 0;
  const cascadeCovered = isCascadeCovered(name, hasData, keyStrens, keyErrors);
  let status;
  if (sourceUnavailable) status = "NOT_CONFIGURED";
  else if (seedError) status = "SEED_ERROR";
  else if (!hasData) {
    if (cascadeCovered) status = "OK_CASCADE";
    else if (MISSING_DATA_IS_FAILURE_KEYS.has(name) && hasMeta && seedStale !== true) status = "EMPTY";
    else if (EMPTY_DATA_OK_KEYS.has(name)) status = seedStale === true ? "STALE_SEED" : "OK";
    else if (isOnDemand) status = "EMPTY_ON_DEMAND";
    else status = "EMPTY";
  } else if (records === 0) {
    if (ZERO_RECORD_DATA_OK_KEYS.has(name)) status = seedStale === true ? "STALE_SEED" : "OK";
    else if (isOnDemand) status = "EMPTY_ON_DEMAND";
    else status = "EMPTY_DATA";
  } else if (seedStale === true) status = "STALE_SEED";
  else if (seedCfg?.minRecordCount != null && records < seedCfg.minRecordCount) status = "COVERAGE_PARTIAL";
  else if (contentAge && contentAge.contentStale) status = "STALE_CONTENT";
  else status = "OK";
  const entry = { status, records };
  if (seedAge !== null) entry.seedAgeMin = seedAge;
  if (seedCfg) entry.maxStaleMin = seedCfg.maxStaleMin;
  if (seedCfg?.minRecordCount != null) entry.minRecordCount = seedCfg.minRecordCount;
  if (contentAge) {
    entry.contentAgeMin = contentAge.contentAgeMin;
    entry.maxContentAgeMin = contentAge.maxContentAgeMin;
  }
  return entry;
}
var STATUS_COUNTS = {
  OK: "ok",
  OK_CASCADE: "ok",
  // An optional source adapter this deployment never supplied a credential for
  // (producer wrote sourceState:'unavailable'). Buckets to `ok` because there is
  // no fault and no operator action that would clear it other than opting in.
  // Must stay registered here: the summary does `STATUS_COUNTS[status] ?? 'warn'`,
  // so an unlisted status would silently re-become the warn this exists to stop.
  NOT_CONFIGURED: "ok",
  STALE_SEED: "warn",
  SEED_ERROR: "warn",
  EMPTY_ON_DEMAND: "warn",
  REDIS_PARTIAL: "warn",
  COVERAGE_PARTIAL: "warn",
  // Content-age signal — seeder is healthy but upstream stopped publishing.
  // Operator can't fix upstream cadence, so de-rank vs. STALE_SEED in alerting
  // (both bucket to 'warn' — overall status is `degraded`, not `critical`).
  // 2026-05-04 health-readiness plan, Sprint 1.
  STALE_CONTENT: "warn",
  CHINA_DEGRADED: "warn",
  CHINA_UNAVAILABLE: "crit",
  EMPTY: "crit",
  EMPTY_DATA: "crit"
};
function isValidChinaCoverageSummary(candidate) {
  if (!candidate || typeof candidate !== "object" || candidate.schemaVersion !== 1 || candidate.countryCode !== "CN" || !["healthy", "degraded", "unavailable"].includes(candidate.status) || typeof candidate.evaluatedAt !== "string" || !Number.isFinite(Date.parse(candidate.evaluatedAt)) || !Array.isArray(candidate.entries) || candidate.entries.length === 0 || candidate.entries.length > 100 || !candidate.counts || typeof candidate.counts !== "object") {
    return false;
  }
  const ids = /* @__PURE__ */ new Set();
  const actual = {
    total: candidate.entries.length,
    launched: 0,
    planned: 0,
    blocked: 0,
    healthy: 0,
    degraded: 0,
    unavailable: 0
  };
  for (const entry of candidate.entries) {
    if (!entry || typeof entry !== "object" || typeof entry.id !== "string" || entry.id.length === 0 || entry.id.length > 100 || ids.has(entry.id) || !["launched", "planned", "blocked"].includes(entry.launchStatus) || !Array.isArray(entry.reasonCodes) || entry.reasonCodes.length > 16 || entry.reasonCodes.some((reason) => typeof reason !== "string" || reason.length > 64)) {
      return false;
    }
    ids.add(entry.id);
    actual[entry.launchStatus]++;
    if (entry.launchStatus === "launched") {
      if (!["healthy", "degraded", "unavailable"].includes(entry.status)) return false;
      actual[entry.status]++;
    } else if (entry.status !== entry.launchStatus) {
      return false;
    }
  }
  if (actual.launched === 0) return false;
  for (const [name, value] of Object.entries(actual)) {
    if (candidate.counts[name] !== value) return false;
  }
  const expectedStatus = actual.unavailable === actual.launched ? "unavailable" : actual.degraded > 0 || actual.unavailable > 0 ? "degraded" : "healthy";
  return candidate.status === expectedStatus;
}
function projectChinaCoverageStatus(raw, readError = false) {
  if (readError) {
    return { status: "REDIS_PARTIAL", chinaStatus: null, reason: "SUMMARY_READ_FAILED" };
  }
  const candidate = typeof raw === "string" ? unwrapEnvelope(parseRedisValue(raw)).data : unwrapEnvelope(raw).data;
  if (!isValidChinaCoverageSummary(candidate)) {
    return { status: "CHINA_UNAVAILABLE", chinaStatus: "unavailable", reason: "SUMMARY_INVALID" };
  }
  const status = {
    healthy: "OK",
    degraded: "CHINA_DEGRADED",
    unavailable: "CHINA_UNAVAILABLE"
  }[candidate.status] ?? "CHINA_UNAVAILABLE";
  const problems = Array.isArray(candidate.entries) ? candidate.entries.filter((entry) => entry?.launchStatus === "launched" && entry?.status !== "healthy").map((entry) => ({ id: entry.id, status: entry.status, reasonCodes: entry.reasonCodes ?? [] })) : [];
  return {
    status,
    chinaStatus: candidate.status,
    evaluatedAt: candidate.evaluatedAt ?? null,
    counts: candidate.counts ?? null,
    ...problems.length > 0 ? { problems } : {}
  };
}
function composeChinaCoverageStatus(entry, raw, readError = false) {
  if (!entry || !["OK", "STALE_SEED", "SEED_ERROR"].includes(entry.status)) return entry;
  const seedStatus = entry.status;
  const projected = projectChinaCoverageStatus(raw, readError);
  if (seedStatus === "OK") return { ...entry, ...projected };
  if (projected.status === "OK") {
    return { ...entry, ...projected, status: seedStatus, seedStatus };
  }
  return { ...entry, ...projected, seedStatus };
}
function parseHealthVerdictSnapshot(raw, now, { requireChecks = true } = {}) {
  if (typeof raw !== "string") return null;
  const snapshot = parseRedisValue(raw);
  if (!snapshot || typeof snapshot !== "object") return null;
  if (typeof snapshot.status !== "string" || typeof snapshot.checkedAt !== "string") return null;
  if (!snapshot.summary || typeof snapshot.summary !== "object") return null;
  if (requireChecks && (!snapshot.checks || typeof snapshot.checks !== "object")) return null;
  const checkedAtMs = Date.parse(snapshot.checkedAt);
  const ageMs = now - checkedAtMs;
  if (!Number.isFinite(checkedAtMs) || ageMs < 0 || ageMs > HEALTH_VERDICT_SNAPSHOT_TTL_MS) return null;
  return snapshot;
}
async function releaseHealthVerdictRefreshLock(lockToken) {
  if (!lockToken) return;
  await redisPipeline([[
    "EVAL",
    HEALTH_VERDICT_RELEASE_LOCK_SCRIPT,
    "1",
    HEALTH_VERDICT_REFRESH_LOCK_KEY,
    lockToken
  ]], 4e3).catch(() => null);
}
function isProblemStatus(status) {
  return STATUS_COUNTS[status] !== "ok";
}
function collectFailureLogProblems(checks) {
  const entries = Object.entries(checks).filter(([, c]) => isProblemStatus(c.status) && c.status !== "EMPTY_ON_DEMAND");
  return {
    problemKeys: entries.map(([k, c]) => `${k}:${c.status}${c.seedAgeMin != null ? `(${c.seedAgeMin}min)` : ""}`),
    // The dedupe signature uses only key:status (no age) so a long STALE_SEED
    // window doesn't produce a new log entry on every poll.
    sigKeys: entries.map(([k, c]) => `${k}:${c.status}`).sort()
  };
}
function healthResponseBody(snapshot, compact) {
  const body = {
    status: snapshot.status,
    summary: snapshot.summary,
    checkedAt: snapshot.checkedAt
  };
  if (!compact) {
    body.checks = snapshot.checks;
    return body;
  }
  const problems = snapshot.checks ? Object.fromEntries(Object.entries(snapshot.checks).filter(([, check]) => isProblemStatus(check.status))) : snapshot.problems ?? {};
  if (Object.keys(problems).length > 0) body.problems = problems;
  return body;
}
function buildCompactVerdictSnapshot(snapshot) {
  return healthResponseBody(snapshot, true);
}
function healthResponse(snapshot, compact, headers) {
  let responseHeaders = headers;
  if (compact) {
    const { "CF-Cache-Status": _bypassMarker, ...base } = headers;
    responseHeaders = {
      ...base,
      "Cache-Control": "no-store, max-age=0",
      "CDN-Cache-Control": "no-store"
    };
  }
  return new Response(JSON.stringify(healthResponseBody(snapshot, compact), null, compact ? 0 : 2), {
    status: 200,
    headers: responseHeaders
  });
}
async function handler(req, ctx) {
  if (isDisallowedOrigin(req)) {
    return new Response("Forbidden", { status: 403 });
  }
  const cors = getCorsHeaders(req, "GET, OPTIONS");
  const headers = {
    "Content-Type": "application/json",
    "Cache-Control": "private, no-store, max-age=0",
    "CDN-Cache-Control": "no-store",
    "CF-Cache-Status": "BYPASS",
    ...cors
  };
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }
  const url = new URL(req.url);
  const compact = url.searchParams.get("compact") === "1";
  const wantsHistory = url.searchParams.get("history") === "1";
  if (!compact || wantsHistory) {
    const keyCheck = await validateApiKey(req, { forceKey: true });
    if (keyCheck.required && !keyCheck.valid) {
      const error = keyCheck.error === USER_API_KEY_GATEWAY_VALIDATION_ERROR ? "Invalid API key" : keyCheck.error;
      return jsonResponse(
        {
          error,
          hint: "Detailed health requires an operator/enterprise API key. Public status: /api/health?compact=1"
        },
        401,
        {
          ...headers,
          "WWW-Authenticate": 'ApiKey realm="worldmonitor-health", header="X-WorldMonitor-Key"'
        }
      );
    }
  }
  if (wantsHistory) {
    const results2 = await redisPipeline(
      [
        ["GET", "health:last-failure"],
        ["LRANGE", "health:failure-log", "0", "-1"]
      ],
      4e3
    );
    const parseJson = (raw) => {
      if (typeof raw !== "string") return null;
      try {
        return JSON.parse(raw);
      } catch {
        return null;
      }
    };
    const lastFailureRaw = results2?.[0]?.result;
    const failureLogRaw = results2?.[1]?.result;
    const body = {
      lastFailure: parseJson(lastFailureRaw),
      failureLog: Array.isArray(failureLogRaw) ? failureLogRaw.map(parseJson).filter((e) => e !== null) : [],
      checkedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    return new Response(JSON.stringify(body, null, 2), { status: 200, headers });
  }
  const now = Date.now();
  let refreshLockToken = null;
  let ownsSnapshotRefreshLock = false;
  try {
    if (!getRedisCredentials()) throw new Error("Redis not configured");
    const snapshotKey = compact ? HEALTH_VERDICT_COMPACT_SNAPSHOT_KEY : HEALTH_VERDICT_SNAPSHOT_KEY;
    const snapshotResult = await redisPipeline([["GET", snapshotKey]], 4e3);
    if (!snapshotResult) throw new Error("Redis request failed");
    if (snapshotResult[0]?.error) throw new Error("Redis snapshot read failed");
    const cachedSnapshot = parseHealthVerdictSnapshot(snapshotResult[0]?.result, Date.now(), { requireChecks: !compact });
    if (cachedSnapshot) return healthResponse(cachedSnapshot, compact, headers);
    refreshLockToken = `${now}:${crypto.randomUUID()}`;
    let lockResult = await redisPipeline([[
      "SET",
      HEALTH_VERDICT_REFRESH_LOCK_KEY,
      refreshLockToken,
      "EX",
      String(HEALTH_VERDICT_REFRESH_LOCK_TTL_SECONDS),
      "NX"
    ]], 4e3);
    if (!lockResult || lockResult[0]?.error) throw new Error("Redis snapshot lock failed");
    ownsSnapshotRefreshLock = lockResult[0]?.result === "OK";
    if (!ownsSnapshotRefreshLock) {
      const waitDeadline = Date.now() + HEALTH_VERDICT_REFRESH_WAIT_MS;
      for (let attempt = 0; attempt < HEALTH_VERDICT_REFRESH_WAIT_ATTEMPTS && Date.now() < waitDeadline; attempt++) {
        const backoffMs = Math.min(100 * 2 ** attempt, 1e3);
        const jitterMs = Math.floor(Math.random() * 50);
        const sleepMs = Math.min(backoffMs + jitterMs, Math.max(0, waitDeadline - Date.now()));
        await new Promise((resolve) => setTimeout(resolve, sleepMs));
        const remainingMs = waitDeadline - Date.now();
        if (remainingMs < HEALTH_VERDICT_MIN_REDIS_TIMEOUT_MS) break;
        const redisTimeoutMs = Math.min(4e3, remainingMs);
        const refreshedResult = await redisPipeline([["GET", snapshotKey]], redisTimeoutMs);
        if (!refreshedResult || refreshedResult[0]?.error) throw new Error("Redis snapshot wait failed");
        const refreshedSnapshot = parseHealthVerdictSnapshot(refreshedResult[0]?.result, Date.now(), { requireChecks: !compact });
        if (refreshedSnapshot) return healthResponse(refreshedSnapshot, compact, headers);
        lockResult = await redisPipeline([[
          "SET",
          HEALTH_VERDICT_REFRESH_LOCK_KEY,
          refreshLockToken,
          "EX",
          String(HEALTH_VERDICT_REFRESH_LOCK_TTL_SECONDS),
          "NX"
        ]], redisTimeoutMs);
        if (!lockResult || lockResult[0]?.error) throw new Error("Redis snapshot lock retry failed");
        ownsSnapshotRefreshLock = lockResult[0]?.result === "OK";
        if (ownsSnapshotRefreshLock) break;
      }
    }
  } catch (err) {
    if (ownsSnapshotRefreshLock) await releaseHealthVerdictRefreshLock(refreshLockToken);
    return jsonResponse({
      status: "REDIS_DOWN",
      error: err.message,
      checkedAt: new Date(now).toISOString()
    }, 503, headers);
  }
  const allDataKeys = [
    ...Object.values(BOOTSTRAP_KEYS),
    ...Object.values(STANDALONE_KEYS)
  ];
  const allMetaKeys = Object.values(SEED_META).map((s) => s.key);
  const activationEntries = Object.entries(ACTIVATION_MARKERS);
  let results;
  try {
    const commands = [
      ...allDataKeys.map(dataLenCommand),
      ...allMetaKeys.map((k) => ["GET", k]),
      ...activationEntries.map(([, marker]) => ["EXISTS", marker]),
      ["GET", CHINA_COVERAGE_SUMMARY_KEY]
    ];
    if (!getRedisCredentials()) throw new Error("Redis not configured");
    results = await redisPipeline(commands, 8e3);
    if (!results) throw new Error("Redis request failed");
  } catch (err) {
    if (ownsSnapshotRefreshLock) await releaseHealthVerdictRefreshLock(refreshLockToken);
    return jsonResponse({
      status: "REDIS_DOWN",
      error: err.message,
      checkedAt: new Date(now).toISOString()
    }, 503, headers);
  }
  const keyStrens = /* @__PURE__ */ new Map();
  const keyErrors = /* @__PURE__ */ new Map();
  for (let i = 0; i < allDataKeys.length; i++) {
    const r = results[i];
    if (r?.error) keyErrors.set(allDataKeys[i], r.error);
    keyStrens.set(allDataKeys[i], r?.result ?? 0);
  }
  const keyMetaValues = /* @__PURE__ */ new Map();
  const keyMetaErrors = /* @__PURE__ */ new Map();
  for (let i = 0; i < allMetaKeys.length; i++) {
    const r = results[allDataKeys.length + i];
    if (r?.error) keyMetaErrors.set(allMetaKeys[i], r.error);
    keyMetaValues.set(allMetaKeys[i], r?.result ?? null);
  }
  const activatedNames = /* @__PURE__ */ new Set();
  for (let i = 0; i < activationEntries.length; i++) {
    const r = results[allDataKeys.length + allMetaKeys.length + i];
    if (!r?.error && Number(r?.result) === 1) activatedNames.add(activationEntries[i][0]);
  }
  const chinaCoverageResult = results[allDataKeys.length + allMetaKeys.length + activationEntries.length];
  const chinaCoverageRaw = chinaCoverageResult?.error ? null : chinaCoverageResult?.result;
  const classifyCtx = { keyStrens, keyErrors, keyMetaValues, keyMetaErrors, activatedNames, now };
  const checks = {};
  const counts = { ok: 0, warn: 0, onDemandWarn: 0, staleContent: 0, crit: 0 };
  let totalChecks = 0;
  const sources = [
    [BOOTSTRAP_KEYS, { allowOnDemand: false }],
    [STANDALONE_KEYS, { allowOnDemand: true }]
  ];
  for (const [registry, opts] of sources) {
    for (const [name, redisKey] of Object.entries(registry)) {
      totalChecks++;
      let entry = classifyKey(name, redisKey, opts, classifyCtx);
      if (name === "chinaCoverage") {
        entry = composeChinaCoverageStatus(entry, chinaCoverageRaw, Boolean(chinaCoverageResult?.error));
      }
      checks[name] = entry;
      const bucket = STATUS_COUNTS[entry.status] ?? "warn";
      counts[bucket]++;
      if (entry.status === "EMPTY_ON_DEMAND") counts.onDemandWarn++;
      if (entry.status === "STALE_CONTENT") counts.staleContent++;
    }
  }
  const realWarnCount = counts.warn - counts.onDemandWarn;
  const critCount = counts.crit;
  let overall;
  if (critCount === 0 && realWarnCount === 0) overall = "HEALTHY";
  else if (critCount === 0) overall = "WARNING";
  else if (critCount / totalChecks <= 0.03) overall = "DEGRADED";
  else overall = "UNHEALTHY";
  if (overall !== "HEALTHY") {
    const { problemKeys, sigKeys } = collectFailureLogProblems(checks);
    console.log("[health] %s problems=[%s]", overall, problemKeys.join(", "));
    const failureLogEntry = {
      at: new Date(now).toISOString(),
      status: overall,
      critCount,
      warnCount: realWarnCount,
      problems: problemKeys
    };
    const sig = `${overall}|${sigKeys.join(",")}`;
    const prevSigResult = await redisPipeline([["GET", "health:failure-log-sig"]], 4e3).catch(() => null);
    const prevSig = prevSigResult?.[0]?.result ?? "";
    const persistCmds = [
      ["SET", "health:last-failure", JSON.stringify(failureLogEntry), "EX", 86400]
    ];
    if (sig !== prevSig) {
      persistCmds.push(
        ["LPUSH", "health:failure-log", JSON.stringify(failureLogEntry)],
        ["LTRIM", "health:failure-log", 0, 49],
        ["EXPIRE", "health:failure-log", 86400 * 7],
        ["SET", "health:failure-log-sig", sig, "EX", 86400]
      );
    }
    const persist = redisPipeline(persistCmds, 4e3).catch(() => {
    });
    if (ctx && typeof ctx.waitUntil === "function") ctx.waitUntil(persist);
  } else {
    const clear = redisPipeline([["DEL", "health:failure-log-sig"]], 4e3).catch(() => {
    });
    if (ctx && typeof ctx.waitUntil === "function") ctx.waitUntil(clear);
  }
  const verdictSnapshot = {
    status: overall,
    summary: {
      total: totalChecks,
      ok: counts.ok,
      // `warn` excludes on-demand-empty (cosmetic warns); `onDemandWarn` is
      // surfaced separately so readers can reconcile against `overall`.
      warn: realWarnCount,
      onDemandWarn: counts.onDemandWarn,
      // `staleContent` is a SUBSET of `warn` (fresh seeder, frozen upstream
      // data — issue #3845). Surfaced so a frozen feed is visible without
      // walking every check entry.
      staleContent: counts.staleContent,
      crit: critCount
    },
    checkedAt: new Date(now).toISOString(),
    checks
  };
  const snapshotWriteResult = await redisPipeline([
    [
      "SET",
      HEALTH_VERDICT_SNAPSHOT_KEY,
      JSON.stringify(verdictSnapshot),
      "EX",
      String(HEALTH_VERDICT_SNAPSHOT_TTL_SECONDS)
    ],
    [
      "SET",
      HEALTH_VERDICT_COMPACT_SNAPSHOT_KEY,
      JSON.stringify(buildCompactVerdictSnapshot(verdictSnapshot)),
      "EX",
      String(HEALTH_VERDICT_SNAPSHOT_TTL_SECONDS)
    ]
  ], 4e3).catch(() => null);
  const snapshotWriteFailed = !snapshotWriteResult || snapshotWriteResult.length !== 2 || snapshotWriteResult.some((entry) => entry?.error);
  if (ownsSnapshotRefreshLock) await releaseHealthVerdictRefreshLock(refreshLockToken);
  if (snapshotWriteFailed) console.warn("[health] verdict snapshot write failed");
  return healthResponse(verdictSnapshot, compact, headers);
}
var __testing__ = {
  readSeedMeta,
  classifyKey,
  healthResponseBody,
  collectFailureLogProblems,
  ACTIVATION_MARKERS,
  STATUS_COUNTS,
  // List-typed data keys + the command builder that measures them with LLEN
  // instead of STRLEN (tests/health-list-data-keys.test.mjs).
  LIST_DATA_KEYS,
  dataLenCommand,
  HEALTH_VERDICT_SNAPSHOT_KEY,
  HEALTH_VERDICT_COMPACT_SNAPSHOT_KEY,
  buildCompactVerdictSnapshot,
  HEALTH_VERDICT_SNAPSHOT_TTL_SECONDS,
  HEALTH_VERDICT_REFRESH_LOCK_KEY,
  HEALTH_VERDICT_REFRESH_WAIT_MS,
  CHINA_COVERAGE_SUMMARY_KEY,
  projectChinaCoverageStatus,
  composeChinaCoverageStatus,
  healthVerdictRedisKey,
  parseHealthVerdictSnapshot,
  // U7 (Tier 3 parity test): exposed for tests/mcp-bootstrap-parity.test.mjs
  // to walk the canonical seeded-data inventory. Both consts are unexported
  // at module scope by design — this is the test-only escape hatch.
  BOOTSTRAP_KEYS,
  STANDALONE_KEYS,
  SEED_META,
  EMPTY_DATA_OK_KEYS,
  MISSING_DATA_IS_FAILURE_KEYS,
  ZERO_RECORD_DATA_OK_KEYS
};
export {
  __testing__,
  config,
  handler as default
};
