var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res, err) => function __init() {
  if (err) throw err[0];
  try {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  } catch (e) {
    throw err = [e], e;
  }
};
var __commonJS = (cb, mod) => function __require() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

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
  const json = JSON.stringify(value);
  const size = json.length * 2;
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
    value: json,
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

// node_modules/@upstash/core-analytics/dist/index.js
var require_dist = __commonJS({
  "node_modules/@upstash/core-analytics/dist/index.js"(exports, module) {
    "use strict";
    var g = Object.defineProperty;
    var k = Object.getOwnPropertyDescriptor;
    var _ = Object.getOwnPropertyNames;
    var y = Object.prototype.hasOwnProperty;
    var w = (l, e) => {
      for (var t in e) g(l, t, { get: e[t], enumerable: true });
    };
    var A = (l, e, t, i) => {
      if (e && typeof e == "object" || typeof e == "function") for (let s of _(e)) !y.call(l, s) && s !== t && g(l, s, { get: () => e[s], enumerable: !(i = k(e, s)) || i.enumerable });
      return l;
    };
    var x = (l) => A(g({}, "__esModule", { value: true }), l);
    var S = {};
    w(S, { Analytics: () => b });
    module.exports = x(S);
    var p = `
local key = KEYS[1]
local field = ARGV[1]

local data = redis.call("ZRANGE", key, 0, -1, "WITHSCORES")
local count = {}

for i = 1, #data, 2 do
  local json_str = data[i]
  local score = tonumber(data[i + 1])
  local obj = cjson.decode(json_str)

  local fieldValue = obj[field]

  if count[fieldValue] == nil then
    count[fieldValue] = score
  else
    count[fieldValue] = count[fieldValue] + score
  end
end

local result = {}
for k, v in pairs(count) do
  table.insert(result, {k, v})
end

return result
`;
    var f = `
local prefix = KEYS[1]
local first_timestamp = tonumber(ARGV[1]) -- First timestamp to check
local increment = tonumber(ARGV[2])       -- Increment between each timestamp
local num_timestamps = tonumber(ARGV[3])  -- Number of timestampts to check (24 for a day and 24 * 7 for a week)
local num_elements = tonumber(ARGV[4])    -- Number of elements to fetch in each category
local check_at_most = tonumber(ARGV[5])   -- Number of elements to check at most.

local keys = {}
for i = 1, num_timestamps do
  local timestamp = first_timestamp - (i - 1) * increment
  table.insert(keys, prefix .. ":" .. timestamp)
end

-- get the union of the groups
local zunion_params = {"ZUNION", num_timestamps, unpack(keys)}
table.insert(zunion_params, "WITHSCORES")
local result = redis.call(unpack(zunion_params))

-- select num_elements many items
local true_group = {}
local false_group = {}
local denied_group = {}
local true_count = 0
local false_count = 0
local denied_count = 0
local i = #result - 1

-- index to stop at after going through "checkAtMost" many items:
local cutoff_index = #result - 2 * check_at_most

-- iterate over the results
while (true_count + false_count + denied_count) < (num_elements * 3) and 1 <= i and i >= cutoff_index do
  local score = tonumber(result[i + 1])
  if score > 0 then
    local element = result[i]
    if string.find(element, "success\\":true") and true_count < num_elements then
      table.insert(true_group, {score, element})
      true_count = true_count + 1
    elseif string.find(element, "success\\":false") and false_count < num_elements then
      table.insert(false_group, {score, element})
      false_count = false_count + 1
    elseif string.find(element, "success\\":\\"denied") and denied_count < num_elements then
      table.insert(denied_group, {score, element})
      denied_count = denied_count + 1
    end
  end
  i = i - 2
end

return {true_group, false_group, denied_group}
`;
    var h = `
local prefix = KEYS[1]
local first_timestamp = tonumber(ARGV[1])
local increment = tonumber(ARGV[2])
local num_timestamps = tonumber(ARGV[3])

local keys = {}
for i = 1, num_timestamps do
  local timestamp = first_timestamp - (i - 1) * increment
  table.insert(keys, prefix .. ":" .. timestamp)
end

-- get the union of the groups
local zunion_params = {"ZUNION", num_timestamps, unpack(keys)}
table.insert(zunion_params, "WITHSCORES")
local result = redis.call(unpack(zunion_params))

return result
`;
    var b = class {
      redis;
      prefix;
      bucketSize;
      constructor(e) {
        this.redis = e.redis, this.prefix = e.prefix ?? "@upstash/analytics", this.bucketSize = this.parseWindow(e.window);
      }
      validateTableName(e) {
        if (!/^[a-zA-Z0-9_-]+$/.test(e)) throw new Error(`Invalid table name: ${e}. Table names can only contain letters, numbers, dashes and underscores.`);
      }
      parseWindow(e) {
        if (typeof e == "number") {
          if (e <= 0) throw new Error(`Invalid window: ${e}`);
          return e;
        }
        let t = /^(\d+)([smhd])$/;
        if (!t.test(e)) throw new Error(`Invalid window: ${e}`);
        let [, i, s] = e.match(t), n = parseInt(i);
        switch (s) {
          case "s":
            return n * 1e3;
          case "m":
            return n * 1e3 * 60;
          case "h":
            return n * 1e3 * 60 * 60;
          case "d":
            return n * 1e3 * 60 * 60 * 24;
          default:
            throw new Error(`Invalid window unit: ${s}`);
        }
      }
      getBucket(e) {
        let t = e ?? Date.now();
        return Math.floor(t / this.bucketSize) * this.bucketSize;
      }
      async ingest(e, ...t) {
        this.validateTableName(e), await Promise.all(t.map(async (i) => {
          let s = this.getBucket(i.time), n = [this.prefix, e, s].join(":");
          await this.redis.zincrby(n, 1, JSON.stringify({ ...i, time: void 0 }));
        }));
      }
      formatBucketAggregate(e, t, i) {
        let s = {};
        return e.forEach(([n, r]) => {
          t == "success" && (n = n === 1 ? "true" : n === null ? "false" : n), s[t] = s[t] || {}, s[t][(n ?? "null").toString()] = r;
        }), { time: i, ...s };
      }
      async aggregateBucket(e, t, i) {
        this.validateTableName(e);
        let s = this.getBucket(i), n = [this.prefix, e, s].join(":"), r = await this.redis.eval(p, [n], [t]);
        return this.formatBucketAggregate(r, t, s);
      }
      async aggregateBuckets(e, t, i, s) {
        this.validateTableName(e);
        let n = this.getBucket(s), r = [];
        for (let o = 0; o < i; o += 1) r.push(this.aggregateBucket(e, t, n)), n = n - this.bucketSize;
        return Promise.all(r);
      }
      async aggregateBucketsWithPipeline(e, t, i, s, n) {
        this.validateTableName(e), n = n ?? 48;
        let r = this.getBucket(s), o = [], c = this.redis.pipeline(), u = [];
        for (let a = 1; a <= i; a += 1) {
          let d = [this.prefix, e, r].join(":");
          c.eval(p, [d], [t]), o.push(r), r = r - this.bucketSize, (a % n == 0 || a == i) && (u.push(c.exec()), c = this.redis.pipeline());
        }
        return (await Promise.all(u)).flat().map((a, d) => this.formatBucketAggregate(a, t, o[d]));
      }
      async getAllowedBlocked(e, t, i) {
        this.validateTableName(e);
        let s = [this.prefix, e].join(":"), n = this.getBucket(i), r = await this.redis.eval(h, [s], [n, this.bucketSize, t]), o = {};
        for (let c = 0; c < r.length; c += 2) {
          let u = r[c], m = u.identifier, a = +r[c + 1];
          o[m] || (o[m] = { success: 0, blocked: 0 }), o[m][u.success ? "success" : "blocked"] = a;
        }
        return o;
      }
      async getMostAllowedBlocked(e, t, i, s, n) {
        this.validateTableName(e);
        let r = [this.prefix, e].join(":"), o = this.getBucket(s), c = n ?? i * 5, [u, m, a] = await this.redis.eval(f, [r], [o, this.bucketSize, t, i, c]);
        return { allowed: this.toDicts(u), ratelimited: this.toDicts(m), denied: this.toDicts(a) };
      }
      toDicts(e) {
        let t = [];
        for (let i = 0; i < e.length; i += 1) {
          let s = +e[i][0], n = e[i][1];
          t.push({ identifier: n.identifier, count: s });
        }
        return t;
      }
    };
  }
});

