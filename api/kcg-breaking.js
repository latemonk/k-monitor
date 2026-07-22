// api/kcg-breaking.js
var config = { runtime: "edge" };
var GN = (q) => `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=ko&gl=KR&ceid=KR:ko`;
var TOPICS = {
  domestic: [
    "https://newsis.com/RSS/sokbo.xml",
    // 뉴시스 속보 — 실측 최신 6분 전
    "https://www.yna.co.kr/rss/news.xml",
    // 연합뉴스 최신 — 실측 9분 전
    GN("\uC18D\uBCF4 when:1h"),
    GN("\uC18D\uBCF4 when:1d")
  ],
  maritime: [
    GN("\uD574\uACBD OR \uD574\uAD70 OR \uC120\uBC15 OR \uD574\uC0C1 when:1h"),
    GN("\uD574\uC591\uACBD\uCC30 OR \uD574\uACBD OR \uD574\uAD70 when:1d"),
    GN("\uC120\uBC15 OR \uC5B4\uC120 OR \uC5EC\uAC1D\uC120 OR \uD56D\uB9CC when:1d"),
    GN("\uD574\uC0C1 \uC0AC\uACE0 OR \uC870\uB09C OR \uD45C\uB958 OR \uBC00\uC785\uAD6D when:1d")
  ],
  aviation: [
    GN("\uACF5\uD56D OR \uD56D\uACF5\uAE30 OR \uD56D\uACF5\uC0AC when:1h"),
    GN("\uACF5\uD56D OR \uD56D\uACF5\uD3B8 OR \uACB0\uD56D OR \uD68C\uD56D when:1d"),
    GN("\uD56D\uACF5\uAE30 OR \uC5EC\uAC1D\uAE30 OR \uD56D\uACF5\uC0AC when:1d"),
    GN("\uC601\uACF5 OR \uACF5\uAD70 OR \uC804\uD22C\uAE30 when:1d")
  ],
  security: [
    GN("\uBD81\uD55C OR \uBBF8\uC0AC\uC77C OR \uAD6D\uBC29\uBD80 OR \uD569\uCC38 when:1h"),
    GN("\uBD81\uD55C when:1d"),
    GN("\uBBF8\uC0AC\uC77C OR \uB3C4\uBC1C OR \uAD70\uC0AC when:1d"),
    GN("\uAD6D\uBC29\uBD80 OR \uD569\uCC38 OR \uC8FC\uD55C\uBBF8\uAD70 when:1d")
  ],
  disaster: [
    GN("\uC9C0\uC9C4 OR \uD638\uC6B0 OR \uC0B0\uBD88 OR \uD654\uC7AC OR \uC0AC\uACE0 when:1h"),
    GN("\uC9C0\uC9C4 OR \uD0DC\uD48D OR \uD638\uC6B0 OR \uD3ED\uC124 when:1d"),
    GN("\uC0B0\uBD88 OR \uD654\uC7AC OR \uBD95\uAD34 OR \uD3ED\uBC1C when:1d"),
    GN("\uC7AC\uB09C OR \uB300\uD53C OR \uC2E4\uC885 when:1d")
  ]
};
var cache = /* @__PURE__ */ new Map();
var CACHE_TTL_MS = 2 * 60 * 1e3;
var MAX_ITEMS = 60;
function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=60" }
  });
}
function decodeEntities(s) {
  return s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n))).replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16))).replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").trim();
}
function stripSourceTail(title) {
  let cleaned = title;
  for (let i = 0; i < 2; i++) {
    const idx = cleaned.lastIndexOf(" - ");
    if (idx <= 0) break;
    const tail = cleaned.slice(idx + 3).trim();
    if (tail.length === 0 || tail.length > 30) break;
    cleaned = cleaned.slice(0, idx).trimEnd();
  }
  return cleaned.length >= 5 ? cleaned : title;
}
function parseRss(xml) {
  const items = [];
  const blocks = xml.split(/<item[\s>]/).slice(1);
  for (const block of blocks) {
    const pick = (tag) => {
      const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`));
      return m ? decodeEntities(m[1]) : "";
    };
    const title = stripSourceTail(pick("title"));
    const link = pick("link");
    const pubDate = pick("pubDate");
    const source = pick("source");
    if (!title || !link || !/^https?:\/\//.test(link)) continue;
    const ts = Date.parse(pubDate);
    items.push({
      title,
      link,
      source: source || "Google News",
      publishedAt: Number.isFinite(ts) ? new Date(ts).toISOString() : (/* @__PURE__ */ new Date()).toISOString(),
      _ts: Number.isFinite(ts) ? ts : Date.now()
    });
  }
  return items;
}
var normTitle = (t) => t.toLowerCase().replace(/[\s\p{P}]+/gu, "");
async function handler(req) {
  const url = new URL(req.url);
  const topic = String(url.searchParams.get("topic") || "domestic");
  if (!Object.prototype.hasOwnProperty.call(TOPICS, topic)) return json(400, { error: "unknown topic" });
  const feeds = TOPICS[topic];
  const hit = cache.get(topic);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return json(200, hit.data);
  const results = await Promise.allSettled(
    feeds.map(
      (feedUrl) => fetch(feedUrl, {
        signal: AbortSignal.timeout(9e3),
        headers: { "Accept": "application/rss+xml, application/xml, text/xml" }
      }).then((r) => r.ok ? r.text() : Promise.reject(new Error(`HTTP ${r.status}`)))
    )
  );
  const seen = /* @__PURE__ */ new Set();
  const merged = [];
  for (const r of results) {
    if (r.status !== "fulfilled") continue;
    for (const item of parseRss(r.value)) {
      const key = normTitle(item.title);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      merged.push(item);
    }
  }
  if (merged.length === 0) {
    if (hit) return json(200, hit.data);
    return json(502, { error: "no items" });
  }
  merged.sort((a, b) => b._ts - a._ts);
  const data = {
    topic,
    generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    items: merged.slice(0, MAX_ITEMS).map(({ _ts, ...rest }) => rest)
  };
  cache.set(topic, { data, at: Date.now() });
  return json(200, data);
}
export {
  config,
  handler as default
};