// node_modules/@upstash/ratelimit/dist/index.js
var require_dist2 = __commonJS({
  "node_modules/@upstash/ratelimit/dist/index.js"(exports, module) {
    "use strict";
    var __defProp3 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __export3 = (target, all) => {
      for (var name in all)
        __defProp3(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp3(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS = (mod) => __copyProps2(__defProp3({}, "__esModule", { value: true }), mod);
    var src_exports = {};
    __export3(src_exports, {
      Analytics: () => Analytics2,
      IpDenyList: () => ip_deny_list_exports,
      MultiRegionRatelimit: () => MultiRegionRatelimit,
      Ratelimit: () => RegionRatelimit
    });
    module.exports = __toCommonJS(src_exports);
    var import_core_analytics = require_dist();
    var Analytics2 = class {
      analytics;
      table = "events";
      constructor(config2) {
        this.analytics = new import_core_analytics.Analytics({
          // @ts-expect-error we need to fix the types in core-analytics, it should only require the methods it needs, not the whole sdk
          redis: config2.redis,
          window: "1h",
          prefix: config2.prefix ?? "@upstash/ratelimit",
          retention: "90d"
        });
      }
      /**
       * Try to extract the geo information from the request
       *
       * This handles Vercel's `req.geo` and  and Cloudflare's `request.cf` properties
       * @param req
       * @returns
       */
      extractGeo(req) {
        if (req.geo !== void 0) {
          return req.geo;
        }
        if (req.cf !== void 0) {
          return req.cf;
        }
        return {};
      }
      async record(event) {
        await this.analytics.ingest(this.table, event);
      }
      async series(filter, cutoff) {
        const timestampCount = Math.min(
          (this.analytics.getBucket(Date.now()) - this.analytics.getBucket(cutoff)) / (60 * 60 * 1e3),
          256
        );
        return this.analytics.aggregateBucketsWithPipeline(this.table, filter, timestampCount);
      }
      async getUsage(cutoff = 0) {
        const timestampCount = Math.min(
          (this.analytics.getBucket(Date.now()) - this.analytics.getBucket(cutoff)) / (60 * 60 * 1e3),
          256
        );
        const records = await this.analytics.getAllowedBlocked(this.table, timestampCount);
        return records;
      }
      async getUsageOverTime(timestampCount, groupby) {
        const result = await this.analytics.aggregateBucketsWithPipeline(this.table, groupby, timestampCount);
        return result;
      }
      async getMostAllowedBlocked(timestampCount, getTop, checkAtMost) {
        getTop = getTop ?? 5;
        const timestamp = void 0;
        return this.analytics.getMostAllowedBlocked(this.table, timestampCount, getTop, timestamp, checkAtMost);
      }
    };
    var Cache = class {
      /**
       * Stores identifier -> reset (in milliseconds)
       */
      cache;
      constructor(cache2) {
        this.cache = cache2;
      }
      isBlocked(identifier) {
        if (!this.cache.has(identifier)) {
          return { blocked: false, reset: 0 };
        }
        const reset = this.cache.get(identifier);
        if (reset < Date.now()) {
          this.cache.delete(identifier);
          return { blocked: false, reset: 0 };
        }
        return { blocked: true, reset };
      }
      blockUntil(identifier, reset) {
        this.cache.set(identifier, reset);
      }
      set(key, value) {
        this.cache.set(key, value);
      }
      get(key) {
        return this.cache.get(key) || null;
      }
      incr(key, incrementAmount = 1) {
        let value = this.cache.get(key) ?? 0;
        value += incrementAmount;
        this.cache.set(key, value);
        return value;
      }
      pop(key) {
        this.cache.delete(key);
      }
      empty() {
        this.cache.clear();
      }
      size() {
        return this.cache.size;
      }
    };
    var DYNAMIC_LIMIT_KEY_SUFFIX = ":dynamic:global";
    var DEFAULT_PREFIX = "@upstash/ratelimit";
    function ms(d) {
      const match = d.match(/^(\d+)\s?(ms|s|m|h|d)$/);
      if (!match) {
        throw new Error(`Unable to parse window size: ${d}`);
      }
      const time = Number.parseInt(match[1]);
      const unit = match[2];
      switch (unit) {
        case "ms": {
          return time;
        }
        case "s": {
          return time * 1e3;
        }
        case "m": {
          return time * 1e3 * 60;
        }
        case "h": {
          return time * 1e3 * 60 * 60;
        }
        case "d": {
          return time * 1e3 * 60 * 60 * 24;
        }
        default: {
          throw new Error(`Unable to parse window size: ${d}`);
        }
      }
    }
    var safeEval = async (ctx, script, keys, args) => {
      try {
        return await ctx.redis.evalsha(script.hash, keys, args);
      } catch (error) {
        if (`${error}`.includes("NOSCRIPT")) {
          return await ctx.redis.eval(script.script, keys, args);
        }
        throw error;
      }
    };
    var fixedWindowLimitScript = `
  local key           = KEYS[1]
  local dynamicLimitKey = KEYS[2]  -- optional: key for dynamic limit in redis
  local tokens        = tonumber(ARGV[1])  -- default limit
  local window        = ARGV[2]
  local incrementBy   = ARGV[3] -- increment rate per request at a given value, default is 1

  -- Check for dynamic limit
  local effectiveLimit = tokens
  if dynamicLimitKey ~= "" then
    local dynamicLimit = redis.call("GET", dynamicLimitKey)
    if dynamicLimit then
      effectiveLimit = tonumber(dynamicLimit)
    end
  end

  local r = redis.call("INCRBY", key, incrementBy)
  if r == tonumber(incrementBy) then
  -- The first time this key is set, the value will be equal to incrementBy.
  -- So we only need the expire command once
  redis.call("PEXPIRE", key, window)
  end

  return {r, effectiveLimit}
`;
    var fixedWindowRemainingTokensScript = `
  local key = KEYS[1]
  local dynamicLimitKey = KEYS[2]  -- optional: key for dynamic limit in redis
  local tokens = tonumber(ARGV[1])  -- default limit

  -- Check for dynamic limit
  local effectiveLimit = tokens
  if dynamicLimitKey ~= "" then
    local dynamicLimit = redis.call("GET", dynamicLimitKey)
    if dynamicLimit then
      effectiveLimit = tonumber(dynamicLimit)
    end
  end

  local value = redis.call('GET', key)
  local usedTokens = 0
  if value then
    usedTokens = tonumber(value)
  end
  
  return {effectiveLimit - usedTokens, effectiveLimit}
`;
    var slidingWindowLimitScript = `
  local currentKey  = KEYS[1]           -- identifier including prefixes
  local previousKey = KEYS[2]           -- key of the previous bucket
  local dynamicLimitKey = KEYS[3]       -- optional: key for dynamic limit in redis
  local tokens      = tonumber(ARGV[1]) -- default tokens per window
  local now         = ARGV[2]           -- current timestamp in milliseconds
  local window      = ARGV[3]           -- interval in milliseconds
  local incrementBy = tonumber(ARGV[4]) -- increment rate per request at a given value, default is 1

  -- Check for dynamic limit
  local effectiveLimit = tokens
  if dynamicLimitKey ~= "" then
    local dynamicLimit = redis.call("GET", dynamicLimitKey)
    if dynamicLimit then
      effectiveLimit = tonumber(dynamicLimit)
    end
  end

  local requestsInCurrentWindow = redis.call("GET", currentKey)
  if requestsInCurrentWindow == false then
    requestsInCurrentWindow = 0
  end

  local requestsInPreviousWindow = redis.call("GET", previousKey)
  if requestsInPreviousWindow == false then
    requestsInPreviousWindow = 0
  end
  local percentageInCurrent = ( now % window ) / window
  -- weighted requests to consider from the previous window
  requestsInPreviousWindow = math.floor(( 1 - percentageInCurrent ) * requestsInPreviousWindow)

  -- Only check limit if not refunding (negative rate)
  if incrementBy > 0 and requestsInPreviousWindow + requestsInCurrentWindow >= effectiveLimit then
    return {-1, effectiveLimit}
  end

  local newValue = redis.call("INCRBY", currentKey, incrementBy)
  if newValue == incrementBy then
    -- The first time this key is set, the value will be equal to incrementBy.
    -- So we only need the expire command once
    redis.call("PEXPIRE", currentKey, window * 2 + 1000) -- Enough time to overlap with a new window + 1 second
  end
  return {effectiveLimit - ( newValue + requestsInPreviousWindow ), effectiveLimit}
`;
    var slidingWindowRemainingTokensScript = `
  local currentKey  = KEYS[1]           -- identifier including prefixes
  local previousKey = KEYS[2]           -- key of the previous bucket
  local dynamicLimitKey = KEYS[3]       -- optional: key for dynamic limit in redis
  local tokens      = tonumber(ARGV[1]) -- default tokens per window
  local now         = ARGV[2]           -- current timestamp in milliseconds
  local window      = ARGV[3]           -- interval in milliseconds

  -- Check for dynamic limit
  local effectiveLimit = tokens
  if dynamicLimitKey ~= "" then
    local dynamicLimit = redis.call("GET", dynamicLimitKey)
    if dynamicLimit then
      effectiveLimit = tonumber(dynamicLimit)
    end
  end

  local requestsInCurrentWindow = redis.call("GET", currentKey)
  if requestsInCurrentWindow == false then
    requestsInCurrentWindow = 0
  end

  local requestsInPreviousWindow = redis.call("GET", previousKey)
  if requestsInPreviousWindow == false then
    requestsInPreviousWindow = 0
  end

  local percentageInCurrent = ( now % window ) / window
  -- weighted requests to consider from the previous window
  requestsInPreviousWindow = math.floor(( 1 - percentageInCurrent ) * requestsInPreviousWindow)

  local usedTokens = requestsInPreviousWindow + requestsInCurrentWindow
  return {effectiveLimit - usedTokens, effectiveLimit}
`;
    var tokenBucketLimitScript = `
  local key         = KEYS[1]           -- identifier including prefixes
  local dynamicLimitKey = KEYS[2]       -- optional: key for dynamic limit in redis
  local maxTokens   = tonumber(ARGV[1]) -- default maximum number of tokens
  local interval    = tonumber(ARGV[2]) -- size of the window in milliseconds
  local refillRate  = tonumber(ARGV[3]) -- how many tokens are refilled after each interval
  local now         = tonumber(ARGV[4]) -- current timestamp in milliseconds
  local incrementBy = tonumber(ARGV[5]) -- how many tokens to consume, default is 1

  -- Check for dynamic limit
  local effectiveLimit = maxTokens
  if dynamicLimitKey ~= "" then
    local dynamicLimit = redis.call("GET", dynamicLimitKey)
    if dynamicLimit then
      effectiveLimit = tonumber(dynamicLimit)
    end
  end
        
  local bucket = redis.call("HMGET", key, "refilledAt", "tokens")
        
  local refilledAt
  local tokens

  if bucket[1] == false then
    refilledAt = now
    tokens = effectiveLimit
  else
    refilledAt = tonumber(bucket[1])
    tokens = tonumber(bucket[2])
  end
        
  if now >= refilledAt + interval then
    local numRefills = math.floor((now - refilledAt) / interval)
    tokens = math.min(effectiveLimit, tokens + numRefills * refillRate)

    refilledAt = refilledAt + numRefills * interval
  end

  -- Only reject if tokens are 0 and we're consuming (not refunding)
  if tokens == 0 and incrementBy > 0 then
    return {-1, refilledAt + interval, effectiveLimit}
  end

  local remaining = tokens - incrementBy
  local expireAt = math.ceil(((effectiveLimit - remaining) / refillRate)) * interval
        
  redis.call("HSET", key, "refilledAt", refilledAt, "tokens", remaining)

  if (expireAt > 0) then
    redis.call("PEXPIRE", key, expireAt)
  end
  return {remaining, refilledAt + interval, effectiveLimit}
`;
    var tokenBucketIdentifierNotFound = -1;
    var tokenBucketRemainingTokensScript = `
  local key         = KEYS[1]
  local dynamicLimitKey = KEYS[2]       -- optional: key for dynamic limit in redis
  local maxTokens   = tonumber(ARGV[1]) -- default maximum number of tokens

  -- Check for dynamic limit
  local effectiveLimit = maxTokens
  if dynamicLimitKey ~= "" then
    local dynamicLimit = redis.call("GET", dynamicLimitKey)
    if dynamicLimit then
      effectiveLimit = tonumber(dynamicLimit)
    end
  end
        
  local bucket = redis.call("HMGET", key, "refilledAt", "tokens")

  if bucket[1] == false then
    return {effectiveLimit, ${tokenBucketIdentifierNotFound}, effectiveLimit}
  end
        
  return {tonumber(bucket[2]), tonumber(bucket[1]), effectiveLimit}
`;
    var cachedFixedWindowLimitScript = `
  local key     = KEYS[1]
  local window  = ARGV[1]
  local incrementBy   = ARGV[2] -- increment rate per request at a given value, default is 1

  local r = redis.call("INCRBY", key, incrementBy)
  if r == incrementBy then
  -- The first time this key is set, the value will be equal to incrementBy.
  -- So we only need the expire command once
  redis.call("PEXPIRE", key, window)
  end
      
  return r
`;
    var cachedFixedWindowRemainingTokenScript = `
  local key = KEYS[1]
  local tokens = 0

  local value = redis.call('GET', key)
  if value then
      tokens = value
  end
  return tokens
`;
    var fixedWindowLimitScript2 = `
	local key           = KEYS[1]
	local id            = ARGV[1]
	local window        = ARGV[2]
	local incrementBy   = tonumber(ARGV[3])

	redis.call("HSET", key, id, incrementBy)
	local fields = redis.call("HGETALL", key)
	if #fields == 2 and tonumber(fields[2])==incrementBy then
	-- The first time this key is set, and the value will be equal to incrementBy.
	-- So we only need the expire command once
	  redis.call("PEXPIRE", key, window)
	end

	return fields
`;
    var fixedWindowRemainingTokensScript2 = `
      local key = KEYS[1]
      local tokens = 0

      local fields = redis.call("HGETALL", key)

      return fields
    `;
    var slidingWindowLimitScript2 = `
	local currentKey    = KEYS[1]           -- identifier including prefixes
	local previousKey   = KEYS[2]           -- key of the previous bucket
	local tokens        = tonumber(ARGV[1]) -- tokens per window
	local now           = ARGV[2]           -- current timestamp in milliseconds
	local window        = ARGV[3]           -- interval in milliseconds
	local requestId     = ARGV[4]           -- uuid for this request
	local incrementBy   = tonumber(ARGV[5]) -- custom rate, default is  1

	local currentFields = redis.call("HGETALL", currentKey)
	local requestsInCurrentWindow = 0
	for i = 2, #currentFields, 2 do
	requestsInCurrentWindow = requestsInCurrentWindow + tonumber(currentFields[i])
	end

	local previousFields = redis.call("HGETALL", previousKey)
	local requestsInPreviousWindow = 0
	for i = 2, #previousFields, 2 do
	requestsInPreviousWindow = requestsInPreviousWindow + tonumber(previousFields[i])
	end

	local percentageInCurrent = ( now % window) / window

	-- Only check limit if not refunding (negative rate)
	if incrementBy > 0 and requestsInPreviousWindow * (1 - percentageInCurrent ) + requestsInCurrentWindow + incrementBy > tokens then
	  return {currentFields, previousFields, false}
	end

	redis.call("HSET", currentKey, requestId, incrementBy)

	if requestsInCurrentWindow == 0 then 
	  -- The first time this key is set, the value will be equal to incrementBy.
	  -- So we only need the expire command once
	  redis.call("PEXPIRE", currentKey, window * 2 + 1000) -- Enough time to overlap with a new window + 1 second
	end
	return {currentFields, previousFields, true}
`;
    var slidingWindowRemainingTokensScript2 = `
	local currentKey    = KEYS[1]           -- identifier including prefixes
	local previousKey   = KEYS[2]           -- key of the previous bucket
	local now         	= ARGV[1]           -- current timestamp in milliseconds
  	local window      	= ARGV[2]           -- interval in milliseconds

	local currentFields = redis.call("HGETALL", currentKey)
	local requestsInCurrentWindow = 0
	for i = 2, #currentFields, 2 do
	requestsInCurrentWindow = requestsInCurrentWindow + tonumber(currentFields[i])
	end

	local previousFields = redis.call("HGETALL", previousKey)
	local requestsInPreviousWindow = 0
	for i = 2, #previousFields, 2 do
	requestsInPreviousWindow = requestsInPreviousWindow + tonumber(previousFields[i])
	end

	local percentageInCurrent = ( now % window) / window
  	requestsInPreviousWindow = math.floor(( 1 - percentageInCurrent ) * requestsInPreviousWindow)
	
	return requestsInCurrentWindow + requestsInPreviousWindow
`;
    var resetScript = `
      local pattern = KEYS[1]

      -- Initialize cursor to start from 0
      local cursor = "0"

      repeat
          -- Scan for keys matching the pattern
          local scan_result = redis.call('SCAN', cursor, 'MATCH', pattern)

          -- Extract cursor for the next iteration
          cursor = scan_result[1]

          -- Extract keys from the scan result
          local keys = scan_result[2]

          for i=1, #keys do
          redis.call('DEL', keys[i])
          end

      -- Continue scanning until cursor is 0 (end of keyspace)
      until cursor == "0"
    `;
    var SCRIPTS = {
      singleRegion: {
        fixedWindow: {
          limit: {
            script: fixedWindowLimitScript,
            hash: "472e55443b62f60d0991028456c57815a387066d"
          },
          getRemaining: {
            script: fixedWindowRemainingTokensScript,
            hash: "40515c9dd0a08f8584f5f9b593935f6a87c1c1c3"
          }
        },
        slidingWindow: {
          limit: {
            script: slidingWindowLimitScript,
            hash: "977fb636fb5ceb7e98a96d1b3a1272ba018efdae"
          },
          getRemaining: {
            script: slidingWindowRemainingTokensScript,
            hash: "ee3a3265fad822f83acad23f8a1e2f5c0b156b03"
          }
        },
        tokenBucket: {
          limit: {
            script: tokenBucketLimitScript,
            hash: "b35c5bc0b7fdae7dd0573d4529911cabaf9d1d89"
          },
          getRemaining: {
            script: tokenBucketRemainingTokensScript,
            hash: "deb03663e8af5a968deee895dd081be553d2611b"
          }
        },
        cachedFixedWindow: {
          limit: {
            script: cachedFixedWindowLimitScript,
            hash: "c26b12703dd137939b9a69a3a9b18e906a2d940f"
          },
          getRemaining: {
            script: cachedFixedWindowRemainingTokenScript,
            hash: "8e8f222ccae68b595ee6e3f3bf2199629a62b91a"
          }
        }
      },
      multiRegion: {
        fixedWindow: {
          limit: {
            script: fixedWindowLimitScript2,
            hash: "a8c14f3835aa87bd70e5e2116081b81664abcf5c"
          },
          getRemaining: {
            script: fixedWindowRemainingTokensScript2,
            hash: "8ab8322d0ed5fe5ac8eb08f0c2e4557f1b4816fd"
          }
        },
        slidingWindow: {
          limit: {
            script: slidingWindowLimitScript2,
            hash: "1e7ca8dcd2d600a6d0124a67a57ea225ed62921b"
          },
          getRemaining: {
            script: slidingWindowRemainingTokensScript2,
            hash: "558c9306b7ec54abb50747fe0b17e5d44bd24868"
          }
        }
      }
    };
    var RESET_SCRIPT = {
      script: resetScript,
      hash: "54bd274ddc59fb3be0f42deee2f64322a10e2b50"
    };
    var DenyListExtension = "denyList";
    var IpDenyListKey = "ipDenyList";
    var IpDenyListStatusKey = "ipDenyListStatus";
    var checkDenyListScript = `
  -- Checks if values provideed in ARGV are present in the deny lists.
  -- This is done using the allDenyListsKey below.

  -- Additionally, checks the status of the ip deny list using the
  -- ipDenyListStatusKey below. Here are the possible states of the
  -- ipDenyListStatusKey key:
  -- * status == -1: set to "disabled" with no TTL
  -- * status == -2: not set, meaning that is was set before but expired
  -- * status  >  0: set to "valid", with a TTL
  --
  -- In the case of status == -2, we set the status to "pending" with
  -- 30 second ttl. During this time, the process which got status == -2
  -- will update the ip deny list.

  local allDenyListsKey     = KEYS[1]
  local ipDenyListStatusKey = KEYS[2]

  local results = redis.call('SMISMEMBER', allDenyListsKey, unpack(ARGV))
  local status  = redis.call('TTL', ipDenyListStatusKey)
  if status == -2 then
    redis.call('SETEX', ipDenyListStatusKey, 30, "pending")
  end

  return { results, status }
`;
    var ip_deny_list_exports = {};
    __export3(ip_deny_list_exports, {
      ThresholdError: () => ThresholdError,
      disableIpDenyList: () => disableIpDenyList,
      updateIpDenyList: () => updateIpDenyList
    });
    var MILLISECONDS_IN_HOUR = 60 * 60 * 1e3;
    var MILLISECONDS_IN_DAY = 24 * MILLISECONDS_IN_HOUR;
    var MILLISECONDS_TO_2AM = 2 * MILLISECONDS_IN_HOUR;
    var getIpListTTL = (time) => {
      const now = time || Date.now();
      const timeSinceLast2AM = (now - MILLISECONDS_TO_2AM) % MILLISECONDS_IN_DAY;
      return MILLISECONDS_IN_DAY - timeSinceLast2AM;
    };
    var baseUrl = "https://raw.githubusercontent.com/stamparm/ipsum/master/levels";
    var ThresholdError = class extends Error {
      constructor(threshold) {
        super(`Allowed threshold values are from 1 to 8, 1 and 8 included. Received: ${threshold}`);
        this.name = "ThresholdError";
      }
    };
    var getIpDenyList = async (threshold) => {
      if (typeof threshold !== "number" || threshold < 1 || threshold > 8) {
        throw new ThresholdError(threshold);
      }
      try {
        const response = await fetch(`${baseUrl}/${threshold}.txt`);
        if (!response.ok) {
          throw new Error(`Error fetching data: ${response.statusText}`);
        }
        const data = await response.text();
        const lines = data.split("\n");
        return lines.filter((value) => value.length > 0);
      } catch (error) {
        throw new Error(`Failed to fetch ip deny list: ${error}`);
      }
    };
    var updateIpDenyList = async (redis, prefix, threshold, ttl) => {
      const allIps = await getIpDenyList(threshold);
      const allDenyLists = [prefix, DenyListExtension, "all"].join(":");
      const ipDenyList = [prefix, DenyListExtension, IpDenyListKey].join(":");
      const statusKey = [prefix, IpDenyListStatusKey].join(":");
      const transaction = redis.multi();
      transaction.sdiffstore(allDenyLists, allDenyLists, ipDenyList);
      transaction.del(ipDenyList);
      transaction.sadd(ipDenyList, allIps.at(0), ...allIps.slice(1));
      transaction.sdiffstore(ipDenyList, ipDenyList, allDenyLists);
      transaction.sunionstore(allDenyLists, allDenyLists, ipDenyList);
      transaction.set(statusKey, "valid", { px: ttl ?? getIpListTTL() });
      return await transaction.exec();
    };
    var disableIpDenyList = async (redis, prefix) => {
      const allDenyListsKey = [prefix, DenyListExtension, "all"].join(":");
      const ipDenyListKey = [prefix, DenyListExtension, IpDenyListKey].join(":");
      const statusKey = [prefix, IpDenyListStatusKey].join(":");
      const transaction = redis.multi();
      transaction.sdiffstore(allDenyListsKey, allDenyListsKey, ipDenyListKey);
      transaction.del(ipDenyListKey);
      transaction.set(statusKey, "disabled");
      return await transaction.exec();
    };
    var denyListCache = new Cache(/* @__PURE__ */ new Map());
    var checkDenyListCache = (members) => {
      return members.find(
        (member) => denyListCache.isBlocked(member).blocked
      );
    };
    var blockMember = (member) => {
      if (denyListCache.size() > 1e3)
        denyListCache.empty();
      denyListCache.blockUntil(member, Date.now() + 6e4);
    };
    var checkDenyList = async (redis, prefix, members) => {
      const [deniedValues, ipDenyListStatus] = await redis.eval(
        checkDenyListScript,
        [
          [prefix, DenyListExtension, "all"].join(":"),
          [prefix, IpDenyListStatusKey].join(":")
        ],
        members
      );
      let deniedValue = void 0;
      deniedValues.map((memberDenied, index) => {
        if (memberDenied) {
          blockMember(members[index]);
          deniedValue = members[index];
        }
      });
      return {
        deniedValue,
        invalidIpDenyList: ipDenyListStatus === -2
      };
    };
    var resolveLimitPayload = (redis, prefix, [ratelimitResponse, denyListResponse], threshold) => {
      if (denyListResponse.deniedValue) {
        ratelimitResponse.success = false;
        ratelimitResponse.remaining = 0;
        ratelimitResponse.reason = "denyList";
        ratelimitResponse.deniedValue = denyListResponse.deniedValue;
      }
      if (denyListResponse.invalidIpDenyList) {
        const updatePromise = updateIpDenyList(redis, prefix, threshold);
        ratelimitResponse.pending = Promise.all([
          ratelimitResponse.pending,
          updatePromise
        ]);
      }
      return ratelimitResponse;
    };
    var defaultDeniedResponse = (deniedValue) => {
      return {
        success: false,
        limit: 0,
        remaining: 0,
        reset: 0,
        pending: Promise.resolve(),
        reason: "denyList",
        deniedValue
      };
    };
    var Ratelimit3 = class {
      limiter;
      ctx;
      prefix;
      timeout;
      primaryRedis;
      analytics;
      enableProtection;
      denyListThreshold;
      dynamicLimits;
      constructor(config2) {
        this.ctx = config2.ctx;
        this.limiter = config2.limiter;
        this.timeout = config2.timeout ?? 5e3;
        this.prefix = config2.prefix ?? DEFAULT_PREFIX;
        this.dynamicLimits = config2.dynamicLimits ?? false;
        this.enableProtection = config2.enableProtection ?? false;
        this.denyListThreshold = config2.denyListThreshold ?? 6;
        this.primaryRedis = "redis" in this.ctx ? this.ctx.redis : this.ctx.regionContexts[0].redis;
        if ("redis" in this.ctx) {
          this.ctx.dynamicLimits = this.dynamicLimits;
          this.ctx.prefix = this.prefix;
        }
        this.analytics = config2.analytics ? new Analytics2({
          redis: this.primaryRedis,
          prefix: this.prefix
        }) : void 0;
        if (config2.ephemeralCache instanceof Map) {
          this.ctx.cache = new Cache(config2.ephemeralCache);
        } else if (config2.ephemeralCache === void 0) {
          this.ctx.cache = new Cache(/* @__PURE__ */ new Map());
        }
      }
      /**
       * Determine if a request should pass or be rejected based on the identifier and previously chosen ratelimit.
       *
       * Use this if you want to reject all requests that you can not handle right now.
       *
       * @example
       * ```ts
       *  const ratelimit = new Ratelimit({
       *    redis: Redis.fromEnv(),
       *    limiter: Ratelimit.slidingWindow(10, "10 s")
       *  })
       *
       *  const { success } = await ratelimit.limit(id)
       *  if (!success){
       *    return "Nope"
       *  }
       *  return "Yes"
       * ```
       *
       * @param req.rate - The rate at which tokens will be added or consumed from the token bucket. A higher rate allows for more requests to be processed. Defaults to 1 token per interval if not specified.
       *
       * Usage with `req.rate`
       * @example
       * ```ts
       *  const ratelimit = new Ratelimit({
       *    redis: Redis.fromEnv(),
       *    limiter: Ratelimit.slidingWindow(100, "10 s")
       *  })
       *
       *  const { success } = await ratelimit.limit(id, {rate: 10})
       *  if (!success){
       *    return "Nope"
       *  }
       *  return "Yes"
       * ```
       */
      limit = async (identifier, req) => {
        let timeoutId = null;
        try {
          const response = this.getRatelimitResponse(identifier, req);
          const { responseArray, newTimeoutId } = this.applyTimeout(response);
          timeoutId = newTimeoutId;
          const timedResponse = await Promise.race(responseArray);
          const finalResponse = this.submitAnalytics(timedResponse, identifier, req);
          return finalResponse;
        } finally {
          if (timeoutId) {
            clearTimeout(timeoutId);
          }
        }
      };
      /**
       * Block until the request may pass or timeout is reached.
       *
       * This method returns a promise that resolves as soon as the request may be processed
       * or after the timeout has been reached.
       *
       * Use this if you want to delay the request until it is ready to get processed.
       *
       * @example
       * ```ts
       *  const ratelimit = new Ratelimit({
       *    redis: Redis.fromEnv(),
       *    limiter: Ratelimit.slidingWindow(10, "10 s")
       *  })
       *
       *  const { success } = await ratelimit.blockUntilReady(id, 60_000)
       *  if (!success){
       *    return "Nope"
       *  }
       *  return "Yes"
       * ```
       */
      blockUntilReady = async (identifier, timeout) => {
        if (timeout <= 0) {
          throw new Error("timeout must be positive");
        }
        let res;
        const deadline = Date.now() + timeout;
        while (true) {
          res = await this.limit(identifier);
          if (res.success) {
            break;
          }
          if (res.reset === 0) {
            throw new Error("This should not happen");
          }
          const wait = Math.min(res.reset, deadline) - Date.now();
          await new Promise((r) => setTimeout(r, wait));
          if (Date.now() > deadline) {
            break;
          }
        }
        return res;
      };
      resetUsedTokens = async (identifier) => {
        const pattern = [this.prefix, identifier].join(":");
        await this.limiter().resetTokens(this.ctx, pattern);
      };
      /**
       * Returns the remaining token count together with a reset timestamps
       * 
       * @param identifier identifir to check
       * @returns object with `remaining`, `reset`, and `limit` fields. `remaining` denotes
       *          the remaining tokens, `limit` is the effective limit (considering dynamic
       *          limits if enabled), and `reset` denotes the timestamp when the tokens reset.
       */
      getRemaining = async (identifier) => {
        const pattern = [this.prefix, identifier].join(":");
        return await this.limiter().getRemaining(this.ctx, pattern);
      };
      /**
       * Checks if the identifier or the values in req are in the deny list cache.
       * If so, returns the default denied response.
       * 
       * Otherwise, calls redis to check the rate limit and deny list. Returns after
       * resolving the result. Resolving is overriding the rate limit result if
       * the some value is in deny list.
       * 
       * @param identifier identifier to block
       * @param req options with ip, user agent, country, rate and geo info
       * @returns rate limit response
       */
      getRatelimitResponse = async (identifier, req) => {
        const key = this.getKey(identifier);
        const definedMembers = this.getDefinedMembers(identifier, req);
        const deniedValue = checkDenyListCache(definedMembers);
        const result = deniedValue ? [defaultDeniedResponse(deniedValue), { deniedValue, invalidIpDenyList: false }] : await Promise.all([
          this.limiter().limit(this.ctx, key, req?.rate),
          this.enableProtection ? checkDenyList(this.primaryRedis, this.prefix, definedMembers) : { deniedValue: void 0, invalidIpDenyList: false }
        ]);
        return resolveLimitPayload(this.primaryRedis, this.prefix, result, this.denyListThreshold);
      };
      /**
       * Creates an array with the original response promise and a timeout promise
       * if this.timeout > 0.
       * 
       * @param response Ratelimit response promise
       * @returns array with the response and timeout promise. also includes the timeout id
       */
      applyTimeout = (response) => {
        let newTimeoutId = null;
        const responseArray = [response];
        if (this.timeout > 0) {
          const timeoutResponse = new Promise((resolve) => {
            newTimeoutId = setTimeout(() => {
              resolve({
                success: true,
                limit: 0,
                remaining: 0,
                reset: 0,
                pending: Promise.resolve(),
                reason: "timeout"
              });
            }, this.timeout);
          });
          responseArray.push(timeoutResponse);
        }
        return {
          responseArray,
          newTimeoutId
        };
      };
      /**
       * submits analytics if this.analytics is set
       * 
       * @param ratelimitResponse final rate limit response
       * @param identifier identifier to submit
       * @param req limit options
       * @returns rate limit response after updating the .pending field
       */
      submitAnalytics = (ratelimitResponse, identifier, req) => {
        if (this.analytics) {
          try {
            const geo = req ? this.analytics.extractGeo(req) : void 0;
            const analyticsP = this.analytics.record({
              identifier: ratelimitResponse.reason === "denyList" ? ratelimitResponse.deniedValue : identifier,
              time: Date.now(),
              success: ratelimitResponse.reason === "denyList" ? "denied" : ratelimitResponse.success,
              ...geo
            }).catch((error) => {
              let errorMessage = "Failed to record analytics";
              if (`${error}`.includes("WRONGTYPE")) {
                errorMessage = `
    Failed to record analytics. See the information below:

    This can occur when you uprade to Ratelimit version 1.1.2
    or later from an earlier version.

    This occurs simply because the way we store analytics data
    has changed. To avoid getting this error, disable analytics
    for *an hour*, then simply enable it back.

    `;
              }
              console.warn(errorMessage, error);
            });
            ratelimitResponse.pending = Promise.all([ratelimitResponse.pending, analyticsP]);
          } catch (error) {
            console.warn("Failed to record analytics", error);
          }
          ;
        }
        ;
        return ratelimitResponse;
      };
      getKey = (identifier) => {
        return [this.prefix, identifier].join(":");
      };
      /**
       * returns a list of defined values from
       * [identifier, req.ip, req.userAgent, req.country]
       * 
       * @param identifier identifier
       * @param req limit options
       * @returns list of defined values
       */
      getDefinedMembers = (identifier, req) => {
        const members = [identifier, req?.ip, req?.userAgent, req?.country];
        return members.filter(Boolean);
      };
      /**
       * Set a dynamic rate limit globally.
       * 
       * When dynamicLimits is enabled, this limit will override the default limit
       * set in the constructor for all requests.
       * 
       * @example
       * ```ts
       * const ratelimit = new Ratelimit({
       *   redis: Redis.fromEnv(),
       *   limiter: Ratelimit.slidingWindow(10, "10 s"),
       *   dynamicLimits: true
       * });
       * 
       * // Set global dynamic limit to 120 requests
       * await ratelimit.setDynamicLimit({ limit: 120 });
       * 
       * // Disable dynamic limit (falls back to default)
       * await ratelimit.setDynamicLimit({ limit: false });
       * ```
       * 
       * @param options.limit - The new rate limit to apply globally, or false to disable
       */
      setDynamicLimit = async (options) => {
        if (!this.dynamicLimits) {
          throw new Error(
            "dynamicLimits must be enabled in the Ratelimit constructor to use setDynamicLimit()"
          );
        }
        const globalKey = `${this.prefix}${DYNAMIC_LIMIT_KEY_SUFFIX}`;
        await (options.limit === false ? this.primaryRedis.del(globalKey) : this.primaryRedis.set(globalKey, options.limit));
      };
      /**
       * Get the current global dynamic rate limit.
       * 
       * @example
       * ```ts
       * const { dynamicLimit } = await ratelimit.getDynamicLimit();
       * console.log(dynamicLimit); // 120 or null if not set
       * ```
       * 
       * @returns Object containing the current global dynamic limit, or null if not set
       */
      getDynamicLimit = async () => {
        if (!this.dynamicLimits) {
          throw new Error(
            "dynamicLimits must be enabled in the Ratelimit constructor to use getDynamicLimit()"
          );
        }
        const globalKey = `${this.prefix}${DYNAMIC_LIMIT_KEY_SUFFIX}`;
        const result = await this.primaryRedis.get(globalKey);
        return { dynamicLimit: result === null ? null : Number(result) };
      };
    };
    function randomId() {
      let result = "";
      const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
      const charactersLength = characters.length;
      for (let i = 0; i < 16; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
      }
      return result;
    }
    var MultiRegionRatelimit = class extends Ratelimit3 {
      /**
       * Create a new Ratelimit instance by providing a `@upstash/redis` instance and the algorithn of your choice.
       */
      constructor(config2) {
        super({
          prefix: config2.prefix,
          limiter: config2.limiter,
          timeout: config2.timeout,
          analytics: config2.analytics,
          dynamicLimits: config2.dynamicLimits,
          ctx: {
            regionContexts: config2.redis.map((redis) => ({
              redis,
              prefix: config2.prefix ?? DEFAULT_PREFIX
            })),
            cache: config2.ephemeralCache ? new Cache(config2.ephemeralCache) : void 0
          }
        });
        if (config2.dynamicLimits) {
          console.warn(
            "Warning: Dynamic limits are not yet supported for multi-region rate limiters. The dynamicLimits option will be ignored."
          );
        }
      }
      /**
       * Each request inside a fixed time increases a counter.
       * Once the counter reaches the maximum allowed number, all further requests are
       * rejected.
       *
       * **Pro:**
       *
       * - Newer requests are not starved by old ones.
       * - Low storage cost.
       *
       * **Con:**
       *
       * A burst of requests near the boundary of a window can result in a very
       * high request rate because two windows will be filled with requests quickly.
       *
       * @param tokens - How many requests a user can make in each time window.
       * @param window - A fixed timeframe
       */
      static fixedWindow(tokens, window) {
        const windowDuration = ms(window);
        return () => ({
          async limit(ctx, identifier, rate) {
            const requestId = randomId();
            const bucket = Math.floor(Date.now() / windowDuration);
            const key = [identifier, bucket].join(":");
            const incrementBy = rate ?? 1;
            if (ctx.cache && incrementBy > 0) {
              const { blocked, reset: reset2 } = ctx.cache.isBlocked(identifier);
              if (blocked) {
                return {
                  success: false,
                  limit: tokens,
                  remaining: 0,
                  reset: reset2,
                  pending: Promise.resolve(),
                  reason: "cacheBlock"
                };
              }
            }
            const dbs = ctx.regionContexts.map((regionContext) => ({
              redis: regionContext.redis,
              request: safeEval(
                regionContext,
                SCRIPTS.multiRegion.fixedWindow.limit,
                [key],
                [requestId, windowDuration, incrementBy]
              )
            }));
            const firstResponse = await Promise.any(dbs.map((s) => s.request));
            const usedTokens = firstResponse.reduce(
              (accTokens, usedToken, index) => {
                let parsedToken = 0;
                if (index % 2) {
                  parsedToken = Number.parseInt(usedToken);
                }
                return accTokens + parsedToken;
              },
              0
            );
            const remaining = tokens - usedTokens;
            async function sync() {
              const individualIDs = await Promise.all(dbs.map((s) => s.request));
              const allIDs = [
                ...new Set(
                  individualIDs.flat().reduce((acc, curr, index) => {
                    if (index % 2 === 0) {
                      acc.push(curr);
                    }
                    return acc;
                  }, [])
                ).values()
              ];
              for (const db of dbs) {
                const usedDbTokensRequest = await db.request;
                const usedDbTokens = usedDbTokensRequest.reduce(
                  (accTokens, usedToken, index) => {
                    let parsedToken = 0;
                    if (index % 2) {
                      parsedToken = Number.parseInt(usedToken);
                    }
                    return accTokens + parsedToken;
                  },
                  0
                );
                const dbIdsRequest = await db.request;
                const dbIds = dbIdsRequest.reduce(
                  (ids, currentId, index) => {
                    if (index % 2 === 0) {
                      ids.push(currentId);
                    }
                    return ids;
                  },
                  []
                );
                if (usedDbTokens >= tokens) {
                  continue;
                }
                const diff = allIDs.filter((id) => !dbIds.includes(id));
                if (diff.length === 0) {
                  continue;
                }
                for (const requestId2 of diff) {
                  await db.redis.hset(key, { [requestId2]: incrementBy });
                }
              }
            }
            const success = remaining >= 0;
            const reset = (bucket + 1) * windowDuration;
            if (ctx.cache) {
              if (!success) {
                ctx.cache.blockUntil(identifier, reset);
              } else if (incrementBy < 0) {
                ctx.cache.pop(identifier);
              }
            }
            return {
              success,
              limit: tokens,
              remaining,
              reset,
              pending: sync()
            };
          },
          async getRemaining(ctx, identifier) {
            const bucket = Math.floor(Date.now() / windowDuration);
            const key = [identifier, bucket].join(":");
            const dbs = ctx.regionContexts.map((regionContext) => ({
              redis: regionContext.redis,
              request: safeEval(
                regionContext,
                SCRIPTS.multiRegion.fixedWindow.getRemaining,
                [key],
                [null]
              )
            }));
            const firstResponse = await Promise.any(dbs.map((s) => s.request));
            const usedTokens = firstResponse.reduce(
              (accTokens, usedToken, index) => {
                let parsedToken = 0;
                if (index % 2) {
                  parsedToken = Number.parseInt(usedToken);
                }
                return accTokens + parsedToken;
              },
              0
            );
            return {
              remaining: Math.max(0, tokens - usedTokens),
              reset: (bucket + 1) * windowDuration,
              limit: tokens
            };
          },
          async resetTokens(ctx, identifier) {
            const pattern = [identifier, "*"].join(":");
            if (ctx.cache) {
              ctx.cache.pop(identifier);
            }
            await Promise.all(
              ctx.regionContexts.map((regionContext) => {
                safeEval(regionContext, RESET_SCRIPT, [pattern], [null]);
              })
            );
          }
        });
      }
      /**
       * Combined approach of `slidingLogs` and `fixedWindow` with lower storage
       * costs than `slidingLogs` and improved boundary behavior by calculating a
       * weighted score between two windows.
       *
       * **Pro:**
       *
       * Good performance allows this to scale to very high loads.
       *
       * **Con:**
       *
       * Nothing major.
       *
       * @param tokens - How many requests a user can make in each time window.
       * @param window - The duration in which the user can max X requests.
       */
      static slidingWindow(tokens, window) {
        const windowSize = ms(window);
        const windowDuration = ms(window);
        return () => ({
          async limit(ctx, identifier, rate) {
            const requestId = randomId();
            const now = Date.now();
            const currentWindow = Math.floor(now / windowSize);
            const currentKey = [identifier, currentWindow].join(":");
            const previousWindow = currentWindow - 1;
            const previousKey = [identifier, previousWindow].join(":");
            const incrementBy = rate ?? 1;
            if (ctx.cache && incrementBy > 0) {
              const { blocked, reset: reset2 } = ctx.cache.isBlocked(identifier);
              if (blocked) {
                return {
                  success: false,
                  limit: tokens,
                  remaining: 0,
                  reset: reset2,
                  pending: Promise.resolve(),
                  reason: "cacheBlock"
                };
              }
            }
            const dbs = ctx.regionContexts.map((regionContext) => ({
              redis: regionContext.redis,
              request: safeEval(
                regionContext,
                SCRIPTS.multiRegion.slidingWindow.limit,
                [currentKey, previousKey],
                [tokens, now, windowDuration, requestId, incrementBy]
                // lua seems to return `1` for true and `null` for false
              )
            }));
            const percentageInCurrent = now % windowDuration / windowDuration;
            const [current, previous, success] = await Promise.any(
              dbs.map((s) => s.request)
            );
            if (success) {
              current.push(requestId, incrementBy.toString());
            }
            const previousUsedTokens = previous.reduce(
              (accTokens, usedToken, index) => {
                let parsedToken = 0;
                if (index % 2) {
                  parsedToken = Number.parseInt(usedToken);
                }
                return accTokens + parsedToken;
              },
              0
            );
            const currentUsedTokens = current.reduce(
              (accTokens, usedToken, index) => {
                let parsedToken = 0;
                if (index % 2) {
                  parsedToken = Number.parseInt(usedToken);
                }
                return accTokens + parsedToken;
              },
              0
            );
            const previousPartialUsed = Math.ceil(
              previousUsedTokens * (1 - percentageInCurrent)
            );
            const usedTokens = previousPartialUsed + currentUsedTokens;
            const remaining = tokens - usedTokens;
            async function sync() {
              const res = await Promise.all(dbs.map((s) => s.request));
              const allCurrentIds = [
                ...new Set(
                  res.flatMap(([current2]) => current2).reduce((acc, curr, index) => {
                    if (index % 2 === 0) {
                      acc.push(curr);
                    }
                    return acc;
                  }, [])
                ).values()
              ];
              for (const db of dbs) {
                const [current2, _previous, _success] = await db.request;
                const dbIds = current2.reduce((ids, currentId, index) => {
                  if (index % 2 === 0) {
                    ids.push(currentId);
                  }
                  return ids;
                }, []);
                const usedDbTokens = current2.reduce(
                  (accTokens, usedToken, index) => {
                    let parsedToken = 0;
                    if (index % 2) {
                      parsedToken = Number.parseInt(usedToken);
                    }
                    return accTokens + parsedToken;
                  },
                  0
                );
                if (usedDbTokens >= tokens) {
                  continue;
                }
                const diff = allCurrentIds.filter((id) => !dbIds.includes(id));
                if (diff.length === 0) {
                  continue;
                }
                for (const requestId2 of diff) {
                  await db.redis.hset(currentKey, { [requestId2]: incrementBy });
                }
              }
            }
            const reset = (currentWindow + 1) * windowDuration;
            if (ctx.cache) {
              if (!success) {
                ctx.cache.blockUntil(identifier, reset);
              } else if (incrementBy < 0) {
                ctx.cache.pop(identifier);
              }
            }
            return {
              success: Boolean(success),
              limit: tokens,
              remaining: Math.max(0, remaining),
              reset,
              pending: sync()
            };
          },
          async getRemaining(ctx, identifier) {
            const now = Date.now();
            const currentWindow = Math.floor(now / windowSize);
            const currentKey = [identifier, currentWindow].join(":");
            const previousWindow = currentWindow - 1;
            const previousKey = [identifier, previousWindow].join(":");
            const dbs = ctx.regionContexts.map((regionContext) => ({
              redis: regionContext.redis,
              request: safeEval(
                regionContext,
                SCRIPTS.multiRegion.slidingWindow.getRemaining,
                [currentKey, previousKey],
                [now, windowSize]
                // lua seems to return `1` for true and `null` for false
              )
            }));
            const usedTokens = await Promise.any(dbs.map((s) => s.request));
            return {
              remaining: Math.max(0, tokens - usedTokens),
              reset: (currentWindow + 1) * windowSize,
              limit: tokens
            };
          },
          async resetTokens(ctx, identifier) {
            const pattern = [identifier, "*"].join(":");
            if (ctx.cache) {
              ctx.cache.pop(identifier);
            }
            await Promise.all(
              ctx.regionContexts.map((regionContext) => {
                safeEval(regionContext, RESET_SCRIPT, [pattern], [null]);
              })
            );
          }
        });
      }
    };
    var RegionRatelimit = class extends Ratelimit3 {
      /**
       * Create a new Ratelimit instance by providing a `@upstash/redis` instance and the algorithm of your choice.
       */
      constructor(config2) {
        super({
          prefix: config2.prefix,
          limiter: config2.limiter,
          timeout: config2.timeout,
          analytics: config2.analytics,
          ctx: {
            redis: config2.redis,
            prefix: config2.prefix ?? DEFAULT_PREFIX
          },
          ephemeralCache: config2.ephemeralCache,
          enableProtection: config2.enableProtection,
          denyListThreshold: config2.denyListThreshold,
          dynamicLimits: config2.dynamicLimits
        });
      }
      /**
       * Each request inside a fixed time increases a counter.
       * Once the counter reaches the maximum allowed number, all further requests are
       * rejected.
       *
       * **Pro:**
       *
       * - Newer requests are not starved by old ones.
       * - Low storage cost.
       *
       * **Con:**
       *
       * A burst of requests near the boundary of a window can result in a very
       * high request rate because two windows will be filled with requests quickly.
       *
       * @param tokens - How many requests a user can make in each time window.
       * @param window - A fixed timeframe
       */
      static fixedWindow(tokens, window) {
        const windowDuration = ms(window);
        return () => ({
          async limit(ctx, identifier, rate) {
            const bucket = Math.floor(Date.now() / windowDuration);
            const key = [identifier, bucket].join(":");
            const incrementBy = rate ?? 1;
            if (ctx.cache && incrementBy > 0) {
              const { blocked, reset: reset2 } = ctx.cache.isBlocked(identifier);
              if (blocked) {
                return {
                  success: false,
                  limit: tokens,
                  remaining: 0,
                  reset: reset2,
                  pending: Promise.resolve(),
                  reason: "cacheBlock"
                };
              }
            }
            const dynamicLimitKey = ctx.dynamicLimits ? `${ctx.prefix}${DYNAMIC_LIMIT_KEY_SUFFIX}` : "";
            const [usedTokensAfterUpdate, effectiveLimit] = await safeEval(
              ctx,
              SCRIPTS.singleRegion.fixedWindow.limit,
              [key, dynamicLimitKey],
              [tokens, windowDuration, incrementBy]
            );
            const success = usedTokensAfterUpdate <= effectiveLimit;
            const remainingTokens = Math.max(0, effectiveLimit - usedTokensAfterUpdate);
            const reset = (bucket + 1) * windowDuration;
            if (ctx.cache) {
              if (!success) {
                ctx.cache.blockUntil(identifier, reset);
              } else if (incrementBy < 0) {
                ctx.cache.pop(identifier);
              }
            }
            return {
              success,
              limit: effectiveLimit,
              remaining: remainingTokens,
              reset,
              pending: Promise.resolve()
            };
          },
          async getRemaining(ctx, identifier) {
            const bucket = Math.floor(Date.now() / windowDuration);
            const key = [identifier, bucket].join(":");
            const dynamicLimitKey = ctx.dynamicLimits ? `${ctx.prefix}${DYNAMIC_LIMIT_KEY_SUFFIX}` : "";
            const [remaining, effectiveLimit] = await safeEval(
              ctx,
              SCRIPTS.singleRegion.fixedWindow.getRemaining,
              [key, dynamicLimitKey],
              [tokens]
            );
            return {
              remaining: Math.max(0, remaining),
              reset: (bucket + 1) * windowDuration,
              limit: effectiveLimit
            };
          },
          async resetTokens(ctx, identifier) {
            const pattern = [identifier, "*"].join(":");
            if (ctx.cache) {
              ctx.cache.pop(identifier);
            }
            await safeEval(
              ctx,
              RESET_SCRIPT,
              [pattern],
              [null]
            );
          }
        });
      }
      /**
       * Combined approach of `slidingLogs` and `fixedWindow` with lower storage
       * costs than `slidingLogs` and improved boundary behavior by calculating a
       * weighted score between two windows.
       *
       * **Pro:**
       *
       * Good performance allows this to scale to very high loads.
       *
       * **Con:**
       *
       * Nothing major.
       *
       * @param tokens - How many requests a user can make in each time window.
       * @param window - The duration in which the user can max X requests.
       */
      static slidingWindow(tokens, window) {
        const windowSize = ms(window);
        return () => ({
          async limit(ctx, identifier, rate) {
            const now = Date.now();
            const currentWindow = Math.floor(now / windowSize);
            const currentKey = [identifier, currentWindow].join(":");
            const previousWindow = currentWindow - 1;
            const previousKey = [identifier, previousWindow].join(":");
            const incrementBy = rate ?? 1;
            if (ctx.cache && incrementBy > 0) {
              const { blocked, reset: reset2 } = ctx.cache.isBlocked(identifier);
              if (blocked) {
                return {
                  success: false,
                  limit: tokens,
                  remaining: 0,
                  reset: reset2,
                  pending: Promise.resolve(),
                  reason: "cacheBlock"
                };
              }
            }
            const dynamicLimitKey = ctx.dynamicLimits ? `${ctx.prefix}${DYNAMIC_LIMIT_KEY_SUFFIX}` : "";
            const [remainingTokens, effectiveLimit] = await safeEval(
              ctx,
              SCRIPTS.singleRegion.slidingWindow.limit,
              [currentKey, previousKey, dynamicLimitKey],
              [tokens, now, windowSize, incrementBy]
            );
            const success = remainingTokens >= 0;
            const reset = (currentWindow + 1) * windowSize;
            if (ctx.cache) {
              if (!success) {
                ctx.cache.blockUntil(identifier, reset);
              } else if (incrementBy < 0) {
                ctx.cache.pop(identifier);
              }
            }
            return {
              success,
              limit: effectiveLimit,
              remaining: Math.max(0, remainingTokens),
              reset,
              pending: Promise.resolve()
            };
          },
          async getRemaining(ctx, identifier) {
            const now = Date.now();
            const currentWindow = Math.floor(now / windowSize);
            const currentKey = [identifier, currentWindow].join(":");
            const previousWindow = currentWindow - 1;
            const previousKey = [identifier, previousWindow].join(":");
            const dynamicLimitKey = ctx.dynamicLimits ? `${ctx.prefix}${DYNAMIC_LIMIT_KEY_SUFFIX}` : "";
            const [remaining, effectiveLimit] = await safeEval(
              ctx,
              SCRIPTS.singleRegion.slidingWindow.getRemaining,
              [currentKey, previousKey, dynamicLimitKey],
              [tokens, now, windowSize]
            );
            return {
              remaining: Math.max(0, remaining),
              reset: (currentWindow + 1) * windowSize,
              limit: effectiveLimit
            };
          },
          async resetTokens(ctx, identifier) {
            const pattern = [identifier, "*"].join(":");
            if (ctx.cache) {
              ctx.cache.pop(identifier);
            }
            await safeEval(
              ctx,
              RESET_SCRIPT,
              [pattern],
              [null]
            );
          }
        });
      }
      /**
       * You have a bucket filled with `{maxTokens}` tokens that refills constantly
       * at `{refillRate}` per `{interval}`.
       * Every request will remove one token from the bucket and if there is no
       * token to take, the request is rejected.
       *
       * **Pro:**
       *
       * - Bursts of requests are smoothed out and you can process them at a constant
       * rate.
       * - Allows to set a higher initial burst limit by setting `maxTokens` higher
       * than `refillRate`
       */
      static tokenBucket(refillRate, interval, maxTokens) {
        const intervalDuration = ms(interval);
        return () => ({
          async limit(ctx, identifier, rate) {
            const now = Date.now();
            const incrementBy = rate ?? 1;
            if (ctx.cache && incrementBy > 0) {
              const { blocked, reset: reset2 } = ctx.cache.isBlocked(identifier);
              if (blocked) {
                return {
                  success: false,
                  limit: maxTokens,
                  remaining: 0,
                  reset: reset2,
                  pending: Promise.resolve(),
                  reason: "cacheBlock"
                };
              }
            }
            const dynamicLimitKey = ctx.dynamicLimits ? `${ctx.prefix}${DYNAMIC_LIMIT_KEY_SUFFIX}` : "";
            const [remaining, reset, effectiveLimit] = await safeEval(
              ctx,
              SCRIPTS.singleRegion.tokenBucket.limit,
              [identifier, dynamicLimitKey],
              [maxTokens, intervalDuration, refillRate, now, incrementBy]
            );
            const success = remaining >= 0;
            if (ctx.cache) {
              if (!success) {
                ctx.cache.blockUntil(identifier, reset);
              } else if (incrementBy < 0) {
                ctx.cache.pop(identifier);
              }
            }
            return {
              success,
              limit: effectiveLimit,
              remaining: Math.max(0, remaining),
              reset,
              pending: Promise.resolve()
            };
          },
          async getRemaining(ctx, identifier) {
            const dynamicLimitKey = ctx.dynamicLimits ? `${ctx.prefix}${DYNAMIC_LIMIT_KEY_SUFFIX}` : "";
            const [remainingTokens, refilledAt, effectiveLimit] = await safeEval(
              ctx,
              SCRIPTS.singleRegion.tokenBucket.getRemaining,
              [identifier, dynamicLimitKey],
              [maxTokens]
            );
            const freshRefillAt = Date.now() + intervalDuration;
            const identifierRefillsAt = refilledAt + intervalDuration;
            return {
              remaining: Math.max(0, remainingTokens),
              reset: refilledAt === tokenBucketIdentifierNotFound ? freshRefillAt : identifierRefillsAt,
              limit: effectiveLimit
            };
          },
          async resetTokens(ctx, identifier) {
            const pattern = identifier;
            if (ctx.cache) {
              ctx.cache.pop(identifier);
            }
            await safeEval(
              ctx,
              RESET_SCRIPT,
              [pattern],
              [null]
            );
          }
        });
      }
      /**
       * cachedFixedWindow first uses the local cache to decide if a request may pass and then updates
       * it asynchronously.
       * This is experimental and not yet recommended for production use.
       *
       * @experimental
       *
       * Each request inside a fixed time increases a counter.
       * Once the counter reaches the maximum allowed number, all further requests are
       * rejected.
       *
       * **Pro:**
       *
       * - Newer requests are not starved by old ones.
       * - Low storage cost.
       *
       * **Con:**
       *
       * A burst of requests near the boundary of a window can result in a very
       * high request rate because two windows will be filled with requests quickly.
       *
       * @param tokens - How many requests a user can make in each time window.
       * @param window - A fixed timeframe
       */
      static cachedFixedWindow(tokens, window) {
        const windowDuration = ms(window);
        return () => ({
          async limit(ctx, identifier, rate) {
            if (!ctx.cache) {
              throw new Error("This algorithm requires a cache");
            }
            if (ctx.dynamicLimits) {
              console.warn(
                "Warning: Dynamic limits are not yet supported for cachedFixedWindow algorithm. The dynamicLimits option will be ignored."
              );
            }
            const bucket = Math.floor(Date.now() / windowDuration);
            const key = [identifier, bucket].join(":");
            const reset = (bucket + 1) * windowDuration;
            const incrementBy = rate ?? 1;
            const hit = typeof ctx.cache.get(key) === "number";
            if (hit) {
              const cachedTokensAfterUpdate = ctx.cache.incr(key, incrementBy);
              const success = cachedTokensAfterUpdate < tokens;
              const pending = success ? safeEval(
                ctx,
                SCRIPTS.singleRegion.cachedFixedWindow.limit,
                [key],
                [windowDuration, incrementBy]
              ) : Promise.resolve();
              return {
                success,
                limit: tokens,
                remaining: tokens - cachedTokensAfterUpdate,
                reset,
                pending
              };
            }
            const usedTokensAfterUpdate = await safeEval(
              ctx,
              SCRIPTS.singleRegion.cachedFixedWindow.limit,
              [key],
              [windowDuration, incrementBy]
            );
            ctx.cache.set(key, usedTokensAfterUpdate);
            const remaining = tokens - usedTokensAfterUpdate;
            return {
              success: remaining >= 0,
              limit: tokens,
              remaining,
              reset,
              pending: Promise.resolve()
            };
          },
          async getRemaining(ctx, identifier) {
            if (!ctx.cache) {
              throw new Error("This algorithm requires a cache");
            }
            const bucket = Math.floor(Date.now() / windowDuration);
            const key = [identifier, bucket].join(":");
            const hit = typeof ctx.cache.get(key) === "number";
            if (hit) {
              const cachedUsedTokens = ctx.cache.get(key) ?? 0;
              return {
                remaining: Math.max(0, tokens - cachedUsedTokens),
                reset: (bucket + 1) * windowDuration,
                limit: tokens
              };
            }
            const usedTokens = await safeEval(
              ctx,
              SCRIPTS.singleRegion.cachedFixedWindow.getRemaining,
              [key],
              [null]
            );
            return {
              remaining: Math.max(0, tokens - usedTokens),
              reset: (bucket + 1) * windowDuration,
              limit: tokens
            };
          },
          async resetTokens(ctx, identifier) {
            if (!ctx.cache) {
              throw new Error("This algorithm requires a cache");
            }
            const bucket = Math.floor(Date.now() / windowDuration);
            const key = [identifier, bucket].join(":");
            ctx.cache.pop(key);
            const pattern = [identifier, "*"].join(":");
            await safeEval(
              ctx,
              RESET_SCRIPT,
              [pattern],
              [null]
            );
          }
        });
      }
    };
  }
});

// node_modules/jose/dist/webapi/lib/buffer_utils.js
var encoder = new TextEncoder();
var decoder = new TextDecoder();
var MAX_INT32 = 2 ** 32;
function concat(...buffers) {
  const size = buffers.reduce((acc, { length }) => acc + length, 0);
  const buf = new Uint8Array(size);
  let i = 0;
  for (const buffer of buffers) {
    buf.set(buffer, i);
    i += buffer.length;
  }
  return buf;
}
function encode(string) {
  const bytes = new Uint8Array(string.length);
  for (let i = 0; i < string.length; i++) {
    const code = string.charCodeAt(i);
    if (code > 127) {
      throw new TypeError("non-ASCII string encountered in encode()");
    }
    bytes[i] = code;
  }
  return bytes;
}

// node_modules/jose/dist/webapi/lib/base64.js
function decodeBase64(encoded) {
  if (Uint8Array.fromBase64) {
    return Uint8Array.fromBase64(encoded);
  }
  const binary = atob(encoded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// node_modules/jose/dist/webapi/util/base64url.js
function decode(input) {
  if (Uint8Array.fromBase64) {
    return Uint8Array.fromBase64(typeof input === "string" ? input : decoder.decode(input), {
      alphabet: "base64url"
    });
  }
  let encoded = input;
  if (encoded instanceof Uint8Array) {
    encoded = decoder.decode(encoded);
  }
  encoded = encoded.replace(/-/g, "+").replace(/_/g, "/");
  try {
    return decodeBase64(encoded);
  } catch {
    throw new TypeError("The input to be decoded is not correctly encoded.");
  }
}

// node_modules/jose/dist/webapi/lib/crypto_key.js
var unusable = (name, prop = "algorithm.name") => new TypeError(`CryptoKey does not support this operation, its ${prop} must be ${name}`);
var isAlgorithm = (algorithm, name) => algorithm.name === name;
function getHashLength(hash) {
  return parseInt(hash.name.slice(4), 10);
}
function checkHashLength(algorithm, expected) {
  const actual = getHashLength(algorithm.hash);
  if (actual !== expected)
    throw unusable(`SHA-${expected}`, "algorithm.hash");
}
function getNamedCurve(alg) {
  switch (alg) {
    case "ES256":
      return "P-256";
    case "ES384":
      return "P-384";
    case "ES512":
      return "P-521";
    default:
      throw new Error("unreachable");
  }
}
function checkUsage(key, usage) {
  if (usage && !key.usages.includes(usage)) {
    throw new TypeError(`CryptoKey does not support this operation, its usages must include ${usage}.`);
  }
}
function checkSigCryptoKey(key, alg, usage) {
  switch (alg) {
    case "HS256":
    case "HS384":
    case "HS512": {
      if (!isAlgorithm(key.algorithm, "HMAC"))
        throw unusable("HMAC");
      checkHashLength(key.algorithm, parseInt(alg.slice(2), 10));
      break;
    }
    case "RS256":
    case "RS384":
    case "RS512": {
      if (!isAlgorithm(key.algorithm, "RSASSA-PKCS1-v1_5"))
        throw unusable("RSASSA-PKCS1-v1_5");
      checkHashLength(key.algorithm, parseInt(alg.slice(2), 10));
      break;
    }
    case "PS256":
    case "PS384":
    case "PS512": {
      if (!isAlgorithm(key.algorithm, "RSA-PSS"))
        throw unusable("RSA-PSS");
      checkHashLength(key.algorithm, parseInt(alg.slice(2), 10));
      break;
    }
    case "Ed25519":
    case "EdDSA": {
      if (!isAlgorithm(key.algorithm, "Ed25519"))
        throw unusable("Ed25519");
      break;
    }
    case "ML-DSA-44":
    case "ML-DSA-65":
    case "ML-DSA-87": {
      if (!isAlgorithm(key.algorithm, alg))
        throw unusable(alg);
      break;
    }
    case "ES256":
    case "ES384":
    case "ES512": {
      if (!isAlgorithm(key.algorithm, "ECDSA"))
        throw unusable("ECDSA");
      const expected = getNamedCurve(alg);
      const actual = key.algorithm.namedCurve;
      if (actual !== expected)
        throw unusable(expected, "algorithm.namedCurve");
      break;
    }
    default:
      throw new TypeError("CryptoKey does not support this operation");
  }
  checkUsage(key, usage);
}

// node_modules/jose/dist/webapi/lib/invalid_key_input.js
function message(msg, actual, ...types) {
  types = types.filter(Boolean);
  if (types.length > 2) {
    const last = types.pop();
    msg += `one of type ${types.join(", ")}, or ${last}.`;
  } else if (types.length === 2) {
    msg += `one of type ${types[0]} or ${types[1]}.`;
  } else {
    msg += `of type ${types[0]}.`;
  }
  if (actual == null) {
    msg += ` Received ${actual}`;
  } else if (typeof actual === "function" && actual.name) {
    msg += ` Received function ${actual.name}`;
  } else if (typeof actual === "object" && actual != null) {
    if (actual.constructor?.name) {
      msg += ` Received an instance of ${actual.constructor.name}`;
    }
  }
  return msg;
}
var invalidKeyInput = (actual, ...types) => message("Key must be ", actual, ...types);
var withAlg = (alg, actual, ...types) => message(`Key for the ${alg} algorithm must be `, actual, ...types);

// node_modules/jose/dist/webapi/util/errors.js
var JOSEError = class extends Error {
  static code = "ERR_JOSE_GENERIC";
  code = "ERR_JOSE_GENERIC";
  constructor(message2, options) {
    super(message2, options);
    this.name = this.constructor.name;
    Error.captureStackTrace?.(this, this.constructor);
  }
};
var JWTClaimValidationFailed = class extends JOSEError {
  static code = "ERR_JWT_CLAIM_VALIDATION_FAILED";
  code = "ERR_JWT_CLAIM_VALIDATION_FAILED";
  claim;
  reason;
  payload;
  constructor(message2, payload, claim = "unspecified", reason = "unspecified") {
    super(message2, { cause: { claim, reason, payload } });
    this.claim = claim;
    this.reason = reason;
    this.payload = payload;
  }
};
var JWTExpired = class extends JOSEError {
  static code = "ERR_JWT_EXPIRED";
  code = "ERR_JWT_EXPIRED";
  claim;
  reason;
  payload;
  constructor(message2, payload, claim = "unspecified", reason = "unspecified") {
    super(message2, { cause: { claim, reason, payload } });
    this.claim = claim;
    this.reason = reason;
    this.payload = payload;
  }
};
var JOSEAlgNotAllowed = class extends JOSEError {
  static code = "ERR_JOSE_ALG_NOT_ALLOWED";
  code = "ERR_JOSE_ALG_NOT_ALLOWED";
};
var JOSENotSupported = class extends JOSEError {
  static code = "ERR_JOSE_NOT_SUPPORTED";
  code = "ERR_JOSE_NOT_SUPPORTED";
};
var JWSInvalid = class extends JOSEError {
  static code = "ERR_JWS_INVALID";
  code = "ERR_JWS_INVALID";
};
var JWTInvalid = class extends JOSEError {
  static code = "ERR_JWT_INVALID";
  code = "ERR_JWT_INVALID";
};
var JWKSInvalid = class extends JOSEError {
  static code = "ERR_JWKS_INVALID";
  code = "ERR_JWKS_INVALID";
};
var JWKSNoMatchingKey = class extends JOSEError {
  static code = "ERR_JWKS_NO_MATCHING_KEY";
  code = "ERR_JWKS_NO_MATCHING_KEY";
  constructor(message2 = "no applicable key found in the JSON Web Key Set", options) {
    super(message2, options);
  }
};
var JWKSMultipleMatchingKeys = class extends JOSEError {
  [Symbol.asyncIterator];
  static code = "ERR_JWKS_MULTIPLE_MATCHING_KEYS";
  code = "ERR_JWKS_MULTIPLE_MATCHING_KEYS";
  constructor(message2 = "multiple matching keys found in the JSON Web Key Set", options) {
    super(message2, options);
  }
};
var JWKSTimeout = class extends JOSEError {
  static code = "ERR_JWKS_TIMEOUT";
  code = "ERR_JWKS_TIMEOUT";
  constructor(message2 = "request timed out", options) {
    super(message2, options);
  }
};
var JWSSignatureVerificationFailed = class extends JOSEError {
  static code = "ERR_JWS_SIGNATURE_VERIFICATION_FAILED";
  code = "ERR_JWS_SIGNATURE_VERIFICATION_FAILED";
  constructor(message2 = "signature verification failed", options) {
    super(message2, options);
  }
};

// node_modules/jose/dist/webapi/lib/is_key_like.js
var isCryptoKey = (key) => {
  if (key?.[Symbol.toStringTag] === "CryptoKey")
    return true;
  try {
    return key instanceof CryptoKey;
  } catch {
    return false;
  }
};
var isKeyObject = (key) => key?.[Symbol.toStringTag] === "KeyObject";
var isKeyLike = (key) => isCryptoKey(key) || isKeyObject(key);

// node_modules/jose/dist/webapi/lib/helpers.js
function decodeBase64url(value, label, ErrorClass) {
  try {
    return decode(value);
  } catch {
    throw new ErrorClass(`Failed to base64url decode the ${label}`);
  }
}

// node_modules/jose/dist/webapi/lib/type_checks.js
var isObjectLike = (value) => typeof value === "object" && value !== null;
function isObject(input) {
  if (!isObjectLike(input) || Object.prototype.toString.call(input) !== "[object Object]") {
    return false;
  }
  if (Object.getPrototypeOf(input) === null) {
    return true;
  }
  let proto = input;
  while (Object.getPrototypeOf(proto) !== null) {
    proto = Object.getPrototypeOf(proto);
  }
  return Object.getPrototypeOf(input) === proto;
}
function isDisjoint(...headers) {
  const sources = headers.filter(Boolean);
  if (sources.length === 0 || sources.length === 1) {
    return true;
  }
  let acc;
  for (const header of sources) {
    const parameters = Object.keys(header);
    if (!acc || acc.size === 0) {
      acc = new Set(parameters);
      continue;
    }
    for (const parameter of parameters) {
      if (acc.has(parameter)) {
        return false;
      }
      acc.add(parameter);
    }
  }
  return true;
}
var isJWK = (key) => isObject(key) && typeof key.kty === "string";
var isPrivateJWK = (key) => key.kty !== "oct" && (key.kty === "AKP" && typeof key.priv === "string" || typeof key.d === "string");
var isPublicJWK = (key) => key.kty !== "oct" && key.d === void 0 && key.priv === void 0;
var isSecretJWK = (key) => key.kty === "oct" && typeof key.k === "string";

// node_modules/jose/dist/webapi/lib/signing.js
function checkKeyLength(alg, key) {
  if (alg.startsWith("RS") || alg.startsWith("PS")) {
    const { modulusLength } = key.algorithm;
    if (typeof modulusLength !== "number" || modulusLength < 2048) {
      throw new TypeError(`${alg} requires key modulusLength to be 2048 bits or larger`);
    }
  }
}
function subtleAlgorithm(alg, algorithm) {
  const hash = `SHA-${alg.slice(-3)}`;
  switch (alg) {
    case "HS256":
    case "HS384":
    case "HS512":
      return { hash, name: "HMAC" };
    case "PS256":
    case "PS384":
    case "PS512":
      return { hash, name: "RSA-PSS", saltLength: parseInt(alg.slice(-3), 10) >> 3 };
    case "RS256":
    case "RS384":
    case "RS512":
      return { hash, name: "RSASSA-PKCS1-v1_5" };
    case "ES256":
    case "ES384":
    case "ES512":
      return { hash, name: "ECDSA", namedCurve: algorithm.namedCurve };
    case "Ed25519":
    case "EdDSA":
      return { name: "Ed25519" };
    case "ML-DSA-44":
    case "ML-DSA-65":
    case "ML-DSA-87":
      return { name: alg };
    default:
      throw new JOSENotSupported(`alg ${alg} is not supported either by JOSE or your javascript runtime`);
  }
}
async function getSigKey(alg, key, usage) {
  if (key instanceof Uint8Array) {
    if (!alg.startsWith("HS")) {
      throw new TypeError(invalidKeyInput(key, "CryptoKey", "KeyObject", "JSON Web Key"));
    }
    return crypto.subtle.importKey("raw", key, { hash: `SHA-${alg.slice(-3)}`, name: "HMAC" }, false, [usage]);
  }
  checkSigCryptoKey(key, alg, usage);
  return key;
}
async function verify(alg, key, signature, data) {
  const cryptoKey = await getSigKey(alg, key, "verify");
  checkKeyLength(alg, cryptoKey);
  const algorithm = subtleAlgorithm(alg, cryptoKey.algorithm);
  try {
    return await crypto.subtle.verify(algorithm, cryptoKey, signature, data);
  } catch {
    return false;
  }
}

// node_modules/jose/dist/webapi/lib/jwk_to_key.js
var unsupportedAlg = 'Invalid or unsupported JWK "alg" (Algorithm) Parameter value';
function subtleMapping(jwk) {
  let algorithm;
  let keyUsages;
  switch (jwk.kty) {
    case "AKP": {
      switch (jwk.alg) {
        case "ML-DSA-44":
        case "ML-DSA-65":
        case "ML-DSA-87":
          algorithm = { name: jwk.alg };
          keyUsages = jwk.priv ? ["sign"] : ["verify"];
          break;
        default:
          throw new JOSENotSupported(unsupportedAlg);
      }
      break;
    }
    case "RSA": {
      switch (jwk.alg) {
        case "PS256":
        case "PS384":
        case "PS512":
          algorithm = { name: "RSA-PSS", hash: `SHA-${jwk.alg.slice(-3)}` };
          keyUsages = jwk.d ? ["sign"] : ["verify"];
          break;
        case "RS256":
        case "RS384":
        case "RS512":
          algorithm = { name: "RSASSA-PKCS1-v1_5", hash: `SHA-${jwk.alg.slice(-3)}` };
          keyUsages = jwk.d ? ["sign"] : ["verify"];
          break;
        case "RSA-OAEP":
        case "RSA-OAEP-256":
        case "RSA-OAEP-384":
        case "RSA-OAEP-512":
          algorithm = {
            name: "RSA-OAEP",
            hash: `SHA-${parseInt(jwk.alg.slice(-3), 10) || 1}`
          };
          keyUsages = jwk.d ? ["decrypt", "unwrapKey"] : ["encrypt", "wrapKey"];
          break;
        default:
          throw new JOSENotSupported(unsupportedAlg);
      }
      break;
    }
    case "EC": {
      switch (jwk.alg) {
        case "ES256":
        case "ES384":
        case "ES512":
          algorithm = {
            name: "ECDSA",
            namedCurve: { ES256: "P-256", ES384: "P-384", ES512: "P-521" }[jwk.alg]
          };
          keyUsages = jwk.d ? ["sign"] : ["verify"];
          break;
        case "ECDH-ES":
        case "ECDH-ES+A128KW":
        case "ECDH-ES+A192KW":
        case "ECDH-ES+A256KW":
          algorithm = { name: "ECDH", namedCurve: jwk.crv };
          keyUsages = jwk.d ? ["deriveBits"] : [];
          break;
        default:
          throw new JOSENotSupported(unsupportedAlg);
      }
      break;
    }
    case "OKP": {
      switch (jwk.alg) {
        case "Ed25519":
        case "EdDSA":
          algorithm = { name: "Ed25519" };
          keyUsages = jwk.d ? ["sign"] : ["verify"];
          break;
        case "ECDH-ES":
        case "ECDH-ES+A128KW":
        case "ECDH-ES+A192KW":
        case "ECDH-ES+A256KW":
          algorithm = { name: jwk.crv };
          keyUsages = jwk.d ? ["deriveBits"] : [];
          break;
        default:
          throw new JOSENotSupported(unsupportedAlg);
      }
      break;
    }
    default:
      throw new JOSENotSupported('Invalid or unsupported JWK "kty" (Key Type) Parameter value');
  }
  return { algorithm, keyUsages };
}
async function jwkToKey(jwk) {
  if (!jwk.alg) {
    throw new TypeError('"alg" argument is required when "jwk.alg" is not present');
  }
  const { algorithm, keyUsages } = subtleMapping(jwk);
  const keyData = { ...jwk };
  if (keyData.kty !== "AKP") {
    delete keyData.alg;
  }
  delete keyData.use;
  return crypto.subtle.importKey("jwk", keyData, algorithm, jwk.ext ?? (jwk.d || jwk.priv ? false : true), jwk.key_ops ?? keyUsages);
}

// node_modules/jose/dist/webapi/lib/normalize_key.js
var unusableForAlg = "given KeyObject instance cannot be used for this algorithm";
var cache;
var handleJWK = async (key, jwk, alg, freeze = false) => {
  cache ||= /* @__PURE__ */ new WeakMap();
  let cached = cache.get(key);
  if (cached?.[alg]) {
    return cached[alg];
  }
  const cryptoKey = await jwkToKey({ ...jwk, alg });
  if (freeze)
    Object.freeze(key);
  if (!cached) {
    cache.set(key, { [alg]: cryptoKey });
  } else {
    cached[alg] = cryptoKey;
  }
  return cryptoKey;
};
var handleKeyObject = (keyObject, alg) => {
  cache ||= /* @__PURE__ */ new WeakMap();
  let cached = cache.get(keyObject);
  if (cached?.[alg]) {
    return cached[alg];
  }
  const isPublic = keyObject.type === "public";
  const extractable = isPublic ? true : false;
  let cryptoKey;
  if (keyObject.asymmetricKeyType === "x25519") {
    switch (alg) {
      case "ECDH-ES":
      case "ECDH-ES+A128KW":
      case "ECDH-ES+A192KW":
      case "ECDH-ES+A256KW":
        break;
      default:
        throw new TypeError(unusableForAlg);
    }
    cryptoKey = keyObject.toCryptoKey(keyObject.asymmetricKeyType, extractable, isPublic ? [] : ["deriveBits"]);
  }
  if (keyObject.asymmetricKeyType === "ed25519") {
    if (alg !== "EdDSA" && alg !== "Ed25519") {
      throw new TypeError(unusableForAlg);
    }
    cryptoKey = keyObject.toCryptoKey(keyObject.asymmetricKeyType, extractable, [
      isPublic ? "verify" : "sign"
    ]);
  }
  switch (keyObject.asymmetricKeyType) {
    case "ml-dsa-44":
    case "ml-dsa-65":
    case "ml-dsa-87": {
      if (alg !== keyObject.asymmetricKeyType.toUpperCase()) {
        throw new TypeError(unusableForAlg);
      }
      cryptoKey = keyObject.toCryptoKey(keyObject.asymmetricKeyType, extractable, [
        isPublic ? "verify" : "sign"
      ]);
    }
  }
  if (keyObject.asymmetricKeyType === "rsa") {
    let hash;
    switch (alg) {
      case "RSA-OAEP":
        hash = "SHA-1";
        break;
      case "RS256":
      case "PS256":
      case "RSA-OAEP-256":
        hash = "SHA-256";
        break;
      case "RS384":
      case "PS384":
      case "RSA-OAEP-384":
        hash = "SHA-384";
        break;
      case "RS512":
      case "PS512":
      case "RSA-OAEP-512":
        hash = "SHA-512";
        break;
      default:
        throw new TypeError(unusableForAlg);
    }
    if (alg.startsWith("RSA-OAEP")) {
      return keyObject.toCryptoKey({
        name: "RSA-OAEP",
        hash
      }, extractable, isPublic ? ["encrypt"] : ["decrypt"]);
    }
    cryptoKey = keyObject.toCryptoKey({
      name: alg.startsWith("PS") ? "RSA-PSS" : "RSASSA-PKCS1-v1_5",
      hash
    }, extractable, [isPublic ? "verify" : "sign"]);
  }
  if (keyObject.asymmetricKeyType === "ec") {
    const nist = /* @__PURE__ */ new Map([
      ["prime256v1", "P-256"],
      ["secp384r1", "P-384"],
      ["secp521r1", "P-521"]
    ]);
    const namedCurve = nist.get(keyObject.asymmetricKeyDetails?.namedCurve);
    if (!namedCurve) {
      throw new TypeError(unusableForAlg);
    }
    const expectedCurve = { ES256: "P-256", ES384: "P-384", ES512: "P-521" };
    if (expectedCurve[alg] && namedCurve === expectedCurve[alg]) {
      cryptoKey = keyObject.toCryptoKey({
        name: "ECDSA",
        namedCurve
      }, extractable, [isPublic ? "verify" : "sign"]);
    }
    if (alg.startsWith("ECDH-ES")) {
      cryptoKey = keyObject.toCryptoKey({
        name: "ECDH",
        namedCurve
      }, extractable, isPublic ? [] : ["deriveBits"]);
    }
  }
  if (!cryptoKey) {
    throw new TypeError(unusableForAlg);
  }
  if (!cached) {
    cache.set(keyObject, { [alg]: cryptoKey });
  } else {
    cached[alg] = cryptoKey;
  }
  return cryptoKey;
};
async function normalizeKey(key, alg) {
  if (key instanceof Uint8Array) {
    return key;
  }
  if (isCryptoKey(key)) {
    return key;
  }
  if (isKeyObject(key)) {
    if (key.type === "secret") {
      return key.export();
    }
    if ("toCryptoKey" in key && typeof key.toCryptoKey === "function") {
      try {
        return handleKeyObject(key, alg);
      } catch (err) {
        if (err instanceof TypeError) {
          throw err;
        }
      }
    }
    let jwk = key.export({ format: "jwk" });
    return handleJWK(key, jwk, alg);
  }
  if (isJWK(key)) {
    if (key.k) {
      return decode(key.k);
    }
    return handleJWK(key, key, alg, true);
  }
  throw new Error("unreachable");
}

// node_modules/jose/dist/webapi/key/import.js
async function importJWK(jwk, alg, options) {
  if (!isObject(jwk)) {
    throw new TypeError("JWK must be an object");
  }
  let ext;
  alg ??= jwk.alg;
  ext ??= options?.extractable ?? jwk.ext;
  switch (jwk.kty) {
    case "oct":
      if (typeof jwk.k !== "string" || !jwk.k) {
        throw new TypeError('missing "k" (Key Value) Parameter value');
      }
      return decode(jwk.k);
    case "RSA":
      if ("oth" in jwk && jwk.oth !== void 0) {
        throw new JOSENotSupported('RSA JWK "oth" (Other Primes Info) Parameter value is not supported');
      }
      return jwkToKey({ ...jwk, alg, ext });
    case "AKP": {
      if (typeof jwk.alg !== "string" || !jwk.alg) {
        throw new TypeError('missing "alg" (Algorithm) Parameter value');
      }
      if (alg !== void 0 && alg !== jwk.alg) {
        throw new TypeError("JWK alg and alg option value mismatch");
      }
      return jwkToKey({ ...jwk, ext });
    }
    case "EC":
    case "OKP":
      return jwkToKey({ ...jwk, alg, ext });
    default:
      throw new JOSENotSupported('Unsupported "kty" (Key Type) Parameter value');
  }
}

// node_modules/jose/dist/webapi/lib/validate_crit.js
function validateCrit(Err, recognizedDefault, recognizedOption, protectedHeader, joseHeader) {
  if (joseHeader.crit !== void 0 && protectedHeader?.crit === void 0) {
    throw new Err('"crit" (Critical) Header Parameter MUST be integrity protected');
  }
  if (!protectedHeader || protectedHeader.crit === void 0) {
    return /* @__PURE__ */ new Set();
  }
  if (!Array.isArray(protectedHeader.crit) || protectedHeader.crit.length === 0 || protectedHeader.crit.some((input) => typeof input !== "string" || input.length === 0)) {
    throw new Err('"crit" (Critical) Header Parameter MUST be an array of non-empty strings when present');
  }
  let recognized;
  if (recognizedOption !== void 0) {
    recognized = new Map([...Object.entries(recognizedOption), ...recognizedDefault.entries()]);
  } else {
    recognized = recognizedDefault;
  }
  for (const parameter of protectedHeader.crit) {
    if (!recognized.has(parameter)) {
      throw new JOSENotSupported(`Extension Header Parameter "${parameter}" is not recognized`);
    }
    if (joseHeader[parameter] === void 0) {
      throw new Err(`Extension Header Parameter "${parameter}" is missing`);
    }
    if (recognized.get(parameter) && protectedHeader[parameter] === void 0) {
      throw new Err(`Extension Header Parameter "${parameter}" MUST be integrity protected`);
    }
  }
  return new Set(protectedHeader.crit);
}

// node_modules/jose/dist/webapi/lib/validate_algorithms.js
function validateAlgorithms(option, algorithms) {
  if (algorithms !== void 0 && (!Array.isArray(algorithms) || algorithms.some((s) => typeof s !== "string"))) {
    throw new TypeError(`"${option}" option must be an array of strings`);
  }
  if (!algorithms) {
    return void 0;
  }
  return new Set(algorithms);
}

// node_modules/jose/dist/webapi/lib/check_key_type.js
var tag = (key) => key?.[Symbol.toStringTag];
var jwkMatchesOp = (alg, key, usage) => {
  if (key.use !== void 0) {
    let expected;
    switch (usage) {
      case "sign":
      case "verify":
        expected = "sig";
        break;
      case "encrypt":
      case "decrypt":
        expected = "enc";
        break;
    }
    if (key.use !== expected) {
      throw new TypeError(`Invalid key for this operation, its "use" must be "${expected}" when present`);
    }
  }
  if (key.alg !== void 0 && key.alg !== alg) {
    throw new TypeError(`Invalid key for this operation, its "alg" must be "${alg}" when present`);
  }
  if (Array.isArray(key.key_ops)) {
    let expectedKeyOp;
    switch (true) {
      case (usage === "sign" || usage === "verify"):
      case alg === "dir":
      case alg.includes("CBC-HS"):
        expectedKeyOp = usage;
        break;
      case alg.startsWith("PBES2"):
        expectedKeyOp = "deriveBits";
        break;
      case /^A\d{3}(?:GCM)?(?:KW)?$/.test(alg):
        if (!alg.includes("GCM") && alg.endsWith("KW")) {
          expectedKeyOp = usage === "encrypt" ? "wrapKey" : "unwrapKey";
        } else {
          expectedKeyOp = usage;
        }
        break;
      case (usage === "encrypt" && alg.startsWith("RSA")):
        expectedKeyOp = "wrapKey";
        break;
      case usage === "decrypt":
        expectedKeyOp = alg.startsWith("RSA") ? "unwrapKey" : "deriveBits";
        break;
    }
    if (expectedKeyOp && key.key_ops?.includes?.(expectedKeyOp) === false) {
      throw new TypeError(`Invalid key for this operation, its "key_ops" must include "${expectedKeyOp}" when present`);
    }
  }
  return true;
};
var symmetricTypeCheck = (alg, key, usage) => {
  if (key instanceof Uint8Array)
    return;
  if (isJWK(key)) {
    if (isSecretJWK(key) && jwkMatchesOp(alg, key, usage))
      return;
    throw new TypeError(`JSON Web Key for symmetric algorithms must have JWK "kty" (Key Type) equal to "oct" and the JWK "k" (Key Value) present`);
  }
  if (!isKeyLike(key)) {
    throw new TypeError(withAlg(alg, key, "CryptoKey", "KeyObject", "JSON Web Key", "Uint8Array"));
  }
  if (key.type !== "secret") {
    throw new TypeError(`${tag(key)} instances for symmetric algorithms must be of type "secret"`);
  }
};
var asymmetricTypeCheck = (alg, key, usage) => {
  if (isJWK(key)) {
    switch (usage) {
      case "decrypt":
      case "sign":
        if (isPrivateJWK(key) && jwkMatchesOp(alg, key, usage))
          return;
        throw new TypeError(`JSON Web Key for this operation must be a private JWK`);
      case "encrypt":
      case "verify":
        if (isPublicJWK(key) && jwkMatchesOp(alg, key, usage))
          return;
        throw new TypeError(`JSON Web Key for this operation must be a public JWK`);
    }
  }
  if (!isKeyLike(key)) {
    throw new TypeError(withAlg(alg, key, "CryptoKey", "KeyObject", "JSON Web Key"));
  }
  if (key.type === "secret") {
    throw new TypeError(`${tag(key)} instances for asymmetric algorithms must not be of type "secret"`);
  }
  if (key.type === "public") {
    switch (usage) {
      case "sign":
        throw new TypeError(`${tag(key)} instances for asymmetric algorithm signing must be of type "private"`);
      case "decrypt":
        throw new TypeError(`${tag(key)} instances for asymmetric algorithm decryption must be of type "private"`);
    }
  }
  if (key.type === "private") {
    switch (usage) {
      case "verify":
        throw new TypeError(`${tag(key)} instances for asymmetric algorithm verifying must be of type "public"`);
      case "encrypt":
        throw new TypeError(`${tag(key)} instances for asymmetric algorithm encryption must be of type "public"`);
    }
  }
};
function checkKeyType(alg, key, usage) {
  switch (alg.substring(0, 2)) {
    case "A1":
    case "A2":
    case "di":
    case "HS":
    case "PB":
      symmetricTypeCheck(alg, key, usage);
      break;
    default:
      asymmetricTypeCheck(alg, key, usage);
  }
}

// node_modules/jose/dist/webapi/jws/flattened/verify.js
async function flattenedVerify(jws, key, options) {
  if (!isObject(jws)) {
    throw new JWSInvalid("Flattened JWS must be an object");
  }
  if (jws.protected === void 0 && jws.header === void 0) {
    throw new JWSInvalid('Flattened JWS must have either of the "protected" or "header" members');
  }
  if (jws.protected !== void 0 && typeof jws.protected !== "string") {
    throw new JWSInvalid("JWS Protected Header incorrect type");
  }
  if (jws.payload === void 0) {
    throw new JWSInvalid("JWS Payload missing");
  }
  if (typeof jws.signature !== "string") {
    throw new JWSInvalid("JWS Signature missing or incorrect type");
  }
  if (jws.header !== void 0 && !isObject(jws.header)) {
    throw new JWSInvalid("JWS Unprotected Header incorrect type");
  }
  let parsedProt = {};
  if (jws.protected) {
    try {
      const protectedHeader = decode(jws.protected);
      parsedProt = JSON.parse(decoder.decode(protectedHeader));
    } catch {
      throw new JWSInvalid("JWS Protected Header is invalid");
    }
  }
  if (!isDisjoint(parsedProt, jws.header)) {
    throw new JWSInvalid("JWS Protected and JWS Unprotected Header Parameter names must be disjoint");
  }
  const joseHeader = {
    ...parsedProt,
    ...jws.header
  };
  const extensions = validateCrit(JWSInvalid, /* @__PURE__ */ new Map([["b64", true]]), options?.crit, parsedProt, joseHeader);
  let b64 = true;
  if (extensions.has("b64")) {
    b64 = parsedProt.b64;
    if (typeof b64 !== "boolean") {
      throw new JWSInvalid('The "b64" (base64url-encode payload) Header Parameter must be a boolean');
    }
  }
  const { alg } = joseHeader;
  if (typeof alg !== "string" || !alg) {
    throw new JWSInvalid('JWS "alg" (Algorithm) Header Parameter missing or invalid');
  }
  const algorithms = options && validateAlgorithms("algorithms", options.algorithms);
  if (algorithms && !algorithms.has(alg)) {
    throw new JOSEAlgNotAllowed('"alg" (Algorithm) Header Parameter value not allowed');
  }
  if (b64) {
    if (typeof jws.payload !== "string") {
      throw new JWSInvalid("JWS Payload must be a string");
    }
  } else if (typeof jws.payload !== "string" && !(jws.payload instanceof Uint8Array)) {
    throw new JWSInvalid("JWS Payload must be a string or an Uint8Array instance");
  }
  let resolvedKey = false;
  if (typeof key === "function") {
    key = await key(parsedProt, jws);
    resolvedKey = true;
  }
  checkKeyType(alg, key, "verify");
  const data = concat(jws.protected !== void 0 ? encode(jws.protected) : new Uint8Array(), encode("."), typeof jws.payload === "string" ? b64 ? encode(jws.payload) : encoder.encode(jws.payload) : jws.payload);
  const signature = decodeBase64url(jws.signature, "signature", JWSInvalid);
  const k = await normalizeKey(key, alg);
  const verified = await verify(alg, k, signature, data);
  if (!verified) {
    throw new JWSSignatureVerificationFailed();
  }
  let payload;
  if (b64) {
    payload = decodeBase64url(jws.payload, "payload", JWSInvalid);
  } else if (typeof jws.payload === "string") {
    payload = encoder.encode(jws.payload);
  } else {
    payload = jws.payload;
  }
  const result = { payload };
  if (jws.protected !== void 0) {
    result.protectedHeader = parsedProt;
  }
  if (jws.header !== void 0) {
    result.unprotectedHeader = jws.header;
  }
  if (resolvedKey) {
    return { ...result, key: k };
  }
  return result;
}

// node_modules/jose/dist/webapi/jws/compact/verify.js
async function compactVerify(jws, key, options) {
  if (jws instanceof Uint8Array) {
    jws = decoder.decode(jws);
  }
  if (typeof jws !== "string") {
    throw new JWSInvalid("Compact JWS must be a string or Uint8Array");
  }
  const { 0: protectedHeader, 1: payload, 2: signature, length } = jws.split(".");
  if (length !== 3) {
    throw new JWSInvalid("Invalid Compact JWS");
  }
  const verified = await flattenedVerify({ payload, protected: protectedHeader, signature }, key, options);
  const result = { payload: verified.payload, protectedHeader: verified.protectedHeader };
  if (typeof key === "function") {
    return { ...result, key: verified.key };
  }
  return result;
}

// node_modules/jose/dist/webapi/lib/jwt_claims_set.js
var epoch = (date) => Math.floor(date.getTime() / 1e3);
var minute = 60;
var hour = minute * 60;
var day = hour * 24;
var week = day * 7;
var year = day * 365.25;
var REGEX = /^(\+|\-)? ?(\d+|\d+\.\d+) ?(seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)(?: (ago|from now))?$/i;
function secs(str) {
  const matched = REGEX.exec(str);
  if (!matched || matched[4] && matched[1]) {
    throw new TypeError("Invalid time period format");
  }
  const value = parseFloat(matched[2]);
  const unit = matched[3].toLowerCase();
  let numericDate;
  switch (unit) {
    case "sec":
    case "secs":
    case "second":
    case "seconds":
    case "s":
      numericDate = Math.round(value);
      break;
    case "minute":
    case "minutes":
    case "min":
    case "mins":
    case "m":
      numericDate = Math.round(value * minute);
      break;
    case "hour":
    case "hours":
    case "hr":
    case "hrs":
    case "h":
      numericDate = Math.round(value * hour);
      break;
    case "day":
    case "days":
    case "d":
      numericDate = Math.round(value * day);
      break;
    case "week":
    case "weeks":
    case "w":
      numericDate = Math.round(value * week);
      break;
    default:
      numericDate = Math.round(value * year);
      break;
  }
  if (matched[1] === "-" || matched[4] === "ago") {
    return -numericDate;
  }
  return numericDate;
}
var normalizeTyp = (value) => {
  if (value.includes("/")) {
    return value.toLowerCase();
  }
  return `application/${value.toLowerCase()}`;
};
var checkAudiencePresence = (audPayload, audOption) => {
  if (typeof audPayload === "string") {
    return audOption.includes(audPayload);
  }
  if (Array.isArray(audPayload)) {
    return audOption.some(Set.prototype.has.bind(new Set(audPayload)));
  }
  return false;
};
function validateClaimsSet(protectedHeader, encodedPayload, options = {}) {
  let payload;
  try {
    payload = JSON.parse(decoder.decode(encodedPayload));
  } catch {
  }
  if (!isObject(payload)) {
    throw new JWTInvalid("JWT Claims Set must be a top-level JSON object");
  }
  const { typ } = options;
  if (typ && (typeof protectedHeader.typ !== "string" || normalizeTyp(protectedHeader.typ) !== normalizeTyp(typ))) {
    throw new JWTClaimValidationFailed('unexpected "typ" JWT header value', payload, "typ", "check_failed");
  }
  const { requiredClaims = [], issuer, subject, audience, maxTokenAge } = options;
  const presenceCheck = [...requiredClaims];
  if (maxTokenAge !== void 0)
    presenceCheck.push("iat");
  if (audience !== void 0)
    presenceCheck.push("aud");
  if (subject !== void 0)
    presenceCheck.push("sub");
  if (issuer !== void 0)
    presenceCheck.push("iss");
  for (const claim of new Set(presenceCheck.reverse())) {
    if (!(claim in payload)) {
      throw new JWTClaimValidationFailed(`missing required "${claim}" claim`, payload, claim, "missing");
    }
  }
  if (issuer && !(Array.isArray(issuer) ? issuer : [issuer]).includes(payload.iss)) {
    throw new JWTClaimValidationFailed('unexpected "iss" claim value', payload, "iss", "check_failed");
  }
  if (subject && payload.sub !== subject) {
    throw new JWTClaimValidationFailed('unexpected "sub" claim value', payload, "sub", "check_failed");
  }
  if (audience && !checkAudiencePresence(payload.aud, typeof audience === "string" ? [audience] : audience)) {
    throw new JWTClaimValidationFailed('unexpected "aud" claim value', payload, "aud", "check_failed");
  }
  let tolerance;
  switch (typeof options.clockTolerance) {
    case "string":
      tolerance = secs(options.clockTolerance);
      break;
    case "number":
      tolerance = options.clockTolerance;
      break;
    case "undefined":
      tolerance = 0;
      break;
    default:
      throw new TypeError("Invalid clockTolerance option type");
  }
  const { currentDate } = options;
  const now = epoch(currentDate || /* @__PURE__ */ new Date());
  if ((payload.iat !== void 0 || maxTokenAge) && typeof payload.iat !== "number") {
    throw new JWTClaimValidationFailed('"iat" claim must be a number', payload, "iat", "invalid");
  }
  if (payload.nbf !== void 0) {
    if (typeof payload.nbf !== "number") {
      throw new JWTClaimValidationFailed('"nbf" claim must be a number', payload, "nbf", "invalid");
    }
    if (payload.nbf > now + tolerance) {
      throw new JWTClaimValidationFailed('"nbf" claim timestamp check failed', payload, "nbf", "check_failed");
    }
  }
  if (payload.exp !== void 0) {
    if (typeof payload.exp !== "number") {
      throw new JWTClaimValidationFailed('"exp" claim must be a number', payload, "exp", "invalid");
    }
    if (payload.exp <= now - tolerance) {
      throw new JWTExpired('"exp" claim timestamp check failed', payload, "exp", "check_failed");
    }
  }
  if (maxTokenAge) {
    const age = now - payload.iat;
    const max = typeof maxTokenAge === "number" ? maxTokenAge : secs(maxTokenAge);
    if (age - tolerance > max) {
      throw new JWTExpired('"iat" claim timestamp check failed (too far in the past)', payload, "iat", "check_failed");
    }
    if (age < 0 - tolerance) {
      throw new JWTClaimValidationFailed('"iat" claim timestamp check failed (it should be in the past)', payload, "iat", "check_failed");
    }
  }
  return payload;
}

// node_modules/jose/dist/webapi/jwt/verify.js
async function jwtVerify(jwt, key, options) {
  const verified = await compactVerify(jwt, key, options);
  if (verified.protectedHeader.crit?.includes("b64") && verified.protectedHeader.b64 === false) {
    throw new JWTInvalid("JWTs MUST NOT use unencoded payload");
  }
  const payload = validateClaimsSet(verified.protectedHeader, verified.payload, options);
  const result = { payload, protectedHeader: verified.protectedHeader };
  if (typeof key === "function") {
    return { ...result, key: verified.key };
  }
  return result;
}

// node_modules/jose/dist/webapi/jwks/local.js
function getKtyFromAlg(alg) {
  switch (typeof alg === "string" && alg.slice(0, 2)) {
    case "RS":
    case "PS":
      return "RSA";
    case "ES":
      return "EC";
    case "Ed":
      return "OKP";
    case "ML":
      return "AKP";
    default:
      throw new JOSENotSupported('Unsupported "alg" value for a JSON Web Key Set');
  }
}
function isJWKSLike(jwks) {
  return jwks && typeof jwks === "object" && Array.isArray(jwks.keys) && jwks.keys.every(isJWKLike);
}
function isJWKLike(key) {
  return isObject(key);
}
var LocalJWKSet = class {
  #jwks;
  #cached = /* @__PURE__ */ new WeakMap();
  constructor(jwks) {
    if (!isJWKSLike(jwks)) {
      throw new JWKSInvalid("JSON Web Key Set malformed");
    }
    this.#jwks = structuredClone(jwks);
  }
  jwks() {
    return this.#jwks;
  }
  async getKey(protectedHeader, token) {
    const { alg, kid } = { ...protectedHeader, ...token?.header };
    const kty = getKtyFromAlg(alg);
    const candidates = this.#jwks.keys.filter((jwk2) => {
      let candidate = kty === jwk2.kty;
      if (candidate && typeof kid === "string") {
        candidate = kid === jwk2.kid;
      }
      if (candidate && (typeof jwk2.alg === "string" || kty === "AKP")) {
        candidate = alg === jwk2.alg;
      }
      if (candidate && typeof jwk2.use === "string") {
        candidate = jwk2.use === "sig";
      }
      if (candidate && Array.isArray(jwk2.key_ops)) {
        candidate = jwk2.key_ops.includes("verify");
      }
      if (candidate) {
        switch (alg) {
          case "ES256":
            candidate = jwk2.crv === "P-256";
            break;
          case "ES384":
            candidate = jwk2.crv === "P-384";
            break;
          case "ES512":
            candidate = jwk2.crv === "P-521";
            break;
          case "Ed25519":
          case "EdDSA":
            candidate = jwk2.crv === "Ed25519";
            break;
        }
      }
      return candidate;
    });
    const { 0: jwk, length } = candidates;
    if (length === 0) {
      throw new JWKSNoMatchingKey();
    }
    if (length !== 1) {
      const error = new JWKSMultipleMatchingKeys();
      const _cached = this.#cached;
      error[Symbol.asyncIterator] = async function* () {
        for (const jwk2 of candidates) {
          try {
            yield await importWithAlgCache(_cached, jwk2, alg);
          } catch {
          }
        }
      };
      throw error;
    }
    return importWithAlgCache(this.#cached, jwk, alg);
  }
};
async function importWithAlgCache(cache2, jwk, alg) {
  const cached = cache2.get(jwk) || cache2.set(jwk, {}).get(jwk);
  if (cached[alg] === void 0) {
    const key = await importJWK({ ...jwk, ext: true }, alg);
    if (key instanceof Uint8Array || key.type !== "public") {
      throw new JWKSInvalid("JSON Web Key Set members must be public keys");
    }
    cached[alg] = key;
  }
  return cached[alg];
}
function createLocalJWKSet(jwks) {
  const set = new LocalJWKSet(jwks);
  const localJWKSet = async (protectedHeader, token) => set.getKey(protectedHeader, token);
  Object.defineProperties(localJWKSet, {
    jwks: {
      value: () => structuredClone(set.jwks()),
      enumerable: false,
      configurable: false,
      writable: false
    }
  });
  return localJWKSet;
}

// node_modules/jose/dist/webapi/jwks/remote.js
function isCloudflareWorkers() {
  return typeof WebSocketPair !== "undefined" || typeof navigator !== "undefined" && navigator.userAgent === "Cloudflare-Workers" || typeof EdgeRuntime !== "undefined" && EdgeRuntime === "vercel";
}
var USER_AGENT;
if (typeof navigator === "undefined" || !navigator.userAgent?.startsWith?.("Mozilla/5.0 ")) {
  const NAME = "jose";
  const VERSION2 = "v6.2.2";
  USER_AGENT = `${NAME}/${VERSION2}`;
}
var customFetch = /* @__PURE__ */ Symbol();
async function fetchJwks(url, headers, signal, fetchImpl = fetch) {
  const response = await fetchImpl(url, {
    method: "GET",
    signal,
    redirect: "manual",
    headers
  }).catch((err) => {
    if (err.name === "TimeoutError") {
      throw new JWKSTimeout();
    }
    throw err;
  });
  if (response.status !== 200) {
    throw new JOSEError("Expected 200 OK from the JSON Web Key Set HTTP response");
  }
  try {
    return await response.json();
  } catch {
    throw new JOSEError("Failed to parse the JSON Web Key Set HTTP response as JSON");
  }
}
var jwksCache = /* @__PURE__ */ Symbol();
function isFreshJwksCache(input, cacheMaxAge) {
  if (typeof input !== "object" || input === null) {
    return false;
  }
  if (!("uat" in input) || typeof input.uat !== "number" || Date.now() - input.uat >= cacheMaxAge) {
    return false;
  }
  if (!("jwks" in input) || !isObject(input.jwks) || !Array.isArray(input.jwks.keys) || !Array.prototype.every.call(input.jwks.keys, isObject)) {
    return false;
  }
  return true;
}
var RemoteJWKSet = class {
  #url;
  #timeoutDuration;
  #cooldownDuration;
  #cacheMaxAge;
  #jwksTimestamp;
  #pendingFetch;
  #headers;
  #customFetch;
  #local;
  #cache;
  constructor(url, options) {
    if (!(url instanceof URL)) {
      throw new TypeError("url must be an instance of URL");
    }
    this.#url = new URL(url.href);
    this.#timeoutDuration = typeof options?.timeoutDuration === "number" ? options?.timeoutDuration : 5e3;
    this.#cooldownDuration = typeof options?.cooldownDuration === "number" ? options?.cooldownDuration : 3e4;
    this.#cacheMaxAge = typeof options?.cacheMaxAge === "number" ? options?.cacheMaxAge : 6e5;
    this.#headers = new Headers(options?.headers);
    if (USER_AGENT && !this.#headers.has("User-Agent")) {
      this.#headers.set("User-Agent", USER_AGENT);
    }
    if (!this.#headers.has("accept")) {
      this.#headers.set("accept", "application/json");
      this.#headers.append("accept", "application/jwk-set+json");
    }
    this.#customFetch = options?.[customFetch];
    if (options?.[jwksCache] !== void 0) {
      this.#cache = options?.[jwksCache];
      if (isFreshJwksCache(options?.[jwksCache], this.#cacheMaxAge)) {
        this.#jwksTimestamp = this.#cache.uat;
        this.#local = createLocalJWKSet(this.#cache.jwks);
      }
    }
  }
  pendingFetch() {
    return !!this.#pendingFetch;
  }
  coolingDown() {
    return typeof this.#jwksTimestamp === "number" ? Date.now() < this.#jwksTimestamp + this.#cooldownDuration : false;
  }
  fresh() {
    return typeof this.#jwksTimestamp === "number" ? Date.now() < this.#jwksTimestamp + this.#cacheMaxAge : false;
  }
  jwks() {
    return this.#local?.jwks();
  }
  async getKey(protectedHeader, token) {
    if (!this.#local || !this.fresh()) {
      await this.reload();
    }
    try {
      return await this.#local(protectedHeader, token);
    } catch (err) {
      if (err instanceof JWKSNoMatchingKey) {
        if (this.coolingDown() === false) {
          await this.reload();
          return this.#local(protectedHeader, token);
        }
      }
      throw err;
    }
  }
  async reload() {
    if (this.#pendingFetch && isCloudflareWorkers()) {
      this.#pendingFetch = void 0;
    }
    this.#pendingFetch ||= fetchJwks(this.#url.href, this.#headers, AbortSignal.timeout(this.#timeoutDuration), this.#customFetch).then((json) => {
      this.#local = createLocalJWKSet(json);
      if (this.#cache) {
        this.#cache.uat = Date.now();
        this.#cache.jwks = json;
      }
      this.#jwksTimestamp = Date.now();
      this.#pendingFetch = void 0;
    }).catch((err) => {
      this.#pendingFetch = void 0;
      throw err;
    });
    await this.#pendingFetch;
  }
};
function createRemoteJWKSet(url, options) {
  const set = new RemoteJWKSet(url, options);
  const remoteJWKSet = async (protectedHeader, token) => set.getKey(protectedHeader, token);
  Object.defineProperties(remoteJWKSet, {
    coolingDown: {
      get: () => set.coolingDown(),
      enumerable: true,
      configurable: false
    },
    fresh: {
      get: () => set.fresh(),
      enumerable: true,
      configurable: false
    },
    reload: {
      value: () => set.reload(),
      enumerable: true,
      configurable: false,
      writable: false
    },
    reloading: {
      get: () => set.pendingFetch(),
      enumerable: true,
      configurable: false
    },
    jwks: {
      value: () => set.jwks(),
      enumerable: true,
      configurable: false,
      writable: false
    }
  });
  return remoteJWKSet;
}

// server/auth-session.ts
var CLERK_JWT_ISSUER_DOMAIN = process.env.CLERK_JWT_ISSUER_DOMAIN ?? "";
var CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY ?? "";
var _jwks = null;
function getJWKS() {
  if (!_jwks) {
    const issuerDomain = process.env.CLERK_JWT_ISSUER_DOMAIN;
    if (issuerDomain) {
      const jwksUrl = new URL("/.well-known/jwks.json", issuerDomain);
      _jwks = createRemoteJWKSet(jwksUrl);
    }
  }
  return _jwks;
}
function getAllowedAudiences() {
  const configured = [
    process.env.CLERK_JWT_AUDIENCE,
    process.env.CLERK_PUBLISHABLE_KEY
  ].flatMap((value) => (value ?? "").split(",")).map((value) => value.trim()).filter(Boolean);
  return Array.from(/* @__PURE__ */ new Set(["convex", ...configured]));
}
function getClerkJwtVerifyOptions() {
  return {
    issuer: CLERK_JWT_ISSUER_DOMAIN,
    audience: getAllowedAudiences(),
    algorithms: ["RS256"]
  };
}
function extractOrgId(payload) {
  const orgClaim = payload.org;
  return (typeof orgClaim?.id === "string" ? orgClaim.id : null) ?? (typeof payload.org_id === "string" ? payload.org_id : null);
}
var _planCache = /* @__PURE__ */ new Map();
var PLAN_CACHE_TTL_MS = 5 * 60 * 1e3;
async function lookupPlanFromClerk(userId) {
  const cached = _planCache.get(userId);
  if (cached && Date.now() < cached.expiresAt) return cached.role;
  if (!CLERK_SECRET_KEY) return "free";
  try {
    const resp = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
      headers: { Authorization: `Bearer ${CLERK_SECRET_KEY}` }
    });
    if (!resp.ok) return "free";
    const user = await resp.json();
    const role = user.public_metadata?.plan === "pro" ? "pro" : "free";
    _planCache.set(userId, { role, expiresAt: Date.now() + PLAN_CACHE_TTL_MS });
    return role;
  } catch {
    return "free";
  }
}
async function validateBearerToken(token) {
  const jwks = getJWKS();
  if (!jwks) return { valid: false };
  try {
    let payload;
    try {
      ({ payload } = await jwtVerify(token, jwks, getClerkJwtVerifyOptions()));
    } catch (audErr) {
      if (audErr.message?.includes('missing required "aud"')) {
        ({ payload } = await jwtVerify(token, jwks, {
          issuer: CLERK_JWT_ISSUER_DOMAIN,
          algorithms: ["RS256"]
        }));
      } else {
        throw audErr;
      }
    }
    const userId = payload.sub;
    if (!userId) return { valid: false };
    const rawPlan = payload.plan;
    const role = rawPlan !== void 0 ? rawPlan === "pro" ? "pro" : "free" : await lookupPlanFromClerk(userId);
    const email = typeof payload.email === "string" ? payload.email : void 0;
    const givenName = typeof payload.given_name === "string" ? payload.given_name : void 0;
    const familyName = typeof payload.family_name === "string" ? payload.family_name : void 0;
    const name = [givenName, familyName].filter(Boolean).join(" ") || void 0;
    const orgId = extractOrgId(payload);
    return { valid: true, userId, orgId, role, email, name };
  } catch {
    return { valid: false };
  }
}

// server/_shared/auth-session.ts
async function resolveClerkSession(request) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return null;
    const session = await validateBearerToken(authHeader.slice(7));
    if (!session.valid || !session.userId) return null;
    return {
      userId: session.userId,
      orgId: session.orgId ?? null,
      role: session.role ?? "free"
    };
  } catch (err) {
    console.warn(
      "[auth-session] JWT verification failed:",
      err instanceof Error ? err.message : String(err)
    );
    return null;
  }
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
var CB_WINDOW_MS = 5 * 60 * 1e3;

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
async function setCachedJson(key, value, ttlSeconds, raw = false) {
  if (process.env.LOCAL_API_MODE === "tauri-sidecar") {
    const { sidecarCacheSet: sidecarCacheSet2 } = await Promise.resolve().then(() => (init_sidecar_cache(), sidecar_cache_exports));
    sidecarCacheSet2(key, value, ttlSeconds);
    return true;
  }
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return false;
  try {
    const finalKey = raw ? key : prefixKey(key);
    const resp = await fetch(`${url}/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(["SET", finalKey, JSON.stringify(value), "EX", String(ttlSeconds)]),
      signal: AbortSignal.timeout(REDIS_PIPELINE_TIMEOUT_MS)
    });
    const data = await resp.json().catch(() => null);
    if (!resp.ok || data?.error) {
      console.warn(`[redis] setCachedJson failed:`, data?.error ?? `HTTP ${resp.status}`);
      return false;
    }
    return true;
  } catch (err) {
    console.warn("[redis] setCachedJson failed:", errMsg(err));
    return false;
  }
}

// server/_shared/entitlement-check.ts
var CONVEX_INTERNAL_ENTITLEMENTS_PATH = "/api/internal-entitlements";
var _didWarnMissingConvexSharedSecret = false;
function getConvexSharedSecret() {
  const secret = process.env.CONVEX_SERVER_SHARED_SECRET ?? "";
  if (!secret && !_didWarnMissingConvexSharedSecret) {
    _didWarnMissingConvexSharedSecret = true;
    console.warn("[entitlement-check] CONVEX_SERVER_SHARED_SECRET not set; Convex fallback disabled");
  }
  return secret;
}
var _inFlight = /* @__PURE__ */ new Map();
var ENV_PREFIX = process.env.DODO_PAYMENTS_ENVIRONMENT === "live_mode" ? "live" : "test";
var ENTITLEMENT_CACHE_TTL_SECONDS = 900;
async function getEntitlements(userId) {
  const existing = _inFlight.get(userId);
  if (existing) return existing;
  const promise = _getEntitlementsImpl(userId);
  _inFlight.set(userId, promise);
  try {
    return await promise;
  } finally {
    _inFlight.delete(userId);
  }
}
async function _getEntitlementsImpl(userId) {
  try {
    const cached = await getCachedJson(`entitlements:${ENV_PREFIX}:${userId}`, true);
    if (cached && typeof cached === "object") {
      const ent = cached;
      if (ent.validUntil >= Date.now() && typeof ent.features.mcpAccess === "boolean") {
        return ent;
      }
    }
    const convexSiteUrl = process.env.CONVEX_SITE_URL;
    const convexSharedSecret = getConvexSharedSecret();
    if (!convexSiteUrl || !convexSharedSecret) return null;
    const response = await fetch(`${convexSiteUrl}${CONVEX_INTERNAL_ENTITLEMENTS_PATH}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "worldmonitor-gateway/1.0",
        "x-convex-shared-secret": convexSharedSecret
      },
      body: JSON.stringify({ userId }),
      signal: AbortSignal.timeout(3e3)
    });
    if (!response.ok) return null;
    const result = await response.json();
    if (result) {
      try {
        await setCachedJson(`entitlements:${ENV_PREFIX}:${userId}`, result, ENTITLEMENT_CACHE_TTL_SECONDS, true);
      } catch (cacheErr) {
        console.warn("[entitlement-check] cache write failed (non-fatal):", cacheErr instanceof Error ? cacheErr.message : String(cacheErr));
      }
      return result;
    }
    return null;
  } catch (err) {
    console.warn("[entitlement-check] getEntitlements failed:", err instanceof Error ? err.message : String(err));
    return null;
  }
}

// api/_cors.js
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

// api/_rate-limit.js
var import_ratelimit = __toESM(require_dist2(), 1);

// node_modules/@upstash/redis/chunk-IH7W44G6.mjs
var __defProp2 = Object.defineProperty;
var __export2 = (target, all) => {
  for (var name in all)
    __defProp2(target, name, { get: all[name], enumerable: true });
};
var error_exports = {};
__export2(error_exports, {
  UpstashError: () => UpstashError,
  UpstashJSONParseError: () => UpstashJSONParseError,
  UrlError: () => UrlError
});
var UpstashError = class extends Error {
  constructor(message2, options) {
    super(message2, options);
    this.name = "UpstashError";
  }
};
var UrlError = class extends Error {
  constructor(url) {
    super(
      `Upstash Redis client was passed an invalid URL. You should pass a URL starting with https. Received: "${url}". `
    );
    this.name = "UrlError";
  }
};
var UpstashJSONParseError = class extends UpstashError {
  constructor(body, options) {
    const truncatedBody = body.length > 200 ? body.slice(0, 200) + "..." : body;
    super(`Unable to parse response body: ${truncatedBody}`, options);
    this.name = "UpstashJSONParseError";
  }
};
var MAX_BUFFER_SIZE = 1024 * 1024;

// node_modules/@upstash/redis/nodejs.mjs
var BUILD = /* @__PURE__ */ Symbol("build");
var TextFieldBuilder = class _TextFieldBuilder {
  _noTokenize;
  _noStem;
  _from;
  constructor(noTokenize = { noTokenize: false }, noStem = { noStem: false }, from = { from: null }) {
    this._noTokenize = noTokenize;
    this._noStem = noStem;
    this._from = from;
  }
  noTokenize() {
    return new _TextFieldBuilder({ noTokenize: true }, this._noStem, this._from);
  }
  noStem() {
    return new _TextFieldBuilder(this._noTokenize, { noStem: true }, this._from);
  }
  from(field) {
    return new _TextFieldBuilder(this._noTokenize, this._noStem, { from: field });
  }
  [BUILD]() {
    return {
      type: "TEXT",
      ...this._noTokenize.noTokenize ? { noTokenize: true } : {},
      ...this._noStem.noStem ? { noStem: true } : {},
      ...this._from.from ? { from: this._from.from } : {}
    };
  }
};
var NumericFieldBuilder = class _NumericFieldBuilder {
  type;
  _from;
  constructor(type, from = { from: null }) {
    this.type = type;
    this._from = from;
  }
  from(field) {
    return new _NumericFieldBuilder(this.type, { from: field });
  }
  [BUILD]() {
    return this._from.from ? {
      type: this.type,
      fast: true,
      from: this._from.from
    } : {
      type: this.type,
      fast: true
    };
  }
};
var BoolFieldBuilder = class _BoolFieldBuilder {
  _fast;
  _from;
  constructor(fast = { fast: false }, from = { from: null }) {
    this._fast = fast;
    this._from = from;
  }
  fast() {
    return new _BoolFieldBuilder({ fast: true }, this._from);
  }
  from(field) {
    return new _BoolFieldBuilder(this._fast, { from: field });
  }
  [BUILD]() {
    const hasFast = this._fast.fast;
    const hasFrom = Boolean(this._from.from);
    if (hasFast && hasFrom) {
      return {
        type: "BOOL",
        fast: true,
        from: this._from.from
      };
    }
    if (hasFast) {
      return {
        type: "BOOL",
        fast: true
      };
    }
    if (hasFrom) {
      return {
        type: "BOOL",
        from: this._from.from
      };
    }
    return { type: "BOOL" };
  }
};
var DateFieldBuilder = class _DateFieldBuilder {
  _fast;
  _from;
  constructor(fast = { fast: false }, from = { from: null }) {
    this._fast = fast;
    this._from = from;
  }
  fast() {
    return new _DateFieldBuilder({ fast: true }, this._from);
  }
  from(field) {
    return new _DateFieldBuilder(this._fast, { from: field });
  }
  [BUILD]() {
    const hasFast = this._fast.fast;
    const hasFrom = Boolean(this._from.from);
    if (hasFast && hasFrom) {
      return {
        type: "DATE",
        fast: true,
        from: this._from.from
      };
    }
    if (hasFast) {
      return {
        type: "DATE",
        fast: true
      };
    }
    if (hasFrom) {
      return {
        type: "DATE",
        from: this._from.from
      };
    }
    return { type: "DATE" };
  }
};
var KeywordFieldBuilder = class {
  [BUILD]() {
    return { type: "KEYWORD" };
  }
};
var FacetFieldBuilder = class {
  [BUILD]() {
    return { type: "FACET" };
  }
};
if (typeof atob === "undefined") {
  global.atob = (b64) => Buffer.from(b64, "base64").toString("utf8");
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

// api/_client-ip.js
var RATE_LIMIT_DEGRADED_HEADERS = Object.freeze({
  "X-RateLimit-Mode": "degraded",
  "Retry-After": "5"
});

// api/_rate-limit.js
var REDIS_TEST_RETRY_OPTS = process.env.NODE_TEST_CONTEXT ? { retry: false } : {};

// api/oauth/register.js
var import_ratelimit2 = __toESM(require_dist2(), 1);
var CLIENT_TTL_SECONDS = 90 * 24 * 3600;
var ALLOWED_REDIRECT_PREFIXES = [
  "https://claude.ai/api/mcp/auth_callback",
  "https://claude.com/api/mcp/auth_callback"
];
function isAllowedRedirectUri(uri) {
  if (ALLOWED_REDIRECT_PREFIXES.includes(uri)) return true;
  try {
    const u = new URL(uri);
    return (u.hostname === "localhost" || u.hostname === "127.0.0.1") && u.protocol === "http:";
  } catch {
    return false;
  }
}

// api/_mcp-grant-hmac.ts
var ENC = new TextEncoder();
var DEC = new TextDecoder();
var GrantConfigError = class extends Error {
  constructor(message2) {
    super(message2);
    this.name = "GrantConfigError";
  }
};
function base64UrlEncode(bytes) {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
async function importHmacKey(secret) {
  return crypto.subtle.importKey(
    "raw",
    ENC.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}
function readGrantSecret(env = process.env) {
  const secret = env.MCP_PRO_GRANT_HMAC_SECRET ?? "";
  if (!secret) {
    try {
      const mcpKeys = Object.keys(env).filter((k) => k.startsWith("MCP_")).sort();
      console.warn(
        `[mcp-grant-hmac] DIAGNOSTIC missing-secret: process.env MCP_* keys = ${mcpKeys.length === 0 ? "<NONE>" : mcpKeys.join(", ")}`
      );
    } catch {
    }
    throw new GrantConfigError("MCP_PRO_GRANT_HMAC_SECRET is not set");
  }
  return secret;
}
async function signGrant(payload, secret) {
  const sec = secret ?? readGrantSecret();
  const json = JSON.stringify({ userId: payload.userId, nonce: payload.nonce, exp: payload.exp });
  const payloadBytes = ENC.encode(json);
  const key = await importHmacKey(sec);
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, payloadBytes));
  return `${base64UrlEncode(payloadBytes)}.${base64UrlEncode(sig)}`;
}

// api/internal/mcp-grant-mint.ts
var config = { runtime: "edge" };
var AUTHORIZE_PRO_URL = "https://api.worldmonitor.app/oauth/authorize-pro";
var GRANT_TTL_MS = 5 * 60 * 1e3;
var GRANT_TTL_SECONDS = 300;
var NO_STORE_JSON = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store"
};
function jsonError(error, error_description, status) {
  return new Response(JSON.stringify({ error, error_description }), { status, headers: NO_STORE_JSON });
}
async function rawRedisGet(key) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) throw new Error("Redis not configured");
  const resp = await fetch(`${url}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(3e3)
  });
  if (!resp.ok) throw new Error(`Redis HTTP ${resp.status}`);
  const data = await resp.json();
  if (!data?.result) return null;
  try {
    return JSON.parse(data.result);
  } catch {
    return null;
  }
}
async function rawRedisSetEx(key, value, ttlSeconds) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return false;
  try {
    const resp = await fetch(`${url}/pipeline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify([["SET", key, JSON.stringify(value), "EX", ttlSeconds]]),
      signal: AbortSignal.timeout(3e3)
    });
    if (!resp.ok) return false;
    const results = await resp.json().catch(() => null);
    return Array.isArray(results) && results[0]?.result === "OK";
  } catch {
    return false;
  }
}
async function rawRedisSetNxEx(key, value, ttlSeconds) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return false;
  try {
    const resp = await fetch(`${url}/pipeline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify([["SET", key, JSON.stringify(value), "EX", ttlSeconds, "NX"]]),
      signal: AbortSignal.timeout(3e3)
    });
    if (!resp.ok) return false;
    const results = await resp.json().catch(() => null);
    return Array.isArray(results) && results[0]?.result === "OK";
  } catch {
    return false;
  }
}
async function mintGrantHandler(req, deps) {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "METHOD_NOT_ALLOWED" }), {
      status: 405,
      headers: { ...NO_STORE_JSON, Allow: "POST" }
    });
  }
  const userId = await deps.resolveUserId(req);
  if (!userId) {
    return jsonError("UNAUTHENTICATED", "A valid Clerk session is required.", 401);
  }
  let body;
  try {
    body = await req.json();
  } catch {
    return jsonError("INVALID_REQUEST", "Request body must be JSON.", 400);
  }
  const nonce = body?.nonce;
  if (typeof nonce !== "string" || nonce.length === 0) {
    return jsonError("INVALID_REQUEST", "Missing or empty `nonce`.", 400);
  }
  let nonceData;
  try {
    nonceData = await deps.redisGet(`oauth:nonce:${nonce}`);
  } catch {
    return jsonError("SERVICE_UNAVAILABLE", "Authorization storage is temporarily unavailable.", 503);
  }
  if (!nonceData || typeof nonceData.client_id !== "string" || typeof nonceData.redirect_uri !== "string") {
    return jsonError("INVALID_NONCE", "The authorization nonce is missing or expired.", 400);
  }
  let clientData;
  try {
    clientData = await deps.redisGet(`oauth:client:${nonceData.client_id}`);
  } catch {
    return jsonError("SERVICE_UNAVAILABLE", "Authorization storage is temporarily unavailable.", 503);
  }
  if (!clientData) {
    return jsonError("UNKNOWN_CLIENT", "The OAuth client is not registered.", 400);
  }
  const uris = Array.isArray(clientData.redirect_uris) ? clientData.redirect_uris : [];
  if (!uris.includes(nonceData.redirect_uri) || !deps.isAllowedRedirectUri(nonceData.redirect_uri)) {
    return jsonError("INVALID_REDIRECT_URI", "The redirect URI is no longer permitted.", 400);
  }
  const ent = await deps.getEntitlements(userId);
  const now = deps.now();
  if (!ent || ent.features.tier < 1 || ent.features.mcpAccess !== true || ent.validUntil < now) {
    return jsonError("INSUFFICIENT_TIER", "A WorldMonitor Pro subscription is required.", 403);
  }
  const exp = now + GRANT_TTL_MS;
  let grantToken;
  try {
    grantToken = await deps.signGrant({ userId, nonce, exp });
  } catch (err) {
    if (err instanceof GrantConfigError) {
      console.warn("[mcp-grant-mint] missing MCP_PRO_GRANT_HMAC_SECRET");
      return jsonError("CONFIGURATION_ERROR", "Pro MCP authorization is misconfigured.", 500);
    }
    throw err;
  }
  const grantKey = `mcp-grant:${nonce}`;
  const claim = { userId, exp };
  const claimed = await deps.redisSetNxEx(grantKey, claim, GRANT_TTL_SECONDS);
  if (!claimed) {
    let existing;
    try {
      existing = await deps.redisGet(grantKey);
    } catch {
      return jsonError("SERVICE_UNAVAILABLE", "Could not persist the authorization grant.", 503);
    }
    if (!existing || typeof existing.userId !== "string" || typeof existing.exp !== "number") {
      return jsonError("SERVICE_UNAVAILABLE", "Could not persist the authorization grant.", 503);
    }
    if (existing.userId !== userId) {
      return jsonError(
        "NONCE_CLAIMED_BY_OTHER_USER",
        "This authorization request has already been claimed by another account.",
        403
      );
    }
    try {
      grantToken = await deps.signGrant({
        userId,
        nonce,
        exp: existing.exp
      });
    } catch (err) {
      if (err instanceof GrantConfigError) {
        console.warn("[mcp-grant-mint] missing MCP_PRO_GRANT_HMAC_SECRET on idempotent re-sign");
        return jsonError("CONFIGURATION_ERROR", "Pro MCP authorization is misconfigured.", 500);
      }
      throw err;
    }
  }
  const redirect = `${AUTHORIZE_PRO_URL}?nonce=${encodeURIComponent(nonce)}&grant=${encodeURIComponent(grantToken)}`;
  return new Response(JSON.stringify({ redirect }), { status: 200, headers: NO_STORE_JSON });
}
async function handler(req) {
  return mintGrantHandler(req, {
    resolveUserId: async (r) => (await resolveClerkSession(r))?.userId ?? null,
    redisGet: rawRedisGet,
    redisSetEx: rawRedisSetEx,
    redisSetNxEx: rawRedisSetNxEx,
    getEntitlements: (userId) => getEntitlements(userId),
    isAllowedRedirectUri,
    signGrant: (payload) => signGrant(payload),
    now: () => Date.now()
  });
}
export {
  config,
  handler as default,
  mintGrantHandler
};
