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
        let [, i, s] = e.match(t), n2 = parseInt(i);
        switch (s) {
          case "s":
            return n2 * 1e3;
          case "m":
            return n2 * 1e3 * 60;
          case "h":
            return n2 * 1e3 * 60 * 60;
          case "d":
            return n2 * 1e3 * 60 * 60 * 24;
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
          let s = this.getBucket(i.time), n2 = [this.prefix, e, s].join(":");
          await this.redis.zincrby(n2, 1, JSON.stringify({ ...i, time: void 0 }));
        }));
      }
      formatBucketAggregate(e, t, i) {
        let s = {};
        return e.forEach(([n2, r]) => {
          t == "success" && (n2 = n2 === 1 ? "true" : n2 === null ? "false" : n2), s[t] = s[t] || {}, s[t][(n2 ?? "null").toString()] = r;
        }), { time: i, ...s };
      }
      async aggregateBucket(e, t, i) {
        this.validateTableName(e);
        let s = this.getBucket(i), n2 = [this.prefix, e, s].join(":"), r = await this.redis.eval(p, [n2], [t]);
        return this.formatBucketAggregate(r, t, s);
      }
      async aggregateBuckets(e, t, i, s) {
        this.validateTableName(e);
        let n2 = this.getBucket(s), r = [];
        for (let o = 0; o < i; o += 1) r.push(this.aggregateBucket(e, t, n2)), n2 = n2 - this.bucketSize;
        return Promise.all(r);
      }
      async aggregateBucketsWithPipeline(e, t, i, s, n2) {
        this.validateTableName(e), n2 = n2 ?? 48;
        let r = this.getBucket(s), o = [], c = this.redis.pipeline(), u = [];
        for (let a = 1; a <= i; a += 1) {
          let d = [this.prefix, e, r].join(":");
          c.eval(p, [d], [t]), o.push(r), r = r - this.bucketSize, (a % n2 == 0 || a == i) && (u.push(c.exec()), c = this.redis.pipeline());
        }
        return (await Promise.all(u)).flat().map((a, d) => this.formatBucketAggregate(a, t, o[d]));
      }
      async getAllowedBlocked(e, t, i) {
        this.validateTableName(e);
        let s = [this.prefix, e].join(":"), n2 = this.getBucket(i), r = await this.redis.eval(h, [s], [n2, this.bucketSize, t]), o = {};
        for (let c = 0; c < r.length; c += 2) {
          let u = r[c], m = u.identifier, a = +r[c + 1];
          o[m] || (o[m] = { success: 0, blocked: 0 }), o[m][u.success ? "success" : "blocked"] = a;
        }
        return o;
      }
      async getMostAllowedBlocked(e, t, i, s, n2) {
        this.validateTableName(e);
        let r = [this.prefix, e].join(":"), o = this.getBucket(s), c = n2 ?? i * 5, [u, m, a] = await this.redis.eval(f, [r], [o, this.bucketSize, t, i, c]);
        return { allowed: this.toDicts(u), ratelimited: this.toDicts(m), denied: this.toDicts(a) };
      }
      toDicts(e) {
        let t = [];
        for (let i = 0; i < e.length; i += 1) {
          let s = +e[i][0], n2 = e[i][1];
          t.push({ identifier: n2.identifier, count: s });
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
      constructor(cache3) {
        this.cache = cache3;
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

// server/_shared/client-ip.ts
function constantTimeEqual(a, b) {
  const len = b.length;
  let diff = a.length ^ b.length;
  for (let i = 0; i < len; i += 1) diff |= (a.charCodeAt(i) || 0) ^ b.charCodeAt(i);
  return diff === 0;
}
function hasCloudflareTransitProof(request) {
  const secret = (process.env.CF_EDGE_PROOF_SECRET ?? "").trim();
  if (!secret) return false;
  return constantTimeEqual((request.headers.get(CF_EDGE_PROOF_HEADER) ?? "").trim(), secret);
}
function getClientIp(request) {
  const cf = (request.headers.get("cf-connecting-ip") ?? "").trim();
  const xr = (request.headers.get("x-real-ip") ?? "").trim();
  if (cf && hasCloudflareTransitProof(request)) return cf;
  return xr || UNKNOWN_CLIENT_IP;
}
var UNKNOWN_CLIENT_IP, CF_EDGE_PROOF_HEADER;
var init_client_ip = __esm({
  "server/_shared/client-ip.ts"() {
    "use strict";
    UNKNOWN_CLIENT_IP = "unknown";
    CF_EDGE_PROOF_HEADER = "x-wm-edge-proof";
  }
});

// node_modules/jmespath/jmespath.js
var require_jmespath = __commonJS({
  "node_modules/jmespath/jmespath.js"(exports) {
    (function(exports2) {
      "use strict";
      function isArray(obj) {
        if (obj !== null) {
          return Object.prototype.toString.call(obj) === "[object Array]";
        } else {
          return false;
        }
      }
      function isObject2(obj) {
        if (obj !== null) {
          return Object.prototype.toString.call(obj) === "[object Object]";
        } else {
          return false;
        }
      }
      function strictDeepEqual(first, second) {
        if (first === second) {
          return true;
        }
        var firstType = Object.prototype.toString.call(first);
        if (firstType !== Object.prototype.toString.call(second)) {
          return false;
        }
        if (isArray(first) === true) {
          if (first.length !== second.length) {
            return false;
          }
          for (var i = 0; i < first.length; i++) {
            if (strictDeepEqual(first[i], second[i]) === false) {
              return false;
            }
          }
          return true;
        }
        if (isObject2(first) === true) {
          var keysSeen = {};
          for (var key in first) {
            if (hasOwnProperty.call(first, key)) {
              if (strictDeepEqual(first[key], second[key]) === false) {
                return false;
              }
              keysSeen[key] = true;
            }
          }
          for (var key2 in second) {
            if (hasOwnProperty.call(second, key2)) {
              if (keysSeen[key2] !== true) {
                return false;
              }
            }
          }
          return true;
        }
        return false;
      }
      function isFalse(obj) {
        if (obj === "" || obj === false || obj === null) {
          return true;
        } else if (isArray(obj) && obj.length === 0) {
          return true;
        } else if (isObject2(obj)) {
          for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
              return false;
            }
          }
          return true;
        } else {
          return false;
        }
      }
      function objValues(obj) {
        var keys = Object.keys(obj);
        var values = [];
        for (var i = 0; i < keys.length; i++) {
          values.push(obj[keys[i]]);
        }
        return values;
      }
      function merge2(a, b) {
        var merged = {};
        for (var key in a) {
          merged[key] = a[key];
        }
        for (var key2 in b) {
          merged[key2] = b[key2];
        }
        return merged;
      }
      var trimLeft;
      if (typeof String.prototype.trimLeft === "function") {
        trimLeft = function(str) {
          return str.trimLeft();
        };
      } else {
        trimLeft = function(str) {
          return str.match(/^\s*(.*)/)[1];
        };
      }
      var TYPE_NUMBER = 0;
      var TYPE_ANY = 1;
      var TYPE_STRING = 2;
      var TYPE_ARRAY = 3;
      var TYPE_OBJECT = 4;
      var TYPE_BOOLEAN = 5;
      var TYPE_EXPREF = 6;
      var TYPE_NULL = 7;
      var TYPE_ARRAY_NUMBER = 8;
      var TYPE_ARRAY_STRING = 9;
      var TYPE_NAME_TABLE = {
        0: "number",
        1: "any",
        2: "string",
        3: "array",
        4: "object",
        5: "boolean",
        6: "expression",
        7: "null",
        8: "Array<number>",
        9: "Array<string>"
      };
      var TOK_EOF = "EOF";
      var TOK_UNQUOTEDIDENTIFIER = "UnquotedIdentifier";
      var TOK_QUOTEDIDENTIFIER = "QuotedIdentifier";
      var TOK_RBRACKET = "Rbracket";
      var TOK_RPAREN = "Rparen";
      var TOK_COMMA = "Comma";
      var TOK_COLON = "Colon";
      var TOK_RBRACE = "Rbrace";
      var TOK_NUMBER = "Number";
      var TOK_CURRENT = "Current";
      var TOK_EXPREF = "Expref";
      var TOK_PIPE = "Pipe";
      var TOK_OR = "Or";
      var TOK_AND = "And";
      var TOK_EQ = "EQ";
      var TOK_GT = "GT";
      var TOK_LT = "LT";
      var TOK_GTE = "GTE";
      var TOK_LTE = "LTE";
      var TOK_NE = "NE";
      var TOK_FLATTEN = "Flatten";
      var TOK_STAR = "Star";
      var TOK_FILTER = "Filter";
      var TOK_DOT = "Dot";
      var TOK_NOT = "Not";
      var TOK_LBRACE = "Lbrace";
      var TOK_LBRACKET = "Lbracket";
      var TOK_LPAREN = "Lparen";
      var TOK_LITERAL = "Literal";
      var basicTokens = {
        ".": TOK_DOT,
        "*": TOK_STAR,
        ",": TOK_COMMA,
        ":": TOK_COLON,
        "{": TOK_LBRACE,
        "}": TOK_RBRACE,
        "]": TOK_RBRACKET,
        "(": TOK_LPAREN,
        ")": TOK_RPAREN,
        "@": TOK_CURRENT
      };
      var operatorStartToken = {
        "<": true,
        ">": true,
        "=": true,
        "!": true
      };
      var skipChars = {
        " ": true,
        "	": true,
        "\n": true
      };
      function isAlpha(ch) {
        return ch >= "a" && ch <= "z" || ch >= "A" && ch <= "Z" || ch === "_";
      }
      function isNum(ch) {
        return ch >= "0" && ch <= "9" || ch === "-";
      }
      function isAlphaNum(ch) {
        return ch >= "a" && ch <= "z" || ch >= "A" && ch <= "Z" || ch >= "0" && ch <= "9" || ch === "_";
      }
      function Lexer() {
      }
      Lexer.prototype = {
        tokenize: function(stream) {
          var tokens = [];
          this._current = 0;
          var start;
          var identifier;
          var token;
          while (this._current < stream.length) {
            if (isAlpha(stream[this._current])) {
              start = this._current;
              identifier = this._consumeUnquotedIdentifier(stream);
              tokens.push({
                type: TOK_UNQUOTEDIDENTIFIER,
                value: identifier,
                start
              });
            } else if (basicTokens[stream[this._current]] !== void 0) {
              tokens.push({
                type: basicTokens[stream[this._current]],
                value: stream[this._current],
                start: this._current
              });
              this._current++;
            } else if (isNum(stream[this._current])) {
              token = this._consumeNumber(stream);
              tokens.push(token);
            } else if (stream[this._current] === "[") {
              token = this._consumeLBracket(stream);
              tokens.push(token);
            } else if (stream[this._current] === '"') {
              start = this._current;
              identifier = this._consumeQuotedIdentifier(stream);
              tokens.push({
                type: TOK_QUOTEDIDENTIFIER,
                value: identifier,
                start
              });
            } else if (stream[this._current] === "'") {
              start = this._current;
              identifier = this._consumeRawStringLiteral(stream);
              tokens.push({
                type: TOK_LITERAL,
                value: identifier,
                start
              });
            } else if (stream[this._current] === "`") {
              start = this._current;
              var literal = this._consumeLiteral(stream);
              tokens.push({
                type: TOK_LITERAL,
                value: literal,
                start
              });
            } else if (operatorStartToken[stream[this._current]] !== void 0) {
              tokens.push(this._consumeOperator(stream));
            } else if (skipChars[stream[this._current]] !== void 0) {
              this._current++;
            } else if (stream[this._current] === "&") {
              start = this._current;
              this._current++;
              if (stream[this._current] === "&") {
                this._current++;
                tokens.push({ type: TOK_AND, value: "&&", start });
              } else {
                tokens.push({ type: TOK_EXPREF, value: "&", start });
              }
            } else if (stream[this._current] === "|") {
              start = this._current;
              this._current++;
              if (stream[this._current] === "|") {
                this._current++;
                tokens.push({ type: TOK_OR, value: "||", start });
              } else {
                tokens.push({ type: TOK_PIPE, value: "|", start });
              }
            } else {
              var error = new Error("Unknown character:" + stream[this._current]);
              error.name = "LexerError";
              throw error;
            }
          }
          return tokens;
        },
        _consumeUnquotedIdentifier: function(stream) {
          var start = this._current;
          this._current++;
          while (this._current < stream.length && isAlphaNum(stream[this._current])) {
            this._current++;
          }
          return stream.slice(start, this._current);
        },
        _consumeQuotedIdentifier: function(stream) {
          var start = this._current;
          this._current++;
          var maxLength = stream.length;
          while (stream[this._current] !== '"' && this._current < maxLength) {
            var current = this._current;
            if (stream[current] === "\\" && (stream[current + 1] === "\\" || stream[current + 1] === '"')) {
              current += 2;
            } else {
              current++;
            }
            this._current = current;
          }
          this._current++;
          return JSON.parse(stream.slice(start, this._current));
        },
        _consumeRawStringLiteral: function(stream) {
          var start = this._current;
          this._current++;
          var maxLength = stream.length;
          while (stream[this._current] !== "'" && this._current < maxLength) {
            var current = this._current;
            if (stream[current] === "\\" && (stream[current + 1] === "\\" || stream[current + 1] === "'")) {
              current += 2;
            } else {
              current++;
            }
            this._current = current;
          }
          this._current++;
          var literal = stream.slice(start + 1, this._current - 1);
          return literal.replace("\\'", "'");
        },
        _consumeNumber: function(stream) {
          var start = this._current;
          this._current++;
          var maxLength = stream.length;
          while (isNum(stream[this._current]) && this._current < maxLength) {
            this._current++;
          }
          var value = parseInt(stream.slice(start, this._current));
          return { type: TOK_NUMBER, value, start };
        },
        _consumeLBracket: function(stream) {
          var start = this._current;
          this._current++;
          if (stream[this._current] === "?") {
            this._current++;
            return { type: TOK_FILTER, value: "[?", start };
          } else if (stream[this._current] === "]") {
            this._current++;
            return { type: TOK_FLATTEN, value: "[]", start };
          } else {
            return { type: TOK_LBRACKET, value: "[", start };
          }
        },
        _consumeOperator: function(stream) {
          var start = this._current;
          var startingChar = stream[start];
          this._current++;
          if (startingChar === "!") {
            if (stream[this._current] === "=") {
              this._current++;
              return { type: TOK_NE, value: "!=", start };
            } else {
              return { type: TOK_NOT, value: "!", start };
            }
          } else if (startingChar === "<") {
            if (stream[this._current] === "=") {
              this._current++;
              return { type: TOK_LTE, value: "<=", start };
            } else {
              return { type: TOK_LT, value: "<", start };
            }
          } else if (startingChar === ">") {
            if (stream[this._current] === "=") {
              this._current++;
              return { type: TOK_GTE, value: ">=", start };
            } else {
              return { type: TOK_GT, value: ">", start };
            }
          } else if (startingChar === "=") {
            if (stream[this._current] === "=") {
              this._current++;
              return { type: TOK_EQ, value: "==", start };
            }
          }
        },
        _consumeLiteral: function(stream) {
          this._current++;
          var start = this._current;
          var maxLength = stream.length;
          var literal;
          while (stream[this._current] !== "`" && this._current < maxLength) {
            var current = this._current;
            if (stream[current] === "\\" && (stream[current + 1] === "\\" || stream[current + 1] === "`")) {
              current += 2;
            } else {
              current++;
            }
            this._current = current;
          }
          var literalString = trimLeft(stream.slice(start, this._current));
          literalString = literalString.replace("\\`", "`");
          if (this._looksLikeJSON(literalString)) {
            literal = JSON.parse(literalString);
          } else {
            literal = JSON.parse('"' + literalString + '"');
          }
          this._current++;
          return literal;
        },
        _looksLikeJSON: function(literalString) {
          var startingChars = '[{"';
          var jsonLiterals = ["true", "false", "null"];
          var numberLooking = "-0123456789";
          if (literalString === "") {
            return false;
          } else if (startingChars.indexOf(literalString[0]) >= 0) {
            return true;
          } else if (jsonLiterals.indexOf(literalString) >= 0) {
            return true;
          } else if (numberLooking.indexOf(literalString[0]) >= 0) {
            try {
              JSON.parse(literalString);
              return true;
            } catch (ex) {
              return false;
            }
          } else {
            return false;
          }
        }
      };
      var bindingPower = {};
      bindingPower[TOK_EOF] = 0;
      bindingPower[TOK_UNQUOTEDIDENTIFIER] = 0;
      bindingPower[TOK_QUOTEDIDENTIFIER] = 0;
      bindingPower[TOK_RBRACKET] = 0;
      bindingPower[TOK_RPAREN] = 0;
      bindingPower[TOK_COMMA] = 0;
      bindingPower[TOK_RBRACE] = 0;
      bindingPower[TOK_NUMBER] = 0;
      bindingPower[TOK_CURRENT] = 0;
      bindingPower[TOK_EXPREF] = 0;
      bindingPower[TOK_PIPE] = 1;
      bindingPower[TOK_OR] = 2;
      bindingPower[TOK_AND] = 3;
      bindingPower[TOK_EQ] = 5;
      bindingPower[TOK_GT] = 5;
      bindingPower[TOK_LT] = 5;
      bindingPower[TOK_GTE] = 5;
      bindingPower[TOK_LTE] = 5;
      bindingPower[TOK_NE] = 5;
      bindingPower[TOK_FLATTEN] = 9;
      bindingPower[TOK_STAR] = 20;
      bindingPower[TOK_FILTER] = 21;
      bindingPower[TOK_DOT] = 40;
      bindingPower[TOK_NOT] = 45;
      bindingPower[TOK_LBRACE] = 50;
      bindingPower[TOK_LBRACKET] = 55;
      bindingPower[TOK_LPAREN] = 60;
      function Parser() {
      }
      Parser.prototype = {
        parse: function(expression) {
          this._loadTokens(expression);
          this.index = 0;
          var ast = this.expression(0);
          if (this._lookahead(0) !== TOK_EOF) {
            var t = this._lookaheadToken(0);
            var error = new Error(
              "Unexpected token type: " + t.type + ", value: " + t.value
            );
            error.name = "ParserError";
            throw error;
          }
          return ast;
        },
        _loadTokens: function(expression) {
          var lexer = new Lexer();
          var tokens = lexer.tokenize(expression);
          tokens.push({ type: TOK_EOF, value: "", start: expression.length });
          this.tokens = tokens;
        },
        expression: function(rbp) {
          var leftToken = this._lookaheadToken(0);
          this._advance();
          var left = this.nud(leftToken);
          var currentToken = this._lookahead(0);
          while (rbp < bindingPower[currentToken]) {
            this._advance();
            left = this.led(currentToken, left);
            currentToken = this._lookahead(0);
          }
          return left;
        },
        _lookahead: function(number) {
          return this.tokens[this.index + number].type;
        },
        _lookaheadToken: function(number) {
          return this.tokens[this.index + number];
        },
        _advance: function() {
          this.index++;
        },
        nud: function(token) {
          var left;
          var right;
          var expression;
          switch (token.type) {
            case TOK_LITERAL:
              return { type: "Literal", value: token.value };
            case TOK_UNQUOTEDIDENTIFIER:
              return { type: "Field", name: token.value };
            case TOK_QUOTEDIDENTIFIER:
              var node = { type: "Field", name: token.value };
              if (this._lookahead(0) === TOK_LPAREN) {
                throw new Error("Quoted identifier not allowed for function names.");
              }
              return node;
            case TOK_NOT:
              right = this.expression(bindingPower.Not);
              return { type: "NotExpression", children: [right] };
            case TOK_STAR:
              left = { type: "Identity" };
              right = null;
              if (this._lookahead(0) === TOK_RBRACKET) {
                right = { type: "Identity" };
              } else {
                right = this._parseProjectionRHS(bindingPower.Star);
              }
              return { type: "ValueProjection", children: [left, right] };
            case TOK_FILTER:
              return this.led(token.type, { type: "Identity" });
            case TOK_LBRACE:
              return this._parseMultiselectHash();
            case TOK_FLATTEN:
              left = { type: TOK_FLATTEN, children: [{ type: "Identity" }] };
              right = this._parseProjectionRHS(bindingPower.Flatten);
              return { type: "Projection", children: [left, right] };
            case TOK_LBRACKET:
              if (this._lookahead(0) === TOK_NUMBER || this._lookahead(0) === TOK_COLON) {
                right = this._parseIndexExpression();
                return this._projectIfSlice({ type: "Identity" }, right);
              } else if (this._lookahead(0) === TOK_STAR && this._lookahead(1) === TOK_RBRACKET) {
                this._advance();
                this._advance();
                right = this._parseProjectionRHS(bindingPower.Star);
                return {
                  type: "Projection",
                  children: [{ type: "Identity" }, right]
                };
              }
              return this._parseMultiselectList();
            case TOK_CURRENT:
              return { type: TOK_CURRENT };
            case TOK_EXPREF:
              expression = this.expression(bindingPower.Expref);
              return { type: "ExpressionReference", children: [expression] };
            case TOK_LPAREN:
              var args = [];
              while (this._lookahead(0) !== TOK_RPAREN) {
                if (this._lookahead(0) === TOK_CURRENT) {
                  expression = { type: TOK_CURRENT };
                  this._advance();
                } else {
                  expression = this.expression(0);
                }
                args.push(expression);
              }
              this._match(TOK_RPAREN);
              return args[0];
            default:
              this._errorToken(token);
          }
        },
        led: function(tokenName, left) {
          var right;
          switch (tokenName) {
            case TOK_DOT:
              var rbp = bindingPower.Dot;
              if (this._lookahead(0) !== TOK_STAR) {
                right = this._parseDotRHS(rbp);
                return { type: "Subexpression", children: [left, right] };
              }
              this._advance();
              right = this._parseProjectionRHS(rbp);
              return { type: "ValueProjection", children: [left, right] };
            case TOK_PIPE:
              right = this.expression(bindingPower.Pipe);
              return { type: TOK_PIPE, children: [left, right] };
            case TOK_OR:
              right = this.expression(bindingPower.Or);
              return { type: "OrExpression", children: [left, right] };
            case TOK_AND:
              right = this.expression(bindingPower.And);
              return { type: "AndExpression", children: [left, right] };
            case TOK_LPAREN:
              var name = left.name;
              var args = [];
              var expression, node;
              while (this._lookahead(0) !== TOK_RPAREN) {
                if (this._lookahead(0) === TOK_CURRENT) {
                  expression = { type: TOK_CURRENT };
                  this._advance();
                } else {
                  expression = this.expression(0);
                }
                if (this._lookahead(0) === TOK_COMMA) {
                  this._match(TOK_COMMA);
                }
                args.push(expression);
              }
              this._match(TOK_RPAREN);
              node = { type: "Function", name, children: args };
              return node;
            case TOK_FILTER:
              var condition = this.expression(0);
              this._match(TOK_RBRACKET);
              if (this._lookahead(0) === TOK_FLATTEN) {
                right = { type: "Identity" };
              } else {
                right = this._parseProjectionRHS(bindingPower.Filter);
              }
              return { type: "FilterProjection", children: [left, right, condition] };
            case TOK_FLATTEN:
              var leftNode = { type: TOK_FLATTEN, children: [left] };
              var rightNode = this._parseProjectionRHS(bindingPower.Flatten);
              return { type: "Projection", children: [leftNode, rightNode] };
            case TOK_EQ:
            case TOK_NE:
            case TOK_GT:
            case TOK_GTE:
            case TOK_LT:
            case TOK_LTE:
              return this._parseComparator(left, tokenName);
            case TOK_LBRACKET:
              var token = this._lookaheadToken(0);
              if (token.type === TOK_NUMBER || token.type === TOK_COLON) {
                right = this._parseIndexExpression();
                return this._projectIfSlice(left, right);
              }
              this._match(TOK_STAR);
              this._match(TOK_RBRACKET);
              right = this._parseProjectionRHS(bindingPower.Star);
              return { type: "Projection", children: [left, right] };
            default:
              this._errorToken(this._lookaheadToken(0));
          }
        },
        _match: function(tokenType) {
          if (this._lookahead(0) === tokenType) {
            this._advance();
          } else {
            var t = this._lookaheadToken(0);
            var error = new Error("Expected " + tokenType + ", got: " + t.type);
            error.name = "ParserError";
            throw error;
          }
        },
        _errorToken: function(token) {
          var error = new Error("Invalid token (" + token.type + '): "' + token.value + '"');
          error.name = "ParserError";
          throw error;
        },
        _parseIndexExpression: function() {
          if (this._lookahead(0) === TOK_COLON || this._lookahead(1) === TOK_COLON) {
            return this._parseSliceExpression();
          } else {
            var node = {
              type: "Index",
              value: this._lookaheadToken(0).value
            };
            this._advance();
            this._match(TOK_RBRACKET);
            return node;
          }
        },
        _projectIfSlice: function(left, right) {
          var indexExpr = { type: "IndexExpression", children: [left, right] };
          if (right.type === "Slice") {
            return {
              type: "Projection",
              children: [indexExpr, this._parseProjectionRHS(bindingPower.Star)]
            };
          } else {
            return indexExpr;
          }
        },
        _parseSliceExpression: function() {
          var parts = [null, null, null];
          var index = 0;
          var currentToken = this._lookahead(0);
          while (currentToken !== TOK_RBRACKET && index < 3) {
            if (currentToken === TOK_COLON) {
              index++;
              this._advance();
            } else if (currentToken === TOK_NUMBER) {
              parts[index] = this._lookaheadToken(0).value;
              this._advance();
            } else {
              var t = this._lookahead(0);
              var error = new Error("Syntax error, unexpected token: " + t.value + "(" + t.type + ")");
              error.name = "Parsererror";
              throw error;
            }
            currentToken = this._lookahead(0);
          }
          this._match(TOK_RBRACKET);
          return {
            type: "Slice",
            children: parts
          };
        },
        _parseComparator: function(left, comparator) {
          var right = this.expression(bindingPower[comparator]);
          return { type: "Comparator", name: comparator, children: [left, right] };
        },
        _parseDotRHS: function(rbp) {
          var lookahead = this._lookahead(0);
          var exprTokens = [TOK_UNQUOTEDIDENTIFIER, TOK_QUOTEDIDENTIFIER, TOK_STAR];
          if (exprTokens.indexOf(lookahead) >= 0) {
            return this.expression(rbp);
          } else if (lookahead === TOK_LBRACKET) {
            this._match(TOK_LBRACKET);
            return this._parseMultiselectList();
          } else if (lookahead === TOK_LBRACE) {
            this._match(TOK_LBRACE);
            return this._parseMultiselectHash();
          }
        },
        _parseProjectionRHS: function(rbp) {
          var right;
          if (bindingPower[this._lookahead(0)] < 10) {
            right = { type: "Identity" };
          } else if (this._lookahead(0) === TOK_LBRACKET) {
            right = this.expression(rbp);
          } else if (this._lookahead(0) === TOK_FILTER) {
            right = this.expression(rbp);
          } else if (this._lookahead(0) === TOK_DOT) {
            this._match(TOK_DOT);
            right = this._parseDotRHS(rbp);
          } else {
            var t = this._lookaheadToken(0);
            var error = new Error("Sytanx error, unexpected token: " + t.value + "(" + t.type + ")");
            error.name = "ParserError";
            throw error;
          }
          return right;
        },
        _parseMultiselectList: function() {
          var expressions = [];
          while (this._lookahead(0) !== TOK_RBRACKET) {
            var expression = this.expression(0);
            expressions.push(expression);
            if (this._lookahead(0) === TOK_COMMA) {
              this._match(TOK_COMMA);
              if (this._lookahead(0) === TOK_RBRACKET) {
                throw new Error("Unexpected token Rbracket");
              }
            }
          }
          this._match(TOK_RBRACKET);
          return { type: "MultiSelectList", children: expressions };
        },
        _parseMultiselectHash: function() {
          var pairs = [];
          var identifierTypes = [TOK_UNQUOTEDIDENTIFIER, TOK_QUOTEDIDENTIFIER];
          var keyToken, keyName, value, node;
          for (; ; ) {
            keyToken = this._lookaheadToken(0);
            if (identifierTypes.indexOf(keyToken.type) < 0) {
              throw new Error("Expecting an identifier token, got: " + keyToken.type);
            }
            keyName = keyToken.value;
            this._advance();
            this._match(TOK_COLON);
            value = this.expression(0);
            node = { type: "KeyValuePair", name: keyName, value };
            pairs.push(node);
            if (this._lookahead(0) === TOK_COMMA) {
              this._match(TOK_COMMA);
            } else if (this._lookahead(0) === TOK_RBRACE) {
              this._match(TOK_RBRACE);
              break;
            }
          }
          return { type: "MultiSelectHash", children: pairs };
        }
      };
      function TreeInterpreter(runtime) {
        this.runtime = runtime;
      }
      TreeInterpreter.prototype = {
        search: function(node, value) {
          return this.visit(node, value);
        },
        visit: function(node, value) {
          var matched, current, result, first, second, field, left, right, collected, i;
          switch (node.type) {
            case "Field":
              if (value !== null && isObject2(value)) {
                field = value[node.name];
                if (field === void 0) {
                  return null;
                } else {
                  return field;
                }
              }
              return null;
            case "Subexpression":
              result = this.visit(node.children[0], value);
              for (i = 1; i < node.children.length; i++) {
                result = this.visit(node.children[1], result);
                if (result === null) {
                  return null;
                }
              }
              return result;
            case "IndexExpression":
              left = this.visit(node.children[0], value);
              right = this.visit(node.children[1], left);
              return right;
            case "Index":
              if (!isArray(value)) {
                return null;
              }
              var index = node.value;
              if (index < 0) {
                index = value.length + index;
              }
              result = value[index];
              if (result === void 0) {
                result = null;
              }
              return result;
            case "Slice":
              if (!isArray(value)) {
                return null;
              }
              var sliceParams = node.children.slice(0);
              var computed = this.computeSliceParams(value.length, sliceParams);
              var start = computed[0];
              var stop = computed[1];
              var step = computed[2];
              result = [];
              if (step > 0) {
                for (i = start; i < stop; i += step) {
                  result.push(value[i]);
                }
              } else {
                for (i = start; i > stop; i += step) {
                  result.push(value[i]);
                }
              }
              return result;
            case "Projection":
              var base = this.visit(node.children[0], value);
              if (!isArray(base)) {
                return null;
              }
              collected = [];
              for (i = 0; i < base.length; i++) {
                current = this.visit(node.children[1], base[i]);
                if (current !== null) {
                  collected.push(current);
                }
              }
              return collected;
            case "ValueProjection":
              base = this.visit(node.children[0], value);
              if (!isObject2(base)) {
                return null;
              }
              collected = [];
              var values = objValues(base);
              for (i = 0; i < values.length; i++) {
                current = this.visit(node.children[1], values[i]);
                if (current !== null) {
                  collected.push(current);
                }
              }
              return collected;
            case "FilterProjection":
              base = this.visit(node.children[0], value);
              if (!isArray(base)) {
                return null;
              }
              var filtered = [];
              var finalResults = [];
              for (i = 0; i < base.length; i++) {
                matched = this.visit(node.children[2], base[i]);
                if (!isFalse(matched)) {
                  filtered.push(base[i]);
                }
              }
              for (var j = 0; j < filtered.length; j++) {
                current = this.visit(node.children[1], filtered[j]);
                if (current !== null) {
                  finalResults.push(current);
                }
              }
              return finalResults;
            case "Comparator":
              first = this.visit(node.children[0], value);
              second = this.visit(node.children[1], value);
              switch (node.name) {
                case TOK_EQ:
                  result = strictDeepEqual(first, second);
                  break;
                case TOK_NE:
                  result = !strictDeepEqual(first, second);
                  break;
                case TOK_GT:
                  result = first > second;
                  break;
                case TOK_GTE:
                  result = first >= second;
                  break;
                case TOK_LT:
                  result = first < second;
                  break;
                case TOK_LTE:
                  result = first <= second;
                  break;
                default:
                  throw new Error("Unknown comparator: " + node.name);
              }
              return result;
            case TOK_FLATTEN:
              var original = this.visit(node.children[0], value);
              if (!isArray(original)) {
                return null;
              }
              var merged = [];
              for (i = 0; i < original.length; i++) {
                current = original[i];
                if (isArray(current)) {
                  merged.push.apply(merged, current);
                } else {
                  merged.push(current);
                }
              }
              return merged;
            case "Identity":
              return value;
            case "MultiSelectList":
              if (value === null) {
                return null;
              }
              collected = [];
              for (i = 0; i < node.children.length; i++) {
                collected.push(this.visit(node.children[i], value));
              }
              return collected;
            case "MultiSelectHash":
              if (value === null) {
                return null;
              }
              collected = {};
              var child;
              for (i = 0; i < node.children.length; i++) {
                child = node.children[i];
                collected[child.name] = this.visit(child.value, value);
              }
              return collected;
            case "OrExpression":
              matched = this.visit(node.children[0], value);
              if (isFalse(matched)) {
                matched = this.visit(node.children[1], value);
              }
              return matched;
            case "AndExpression":
              first = this.visit(node.children[0], value);
              if (isFalse(first) === true) {
                return first;
              }
              return this.visit(node.children[1], value);
            case "NotExpression":
              first = this.visit(node.children[0], value);
              return isFalse(first);
            case "Literal":
              return node.value;
            case TOK_PIPE:
              left = this.visit(node.children[0], value);
              return this.visit(node.children[1], left);
            case TOK_CURRENT:
              return value;
            case "Function":
              var resolvedArgs = [];
              for (i = 0; i < node.children.length; i++) {
                resolvedArgs.push(this.visit(node.children[i], value));
              }
              return this.runtime.callFunction(node.name, resolvedArgs);
            case "ExpressionReference":
              var refNode = node.children[0];
              refNode.jmespathType = TOK_EXPREF;
              return refNode;
            default:
              throw new Error("Unknown node type: " + node.type);
          }
        },
        computeSliceParams: function(arrayLength, sliceParams) {
          var start = sliceParams[0];
          var stop = sliceParams[1];
          var step = sliceParams[2];
          var computed = [null, null, null];
          if (step === null) {
            step = 1;
          } else if (step === 0) {
            var error = new Error("Invalid slice, step cannot be 0");
            error.name = "RuntimeError";
            throw error;
          }
          var stepValueNegative = step < 0 ? true : false;
          if (start === null) {
            start = stepValueNegative ? arrayLength - 1 : 0;
          } else {
            start = this.capSliceRange(arrayLength, start, step);
          }
          if (stop === null) {
            stop = stepValueNegative ? -1 : arrayLength;
          } else {
            stop = this.capSliceRange(arrayLength, stop, step);
          }
          computed[0] = start;
          computed[1] = stop;
          computed[2] = step;
          return computed;
        },
        capSliceRange: function(arrayLength, actualValue, step) {
          if (actualValue < 0) {
            actualValue += arrayLength;
            if (actualValue < 0) {
              actualValue = step < 0 ? -1 : 0;
            }
          } else if (actualValue >= arrayLength) {
            actualValue = step < 0 ? arrayLength - 1 : arrayLength;
          }
          return actualValue;
        }
      };
      function Runtime(interpreter) {
        this._interpreter = interpreter;
        this.functionTable = {
          // name: [function, <signature>]
          // The <signature> can be:
          //
          // {
          //   args: [[type1, type2], [type1, type2]],
          //   variadic: true|false
          // }
          //
          // Each arg in the arg list is a list of valid types
          // (if the function is overloaded and supports multiple
          // types.  If the type is "any" then no type checking
          // occurs on the argument.  Variadic is optional
          // and if not provided is assumed to be false.
          abs: { _func: this._functionAbs, _signature: [{ types: [TYPE_NUMBER] }] },
          avg: { _func: this._functionAvg, _signature: [{ types: [TYPE_ARRAY_NUMBER] }] },
          ceil: { _func: this._functionCeil, _signature: [{ types: [TYPE_NUMBER] }] },
          contains: {
            _func: this._functionContains,
            _signature: [
              { types: [TYPE_STRING, TYPE_ARRAY] },
              { types: [TYPE_ANY] }
            ]
          },
          "ends_with": {
            _func: this._functionEndsWith,
            _signature: [{ types: [TYPE_STRING] }, { types: [TYPE_STRING] }]
          },
          floor: { _func: this._functionFloor, _signature: [{ types: [TYPE_NUMBER] }] },
          length: {
            _func: this._functionLength,
            _signature: [{ types: [TYPE_STRING, TYPE_ARRAY, TYPE_OBJECT] }]
          },
          map: {
            _func: this._functionMap,
            _signature: [{ types: [TYPE_EXPREF] }, { types: [TYPE_ARRAY] }]
          },
          max: {
            _func: this._functionMax,
            _signature: [{ types: [TYPE_ARRAY_NUMBER, TYPE_ARRAY_STRING] }]
          },
          "merge": {
            _func: this._functionMerge,
            _signature: [{ types: [TYPE_OBJECT], variadic: true }]
          },
          "max_by": {
            _func: this._functionMaxBy,
            _signature: [{ types: [TYPE_ARRAY] }, { types: [TYPE_EXPREF] }]
          },
          sum: { _func: this._functionSum, _signature: [{ types: [TYPE_ARRAY_NUMBER] }] },
          "starts_with": {
            _func: this._functionStartsWith,
            _signature: [{ types: [TYPE_STRING] }, { types: [TYPE_STRING] }]
          },
          min: {
            _func: this._functionMin,
            _signature: [{ types: [TYPE_ARRAY_NUMBER, TYPE_ARRAY_STRING] }]
          },
          "min_by": {
            _func: this._functionMinBy,
            _signature: [{ types: [TYPE_ARRAY] }, { types: [TYPE_EXPREF] }]
          },
          type: { _func: this._functionType, _signature: [{ types: [TYPE_ANY] }] },
          keys: { _func: this._functionKeys, _signature: [{ types: [TYPE_OBJECT] }] },
          values: { _func: this._functionValues, _signature: [{ types: [TYPE_OBJECT] }] },
          sort: { _func: this._functionSort, _signature: [{ types: [TYPE_ARRAY_STRING, TYPE_ARRAY_NUMBER] }] },
          "sort_by": {
            _func: this._functionSortBy,
            _signature: [{ types: [TYPE_ARRAY] }, { types: [TYPE_EXPREF] }]
          },
          join: {
            _func: this._functionJoin,
            _signature: [
              { types: [TYPE_STRING] },
              { types: [TYPE_ARRAY_STRING] }
            ]
          },
          reverse: {
            _func: this._functionReverse,
            _signature: [{ types: [TYPE_STRING, TYPE_ARRAY] }]
          },
          "to_array": { _func: this._functionToArray, _signature: [{ types: [TYPE_ANY] }] },
          "to_string": { _func: this._functionToString, _signature: [{ types: [TYPE_ANY] }] },
          "to_number": { _func: this._functionToNumber, _signature: [{ types: [TYPE_ANY] }] },
          "not_null": {
            _func: this._functionNotNull,
            _signature: [{ types: [TYPE_ANY], variadic: true }]
          }
        };
      }
      Runtime.prototype = {
        callFunction: function(name, resolvedArgs) {
          var functionEntry = this.functionTable[name];
          if (functionEntry === void 0) {
            throw new Error("Unknown function: " + name + "()");
          }
          this._validateArgs(name, resolvedArgs, functionEntry._signature);
          return functionEntry._func.call(this, resolvedArgs);
        },
        _validateArgs: function(name, args, signature) {
          var pluralized;
          if (signature[signature.length - 1].variadic) {
            if (args.length < signature.length) {
              pluralized = signature.length === 1 ? " argument" : " arguments";
              throw new Error("ArgumentError: " + name + "() takes at least" + signature.length + pluralized + " but received " + args.length);
            }
          } else if (args.length !== signature.length) {
            pluralized = signature.length === 1 ? " argument" : " arguments";
            throw new Error("ArgumentError: " + name + "() takes " + signature.length + pluralized + " but received " + args.length);
          }
          var currentSpec;
          var actualType;
          var typeMatched;
          for (var i = 0; i < signature.length; i++) {
            typeMatched = false;
            currentSpec = signature[i].types;
            actualType = this._getTypeName(args[i]);
            for (var j = 0; j < currentSpec.length; j++) {
              if (this._typeMatches(actualType, currentSpec[j], args[i])) {
                typeMatched = true;
                break;
              }
            }
            if (!typeMatched) {
              var expected = currentSpec.map(function(typeIdentifier) {
                return TYPE_NAME_TABLE[typeIdentifier];
              }).join(",");
              throw new Error("TypeError: " + name + "() expected argument " + (i + 1) + " to be type " + expected + " but received type " + TYPE_NAME_TABLE[actualType] + " instead.");
            }
          }
        },
        _typeMatches: function(actual, expected, argValue) {
          if (expected === TYPE_ANY) {
            return true;
          }
          if (expected === TYPE_ARRAY_STRING || expected === TYPE_ARRAY_NUMBER || expected === TYPE_ARRAY) {
            if (expected === TYPE_ARRAY) {
              return actual === TYPE_ARRAY;
            } else if (actual === TYPE_ARRAY) {
              var subtype;
              if (expected === TYPE_ARRAY_NUMBER) {
                subtype = TYPE_NUMBER;
              } else if (expected === TYPE_ARRAY_STRING) {
                subtype = TYPE_STRING;
              }
              for (var i = 0; i < argValue.length; i++) {
                if (!this._typeMatches(
                  this._getTypeName(argValue[i]),
                  subtype,
                  argValue[i]
                )) {
                  return false;
                }
              }
              return true;
            }
          } else {
            return actual === expected;
          }
        },
        _getTypeName: function(obj) {
          switch (Object.prototype.toString.call(obj)) {
            case "[object String]":
              return TYPE_STRING;
            case "[object Number]":
              return TYPE_NUMBER;
            case "[object Array]":
              return TYPE_ARRAY;
            case "[object Boolean]":
              return TYPE_BOOLEAN;
            case "[object Null]":
              return TYPE_NULL;
            case "[object Object]":
              if (obj.jmespathType === TOK_EXPREF) {
                return TYPE_EXPREF;
              } else {
                return TYPE_OBJECT;
              }
          }
        },
        _functionStartsWith: function(resolvedArgs) {
          return resolvedArgs[0].lastIndexOf(resolvedArgs[1]) === 0;
        },
        _functionEndsWith: function(resolvedArgs) {
          var searchStr = resolvedArgs[0];
          var suffix = resolvedArgs[1];
          return searchStr.indexOf(suffix, searchStr.length - suffix.length) !== -1;
        },
        _functionReverse: function(resolvedArgs) {
          var typeName = this._getTypeName(resolvedArgs[0]);
          if (typeName === TYPE_STRING) {
            var originalStr = resolvedArgs[0];
            var reversedStr = "";
            for (var i = originalStr.length - 1; i >= 0; i--) {
              reversedStr += originalStr[i];
            }
            return reversedStr;
          } else {
            var reversedArray = resolvedArgs[0].slice(0);
            reversedArray.reverse();
            return reversedArray;
          }
        },
        _functionAbs: function(resolvedArgs) {
          return Math.abs(resolvedArgs[0]);
        },
        _functionCeil: function(resolvedArgs) {
          return Math.ceil(resolvedArgs[0]);
        },
        _functionAvg: function(resolvedArgs) {
          var sum = 0;
          var inputArray = resolvedArgs[0];
          for (var i = 0; i < inputArray.length; i++) {
            sum += inputArray[i];
          }
          return sum / inputArray.length;
        },
        _functionContains: function(resolvedArgs) {
          return resolvedArgs[0].indexOf(resolvedArgs[1]) >= 0;
        },
        _functionFloor: function(resolvedArgs) {
          return Math.floor(resolvedArgs[0]);
        },
        _functionLength: function(resolvedArgs) {
          if (!isObject2(resolvedArgs[0])) {
            return resolvedArgs[0].length;
          } else {
            return Object.keys(resolvedArgs[0]).length;
          }
        },
        _functionMap: function(resolvedArgs) {
          var mapped = [];
          var interpreter = this._interpreter;
          var exprefNode = resolvedArgs[0];
          var elements = resolvedArgs[1];
          for (var i = 0; i < elements.length; i++) {
            mapped.push(interpreter.visit(exprefNode, elements[i]));
          }
          return mapped;
        },
        _functionMerge: function(resolvedArgs) {
          var merged = {};
          for (var i = 0; i < resolvedArgs.length; i++) {
            var current = resolvedArgs[i];
            for (var key in current) {
              merged[key] = current[key];
            }
          }
          return merged;
        },
        _functionMax: function(resolvedArgs) {
          if (resolvedArgs[0].length > 0) {
            var typeName = this._getTypeName(resolvedArgs[0][0]);
            if (typeName === TYPE_NUMBER) {
              return Math.max.apply(Math, resolvedArgs[0]);
            } else {
              var elements = resolvedArgs[0];
              var maxElement = elements[0];
              for (var i = 1; i < elements.length; i++) {
                if (maxElement.localeCompare(elements[i]) < 0) {
                  maxElement = elements[i];
                }
              }
              return maxElement;
            }
          } else {
            return null;
          }
        },
        _functionMin: function(resolvedArgs) {
          if (resolvedArgs[0].length > 0) {
            var typeName = this._getTypeName(resolvedArgs[0][0]);
            if (typeName === TYPE_NUMBER) {
              return Math.min.apply(Math, resolvedArgs[0]);
            } else {
              var elements = resolvedArgs[0];
              var minElement = elements[0];
              for (var i = 1; i < elements.length; i++) {
                if (elements[i].localeCompare(minElement) < 0) {
                  minElement = elements[i];
                }
              }
              return minElement;
            }
          } else {
            return null;
          }
        },
        _functionSum: function(resolvedArgs) {
          var sum = 0;
          var listToSum = resolvedArgs[0];
          for (var i = 0; i < listToSum.length; i++) {
            sum += listToSum[i];
          }
          return sum;
        },
        _functionType: function(resolvedArgs) {
          switch (this._getTypeName(resolvedArgs[0])) {
            case TYPE_NUMBER:
              return "number";
            case TYPE_STRING:
              return "string";
            case TYPE_ARRAY:
              return "array";
            case TYPE_OBJECT:
              return "object";
            case TYPE_BOOLEAN:
              return "boolean";
            case TYPE_EXPREF:
              return "expref";
            case TYPE_NULL:
              return "null";
          }
        },
        _functionKeys: function(resolvedArgs) {
          return Object.keys(resolvedArgs[0]);
        },
        _functionValues: function(resolvedArgs) {
          var obj = resolvedArgs[0];
          var keys = Object.keys(obj);
          var values = [];
          for (var i = 0; i < keys.length; i++) {
            values.push(obj[keys[i]]);
          }
          return values;
        },
        _functionJoin: function(resolvedArgs) {
          var joinChar = resolvedArgs[0];
          var listJoin = resolvedArgs[1];
          return listJoin.join(joinChar);
        },
        _functionToArray: function(resolvedArgs) {
          if (this._getTypeName(resolvedArgs[0]) === TYPE_ARRAY) {
            return resolvedArgs[0];
          } else {
            return [resolvedArgs[0]];
          }
        },
        _functionToString: function(resolvedArgs) {
          if (this._getTypeName(resolvedArgs[0]) === TYPE_STRING) {
            return resolvedArgs[0];
          } else {
            return JSON.stringify(resolvedArgs[0]);
          }
        },
        _functionToNumber: function(resolvedArgs) {
          var typeName = this._getTypeName(resolvedArgs[0]);
          var convertedValue;
          if (typeName === TYPE_NUMBER) {
            return resolvedArgs[0];
          } else if (typeName === TYPE_STRING) {
            convertedValue = +resolvedArgs[0];
            if (!isNaN(convertedValue)) {
              return convertedValue;
            }
          }
          return null;
        },
        _functionNotNull: function(resolvedArgs) {
          for (var i = 0; i < resolvedArgs.length; i++) {
            if (this._getTypeName(resolvedArgs[i]) !== TYPE_NULL) {
              return resolvedArgs[i];
            }
          }
          return null;
        },
        _functionSort: function(resolvedArgs) {
          var sortedArray = resolvedArgs[0].slice(0);
          sortedArray.sort();
          return sortedArray;
        },
        _functionSortBy: function(resolvedArgs) {
          var sortedArray = resolvedArgs[0].slice(0);
          if (sortedArray.length === 0) {
            return sortedArray;
          }
          var interpreter = this._interpreter;
          var exprefNode = resolvedArgs[1];
          var requiredType = this._getTypeName(
            interpreter.visit(exprefNode, sortedArray[0])
          );
          if ([TYPE_NUMBER, TYPE_STRING].indexOf(requiredType) < 0) {
            throw new Error("TypeError");
          }
          var that = this;
          var decorated = [];
          for (var i = 0; i < sortedArray.length; i++) {
            decorated.push([i, sortedArray[i]]);
          }
          decorated.sort(function(a, b) {
            var exprA = interpreter.visit(exprefNode, a[1]);
            var exprB = interpreter.visit(exprefNode, b[1]);
            if (that._getTypeName(exprA) !== requiredType) {
              throw new Error(
                "TypeError: expected " + requiredType + ", received " + that._getTypeName(exprA)
              );
            } else if (that._getTypeName(exprB) !== requiredType) {
              throw new Error(
                "TypeError: expected " + requiredType + ", received " + that._getTypeName(exprB)
              );
            }
            if (exprA > exprB) {
              return 1;
            } else if (exprA < exprB) {
              return -1;
            } else {
              return a[0] - b[0];
            }
          });
          for (var j = 0; j < decorated.length; j++) {
            sortedArray[j] = decorated[j][1];
          }
          return sortedArray;
        },
        _functionMaxBy: function(resolvedArgs) {
          var exprefNode = resolvedArgs[1];
          var resolvedArray = resolvedArgs[0];
          var keyFunction = this.createKeyFunction(exprefNode, [TYPE_NUMBER, TYPE_STRING]);
          var maxNumber = -Infinity;
          var maxRecord;
          var current;
          for (var i = 0; i < resolvedArray.length; i++) {
            current = keyFunction(resolvedArray[i]);
            if (current > maxNumber) {
              maxNumber = current;
              maxRecord = resolvedArray[i];
            }
          }
          return maxRecord;
        },
        _functionMinBy: function(resolvedArgs) {
          var exprefNode = resolvedArgs[1];
          var resolvedArray = resolvedArgs[0];
          var keyFunction = this.createKeyFunction(exprefNode, [TYPE_NUMBER, TYPE_STRING]);
          var minNumber = Infinity;
          var minRecord;
          var current;
          for (var i = 0; i < resolvedArray.length; i++) {
            current = keyFunction(resolvedArray[i]);
            if (current < minNumber) {
              minNumber = current;
              minRecord = resolvedArray[i];
            }
          }
          return minRecord;
        },
        createKeyFunction: function(exprefNode, allowedTypes) {
          var that = this;
          var interpreter = this._interpreter;
          var keyFunc = function(x) {
            var current = interpreter.visit(exprefNode, x);
            if (allowedTypes.indexOf(that._getTypeName(current)) < 0) {
              var msg = "TypeError: expected one of " + allowedTypes + ", received " + that._getTypeName(current);
              throw new Error(msg);
            }
            return current;
          };
          return keyFunc;
        }
      };
      function compile(stream) {
        var parser = new Parser();
        var ast = parser.parse(stream);
        return ast;
      }
      function tokenize(stream) {
        var lexer = new Lexer();
        return lexer.tokenize(stream);
      }
      function search(data, expression) {
        var parser = new Parser();
        var runtime = new Runtime();
        var interpreter = new TreeInterpreter(runtime);
        runtime._interpreter = interpreter;
        var node = parser.parse(expression);
        return interpreter.search(node, data);
      }
      exports2.tokenize = tokenize;
      exports2.compile = compile;
      exports2.search = search;
      exports2.strictDeepEqual = strictDeepEqual;
    })(typeof exports === "undefined" ? exports.jmespath = {} : exports);
  }
});

// server/_shared/cache-contract.ts
function isRecord(value) {
  return value != null && typeof value === "object" && !Array.isArray(value);
}
function nonEmptyString(value) {
  return typeof value === "string" && value.trim() !== "";
}
function getRpcNoStoreReasonFromPayload(payload, options = {}) {
  if (!isRecord(payload)) return null;
  if (payload.upstreamUnavailable === true) return "upstream-unavailable";
  if (payload.unavailable === true) return "unavailable";
  if (payload.dataAvailable === false) return "data-unavailable";
  if (payload.degraded === true) return "degraded";
  if (options.includeAvailableFalse !== false && payload.available === false) return "available-false";
  if (nonEmptyString(payload.error)) return "error";
  if (options.pathname === SCENARIO_STATUS_PATH && nonEmptyString(payload.status)) {
    const status = payload.status.trim().toLowerCase();
    if (!SCENARIO_TERMINAL_STATUSES.has(status)) return "nonterminal";
  }
  return null;
}
function getRpcNoStoreReasonFromJson(body, options = {}) {
  try {
    return getRpcNoStoreReasonFromPayload(JSON.parse(body), options);
  } catch {
    if (body.includes('"upstreamUnavailable":true')) return "upstream-unavailable";
    if (body.includes('"unavailable":true')) return "unavailable";
    if (body.includes('"dataAvailable":false')) return "data-unavailable";
    if (body.includes('"degraded":true')) return "degraded";
    if (options.includeAvailableFalse !== false && body.includes('"available":false')) return "available-false";
    return null;
  }
}
var SCENARIO_STATUS_PATH, SCENARIO_TERMINAL_STATUSES;
var init_cache_contract = __esm({
  "server/_shared/cache-contract.ts"() {
    "use strict";
    SCENARIO_STATUS_PATH = "/api/scenario/v1/get-scenario-status";
    SCENARIO_TERMINAL_STATUSES = /* @__PURE__ */ new Set(["done", "failed"]);
  }
});

// server/_shared/seed-envelope.ts
function unwrapEnvelope2(raw) {
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
var init_seed_envelope = __esm({
  "server/_shared/seed-envelope.ts"() {
    "use strict";
  }
});

// server/_shared/usage.ts
function isUsageEnabled() {
  return process.env.USAGE_TELEMETRY === "1";
}
function isDevHeaderEnabled() {
  return process.env.NODE_ENV !== "production";
}
function buildRequestEvent(p) {
  return {
    _time: (/* @__PURE__ */ new Date()).toISOString(),
    event_type: "request",
    request_id: p.requestId,
    domain: p.domain,
    route: p.route,
    method: p.method,
    status: p.status,
    duration_ms: p.durationMs,
    req_bytes: p.reqBytes,
    res_bytes: p.resBytes,
    customer_id: p.customerId,
    principal_id: p.principalId,
    auth_kind: p.authKind,
    tier: p.tier,
    plan_key: p.planKey,
    country: p.country,
    ip_city: p.ipCity,
    ip_region: p.ipRegion,
    execution_region: p.executionRegion,
    execution_plane: p.executionPlane,
    origin_kind: p.originKind,
    cache_tier: p.cacheTier,
    ip: p.ip,
    user_agent: p.userAgent,
    ua_hash: p.uaHash,
    referer: p.referer,
    accept_language: p.acceptLanguage,
    host: p.host,
    sentry_trace_id: p.sentryTraceId,
    reason: p.reason
  };
}
function capHeaderValue(s) {
  if (s == null) return null;
  return s.length > MAX_HEADER_FIELD_LEN ? s.slice(0, MAX_HEADER_FIELD_LEN) : s;
}
function deriveRequestId(req) {
  return req.headers.get("x-vercel-id") ?? "";
}
function deriveExecutionRegion(req) {
  const id = req.headers.get("x-vercel-id");
  if (!id) return null;
  const sep = id.indexOf("::");
  return sep > 0 ? id.slice(0, sep) : null;
}
function deriveCountry(req) {
  if (hasCloudflareTransitProof(req)) {
    const country = req.headers.get("cf-ipcountry");
    return (country && country !== "T1" ? country : null) ?? req.headers.get("x-vercel-ip-country") ?? null;
  }
  return req.headers.get("x-vercel-ip-country") ?? null;
}
function deriveIpCity(req) {
  const raw = req.headers.get("x-vercel-ip-city");
  if (!raw) return null;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}
function deriveIpRegion(req) {
  return req.headers.get("x-vercel-ip-country-region") ?? null;
}
function deriveIp(req) {
  const ip = getClientIp(req);
  return ip === UNKNOWN_CLIENT_IP ? null : ip;
}
function deriveUserAgent(req) {
  return capHeaderValue(req.headers.get("user-agent"));
}
function deriveReferer(req) {
  const raw = req.headers.get("referer");
  if (!raw) return null;
  try {
    const u = new URL(raw);
    return capHeaderValue(`${u.origin}${u.pathname}`);
  } catch {
    return null;
  }
}
function deriveAcceptLanguage(req) {
  return capHeaderValue(req.headers.get("accept-language"));
}
function deriveHost(req) {
  return capHeaderValue(req.headers.get("host"));
}
function deriveReqBytes(req) {
  const len = req.headers.get("content-length");
  if (!len) return 0;
  const n2 = Number(len);
  return Number.isFinite(n2) && n2 >= 0 ? n2 : 0;
}
function deriveSentryTraceId(req) {
  return req.headers.get("sentry-trace") ?? null;
}
async function deriveUaHash(req) {
  const pepper = process.env.USAGE_UA_PEPPER;
  if (!pepper) return null;
  const ua = req.headers.get("user-agent") ?? "";
  if (!ua) return null;
  const data = new TextEncoder().encode(`${pepper}|${ua}`);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}
function deriveOriginKind(req) {
  const origin = req.headers.get("origin") ?? "";
  const hasApiKey = req.headers.has("x-worldmonitor-key") || req.headers.has("x-api-key");
  const hasBearer = (req.headers.get("authorization") ?? "").startsWith("Bearer ");
  if (hasApiKey) return "api-key";
  if (hasBearer) return "oauth";
  if (!origin) return null;
  try {
    const host = new URL(origin).host;
    const reqHost = new URL(req.url).host;
    return host === reqHost ? "browser-same-origin" : "browser-cross-origin";
  } catch {
    return "browser-cross-origin";
  }
}
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
function getTelemetryHealth() {
  if (!isUsageEnabled()) return "off";
  return breakerTripped ? "degraded" : "ok";
}
function maybeAttachDevHealthHeader(headers) {
  if (!isDevHeaderEnabled()) return;
  headers.set("x-usage-telemetry", getTelemetryHealth());
}
async function getScopeStore() {
  if (scopeStore) return scopeStore;
  try {
    const mod = await import("node:async_hooks");
    scopeStore = new mod.AsyncLocalStorage();
    return scopeStore;
  } catch {
    return null;
  }
}
async function runWithUsageScope(scope, fn) {
  const store2 = await getScopeStore();
  if (!store2) return fn();
  return store2.run(scope, fn);
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
var AXIOM_DATASET, AXIOM_INGEST_URL, TELEMETRY_TIMEOUT_MS, CB_WINDOW_MS, CB_TRIP_FAILURE_RATIO, CB_MIN_SAMPLES, SAMPLED_DROP_LOG_RATE, MAX_HEADER_FIELD_LEN, breakerSamples, breakerTripped, breakerLastNotifyTs, scopeStore;
var init_usage = __esm({
  "server/_shared/usage.ts"() {
    "use strict";
    init_client_ip();
    AXIOM_DATASET = "wm_api_usage";
    AXIOM_INGEST_URL = `https://api.axiom.co/v1/datasets/${AXIOM_DATASET}/ingest`;
    TELEMETRY_TIMEOUT_MS = 1500;
    CB_WINDOW_MS = 5 * 60 * 1e3;
    CB_TRIP_FAILURE_RATIO = 0.05;
    CB_MIN_SAMPLES = 20;
    SAMPLED_DROP_LOG_RATE = 0.01;
    MAX_HEADER_FIELD_LEN = 512;
    breakerSamples = [];
    breakerTripped = false;
    breakerLastNotifyTs = 0;
    scopeStore = null;
  }
});

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

// server/_shared/redis.ts
function parseTimeoutEnv(raw, defaultMs) {
  const parsed = Number.parseInt(raw ?? "", 10);
  return parsed > 0 ? parsed : defaultMs;
}
function errMsg(err) {
  return err instanceof Error ? err.message : String(err);
}
function hasRemoteRedisConfig() {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}
function getKeyPrefix() {
  const env = process.env.VERCEL_ENV;
  if (!env || env === "production") return "";
  const sha = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 8) || "dev";
  return `${env}:${sha}:`;
}
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
      value: unwrapEnvelope2(JSON.parse(data.result)).data
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
function evictOldestLocalFallbackEntries(map) {
  while (map.size > LOCAL_FALLBACK_MAX_ENTRIES) {
    const oldestKey = map.keys().next().value;
    if (oldestKey === void 0) return;
    map.delete(oldestKey);
  }
}
function effectiveFetchErrorNegativeTtlSeconds(negativeTtlSeconds) {
  return Math.max(1, Math.min(negativeTtlSeconds, FETCH_ERROR_NEGATIVE_TTL_SECONDS));
}
function armLocalNegativeCooldown(key, ttlSeconds) {
  localNegativeUntil.set(key, Date.now() + ttlSeconds * 1e3);
  evictOldestLocalFallbackEntries(localNegativeUntil);
}
function hasLocalNegativeCooldown(key) {
  const expiresAt = localNegativeUntil.get(key);
  if (expiresAt === void 0) return false;
  if (expiresAt > Date.now()) return true;
  localNegativeUntil.delete(key);
  return false;
}
function effectiveRedisFailurePositiveTtlSeconds(ttlSeconds) {
  return Math.max(1, Math.min(ttlSeconds, REDIS_FAILURE_POSITIVE_TTL_SECONDS));
}
function armLocalPositiveFallback(key, value, ttlSeconds) {
  const effectiveTtlSeconds = effectiveRedisFailurePositiveTtlSeconds(ttlSeconds);
  localPositiveFallback.set(key, {
    value,
    expiresAt: Date.now() + effectiveTtlSeconds * 1e3
  });
  evictOldestLocalFallbackEntries(localPositiveFallback);
}
function readLocalPositiveFallback(key) {
  const cached = localPositiveFallback.get(key);
  if (cached === void 0) return void 0;
  if (cached.expiresAt > Date.now()) return cached.value;
  localPositiveFallback.delete(key);
  return void 0;
}
function normalizePipelineCommand(command, raw) {
  if (raw || command.length < 2) return [...command];
  const [verb, key, ...rest] = command;
  if (typeof verb !== "string" || typeof key !== "string") return [...command];
  return [verb, prefixKey(key), ...rest];
}
async function runRedisPipeline(commands, raw = false) {
  if (process.env.LOCAL_API_MODE === "tauri-sidecar") return [];
  if (commands.length === 0) return [];
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return [];
  try {
    const response = await fetch(`${url}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(commands.map((command) => normalizePipelineCommand(command, raw))),
      signal: AbortSignal.timeout(REDIS_PIPELINE_TIMEOUT_MS)
    });
    if (!response.ok) {
      console.warn(`[redis] runRedisPipeline HTTP ${response.status}`);
      return [];
    }
    return await response.json();
  } catch (err) {
    console.warn("[redis] runRedisPipeline failed:", errMsg(err));
    return [];
  }
}
function withFetcherTimeout(promise, key, timeoutMs, callerName) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`${callerName} timeout after ${timeoutMs}ms for "${key}"`));
    }, timeoutMs);
  });
  return Promise.race([promise, timeout]).finally(() => {
    if (timer !== void 0) clearTimeout(timer);
  });
}
async function cachedFetchJson(key, ttlSeconds, fetcher, negativeTtlSeconds = 120, opts) {
  const cached = await readCachedJson(key);
  if (cached.status === "hit") {
    if (cached.value === NEG_SENTINEL) return null;
    return cached.value;
  }
  const localPositive = readLocalPositiveFallback(key);
  if (localPositive !== void 0) return localPositive;
  const hadCacheReadError = cached.status === "error";
  if (cached.status === "error") {
    logCacheReadError(key, cached.error);
    if (hasLocalNegativeCooldown(key)) return null;
  }
  const existing = inflight.get(key);
  if (existing) return existing;
  const timeoutMs = opts?.timeoutMs ?? fetcherTimeoutDefaultMs;
  const promise = withFetcherTimeout(fetcher(), key, timeoutMs, "cachedFetchJson").then(async (result) => {
    if (result != null) {
      const noStoreReason = getRpcNoStoreReasonFromPayload(result, { includeAvailableFalse: false });
      if (noStoreReason) {
        armLocalNegativeCooldown(key, negativeTtlSeconds);
        await setCachedJson(key, NEG_SENTINEL, negativeTtlSeconds);
      } else {
        const wrote = await setCachedJson(key, result, ttlSeconds);
        if (hadCacheReadError || !wrote && hasRemoteRedisConfig()) {
          armLocalPositiveFallback(key, result, ttlSeconds);
        }
      }
    } else {
      armLocalNegativeCooldown(key, negativeTtlSeconds);
      await setCachedJson(key, NEG_SENTINEL, negativeTtlSeconds);
    }
    return result;
  }).catch(async (err) => {
    const errorTtlSeconds = effectiveFetchErrorNegativeTtlSeconds(negativeTtlSeconds);
    armLocalNegativeCooldown(key, errorTtlSeconds);
    await setCachedJson(key, NEG_SENTINEL, errorTtlSeconds);
    console.warn(`[redis] cachedFetchJson fetcher failed for "${key}":`, errMsg(err));
    throw err;
  }).finally(() => {
    inflight.delete(key);
  });
  inflight.set(key, promise);
  return promise;
}
async function deleteRedisKey(key, raw = false) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return;
  try {
    const finalKey = raw ? key : prefixKey(key);
    await fetch(`${url}/del/${encodeURIComponent(finalKey)}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(REDIS_OP_TIMEOUT_MS)
    });
  } catch (err) {
    console.warn("[redis] deleteRedisKey failed:", errMsg(err));
  }
}
var REDIS_OP_TIMEOUT_MS, REDIS_PIPELINE_TIMEOUT_MS, cachedPrefix, NEG_SENTINEL, FETCH_ERROR_NEGATIVE_TTL_SECONDS, REDIS_FAILURE_POSITIVE_TTL_SECONDS, LOCAL_FALLBACK_MAX_ENTRIES, localNegativeUntil, localPositiveFallback, inflight, FETCHER_TIMEOUT_MS_DEFAULT, fetcherTimeoutDefaultMs;
var init_redis = __esm({
  "server/_shared/redis.ts"() {
    "use strict";
    init_seed_envelope();
    init_cache_contract();
    init_usage();
    REDIS_OP_TIMEOUT_MS = parseTimeoutEnv(process.env.REDIS_OP_TIMEOUT_MS, 1500);
    REDIS_PIPELINE_TIMEOUT_MS = parseTimeoutEnv(process.env.REDIS_PIPELINE_TIMEOUT_MS, 5e3);
    NEG_SENTINEL = "__WM_NEG__";
    FETCH_ERROR_NEGATIVE_TTL_SECONDS = 30;
    REDIS_FAILURE_POSITIVE_TTL_SECONDS = 30;
    LOCAL_FALLBACK_MAX_ENTRIES = 5e3;
    localNegativeUntil = /* @__PURE__ */ new Map();
    localPositiveFallback = /* @__PURE__ */ new Map();
    inflight = /* @__PURE__ */ new Map();
    FETCHER_TIMEOUT_MS_DEFAULT = 3e4;
    fetcherTimeoutDefaultMs = FETCHER_TIMEOUT_MS_DEFAULT;
  }
});

// node_modules/jose/dist/webapi/lib/buffer_utils.js
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
var encoder, decoder, MAX_INT32;
var init_buffer_utils = __esm({
  "node_modules/jose/dist/webapi/lib/buffer_utils.js"() {
    encoder = new TextEncoder();
    decoder = new TextDecoder();
    MAX_INT32 = 2 ** 32;
  }
});

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
var init_base64 = __esm({
  "node_modules/jose/dist/webapi/lib/base64.js"() {
  }
});

// node_modules/jose/dist/webapi/util/base64url.js
function decode2(input) {
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
var init_base64url = __esm({
  "node_modules/jose/dist/webapi/util/base64url.js"() {
    init_buffer_utils();
    init_base64();
  }
});

// node_modules/jose/dist/webapi/lib/crypto_key.js
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
var unusable, isAlgorithm;
var init_crypto_key = __esm({
  "node_modules/jose/dist/webapi/lib/crypto_key.js"() {
    unusable = (name, prop = "algorithm.name") => new TypeError(`CryptoKey does not support this operation, its ${prop} must be ${name}`);
    isAlgorithm = (algorithm, name) => algorithm.name === name;
  }
});

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
var invalidKeyInput, withAlg;
var init_invalid_key_input = __esm({
  "node_modules/jose/dist/webapi/lib/invalid_key_input.js"() {
    invalidKeyInput = (actual, ...types) => message("Key must be ", actual, ...types);
    withAlg = (alg, actual, ...types) => message(`Key for the ${alg} algorithm must be `, actual, ...types);
  }
});

// node_modules/jose/dist/webapi/util/errors.js
var JOSEError, JWTClaimValidationFailed, JWTExpired, JOSEAlgNotAllowed, JOSENotSupported, JWSInvalid, JWTInvalid, JWKSInvalid, JWKSNoMatchingKey, JWKSMultipleMatchingKeys, JWKSTimeout, JWSSignatureVerificationFailed;
var init_errors = __esm({
  "node_modules/jose/dist/webapi/util/errors.js"() {
    JOSEError = class extends Error {
      static code = "ERR_JOSE_GENERIC";
      code = "ERR_JOSE_GENERIC";
      constructor(message2, options) {
        super(message2, options);
        this.name = this.constructor.name;
        Error.captureStackTrace?.(this, this.constructor);
      }
    };
    JWTClaimValidationFailed = class extends JOSEError {
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
    JWTExpired = class extends JOSEError {
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
    JOSEAlgNotAllowed = class extends JOSEError {
      static code = "ERR_JOSE_ALG_NOT_ALLOWED";
      code = "ERR_JOSE_ALG_NOT_ALLOWED";
    };
    JOSENotSupported = class extends JOSEError {
      static code = "ERR_JOSE_NOT_SUPPORTED";
      code = "ERR_JOSE_NOT_SUPPORTED";
    };
    JWSInvalid = class extends JOSEError {
      static code = "ERR_JWS_INVALID";
      code = "ERR_JWS_INVALID";
    };
    JWTInvalid = class extends JOSEError {
      static code = "ERR_JWT_INVALID";
      code = "ERR_JWT_INVALID";
    };
    JWKSInvalid = class extends JOSEError {
      static code = "ERR_JWKS_INVALID";
      code = "ERR_JWKS_INVALID";
    };
    JWKSNoMatchingKey = class extends JOSEError {
      static code = "ERR_JWKS_NO_MATCHING_KEY";
      code = "ERR_JWKS_NO_MATCHING_KEY";
      constructor(message2 = "no applicable key found in the JSON Web Key Set", options) {
        super(message2, options);
      }
    };
    JWKSMultipleMatchingKeys = class extends JOSEError {
      [Symbol.asyncIterator];
      static code = "ERR_JWKS_MULTIPLE_MATCHING_KEYS";
      code = "ERR_JWKS_MULTIPLE_MATCHING_KEYS";
      constructor(message2 = "multiple matching keys found in the JSON Web Key Set", options) {
        super(message2, options);
      }
    };
    JWKSTimeout = class extends JOSEError {
      static code = "ERR_JWKS_TIMEOUT";
      code = "ERR_JWKS_TIMEOUT";
      constructor(message2 = "request timed out", options) {
        super(message2, options);
      }
    };
    JWSSignatureVerificationFailed = class extends JOSEError {
      static code = "ERR_JWS_SIGNATURE_VERIFICATION_FAILED";
      code = "ERR_JWS_SIGNATURE_VERIFICATION_FAILED";
      constructor(message2 = "signature verification failed", options) {
        super(message2, options);
      }
    };
  }
});

// node_modules/jose/dist/webapi/lib/is_key_like.js
var isCryptoKey, isKeyObject, isKeyLike;
var init_is_key_like = __esm({
  "node_modules/jose/dist/webapi/lib/is_key_like.js"() {
    isCryptoKey = (key) => {
      if (key?.[Symbol.toStringTag] === "CryptoKey")
        return true;
      try {
        return key instanceof CryptoKey;
      } catch {
        return false;
      }
    };
    isKeyObject = (key) => key?.[Symbol.toStringTag] === "KeyObject";
    isKeyLike = (key) => isCryptoKey(key) || isKeyObject(key);
  }
});

// node_modules/jose/dist/webapi/lib/helpers.js
function decodeBase64url(value, label, ErrorClass) {
  try {
    return decode2(value);
  } catch {
    throw new ErrorClass(`Failed to base64url decode the ${label}`);
  }
}
var init_helpers = __esm({
  "node_modules/jose/dist/webapi/lib/helpers.js"() {
    init_base64url();
  }
});

// node_modules/jose/dist/webapi/lib/type_checks.js
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
var isObjectLike, isJWK, isPrivateJWK, isPublicJWK, isSecretJWK;
var init_type_checks = __esm({
  "node_modules/jose/dist/webapi/lib/type_checks.js"() {
    isObjectLike = (value) => typeof value === "object" && value !== null;
    isJWK = (key) => isObject(key) && typeof key.kty === "string";
    isPrivateJWK = (key) => key.kty !== "oct" && (key.kty === "AKP" && typeof key.priv === "string" || typeof key.d === "string");
    isPublicJWK = (key) => key.kty !== "oct" && key.d === void 0 && key.priv === void 0;
    isSecretJWK = (key) => key.kty === "oct" && typeof key.k === "string";
  }
});

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
var init_signing = __esm({
  "node_modules/jose/dist/webapi/lib/signing.js"() {
    init_errors();
    init_crypto_key();
    init_invalid_key_input();
  }
});

// node_modules/jose/dist/webapi/lib/jwk_to_key.js
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
var unsupportedAlg;
var init_jwk_to_key = __esm({
  "node_modules/jose/dist/webapi/lib/jwk_to_key.js"() {
    init_errors();
    unsupportedAlg = 'Invalid or unsupported JWK "alg" (Algorithm) Parameter value';
  }
});

// node_modules/jose/dist/webapi/lib/normalize_key.js
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
      return decode2(key.k);
    }
    return handleJWK(key, key, alg, true);
  }
  throw new Error("unreachable");
}
var unusableForAlg, cache, handleJWK, handleKeyObject;
var init_normalize_key = __esm({
  "node_modules/jose/dist/webapi/lib/normalize_key.js"() {
    init_type_checks();
    init_base64url();
    init_jwk_to_key();
    init_is_key_like();
    unusableForAlg = "given KeyObject instance cannot be used for this algorithm";
    handleJWK = async (key, jwk, alg, freeze = false) => {
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
    handleKeyObject = (keyObject, alg) => {
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
  }
});

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
      return decode2(jwk.k);
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
var init_import = __esm({
  "node_modules/jose/dist/webapi/key/import.js"() {
    init_base64url();
    init_jwk_to_key();
    init_errors();
    init_type_checks();
  }
});

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
var init_validate_crit = __esm({
  "node_modules/jose/dist/webapi/lib/validate_crit.js"() {
    init_errors();
  }
});

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
var init_validate_algorithms = __esm({
  "node_modules/jose/dist/webapi/lib/validate_algorithms.js"() {
  }
});

// node_modules/jose/dist/webapi/lib/check_key_type.js
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
var tag, jwkMatchesOp, symmetricTypeCheck, asymmetricTypeCheck;
var init_check_key_type = __esm({
  "node_modules/jose/dist/webapi/lib/check_key_type.js"() {
    init_invalid_key_input();
    init_is_key_like();
    init_type_checks();
    tag = (key) => key?.[Symbol.toStringTag];
    jwkMatchesOp = (alg, key, usage) => {
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
    symmetricTypeCheck = (alg, key, usage) => {
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
    asymmetricTypeCheck = (alg, key, usage) => {
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
  }
});

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
      const protectedHeader = decode2(jws.protected);
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
var init_verify = __esm({
  "node_modules/jose/dist/webapi/jws/flattened/verify.js"() {
    init_base64url();
    init_signing();
    init_errors();
    init_buffer_utils();
    init_helpers();
    init_type_checks();
    init_type_checks();
    init_check_key_type();
    init_validate_crit();
    init_validate_algorithms();
    init_normalize_key();
  }
});

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
var init_verify2 = __esm({
  "node_modules/jose/dist/webapi/jws/compact/verify.js"() {
    init_verify();
    init_errors();
    init_buffer_utils();
  }
});

// node_modules/jose/dist/webapi/lib/jwt_claims_set.js
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
var epoch, minute, hour, day, week, year, REGEX, normalizeTyp, checkAudiencePresence;
var init_jwt_claims_set = __esm({
  "node_modules/jose/dist/webapi/lib/jwt_claims_set.js"() {
    init_errors();
    init_buffer_utils();
    init_type_checks();
    epoch = (date) => Math.floor(date.getTime() / 1e3);
    minute = 60;
    hour = minute * 60;
    day = hour * 24;
    week = day * 7;
    year = day * 365.25;
    REGEX = /^(\+|\-)? ?(\d+|\d+\.\d+) ?(seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)(?: (ago|from now))?$/i;
    normalizeTyp = (value) => {
      if (value.includes("/")) {
        return value.toLowerCase();
      }
      return `application/${value.toLowerCase()}`;
    };
    checkAudiencePresence = (audPayload, audOption) => {
      if (typeof audPayload === "string") {
        return audOption.includes(audPayload);
      }
      if (Array.isArray(audPayload)) {
        return audOption.some(Set.prototype.has.bind(new Set(audPayload)));
      }
      return false;
    };
  }
});

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
var init_verify3 = __esm({
  "node_modules/jose/dist/webapi/jwt/verify.js"() {
    init_verify2();
    init_jwt_claims_set();
    init_errors();
  }
});

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
async function importWithAlgCache(cache3, jwk, alg) {
  const cached = cache3.get(jwk) || cache3.set(jwk, {}).get(jwk);
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
var LocalJWKSet;
var init_local = __esm({
  "node_modules/jose/dist/webapi/jwks/local.js"() {
    init_import();
    init_errors();
    init_type_checks();
    LocalJWKSet = class {
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
  }
});

// node_modules/jose/dist/webapi/jwks/remote.js
function isCloudflareWorkers() {
  return typeof WebSocketPair !== "undefined" || typeof navigator !== "undefined" && navigator.userAgent === "Cloudflare-Workers" || typeof EdgeRuntime !== "undefined" && EdgeRuntime === "vercel";
}
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
var USER_AGENT, customFetch, jwksCache, RemoteJWKSet;
var init_remote = __esm({
  "node_modules/jose/dist/webapi/jwks/remote.js"() {
    init_errors();
    init_local();
    init_type_checks();
    if (typeof navigator === "undefined" || !navigator.userAgent?.startsWith?.("Mozilla/5.0 ")) {
      const NAME = "jose";
      const VERSION2 = "v6.2.2";
      USER_AGENT = `${NAME}/${VERSION2}`;
    }
    customFetch = /* @__PURE__ */ Symbol();
    jwksCache = /* @__PURE__ */ Symbol();
    RemoteJWKSet = class {
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
  }
});

// node_modules/jose/dist/webapi/index.js
var init_webapi = __esm({
  "node_modules/jose/dist/webapi/index.js"() {
    init_verify3();
    init_remote();
  }
});

// server/auth-session.ts
var auth_session_exports = {};
__export(auth_session_exports, {
  getClerkJwtVerifyOptions: () => getClerkJwtVerifyOptions,
  getJWKS: () => getJWKS,
  validateBearerToken: () => validateBearerToken
});
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
var CLERK_JWT_ISSUER_DOMAIN, CLERK_SECRET_KEY, _jwks, _planCache, PLAN_CACHE_TTL_MS;
var init_auth_session = __esm({
  "server/auth-session.ts"() {
    "use strict";
    init_webapi();
    CLERK_JWT_ISSUER_DOMAIN = process.env.CLERK_JWT_ISSUER_DOMAIN ?? "";
    CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY ?? "";
    _jwks = null;
    _planCache = /* @__PURE__ */ new Map();
    PLAN_CACHE_TTL_MS = 5 * 60 * 1e3;
  }
});

// server/_shared/user-api-key.ts
var user_api_key_exports = {};
__export(user_api_key_exports, {
  invalidateApiKeyCache: () => invalidateApiKeyCache,
  validateUserApiKey: () => validateUserApiKey
});
async function sha256Hex3(input) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}
async function validateUserApiKey(key) {
  if (!key || !key.startsWith("wm_")) return null;
  const keyHash = await sha256Hex3(key);
  const cacheKey = `${CACHE_KEY_PREFIX}${keyHash}`;
  try {
    return await cachedFetchJson(
      cacheKey,
      CACHE_TTL_SECONDS,
      () => fetchFromConvex(keyHash),
      NEG_TTL_SECONDS
    );
  } catch (err) {
    console.warn("[user-api-key] validateUserApiKey failed:", err instanceof Error ? err.message : String(err));
    return null;
  }
}
async function fetchFromConvex(keyHash) {
  const convexSiteUrl = process.env.CONVEX_SITE_URL;
  const convexSharedSecret = process.env.CONVEX_SERVER_SHARED_SECRET;
  if (!convexSiteUrl || !convexSharedSecret) return null;
  const resp = await fetch(`${convexSiteUrl}/api/internal-validate-api-key`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "worldmonitor-gateway/1.0",
      "x-convex-shared-secret": convexSharedSecret
    },
    body: JSON.stringify({ keyHash }),
    signal: AbortSignal.timeout(3e3)
  });
  if (!resp.ok) return null;
  return resp.json();
}
async function invalidateApiKeyCache(keyHash) {
  await deleteRedisKey(`${CACHE_KEY_PREFIX}${keyHash}`);
}
var CACHE_TTL_SECONDS, NEG_TTL_SECONDS, CACHE_KEY_PREFIX;
var init_user_api_key = __esm({
  "server/_shared/user-api-key.ts"() {
    "use strict";
    init_redis();
    CACHE_TTL_SECONDS = 60;
    NEG_TTL_SECONDS = 60;
    CACHE_KEY_PREFIX = "user-api-key:";
  }
});

// server/router.ts
function createRouter(allRoutes) {
  const staticTable = /* @__PURE__ */ new Map();
  const staticPaths = /* @__PURE__ */ new Map();
  const dynamicRoutes = [];
  for (const route of allRoutes) {
    if (route.path.includes("{")) {
      const parts = route.path.split("/").filter(Boolean);
      dynamicRoutes.push({
        method: route.method,
        segmentCount: parts.length,
        segments: parts.map((p) => p.startsWith("{") && p.endsWith("}") ? null : p),
        handler: route.handler
      });
    } else {
      const key = `${route.method} ${route.path}`;
      staticTable.set(key, route.handler);
      if (!staticPaths.has(route.path)) staticPaths.set(route.path, /* @__PURE__ */ new Set());
      staticPaths.get(route.path).add(route.method);
    }
  }
  function normalizePath(raw) {
    return raw.length > 1 && raw.endsWith("/") ? raw.slice(0, -1) : raw;
  }
  return {
    match(req) {
      const url = new URL(req.url);
      const pathname = normalizePath(url.pathname);
      const key = `${req.method} ${pathname}`;
      const staticHandler = staticTable.get(key);
      if (staticHandler) return staticHandler;
      const parts = pathname.split("/").filter(Boolean);
      for (const route of dynamicRoutes) {
        if (route.method !== req.method) continue;
        if (route.segmentCount !== parts.length) continue;
        let matched = true;
        for (let i = 0; i < route.segmentCount; i++) {
          if (route.segments[i] !== null && route.segments[i] !== parts[i]) {
            matched = false;
            break;
          }
        }
        if (matched) return route.handler;
      }
      return null;
    },
    allowedMethods(pathname) {
      const normalized = normalizePath(pathname);
      const methods = staticPaths.get(normalized);
      if (methods) {
        const result = Array.from(methods);
        if (result.includes("GET") && !result.includes("HEAD")) result.push("HEAD");
        return result;
      }
      const parts = normalized.split("/").filter(Boolean);
      const found = /* @__PURE__ */ new Set();
      for (const route of dynamicRoutes) {
        if (route.segmentCount !== parts.length) continue;
        let matched = true;
        for (let i = 0; i < route.segmentCount; i++) {
          if (route.segments[i] !== null && route.segments[i] !== parts[i]) {
            matched = false;
            break;
          }
        }
        if (matched) found.add(route.method);
      }
      if (found.has("GET")) found.add("HEAD");
      return Array.from(found);
    }
  };
}

// server/cors.ts
var PRODUCTION_PATTERNS = [
  /^https:\/\/(.*\.)?worldmonitor\.app$/,
  // Vercel preview deployments under the "eliewm" team scope, e.g.
  //   worldmonitor-git-<branch>-eliewm.vercel.app  (git-branch alias)
  //   worldmonitor-<hash>-eliewm.vercel.app        (deployment URL)
  // Tight on purpose: never a bare *.vercel.app (this is a security allowlist).
  /^https:\/\/worldmonitor-[a-z0-9-]+-eliewm\.vercel\.app$/,
  /^https?:\/\/tauri\.localhost(:\d+)?$/,
  /^https?:\/\/[a-z0-9-]+\.tauri\.localhost(:\d+)?$/i,
  /^tauri:\/\/localhost$/,
  /^asset:\/\/localhost$/
];
var DEV_PATTERNS = [
  /^https?:\/\/localhost(:\d+)?$/,
  /^https?:\/\/127\.0\.0\.1(:\d+)?$/
];
var ALLOWED_ORIGIN_PATTERNS = process.env.NODE_ENV === "production" ? PRODUCTION_PATTERNS : [...PRODUCTION_PATTERNS, ...DEV_PATTERNS];
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
  "Location",
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
function getCorsHeaders(req) {
  const origin = req.headers.get("origin") || "";
  const allowOrigin = isAllowedOrigin(origin) ? origin : "https://worldmonitor.app";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
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

// src/shared/public-rpc-cache.ts
var PUBLIC_SHARED_RPC_PATHS = /* @__PURE__ */ new Set([
  "/api/news/v1/list-feed-digest",
  "/api/displacement/v1/get-displacement-summary",
  "/api/forecast/v1/get-forecasts"
]);
var NEWS_VARIANTS = /* @__PURE__ */ new Set(["full", "tech", "finance", "happy", "commodity", "energy"]);
var NEWS_LANGUAGES = /* @__PURE__ */ new Set([
  "en",
  "bg",
  "cs",
  "fr",
  "de",
  "el",
  "es",
  "hr",
  "hu",
  "it",
  "pl",
  "pt",
  "nl",
  "sv",
  "ru",
  "ar",
  "fa",
  "zh",
  "ja",
  "ko",
  "ro",
  "tr",
  "th",
  "vi",
  "hi"
]);
var NEWS_QUERY_KEYS = /* @__PURE__ */ new Set(["variant", "lang", "public"]);
var DISPLACEMENT_PUBLIC_SEARCH = "flow_limit=50&public=1";
var FORECASTS_PUBLIC_SEARCH = "public=1";
function hasSingleValue(params, key) {
  return params.getAll(key).length === 1;
}
function stripRouterInjectedRpcEcho(url) {
  const raw = url.search.startsWith("?") ? url.search.slice(1) : url.search;
  if (!raw) return "";
  const segments = url.pathname.split("/").filter(Boolean);
  const lastSegment = segments[segments.length - 1] ?? "";
  const echo = `rpc=${lastSegment}`;
  const parts = raw.split("&");
  const rpcParts = parts.filter((part) => part === "rpc" || part.startsWith("rpc="));
  if (rpcParts.length === 0) return raw;
  if (!rpcParts.every((part) => part === echo)) return raw;
  return parts.filter((part) => part !== echo).join("&");
}
function hasOnlyKeys(params, allowed) {
  return Array.from(params.keys()).every((key) => allowed.has(key));
}
function isNewsDigestShape(params) {
  return hasOnlyKeys(params, NEWS_QUERY_KEYS) && hasSingleValue(params, "variant") && hasSingleValue(params, "lang") && NEWS_VARIANTS.has(params.get("variant") ?? "") && NEWS_LANGUAGES.has(params.get("lang") ?? "");
}
function isPublicSharedRpcRequest(urlLike, method = "GET") {
  if (method.toUpperCase() !== "GET") return false;
  let url;
  try {
    url = urlLike instanceof URL ? urlLike : new URL(urlLike, "https://worldmonitor.invalid");
  } catch {
    return false;
  }
  const pathname = url.pathname.length > 1 ? url.pathname.replace(/\/+$/, "") : url.pathname;
  if (!PUBLIC_SHARED_RPC_PATHS.has(pathname)) return false;
  const search = stripRouterInjectedRpcEcho(url);
  const params = new URLSearchParams(search);
  if (!hasSingleValue(params, "public") || params.get("public") !== "1") return false;
  if (pathname === "/api/news/v1/list-feed-digest") return isNewsDigestShape(params);
  if (pathname === "/api/forecast/v1/get-forecasts") return search === FORECASTS_PUBLIC_SEARCH;
  return search === DISPLACEMENT_PUBLIC_SEARCH;
}

// api/_session.js
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

// api/_crypto.js
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
async function timingSafeEqualSecret(candidate, expected) {
  if (!candidate || !expected) return false;
  return timingSafeIncludes(candidate, [expected]);
}

// api/_api-key.js
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

// server/error-mapper.ts
function isNetworkError(error) {
  if (!(error instanceof TypeError)) return false;
  const msg = error.message.toLowerCase();
  return msg.includes("fetch") || msg.includes("network") || msg.includes("connect") || msg.includes("econnrefused") || msg.includes("enotfound") || msg.includes("socket");
}
function jsonMessageResponse(message2, status, extras, headers) {
  return new Response(JSON.stringify({ message: message2, ...extras ?? {} }), {
    status,
    headers: { "Content-Type": "application/json", ...headers ?? {} }
  });
}
function mapErrorToResponse(error, _req) {
  if (error instanceof Error && "statusCode" in error) {
    const statusCode = error.statusCode;
    const retryAfter = (statusCode === 429 || statusCode === 503) && "retryAfter" in error ? Number(error.retryAfter) : null;
    const exposesRetryableUnavailable = statusCode === 503 && retryAfter != null && Number.isFinite(retryAfter) && error.exposeMessage === true;
    const message2 = statusCode >= 400 && statusCode < 500 || exposesRetryableUnavailable ? error.message : "Internal server error";
    const body = { message: message2 };
    if (retryAfter != null && Number.isFinite(retryAfter)) {
      body.retryAfter = retryAfter;
    }
    if (statusCode >= 500) {
      const apiBody = "body" in error ? String(error.body).slice(0, 500) : "";
      console.error(`[error-mapper] ${statusCode}:`, error.message, apiBody ? `| body: ${apiBody}` : "");
    }
    return jsonMessageResponse(
      message2,
      statusCode,
      retryAfter != null && Number.isFinite(retryAfter) ? { retryAfter } : void 0,
      retryAfter != null && Number.isFinite(retryAfter) ? { "Retry-After": String(retryAfter) } : void 0
    );
  }
  if (error instanceof SyntaxError) {
    return jsonMessageResponse("Invalid request body", 400);
  }
  if (isNetworkError(error)) {
    console.error("[error-mapper] Network error (502):", error.message);
    return jsonMessageResponse("Upstream unavailable", 502);
  }
  console.error("[error-mapper] Unhandled error:", error instanceof Error ? error.message : error);
  return jsonMessageResponse("Internal server error", 500);
}

// server/_shared/rate-limit.ts
var import_ratelimit = __toESM(require_dist2(), 1);

// node_modules/uncrypto/dist/crypto.node.mjs
import nodeCrypto from "node:crypto";
var subtle = nodeCrypto.webcrypto?.subtle || {};

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
function parseRecursive(obj) {
  const parsed = Array.isArray(obj) ? obj.map((o) => {
    try {
      return parseRecursive(o);
    } catch {
      return o;
    }
  }) : JSON.parse(obj);
  if (typeof parsed === "number" && parsed.toString() !== obj) {
    return obj;
  }
  return parsed;
}
function parseResponse(result) {
  try {
    return parseRecursive(result);
  } catch {
    return result;
  }
}
function deserializeScanResponse(result) {
  return [result[0], ...parseResponse(result.slice(1))];
}
function deserializeScanWithTypesResponse(result) {
  const [cursor, keys] = result;
  const parsedKeys = [];
  for (let i = 0; i < keys.length; i += 2) {
    parsedKeys.push({ key: keys[i], type: keys[i + 1] });
  }
  return [cursor, parsedKeys];
}
function mergeHeaders(...headers) {
  const merged = {};
  for (const header of headers) {
    if (!header) continue;
    for (const [key, value] of Object.entries(header)) {
      if (value !== void 0 && value !== null) {
        merged[key] = value;
      }
    }
  }
  return merged;
}
function kvArrayToObject(v) {
  if (typeof v === "object" && v !== null && !Array.isArray(v)) return v;
  if (!Array.isArray(v)) return {};
  const obj = {};
  for (let i = 0; i < v.length; i += 2) {
    if (typeof v[i] === "string") obj[v[i]] = v[i + 1];
  }
  return obj;
}
var MAX_BUFFER_SIZE = 1024 * 1024;
var HttpClient = class {
  baseUrl;
  headers;
  options;
  readYourWrites;
  upstashSyncToken = "";
  hasCredentials;
  retry;
  constructor(config2) {
    this.options = {
      backend: config2.options?.backend,
      agent: config2.agent,
      responseEncoding: config2.responseEncoding ?? "base64",
      // default to base64
      cache: config2.cache,
      signal: config2.signal,
      keepAlive: config2.keepAlive ?? true
    };
    this.upstashSyncToken = "";
    this.readYourWrites = config2.readYourWrites ?? true;
    this.baseUrl = (config2.baseUrl || "").replace(/\/$/, "");
    const urlRegex = /^https?:\/\/[^\s#$./?].\S*$/;
    if (this.baseUrl && !urlRegex.test(this.baseUrl)) {
      throw new UrlError(this.baseUrl);
    }
    this.headers = {
      "Content-Type": "application/json",
      ...config2.headers
    };
    this.hasCredentials = Boolean(this.baseUrl && this.headers.authorization.split(" ")[1]);
    if (this.options.responseEncoding === "base64") {
      this.headers["Upstash-Encoding"] = "base64";
    }
    this.retry = typeof config2.retry === "boolean" && !config2.retry ? {
      attempts: 1,
      backoff: () => 0
    } : {
      attempts: config2.retry?.retries ?? 5,
      backoff: config2.retry?.backoff ?? ((retryCount) => Math.exp(retryCount) * 50)
    };
  }
  mergeTelemetry(telemetry) {
    this.headers = merge(this.headers, "Upstash-Telemetry-Runtime", telemetry.runtime);
    this.headers = merge(this.headers, "Upstash-Telemetry-Platform", telemetry.platform);
    this.headers = merge(this.headers, "Upstash-Telemetry-Sdk", telemetry.sdk);
  }
  async request(req) {
    const requestHeaders = mergeHeaders(this.headers, req.headers ?? {});
    const requestUrl = [this.baseUrl, ...req.path ?? []].join("/");
    const isEventStream = requestHeaders.Accept === "text/event-stream";
    const signal = req.signal ?? this.options.signal;
    const isSignalFunction = typeof signal === "function";
    const requestOptions = {
      cache: this.options.cache,
      method: "POST",
      headers: requestHeaders,
      body: JSON.stringify(req.body),
      keepalive: this.options.keepAlive,
      agent: this.options.agent,
      signal: isSignalFunction ? signal() : signal,
      /**
       * Fastly specific
       */
      backend: this.options.backend
    };
    if (!this.hasCredentials) {
      console.warn(
        "[Upstash Redis] Redis client was initialized without url or token. Failed to execute command."
      );
    }
    if (this.readYourWrites) {
      const newHeader = this.upstashSyncToken;
      this.headers["upstash-sync-token"] = newHeader;
    }
    let res = null;
    let error = null;
    for (let i = 0; i <= this.retry.attempts; i++) {
      try {
        res = await fetch(requestUrl, requestOptions);
        break;
      } catch (error_) {
        if (requestOptions.signal?.aborted && isSignalFunction) {
          throw error_;
        } else if (requestOptions.signal?.aborted) {
          const myBlob = new Blob([
            JSON.stringify({ result: requestOptions.signal.reason ?? "Aborted" })
          ]);
          const myOptions = {
            status: 200,
            statusText: requestOptions.signal.reason ?? "Aborted"
          };
          res = new Response(myBlob, myOptions);
          break;
        }
        error = error_;
        if (i < this.retry.attempts) {
          await new Promise((r) => setTimeout(r, this.retry.backoff(i)));
        }
      }
    }
    if (!res) {
      throw error ?? new Error("Exhausted all retries");
    }
    if (!res.ok) {
      let body2;
      const rawBody2 = await res.text();
      try {
        body2 = JSON.parse(rawBody2);
      } catch (error2) {
        throw new UpstashJSONParseError(rawBody2, { cause: error2 });
      }
      throw new UpstashError(`${body2.error}, command was: ${JSON.stringify(req.body)}`);
    }
    if (this.readYourWrites) {
      const headers = res.headers;
      this.upstashSyncToken = headers.get("upstash-sync-token") ?? "";
    }
    if (isEventStream && req && req.onMessage && res.body) {
      const reader = res.body.getReader();
      const decoder2 = new TextDecoder();
      (async () => {
        try {
          let buffer = "";
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            buffer += decoder2.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";
            if (buffer.length > MAX_BUFFER_SIZE) {
              throw new Error("Buffer size exceeded (1MB)");
            }
            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6);
                req.onMessage?.(data);
              }
            }
          }
        } catch (error2) {
          if (error2 instanceof Error && error2.name === "AbortError") {
          } else {
            console.error("Stream reading error:", error2);
          }
        } finally {
          try {
            await reader.cancel();
          } catch {
          }
        }
      })();
      return { result: 1 };
    }
    let body;
    const rawBody = await res.text();
    try {
      body = JSON.parse(rawBody);
    } catch (error2) {
      throw new UpstashJSONParseError(rawBody, { cause: error2 });
    }
    if (this.readYourWrites) {
      const headers = res.headers;
      this.upstashSyncToken = headers.get("upstash-sync-token") ?? "";
    }
    if (this.options.responseEncoding === "base64") {
      if (Array.isArray(body)) {
        return body.map(({ result: result2, error: error2 }) => ({
          result: decode(result2),
          error: error2
        }));
      }
      const result = decode(body.result);
      return { result, error: body.error };
    }
    return body;
  }
};
function base64decode(b64) {
  let dec = "";
  try {
    const binString = atob(b64);
    const size = binString.length;
    const bytes = new Uint8Array(size);
    for (let i = 0; i < size; i++) {
      bytes[i] = binString.charCodeAt(i);
    }
    dec = new TextDecoder().decode(bytes);
  } catch {
    dec = b64;
  }
  return dec;
}
function decode(raw) {
  let result = void 0;
  switch (typeof raw) {
    case "undefined": {
      return raw;
    }
    case "number": {
      result = raw;
      break;
    }
    case "object": {
      if (Array.isArray(raw)) {
        result = raw.map(
          (v) => typeof v === "string" ? base64decode(v) : Array.isArray(v) ? v.map((element) => decode(element)) : v
        );
      } else {
        result = null;
      }
      break;
    }
    case "string": {
      result = raw === "OK" ? "OK" : base64decode(raw);
      break;
    }
    default: {
      break;
    }
  }
  return result;
}
function merge(obj, key, value) {
  if (!value) {
    return obj;
  }
  obj[key] = obj[key] ? [obj[key], value].join(",") : value;
  return obj;
}
var defaultSerializer = (c) => {
  switch (typeof c) {
    case "string":
    case "number":
    case "boolean": {
      return c;
    }
    default: {
      return JSON.stringify(c);
    }
  }
};
var Command = class {
  command;
  serialize;
  deserialize;
  headers;
  path;
  onMessage;
  isStreaming;
  signal;
  /**
   * Create a new command instance.
   *
   * You can define a custom `deserialize` function. By default we try to deserialize as json.
   */
  constructor(command, opts) {
    this.serialize = defaultSerializer;
    this.deserialize = opts?.automaticDeserialization === void 0 || opts.automaticDeserialization ? opts?.deserialize ?? parseResponse : (x) => x;
    this.command = command.map((c) => this.serialize(c));
    this.headers = opts?.headers;
    this.path = opts?.path;
    this.onMessage = opts?.streamOptions?.onMessage;
    this.isStreaming = opts?.streamOptions?.isStreaming ?? false;
    this.signal = opts?.streamOptions?.signal;
    if (opts?.latencyLogging) {
      const originalExec = this.exec.bind(this);
      this.exec = async (client) => {
        const start = performance.now();
        const result = await originalExec(client);
        const end = performance.now();
        const loggerResult = (end - start).toFixed(2);
        console.log(
          `Latency for \x1B[38;2;19;185;39m${this.command[0].toString().toUpperCase()}\x1B[0m: \x1B[38;2;0;255;255m${loggerResult} ms\x1B[0m`
        );
        return result;
      };
    }
  }
  /**
   * Execute the command using a client.
   */
  async exec(client) {
    const { result, error } = await client.request({
      body: this.command,
      path: this.path,
      upstashSyncToken: client.upstashSyncToken,
      headers: this.headers,
      onMessage: this.onMessage,
      isStreaming: this.isStreaming,
      signal: this.signal
    });
    if (error) {
      throw new UpstashError(error);
    }
    if (result === void 0) {
      throw new TypeError("Request did not return a result");
    }
    return this.deserialize(result);
  }
};
var ExecCommand = class extends Command {
  constructor(cmd, opts) {
    const normalizedCmd = cmd.map((arg) => typeof arg === "string" ? arg : String(arg));
    super(normalizedCmd, opts);
  }
};
var FIELD_TYPES = [
  "TEXT",
  "U64",
  "I64",
  "F64",
  "BOOL",
  "DATE",
  "KEYWORD",
  "FACET"
];
function isFieldType(value) {
  return typeof value === "string" && FIELD_TYPES.includes(value);
}
function isDetailedField(value) {
  return typeof value === "object" && value !== null && "type" in value && isFieldType(value.type);
}
function isNestedSchema(value) {
  return typeof value === "object" && value !== null && !isDetailedField(value);
}
function flattenSchema(schema, pathPrefix = []) {
  const fields = [];
  for (const [key, value] of Object.entries(schema)) {
    const currentPath = [...pathPrefix, key];
    const pathString = currentPath.join(".");
    if (isFieldType(value)) {
      fields.push({
        path: pathString,
        type: value
      });
    } else if (isDetailedField(value)) {
      fields.push({
        path: pathString,
        type: value.type,
        fast: "fast" in value ? value.fast : void 0,
        noTokenize: "noTokenize" in value ? value.noTokenize : void 0,
        noStem: "noStem" in value ? value.noStem : void 0,
        from: "from" in value ? value.from : void 0
      });
    } else if (isNestedSchema(value)) {
      const nestedFields = flattenSchema(value, currentPath);
      fields.push(...nestedFields);
    }
  }
  return fields;
}
function deserializeQueryResponse(rawResponse) {
  return rawResponse.map((itemRaw) => {
    const raw = itemRaw;
    const key = raw[0];
    const score = Number(raw[1]);
    const rawFields = raw[2];
    if (rawFields === void 0) {
      return { key, score };
    }
    if (!Array.isArray(rawFields) || rawFields.length === 0) {
      return { key, score, data: {} };
    }
    let data = {};
    for (const fieldRaw of rawFields) {
      const key2 = fieldRaw[0];
      const value = fieldRaw[1];
      const pathParts = key2.split(".");
      if (pathParts.length === 1) {
        data[key2] = value;
      } else {
        let currentObj = data;
        for (let i = 0; i < pathParts.length - 1; i++) {
          const pathPart = pathParts[i];
          if (!(pathPart in currentObj)) {
            currentObj[pathPart] = {};
          }
          currentObj = currentObj[pathPart];
        }
        currentObj[pathParts.at(-1)] = value;
      }
    }
    if ("$" in data) {
      data = data["$"];
    }
    return { key, score, data };
  });
}
function deserializeDescribeResponse(rawResponse) {
  const description = {};
  for (let i = 0; i < rawResponse.length; i += 2) {
    const descriptor = rawResponse[i];
    switch (descriptor) {
      case "name": {
        description["name"] = rawResponse[i + 1];
        break;
      }
      case "type": {
        description["dataType"] = rawResponse[i + 1].toLowerCase();
        break;
      }
      case "prefixes": {
        description["prefixes"] = rawResponse[i + 1];
        break;
      }
      case "language": {
        description["language"] = rawResponse[i + 1];
        break;
      }
      case "schema": {
        const schema = {};
        for (const fieldDescription of rawResponse[i + 1]) {
          const fieldName = fieldDescription[0];
          const fieldInfo = { type: fieldDescription[1] };
          if (fieldDescription.length > 2) {
            for (let j = 2; j < fieldDescription.length; j++) {
              const fieldOption = fieldDescription[j];
              switch (fieldOption) {
                case "NOSTEM": {
                  fieldInfo.noStem = true;
                  break;
                }
                case "NOTOKENIZE": {
                  fieldInfo.noTokenize = true;
                  break;
                }
                case "FAST": {
                  fieldInfo.fast = true;
                  break;
                }
                case "FROM": {
                  fieldInfo.from = fieldDescription[++j];
                  break;
                }
              }
            }
          }
          schema[fieldName] = fieldInfo;
        }
        description["schema"] = schema;
        break;
      }
    }
  }
  return description;
}
function parseCountResponse(rawResponse) {
  return typeof rawResponse === "number" ? rawResponse : Number.parseInt(rawResponse, 10);
}
function deserializeAggregateResponse(rawResponse) {
  return parseAggregationArray(rawResponse);
}
function parseAggregationArray(arr) {
  const result = {};
  for (let i = 0; i < arr.length; i += 2) {
    const key = arr[i];
    const value = arr[i + 1];
    if (Array.isArray(value)) {
      if (value.length > 0 && typeof value[0] === "string") {
        result[key] = value[0] === "buckets" ? parseBucketsValue(value) : parseStatsValue(value);
      } else {
        result[key] = parseAggregationArray(value);
      }
    } else {
      result[key] = value;
    }
  }
  return result;
}
function coerceNumericString(value) {
  if (typeof value === "string" && value !== "" && !Number.isNaN(Number(value))) {
    return Number(value);
  }
  return value;
}
function parseStatsValue(arr) {
  const result = {};
  for (let i = 0; i < arr.length; i += 2) {
    const key = arr[i];
    const value = arr[i + 1];
    if (Array.isArray(value) && value.length > 0) {
      if (typeof value[0] === "string") {
        result[key] = parseStatsValue(value);
      } else if (Array.isArray(value[0]) && typeof value[0][0] === "string") {
        result[key] = value.map((item) => parseStatsValue(item));
      } else {
        result[key] = value;
      }
    } else {
      result[key] = coerceNumericString(value);
    }
  }
  return result;
}
function parseBucketsValue(arr) {
  if (arr[0] === "buckets" && Array.isArray(arr[1])) {
    const result = {
      buckets: arr[1].map((bucket) => {
        const bucketObj = {};
        for (let i = 0; i < bucket.length; i += 2) {
          const key = bucket[i];
          const value = bucket[i + 1];
          bucketObj[key] = Array.isArray(value) && value.length > 0 && typeof value[0] === "string" ? parseStatsValue(value) : value;
        }
        return bucketObj;
      })
    };
    for (let i = 2; i < arr.length; i += 2) {
      result[arr[i]] = arr[i + 1];
    }
    return result;
  }
  return arr;
}
function buildQueryCommand(redisCommand, name, options) {
  const query = JSON.stringify(options?.filter ?? {});
  const command = [redisCommand, name, query];
  if (options?.limit !== void 0) {
    command.push("LIMIT", options.limit.toString());
  }
  if (options?.offset !== void 0) {
    command.push("OFFSET", options.offset.toString());
  }
  if (options?.select && Object.keys(options.select).length === 0) {
    command.push("NOCONTENT");
  }
  if (options) {
    if ("orderBy" in options && options.orderBy) {
      command.push("ORDERBY");
      for (const [field, direction] of Object.entries(options.orderBy)) {
        command.push(field, direction);
      }
    } else if ("scoreFunc" in options && options.scoreFunc) {
      command.push("SCOREFUNC", ...buildScoreFunc(options.scoreFunc));
    }
  }
  if (options?.highlight) {
    command.push(
      "HIGHLIGHT",
      "FIELDS",
      options.highlight.fields.length.toString(),
      ...options.highlight.fields
    );
    if (options.highlight.preTag && options.highlight.postTag) {
      command.push("TAGS", options.highlight.preTag, options.highlight.postTag);
    }
  }
  if (options?.select && Object.keys(options.select).length > 0) {
    command.push(
      "SELECT",
      Object.keys(options.select).length.toString(),
      ...Object.keys(options.select)
    );
  }
  return command;
}
function buildScoreFunc(scoreBy) {
  const result = [];
  if (typeof scoreBy === "string") {
    result.push("FIELDVALUE", scoreBy);
  } else if ("fields" in scoreBy) {
    if (scoreBy.combineMode) {
      result.push("COMBINEMODE", scoreBy.combineMode.toUpperCase());
    }
    if (scoreBy.scoreMode) {
      result.push("SCOREMODE", scoreBy.scoreMode.toUpperCase());
    }
    for (const field of scoreBy.fields) {
      result.push(...buildScoreFuncField(field));
    }
  } else {
    result.push(...buildScoreFuncField(scoreBy));
  }
  return result;
}
function buildScoreFuncField(field) {
  const result = [];
  if (typeof field === "string") {
    result.push("FIELDVALUE", field);
  } else {
    if (field.scoreMode) {
      result.push("SCOREMODE", field.scoreMode.toUpperCase());
    }
    result.push("FIELDVALUE", field.field);
    if (field.modifier) {
      result.push("MODIFIER", field.modifier.toUpperCase());
    }
    if (field.factor !== void 0) {
      result.push("FACTOR", field.factor.toString());
    }
    if (field.missing !== void 0) {
      result.push("MISSING", field.missing.toString());
    }
  }
  return result;
}
function buildCreateIndexCommand(params) {
  const { name, schema, dataType, prefix, language, skipInitialScan, existsOk } = params;
  const prefixArray = Array.isArray(prefix) ? prefix : [prefix];
  const payload = [
    name,
    ...skipInitialScan ? ["SKIPINITIALSCAN"] : [],
    ...existsOk ? ["EXISTSOK"] : [],
    "ON",
    dataType.toUpperCase(),
    "PREFIX",
    prefixArray.length.toString(),
    ...prefixArray,
    ...language ? ["LANGUAGE", language] : [],
    "SCHEMA"
  ];
  const fields = flattenSchema(schema);
  for (const field of fields) {
    payload.push(field.path, field.type);
    if (field.fast) {
      payload.push("FAST");
    }
    if (field.noTokenize) {
      payload.push("NOTOKENIZE");
    }
    if (field.noStem) {
      payload.push("NOSTEM");
    }
    if (field.from) {
      payload.push("FROM", field.from);
    }
  }
  return ["SEARCH.CREATE", ...payload];
}
function buildAggregateCommand(name, options) {
  const query = JSON.stringify(options?.filter ?? {});
  const aggregations = JSON.stringify(options.aggregations);
  return ["SEARCH.AGGREGATE", name, query, aggregations];
}
var SearchIndex = class {
  name;
  schema;
  client;
  constructor({ name, schema, client }) {
    this.name = name;
    this.schema = schema;
    this.client = client;
  }
  async waitIndexing() {
    const command = ["SEARCH.WAITINDEXING", this.name];
    return await new ExecCommand(command).exec(this.client);
  }
  async describe() {
    const command = ["SEARCH.DESCRIBE", this.name];
    const rawResult = await new ExecCommand(command).exec(
      this.client
    );
    if (!rawResult) return null;
    return deserializeDescribeResponse(rawResult);
  }
  async query(options) {
    const command = buildQueryCommand("SEARCH.QUERY", this.name, options);
    const rawResult = await new ExecCommand(command).exec(
      this.client
    );
    if (!rawResult) return rawResult;
    return deserializeQueryResponse(rawResult);
  }
  async aggregate(options) {
    const command = buildAggregateCommand(this.name, options);
    const rawResult = await new ExecCommand(
      command
    ).exec(this.client);
    return deserializeAggregateResponse(rawResult);
  }
  async count({ filter }) {
    const command = buildQueryCommand("SEARCH.COUNT", this.name, { filter });
    const rawResult = await new ExecCommand(command).exec(
      this.client
    );
    return { count: parseCountResponse(rawResult) };
  }
  async drop() {
    const command = ["SEARCH.DROP", this.name];
    const result = await new ExecCommand(command).exec(this.client);
    return result;
  }
  async addAlias({ alias }) {
    const command = ["SEARCH.ALIASADD", alias, this.name];
    const result = await new ExecCommand(command).exec(this.client);
    return result;
  }
};
async function createIndex(client, params) {
  const { name, schema } = params;
  const createIndexCommand = buildCreateIndexCommand(params);
  await new ExecCommand(createIndexCommand).exec(client);
  return initIndex(client, { name, schema });
}
function initIndex(client, params) {
  const { name, schema } = params;
  return new SearchIndex({ name, schema, client });
}
async function listAliases(client) {
  const command = ["SEARCH.LISTALIASES"];
  const rawResult = await new ExecCommand(command).exec(client);
  if (rawResult === 0 || Array.isArray(rawResult) && rawResult.length === 0) {
    return {};
  }
  if (!Array.isArray(rawResult)) {
    return {};
  }
  const aliases = {};
  for (const pair of rawResult) {
    if (Array.isArray(pair) && pair.length === 2) {
      const [alias, index] = pair;
      aliases[alias] = index;
    }
  }
  return aliases;
}
async function addAlias(client, { indexName, alias }) {
  const command = ["SEARCH.ALIASADD", alias, indexName];
  const result = await new ExecCommand(command).exec(client);
  return result;
}
async function delAlias(client, { alias }) {
  const command = ["SEARCH.ALIASDEL", alias];
  const result = await new ExecCommand(command).exec(client);
  return result;
}
function deserialize(result) {
  if (result.length === 0) {
    return null;
  }
  const obj = {};
  for (let i = 0; i < result.length; i += 2) {
    const key = result[i];
    const value = result[i + 1];
    try {
      obj[key] = JSON.parse(value);
    } catch {
      obj[key] = value;
    }
  }
  return obj;
}
var HRandFieldCommand = class extends Command {
  constructor(cmd, opts) {
    const command = ["hrandfield", cmd[0]];
    if (typeof cmd[1] === "number") {
      command.push(cmd[1]);
    }
    if (cmd[2]) {
      command.push("WITHVALUES");
    }
    super(command, {
      // @ts-expect-error to silence compiler
      deserialize: cmd[2] ? (result) => deserialize(result) : opts?.deserialize,
      ...opts
    });
  }
};
var AppendCommand = class extends Command {
  constructor(cmd, opts) {
    super(["append", ...cmd], opts);
  }
};
var BitCountCommand = class extends Command {
  constructor([key, start, end], opts) {
    const command = ["bitcount", key];
    if (typeof start === "number") {
      command.push(start);
    }
    if (typeof end === "number") {
      command.push(end);
    }
    super(command, opts);
  }
};
var BitFieldCommand = class {
  constructor(args, client, opts, execOperation = (command) => command.exec(this.client)) {
    this.client = client;
    this.opts = opts;
    this.execOperation = execOperation;
    this.command = ["bitfield", ...args];
  }
  command;
  chain(...args) {
    this.command.push(...args);
    return this;
  }
  get(...args) {
    return this.chain("get", ...args);
  }
  set(...args) {
    return this.chain("set", ...args);
  }
  incrby(...args) {
    return this.chain("incrby", ...args);
  }
  overflow(overflow) {
    return this.chain("overflow", overflow);
  }
  exec() {
    const command = new Command(this.command, this.opts);
    return this.execOperation(command);
  }
};
var BitOpCommand = class extends Command {
  constructor(cmd, opts) {
    super(["bitop", ...cmd], opts);
  }
};
var BitPosCommand = class extends Command {
  constructor(cmd, opts) {
    super(["bitpos", ...cmd], opts);
  }
};
var ClientSetInfoCommand = class extends Command {
  constructor([attribute, value], opts) {
    super(["CLIENT", "SETINFO", attribute.toUpperCase(), value], opts);
  }
};
var CopyCommand = class extends Command {
  constructor([key, destinationKey, opts], commandOptions) {
    super(["COPY", key, destinationKey, ...opts?.replace ? ["REPLACE"] : []], {
      ...commandOptions,
      deserialize(result) {
        if (result > 0) {
          return "COPIED";
        }
        return "NOT_COPIED";
      }
    });
  }
};
var DBSizeCommand = class extends Command {
  constructor(opts) {
    super(["dbsize"], opts);
  }
};
var DecrCommand = class extends Command {
  constructor(cmd, opts) {
    super(["decr", ...cmd], opts);
  }
};
var DecrByCommand = class extends Command {
  constructor(cmd, opts) {
    super(["decrby", ...cmd], opts);
  }
};
var DelCommand = class extends Command {
  constructor(cmd, opts) {
    super(["del", ...cmd], opts);
  }
};
var EchoCommand = class extends Command {
  constructor(cmd, opts) {
    super(["echo", ...cmd], opts);
  }
};
var EvalROCommand = class extends Command {
  constructor([script, keys, args], opts) {
    super(["eval_ro", script, keys.length, ...keys, ...args ?? []], opts);
  }
};
var EvalCommand = class extends Command {
  constructor([script, keys, args], opts) {
    super(["eval", script, keys.length, ...keys, ...args ?? []], opts);
  }
};
var EvalshaROCommand = class extends Command {
  constructor([sha, keys, args], opts) {
    super(["evalsha_ro", sha, keys.length, ...keys, ...args ?? []], opts);
  }
};
var EvalshaCommand = class extends Command {
  constructor([sha, keys, args], opts) {
    super(["evalsha", sha, keys.length, ...keys, ...args ?? []], opts);
  }
};
var ExistsCommand = class extends Command {
  constructor(cmd, opts) {
    super(["exists", ...cmd], opts);
  }
};
var ExpireCommand = class extends Command {
  constructor(cmd, opts) {
    super(["expire", ...cmd.filter(Boolean)], opts);
  }
};
var ExpireAtCommand = class extends Command {
  constructor(cmd, opts) {
    super(["expireat", ...cmd], opts);
  }
};
var FCallCommand = class extends Command {
  constructor([functionName, keys, args], opts) {
    super(["fcall", functionName, ...keys ? [keys.length, ...keys] : [0], ...args ?? []], opts);
  }
};
var FCallRoCommand = class extends Command {
  constructor([functionName, keys, args], opts) {
    super(
      ["fcall_ro", functionName, ...keys ? [keys.length, ...keys] : [0], ...args ?? []],
      opts
    );
  }
};
var FlushAllCommand = class extends Command {
  constructor(args, opts) {
    const command = ["flushall"];
    if (args && args.length > 0 && args[0].async) {
      command.push("async");
    }
    super(command, opts);
  }
};
var FlushDBCommand = class extends Command {
  constructor([opts], cmdOpts) {
    const command = ["flushdb"];
    if (opts?.async) {
      command.push("async");
    }
    super(command, cmdOpts);
  }
};
var FunctionDeleteCommand = class extends Command {
  constructor([libraryName], opts) {
    super(["function", "delete", libraryName], opts);
  }
};
var FunctionFlushCommand = class extends Command {
  constructor(opts) {
    super(["function", "flush"], opts);
  }
};
var FunctionListCommand = class extends Command {
  constructor([args], opts) {
    const command = ["function", "list"];
    if (args?.libraryName) {
      command.push("libraryname", args.libraryName);
    }
    if (args?.withCode) {
      command.push("withcode");
    }
    super(command, { deserialize: deserialize2, ...opts });
  }
};
function deserialize2(result) {
  if (!Array.isArray(result)) return [];
  return result.map((libRaw) => {
    const lib = kvArrayToObject(libRaw);
    const functionsParsed = lib.functions.map(
      (fnRaw) => kvArrayToObject(fnRaw)
    );
    return {
      libraryName: lib.library_name,
      engine: lib.engine,
      functions: functionsParsed.map((fn) => ({
        name: fn.name,
        description: fn.description ?? void 0,
        flags: fn.flags
      })),
      libraryCode: lib.library_code
    };
  });
}
var FunctionLoadCommand = class extends Command {
  constructor([args], opts) {
    super(["function", "load", ...args.replace ? ["replace"] : [], args.code], opts);
  }
};
var FunctionStatsCommand = class extends Command {
  constructor(opts) {
    super(["function", "stats"], { deserialize: deserialize3, ...opts });
  }
};
function deserialize3(result) {
  const rawEngines = kvArrayToObject(kvArrayToObject(result).engines);
  const parsedEngines = Object.fromEntries(
    Object.entries(rawEngines).map(([key, value]) => [key, kvArrayToObject(value)])
  );
  const final = {
    engines: Object.fromEntries(
      Object.entries(parsedEngines).map(([key, value]) => [
        key,
        {
          librariesCount: value.libraries_count,
          functionsCount: value.functions_count
        }
      ])
    )
  };
  return final;
}
var GeoAddCommand = class extends Command {
  constructor([key, arg1, ...arg2], opts) {
    const command = ["geoadd", key];
    if ("nx" in arg1 && arg1.nx) {
      command.push("nx");
    } else if ("xx" in arg1 && arg1.xx) {
      command.push("xx");
    }
    if ("ch" in arg1 && arg1.ch) {
      command.push("ch");
    }
    if ("latitude" in arg1 && arg1.latitude) {
      command.push(arg1.longitude, arg1.latitude, arg1.member);
    }
    command.push(
      ...arg2.flatMap(({ latitude, longitude, member }) => [longitude, latitude, member])
    );
    super(command, opts);
  }
};
var GeoDistCommand = class extends Command {
  constructor([key, member1, member2, unit = "M"], opts) {
    super(["GEODIST", key, member1, member2, unit], opts);
  }
};
var GeoHashCommand = class extends Command {
  constructor(cmd, opts) {
    const [key] = cmd;
    const members = Array.isArray(cmd[1]) ? cmd[1] : cmd.slice(1);
    super(["GEOHASH", key, ...members], opts);
  }
};
var GeoPosCommand = class extends Command {
  constructor(cmd, opts) {
    const [key] = cmd;
    const members = Array.isArray(cmd[1]) ? cmd[1] : cmd.slice(1);
    super(["GEOPOS", key, ...members], {
      deserialize: (result) => transform(result),
      ...opts
    });
  }
};
function transform(result) {
  const final = [];
  for (const pos of result) {
    if (!pos?.[0] || !pos?.[1]) {
      continue;
    }
    final.push({ lng: Number.parseFloat(pos[0]), lat: Number.parseFloat(pos[1]) });
  }
  return final;
}
var GeoSearchCommand = class extends Command {
  constructor([key, centerPoint, shape, order, opts], commandOptions) {
    const command = ["GEOSEARCH", key];
    if (centerPoint.type === "FROMMEMBER" || centerPoint.type === "frommember") {
      command.push(centerPoint.type, centerPoint.member);
    }
    if (centerPoint.type === "FROMLONLAT" || centerPoint.type === "fromlonlat") {
      command.push(centerPoint.type, centerPoint.coordinate.lon, centerPoint.coordinate.lat);
    }
    if (shape.type === "BYRADIUS" || shape.type === "byradius") {
      command.push(shape.type, shape.radius, shape.radiusType);
    }
    if (shape.type === "BYBOX" || shape.type === "bybox") {
      command.push(shape.type, shape.rect.width, shape.rect.height, shape.rectType);
    }
    command.push(order);
    if (opts?.count) {
      command.push("COUNT", opts.count.limit, ...opts.count.any ? ["ANY"] : []);
    }
    const transform2 = (result) => {
      if (!opts?.withCoord && !opts?.withDist && !opts?.withHash) {
        return result.map((member) => {
          try {
            return { member: JSON.parse(member) };
          } catch {
            return { member };
          }
        });
      }
      return result.map((members) => {
        let counter = 1;
        const obj = {};
        try {
          obj.member = JSON.parse(members[0]);
        } catch {
          obj.member = members[0];
        }
        if (opts.withDist) {
          obj.dist = Number.parseFloat(members[counter++]);
        }
        if (opts.withHash) {
          obj.hash = members[counter++].toString();
        }
        if (opts.withCoord) {
          obj.coord = {
            long: Number.parseFloat(members[counter][0]),
            lat: Number.parseFloat(members[counter][1])
          };
        }
        return obj;
      });
    };
    super(
      [
        ...command,
        ...opts?.withCoord ? ["WITHCOORD"] : [],
        ...opts?.withDist ? ["WITHDIST"] : [],
        ...opts?.withHash ? ["WITHHASH"] : []
      ],
      {
        deserialize: transform2,
        ...commandOptions
      }
    );
  }
};
var GeoSearchStoreCommand = class extends Command {
  constructor([destination, key, centerPoint, shape, order, opts], commandOptions) {
    const command = ["GEOSEARCHSTORE", destination, key];
    if (centerPoint.type === "FROMMEMBER" || centerPoint.type === "frommember") {
      command.push(centerPoint.type, centerPoint.member);
    }
    if (centerPoint.type === "FROMLONLAT" || centerPoint.type === "fromlonlat") {
      command.push(centerPoint.type, centerPoint.coordinate.lon, centerPoint.coordinate.lat);
    }
    if (shape.type === "BYRADIUS" || shape.type === "byradius") {
      command.push(shape.type, shape.radius, shape.radiusType);
    }
    if (shape.type === "BYBOX" || shape.type === "bybox") {
      command.push(shape.type, shape.rect.width, shape.rect.height, shape.rectType);
    }
    command.push(order);
    if (opts?.count) {
      command.push("COUNT", opts.count.limit, ...opts.count.any ? ["ANY"] : []);
    }
    super([...command, ...opts?.storeDist ? ["STOREDIST"] : []], commandOptions);
  }
};
var GetCommand = class extends Command {
  constructor(cmd, opts) {
    super(["get", ...cmd], opts);
  }
};
var GetBitCommand = class extends Command {
  constructor(cmd, opts) {
    super(["getbit", ...cmd], opts);
  }
};
var GetDelCommand = class extends Command {
  constructor(cmd, opts) {
    super(["getdel", ...cmd], opts);
  }
};
var GetExCommand = class extends Command {
  constructor([key, opts], cmdOpts) {
    const command = ["getex", key];
    if (opts) {
      if ("ex" in opts && typeof opts.ex === "number") {
        command.push("ex", opts.ex);
      } else if ("px" in opts && typeof opts.px === "number") {
        command.push("px", opts.px);
      } else if ("exat" in opts && typeof opts.exat === "number") {
        command.push("exat", opts.exat);
      } else if ("pxat" in opts && typeof opts.pxat === "number") {
        command.push("pxat", opts.pxat);
      } else if ("persist" in opts && opts.persist) {
        command.push("persist");
      }
    }
    super(command, cmdOpts);
  }
};
var GetRangeCommand = class extends Command {
  constructor(cmd, opts) {
    super(["getrange", ...cmd], opts);
  }
};
var GetSetCommand = class extends Command {
  constructor(cmd, opts) {
    super(["getset", ...cmd], opts);
  }
};
var HDelCommand = class extends Command {
  constructor(cmd, opts) {
    super(["hdel", ...cmd], opts);
  }
};
var HExistsCommand = class extends Command {
  constructor(cmd, opts) {
    super(["hexists", ...cmd], opts);
  }
};
var HExpireCommand = class extends Command {
  constructor(cmd, opts) {
    const [key, fields, seconds, option] = cmd;
    const fieldArray = Array.isArray(fields) ? fields : [fields];
    super(
      [
        "hexpire",
        key,
        seconds,
        ...option ? [option] : [],
        "FIELDS",
        fieldArray.length,
        ...fieldArray
      ],
      opts
    );
  }
};
var HExpireAtCommand = class extends Command {
  constructor(cmd, opts) {
    const [key, fields, timestamp, option] = cmd;
    const fieldArray = Array.isArray(fields) ? fields : [fields];
    super(
      [
        "hexpireat",
        key,
        timestamp,
        ...option ? [option] : [],
        "FIELDS",
        fieldArray.length,
        ...fieldArray
      ],
      opts
    );
  }
};
var HExpireTimeCommand = class extends Command {
  constructor(cmd, opts) {
    const [key, fields] = cmd;
    const fieldArray = Array.isArray(fields) ? fields : [fields];
    super(["hexpiretime", key, "FIELDS", fieldArray.length, ...fieldArray], opts);
  }
};
var HPersistCommand = class extends Command {
  constructor(cmd, opts) {
    const [key, fields] = cmd;
    const fieldArray = Array.isArray(fields) ? fields : [fields];
    super(["hpersist", key, "FIELDS", fieldArray.length, ...fieldArray], opts);
  }
};
var HPExpireCommand = class extends Command {
  constructor(cmd, opts) {
    const [key, fields, milliseconds, option] = cmd;
    const fieldArray = Array.isArray(fields) ? fields : [fields];
    super(
      [
        "hpexpire",
        key,
        milliseconds,
        ...option ? [option] : [],
        "FIELDS",
        fieldArray.length,
        ...fieldArray
      ],
      opts
    );
  }
};
var HPExpireAtCommand = class extends Command {
  constructor(cmd, opts) {
    const [key, fields, timestamp, option] = cmd;
    const fieldArray = Array.isArray(fields) ? fields : [fields];
    super(
      [
        "hpexpireat",
        key,
        timestamp,
        ...option ? [option] : [],
        "FIELDS",
        fieldArray.length,
        ...fieldArray
      ],
      opts
    );
  }
};
var HPExpireTimeCommand = class extends Command {
  constructor(cmd, opts) {
    const [key, fields] = cmd;
    const fieldArray = Array.isArray(fields) ? fields : [fields];
    super(["hpexpiretime", key, "FIELDS", fieldArray.length, ...fieldArray], opts);
  }
};
var HPTtlCommand = class extends Command {
  constructor(cmd, opts) {
    const [key, fields] = cmd;
    const fieldArray = Array.isArray(fields) ? fields : [fields];
    super(["hpttl", key, "FIELDS", fieldArray.length, ...fieldArray], opts);
  }
};
var HGetCommand = class extends Command {
  constructor(cmd, opts) {
    super(["hget", ...cmd], opts);
  }
};
function deserialize4(result) {
  if (result.length === 0) {
    return null;
  }
  const obj = {};
  for (let i = 0; i < result.length; i += 2) {
    const key = result[i];
    const value = result[i + 1];
    try {
      const valueIsNumberAndNotSafeInteger = !Number.isNaN(Number(value)) && !Number.isSafeInteger(Number(value));
      obj[key] = valueIsNumberAndNotSafeInteger ? value : JSON.parse(value);
    } catch {
      obj[key] = value;
    }
  }
  return obj;
}
var HGetAllCommand = class extends Command {
  constructor(cmd, opts) {
    super(["hgetall", ...cmd], {
      deserialize: (result) => deserialize4(result),
      ...opts
    });
  }
};
function deserialize5(fields, result) {
  if (result.every((field) => field === null)) {
    return null;
  }
  const obj = {};
  for (const [i, field] of fields.entries()) {
    try {
      obj[field] = JSON.parse(result[i]);
    } catch {
      obj[field] = result[i];
    }
  }
  return obj;
}
var HMGetCommand = class extends Command {
  constructor([key, ...fields], opts) {
    super(["hmget", key, ...fields], {
      deserialize: (result) => deserialize5(fields, result),
      ...opts
    });
  }
};
var HGetDelCommand = class extends Command {
  constructor([key, ...fields], opts) {
    super(["hgetdel", key, "FIELDS", fields.length, ...fields], {
      deserialize: (result) => deserialize5(fields.map(String), result),
      ...opts
    });
  }
};
var HGetExCommand = class extends Command {
  constructor([key, opts, ...fields], cmdOpts) {
    const command = ["hgetex", key];
    if ("ex" in opts && typeof opts.ex === "number") {
      command.push("EX", opts.ex);
    } else if ("px" in opts && typeof opts.px === "number") {
      command.push("PX", opts.px);
    } else if ("exat" in opts && typeof opts.exat === "number") {
      command.push("EXAT", opts.exat);
    } else if ("pxat" in opts && typeof opts.pxat === "number") {
      command.push("PXAT", opts.pxat);
    } else if ("persist" in opts && opts.persist) {
      command.push("PERSIST");
    }
    command.push("FIELDS", fields.length, ...fields);
    super(command, {
      deserialize: (result) => deserialize5(fields.map(String), result),
      ...cmdOpts
    });
  }
};
var HIncrByCommand = class extends Command {
  constructor(cmd, opts) {
    super(["hincrby", ...cmd], opts);
  }
};
var HIncrByFloatCommand = class extends Command {
  constructor(cmd, opts) {
    super(["hincrbyfloat", ...cmd], opts);
  }
};
var HKeysCommand = class extends Command {
  constructor([key], opts) {
    super(["hkeys", key], opts);
  }
};
var HLenCommand = class extends Command {
  constructor(cmd, opts) {
    super(["hlen", ...cmd], opts);
  }
};
var HMSetCommand = class extends Command {
  constructor([key, kv], opts) {
    super(["hmset", key, ...Object.entries(kv).flatMap(([field, value]) => [field, value])], opts);
  }
};
var HScanCommand = class extends Command {
  constructor([key, cursor, cmdOpts], opts) {
    const command = ["hscan", key, cursor];
    if (cmdOpts?.match) {
      command.push("match", cmdOpts.match);
    }
    if (typeof cmdOpts?.count === "number") {
      command.push("count", cmdOpts.count);
    }
    super(command, {
      deserialize: deserializeScanResponse,
      ...opts
    });
  }
};
var HSetCommand = class extends Command {
  constructor([key, kv], opts) {
    super(["hset", key, ...Object.entries(kv).flatMap(([field, value]) => [field, value])], opts);
  }
};
var HSetExCommand = class extends Command {
  constructor([key, opts, kv], cmdOpts) {
    const command = ["hsetex", key];
    if (opts.conditional) {
      command.push(opts.conditional.toUpperCase());
    }
    if (opts.expiration) {
      if ("ex" in opts.expiration && typeof opts.expiration.ex === "number") {
        command.push("EX", opts.expiration.ex);
      } else if ("px" in opts.expiration && typeof opts.expiration.px === "number") {
        command.push("PX", opts.expiration.px);
      } else if ("exat" in opts.expiration && typeof opts.expiration.exat === "number") {
        command.push("EXAT", opts.expiration.exat);
      } else if ("pxat" in opts.expiration && typeof opts.expiration.pxat === "number") {
        command.push("PXAT", opts.expiration.pxat);
      } else if ("keepttl" in opts.expiration && opts.expiration.keepttl) {
        command.push("KEEPTTL");
      }
    }
    const entries = Object.entries(kv);
    command.push("FIELDS", entries.length);
    for (const [field, value] of entries) {
      command.push(field, value);
    }
    super(command, cmdOpts);
  }
};
var HSetNXCommand = class extends Command {
  constructor(cmd, opts) {
    super(["hsetnx", ...cmd], opts);
  }
};
var HStrLenCommand = class extends Command {
  constructor(cmd, opts) {
    super(["hstrlen", ...cmd], opts);
  }
};
var HTtlCommand = class extends Command {
  constructor(cmd, opts) {
    const [key, fields] = cmd;
    const fieldArray = Array.isArray(fields) ? fields : [fields];
    super(["httl", key, "FIELDS", fieldArray.length, ...fieldArray], opts);
  }
};
var HValsCommand = class extends Command {
  constructor(cmd, opts) {
    super(["hvals", ...cmd], opts);
  }
};
var IncrCommand = class extends Command {
  constructor(cmd, opts) {
    super(["incr", ...cmd], opts);
  }
};
var IncrByCommand = class extends Command {
  constructor(cmd, opts) {
    super(["incrby", ...cmd], opts);
  }
};
var IncrByFloatCommand = class extends Command {
  constructor(cmd, opts) {
    super(["incrbyfloat", ...cmd], opts);
  }
};
var JsonArrAppendCommand = class extends Command {
  constructor(cmd, opts) {
    super(["JSON.ARRAPPEND", ...cmd], opts);
  }
};
var JsonArrIndexCommand = class extends Command {
  constructor(cmd, opts) {
    super(["JSON.ARRINDEX", ...cmd], opts);
  }
};
var JsonArrInsertCommand = class extends Command {
  constructor(cmd, opts) {
    super(["JSON.ARRINSERT", ...cmd], opts);
  }
};
var JsonArrLenCommand = class extends Command {
  constructor(cmd, opts) {
    super(["JSON.ARRLEN", cmd[0], cmd[1] ?? "$"], opts);
  }
};
var JsonArrPopCommand = class extends Command {
  constructor(cmd, opts) {
    super(["JSON.ARRPOP", ...cmd], opts);
  }
};
var JsonArrTrimCommand = class extends Command {
  constructor(cmd, opts) {
    const path = cmd[1] ?? "$";
    const start = cmd[2] ?? 0;
    const stop = cmd[3] ?? 0;
    super(["JSON.ARRTRIM", cmd[0], path, start, stop], opts);
  }
};
var JsonClearCommand = class extends Command {
  constructor(cmd, opts) {
    super(["JSON.CLEAR", ...cmd], opts);
  }
};
var JsonDelCommand = class extends Command {
  constructor(cmd, opts) {
    super(["JSON.DEL", ...cmd], opts);
  }
};
var JsonForgetCommand = class extends Command {
  constructor(cmd, opts) {
    super(["JSON.FORGET", ...cmd], opts);
  }
};
var JsonGetCommand = class extends Command {
  constructor(cmd, opts) {
    const command = ["JSON.GET"];
    if (typeof cmd[1] === "string") {
      command.push(...cmd);
    } else {
      command.push(cmd[0]);
      if (cmd[1]) {
        if (cmd[1].indent) {
          command.push("INDENT", cmd[1].indent);
        }
        if (cmd[1].newline) {
          command.push("NEWLINE", cmd[1].newline);
        }
        if (cmd[1].space) {
          command.push("SPACE", cmd[1].space);
        }
      }
      command.push(...cmd.slice(2));
    }
    super(command, opts);
  }
};
var JsonMergeCommand = class extends Command {
  constructor(cmd, opts) {
    const command = ["JSON.MERGE", ...cmd];
    super(command, opts);
  }
};
var JsonMGetCommand = class extends Command {
  constructor(cmd, opts) {
    super(["JSON.MGET", ...cmd[0], cmd[1]], opts);
  }
};
var JsonMSetCommand = class extends Command {
  constructor(cmd, opts) {
    const command = ["JSON.MSET"];
    for (const c of cmd) {
      command.push(c.key, c.path, c.value);
    }
    super(command, opts);
  }
};
var JsonNumIncrByCommand = class extends Command {
  constructor(cmd, opts) {
    super(["JSON.NUMINCRBY", ...cmd], opts);
  }
};
var JsonNumMultByCommand = class extends Command {
  constructor(cmd, opts) {
    super(["JSON.NUMMULTBY", ...cmd], opts);
  }
};
var JsonObjKeysCommand = class extends Command {
  constructor(cmd, opts) {
    super(["JSON.OBJKEYS", ...cmd], opts);
  }
};
var JsonObjLenCommand = class extends Command {
  constructor(cmd, opts) {
    super(["JSON.OBJLEN", ...cmd], opts);
  }
};
var JsonRespCommand = class extends Command {
  constructor(cmd, opts) {
    super(["JSON.RESP", ...cmd], opts);
  }
};
var JsonSetCommand = class extends Command {
  constructor(cmd, opts) {
    const command = ["JSON.SET", cmd[0], cmd[1], cmd[2]];
    if (cmd[3]) {
      if (cmd[3].nx) {
        command.push("NX");
      } else if (cmd[3].xx) {
        command.push("XX");
      }
    }
    super(command, opts);
  }
};
var JsonStrAppendCommand = class extends Command {
  constructor(cmd, opts) {
    super(["JSON.STRAPPEND", ...cmd], opts);
  }
};
var JsonStrLenCommand = class extends Command {
  constructor(cmd, opts) {
    super(["JSON.STRLEN", ...cmd], opts);
  }
};
var JsonToggleCommand = class extends Command {
  constructor(cmd, opts) {
    super(["JSON.TOGGLE", ...cmd], opts);
  }
};
var JsonTypeCommand = class extends Command {
  constructor(cmd, opts) {
    super(["JSON.TYPE", ...cmd], opts);
  }
};
var KeysCommand = class extends Command {
  constructor(cmd, opts) {
    super(["keys", ...cmd], opts);
  }
};
var LIndexCommand = class extends Command {
  constructor(cmd, opts) {
    super(["lindex", ...cmd], opts);
  }
};
var LInsertCommand = class extends Command {
  constructor(cmd, opts) {
    super(["linsert", ...cmd], opts);
  }
};
var LLenCommand = class extends Command {
  constructor(cmd, opts) {
    super(["llen", ...cmd], opts);
  }
};
var LMoveCommand = class extends Command {
  constructor(cmd, opts) {
    super(["lmove", ...cmd], opts);
  }
};
var LmPopCommand = class extends Command {
  constructor(cmd, opts) {
    const [numkeys, keys, direction, count] = cmd;
    super(["LMPOP", numkeys, ...keys, direction, ...count ? ["COUNT", count] : []], opts);
  }
};
var LPopCommand = class extends Command {
  constructor(cmd, opts) {
    super(["lpop", ...cmd], opts);
  }
};
var LPosCommand = class extends Command {
  constructor(cmd, opts) {
    const args = ["lpos", cmd[0], cmd[1]];
    if (typeof cmd[2]?.rank === "number") {
      args.push("rank", cmd[2].rank);
    }
    if (typeof cmd[2]?.count === "number") {
      args.push("count", cmd[2].count);
    }
    if (typeof cmd[2]?.maxLen === "number") {
      args.push("maxLen", cmd[2].maxLen);
    }
    super(args, opts);
  }
};
var LPushCommand = class extends Command {
  constructor(cmd, opts) {
    super(["lpush", ...cmd], opts);
  }
};
var LPushXCommand = class extends Command {
  constructor(cmd, opts) {
    super(["lpushx", ...cmd], opts);
  }
};
var LRangeCommand = class extends Command {
  constructor(cmd, opts) {
    super(["lrange", ...cmd], opts);
  }
};
var LRemCommand = class extends Command {
  constructor(cmd, opts) {
    super(["lrem", ...cmd], opts);
  }
};
var LSetCommand = class extends Command {
  constructor(cmd, opts) {
    super(["lset", ...cmd], opts);
  }
};
var LTrimCommand = class extends Command {
  constructor(cmd, opts) {
    super(["ltrim", ...cmd], opts);
  }
};
var MGetCommand = class extends Command {
  constructor(cmd, opts) {
    const keys = Array.isArray(cmd[0]) ? cmd[0] : cmd;
    super(["mget", ...keys], opts);
  }
};
var MSetCommand = class extends Command {
  constructor([kv], opts) {
    super(["mset", ...Object.entries(kv).flatMap(([key, value]) => [key, value])], opts);
  }
};
var MSetNXCommand = class extends Command {
  constructor([kv], opts) {
    super(["msetnx", ...Object.entries(kv).flat()], opts);
  }
};
var PersistCommand = class extends Command {
  constructor(cmd, opts) {
    super(["persist", ...cmd], opts);
  }
};
var PExpireCommand = class extends Command {
  constructor(cmd, opts) {
    super(["pexpire", ...cmd], opts);
  }
};
var PExpireAtCommand = class extends Command {
  constructor(cmd, opts) {
    super(["pexpireat", ...cmd], opts);
  }
};
var PfAddCommand = class extends Command {
  constructor(cmd, opts) {
    super(["pfadd", ...cmd], opts);
  }
};
var PfCountCommand = class extends Command {
  constructor(cmd, opts) {
    super(["pfcount", ...cmd], opts);
  }
};
var PfMergeCommand = class extends Command {
  constructor(cmd, opts) {
    super(["pfmerge", ...cmd], opts);
  }
};
var PingCommand = class extends Command {
  constructor(cmd, opts) {
    const command = ["ping"];
    if (cmd?.[0] !== void 0) {
      command.push(cmd[0]);
    }
    super(command, opts);
  }
};
var PSetEXCommand = class extends Command {
  constructor(cmd, opts) {
    super(["psetex", ...cmd], opts);
  }
};
var PTtlCommand = class extends Command {
  constructor(cmd, opts) {
    super(["pttl", ...cmd], opts);
  }
};
var PublishCommand = class extends Command {
  constructor(cmd, opts) {
    super(["publish", ...cmd], opts);
  }
};
var RandomKeyCommand = class extends Command {
  constructor(opts) {
    super(["randomkey"], opts);
  }
};
var RenameCommand = class extends Command {
  constructor(cmd, opts) {
    super(["rename", ...cmd], opts);
  }
};
var RenameNXCommand = class extends Command {
  constructor(cmd, opts) {
    super(["renamenx", ...cmd], opts);
  }
};
var RPopCommand = class extends Command {
  constructor(cmd, opts) {
    super(["rpop", ...cmd], opts);
  }
};
var RPushCommand = class extends Command {
  constructor(cmd, opts) {
    super(["rpush", ...cmd], opts);
  }
};
var RPushXCommand = class extends Command {
  constructor(cmd, opts) {
    super(["rpushx", ...cmd], opts);
  }
};
var SAddCommand = class extends Command {
  constructor(cmd, opts) {
    super(["sadd", ...cmd], opts);
  }
};
var ScanCommand = class extends Command {
  constructor([cursor, opts], cmdOpts) {
    const command = ["scan", cursor];
    if (opts?.match) {
      command.push("match", opts.match);
    }
    if (typeof opts?.count === "number") {
      command.push("count", opts.count);
    }
    if (opts && "withType" in opts && opts.withType === true) {
      command.push("withtype");
    } else if (opts && "type" in opts && opts.type && opts.type.length > 0) {
      command.push("type", opts.type);
    }
    super(command, {
      // @ts-expect-error ignore types here
      deserialize: opts?.withType ? deserializeScanWithTypesResponse : deserializeScanResponse,
      ...cmdOpts
    });
  }
};
var SCardCommand = class extends Command {
  constructor(cmd, opts) {
    super(["scard", ...cmd], opts);
  }
};
var ScriptExistsCommand = class extends Command {
  constructor(hashes, opts) {
    super(["script", "exists", ...hashes], {
      deserialize: (result) => result,
      ...opts
    });
  }
};
var ScriptFlushCommand = class extends Command {
  constructor([opts], cmdOpts) {
    const cmd = ["script", "flush"];
    if (opts?.sync) {
      cmd.push("sync");
    } else if (opts?.async) {
      cmd.push("async");
    }
    super(cmd, cmdOpts);
  }
};
var ScriptLoadCommand = class extends Command {
  constructor(args, opts) {
    super(["script", "load", ...args], opts);
  }
};
var SDiffCommand = class extends Command {
  constructor(cmd, opts) {
    super(["sdiff", ...cmd], opts);
  }
};
var SDiffStoreCommand = class extends Command {
  constructor(cmd, opts) {
    super(["sdiffstore", ...cmd], opts);
  }
};
var SetCommand = class extends Command {
  constructor([key, value, opts], cmdOpts) {
    const command = ["set", key, value];
    if (opts) {
      if ("nx" in opts && opts.nx) {
        command.push("nx");
      } else if ("xx" in opts && opts.xx) {
        command.push("xx");
      }
      if ("get" in opts && opts.get) {
        command.push("get");
      }
      if ("ex" in opts && typeof opts.ex === "number") {
        command.push("ex", opts.ex);
      } else if ("px" in opts && typeof opts.px === "number") {
        command.push("px", opts.px);
      } else if ("exat" in opts && typeof opts.exat === "number") {
        command.push("exat", opts.exat);
      } else if ("pxat" in opts && typeof opts.pxat === "number") {
        command.push("pxat", opts.pxat);
      } else if ("keepTtl" in opts && opts.keepTtl) {
        command.push("keepTtl");
      }
    }
    super(command, cmdOpts);
  }
};
var SetBitCommand = class extends Command {
  constructor(cmd, opts) {
    super(["setbit", ...cmd], opts);
  }
};
var SetExCommand = class extends Command {
  constructor(cmd, opts) {
    super(["setex", ...cmd], opts);
  }
};
var SetNxCommand = class extends Command {
  constructor(cmd, opts) {
    super(["setnx", ...cmd], opts);
  }
};
var SetRangeCommand = class extends Command {
  constructor(cmd, opts) {
    super(["setrange", ...cmd], opts);
  }
};
var SInterCommand = class extends Command {
  constructor(cmd, opts) {
    super(["sinter", ...cmd], opts);
  }
};
var SInterCardCommand = class extends Command {
  constructor(cmd, cmdOpts) {
    const [keys, opts] = cmd;
    const command = ["sintercard", keys.length, ...keys];
    if (opts?.limit !== void 0) {
      command.push("LIMIT", opts.limit);
    }
    super(command, cmdOpts);
  }
};
var SInterStoreCommand = class extends Command {
  constructor(cmd, opts) {
    super(["sinterstore", ...cmd], opts);
  }
};
var SIsMemberCommand = class extends Command {
  constructor(cmd, opts) {
    super(["sismember", ...cmd], opts);
  }
};
var SMembersCommand = class extends Command {
  constructor(cmd, opts) {
    super(["smembers", ...cmd], opts);
  }
};
var SMIsMemberCommand = class extends Command {
  constructor(cmd, opts) {
    super(["smismember", cmd[0], ...cmd[1]], opts);
  }
};
var SMoveCommand = class extends Command {
  constructor(cmd, opts) {
    super(["smove", ...cmd], opts);
  }
};
var SPopCommand = class extends Command {
  constructor([key, count], opts) {
    const command = ["spop", key];
    if (typeof count === "number") {
      command.push(count);
    }
    super(command, opts);
  }
};
var SRandMemberCommand = class extends Command {
  constructor([key, count], opts) {
    const command = ["srandmember", key];
    if (typeof count === "number") {
      command.push(count);
    }
    super(command, opts);
  }
};
var SRemCommand = class extends Command {
  constructor(cmd, opts) {
    super(["srem", ...cmd], opts);
  }
};
var SScanCommand = class extends Command {
  constructor([key, cursor, opts], cmdOpts) {
    const command = ["sscan", key, cursor];
    if (opts?.match) {
      command.push("match", opts.match);
    }
    if (typeof opts?.count === "number") {
      command.push("count", opts.count);
    }
    super(command, {
      deserialize: deserializeScanResponse,
      ...cmdOpts
    });
  }
};
var StrLenCommand = class extends Command {
  constructor(cmd, opts) {
    super(["strlen", ...cmd], opts);
  }
};
var SUnionCommand = class extends Command {
  constructor(cmd, opts) {
    super(["sunion", ...cmd], opts);
  }
};
var SUnionStoreCommand = class extends Command {
  constructor(cmd, opts) {
    super(["sunionstore", ...cmd], opts);
  }
};
var TimeCommand = class extends Command {
  constructor(opts) {
    super(["time"], opts);
  }
};
var TouchCommand = class extends Command {
  constructor(cmd, opts) {
    super(["touch", ...cmd], opts);
  }
};
var TtlCommand = class extends Command {
  constructor(cmd, opts) {
    super(["ttl", ...cmd], opts);
  }
};
var TypeCommand = class extends Command {
  constructor(cmd, opts) {
    super(["type", ...cmd], opts);
  }
};
var UnlinkCommand = class extends Command {
  constructor(cmd, opts) {
    super(["unlink", ...cmd], opts);
  }
};
var XAckCommand = class extends Command {
  constructor([key, group, id], opts) {
    const ids = Array.isArray(id) ? [...id] : [id];
    super(["XACK", key, group, ...ids], opts);
  }
};
var XAckDelCommand = class extends Command {
  constructor([key, group, opts, ...ids], cmdOpts) {
    const command = ["XACKDEL", key, group];
    command.push(opts.toUpperCase(), "IDS", ids.length, ...ids);
    super(command, cmdOpts);
  }
};
var XAddCommand = class extends Command {
  constructor([key, id, entries, opts], commandOptions) {
    const command = ["XADD", key];
    if (opts) {
      if (opts.nomkStream) {
        command.push("NOMKSTREAM");
      }
      if (opts.trim) {
        command.push(opts.trim.type, opts.trim.comparison, opts.trim.threshold);
        if (opts.trim.limit !== void 0) {
          command.push("LIMIT", opts.trim.limit);
        }
      }
    }
    command.push(id);
    for (const [k, v] of Object.entries(entries)) {
      command.push(k, v);
    }
    super(command, commandOptions);
  }
};
var XAutoClaim = class extends Command {
  constructor([key, group, consumer, minIdleTime, start, options], opts) {
    const commands = [];
    if (options?.count) {
      commands.push("COUNT", options.count);
    }
    if (options?.justId) {
      commands.push("JUSTID");
    }
    super(["XAUTOCLAIM", key, group, consumer, minIdleTime, start, ...commands], opts);
  }
};
var XClaimCommand = class extends Command {
  constructor([key, group, consumer, minIdleTime, id, options], opts) {
    const ids = Array.isArray(id) ? [...id] : [id];
    const commands = [];
    if (options?.idleMS) {
      commands.push("IDLE", options.idleMS);
    }
    if (options?.idleMS) {
      commands.push("TIME", options.timeMS);
    }
    if (options?.retryCount) {
      commands.push("RETRYCOUNT", options.retryCount);
    }
    if (options?.force) {
      commands.push("FORCE");
    }
    if (options?.justId) {
      commands.push("JUSTID");
    }
    if (options?.lastId) {
      commands.push("LASTID", options.lastId);
    }
    super(["XCLAIM", key, group, consumer, minIdleTime, ...ids, ...commands], opts);
  }
};
var XDelCommand = class extends Command {
  constructor([key, ids], opts) {
    const cmds = Array.isArray(ids) ? [...ids] : [ids];
    super(["XDEL", key, ...cmds], opts);
  }
};
var XDelExCommand = class extends Command {
  constructor([key, opts, ...ids], cmdOpts) {
    const command = ["XDELEX", key];
    if (opts) {
      command.push(opts.toUpperCase());
    }
    command.push("IDS", ids.length, ...ids);
    super(command, cmdOpts);
  }
};
var XGroupCommand = class extends Command {
  constructor([key, opts], commandOptions) {
    const command = ["XGROUP"];
    switch (opts.type) {
      case "CREATE": {
        command.push("CREATE", key, opts.group, opts.id);
        if (opts.options) {
          if (opts.options.MKSTREAM) {
            command.push("MKSTREAM");
          }
          if (opts.options.ENTRIESREAD !== void 0) {
            command.push("ENTRIESREAD", opts.options.ENTRIESREAD.toString());
          }
        }
        break;
      }
      case "CREATECONSUMER": {
        command.push("CREATECONSUMER", key, opts.group, opts.consumer);
        break;
      }
      case "DELCONSUMER": {
        command.push("DELCONSUMER", key, opts.group, opts.consumer);
        break;
      }
      case "DESTROY": {
        command.push("DESTROY", key, opts.group);
        break;
      }
      case "SETID": {
        command.push("SETID", key, opts.group, opts.id);
        if (opts.options?.ENTRIESREAD !== void 0) {
          command.push("ENTRIESREAD", opts.options.ENTRIESREAD.toString());
        }
        break;
      }
      default: {
        throw new Error("Invalid XGROUP");
      }
    }
    super(command, commandOptions);
  }
};
var XInfoCommand = class extends Command {
  constructor([key, options], opts) {
    const cmds = [];
    if (options.type === "CONSUMERS") {
      cmds.push("CONSUMERS", key, options.group);
    } else {
      cmds.push("GROUPS", key);
    }
    super(["XINFO", ...cmds], opts);
  }
};
var XLenCommand = class extends Command {
  constructor(cmd, opts) {
    super(["XLEN", ...cmd], opts);
  }
};
var XPendingCommand = class extends Command {
  constructor([key, group, start, end, count, options], opts) {
    const consumers = options?.consumer === void 0 ? [] : Array.isArray(options.consumer) ? [...options.consumer] : [options.consumer];
    super(
      [
        "XPENDING",
        key,
        group,
        ...options?.idleTime ? ["IDLE", options.idleTime] : [],
        start,
        end,
        count,
        ...consumers
      ],
      opts
    );
  }
};
function deserialize6(result) {
  const obj = {};
  for (const e of result) {
    for (let i = 0; i < e.length; i += 2) {
      const streamId = e[i];
      const entries = e[i + 1];
      if (!(streamId in obj)) {
        obj[streamId] = {};
      }
      for (let j = 0; j < entries.length; j += 2) {
        const field = entries[j];
        const value = entries[j + 1];
        try {
          obj[streamId][field] = JSON.parse(value);
        } catch {
          obj[streamId][field] = value;
        }
      }
    }
  }
  return obj;
}
var XRangeCommand = class extends Command {
  constructor([key, start, end, count], opts) {
    const command = ["XRANGE", key, start, end];
    if (typeof count === "number") {
      command.push("COUNT", count);
    }
    super(command, {
      deserialize: (result) => deserialize6(result),
      ...opts
    });
  }
};
var UNBALANCED_XREAD_ERR = "ERR Unbalanced XREAD list of streams: for each stream key an ID or '$' must be specified";
var XReadCommand = class extends Command {
  constructor([key, id, options], opts) {
    if (Array.isArray(key) && Array.isArray(id) && key.length !== id.length) {
      throw new Error(UNBALANCED_XREAD_ERR);
    }
    const commands = [];
    if (typeof options?.count === "number") {
      commands.push("COUNT", options.count);
    }
    if (typeof options?.blockMS === "number") {
      commands.push("BLOCK", options.blockMS);
    }
    commands.push(
      "STREAMS",
      ...Array.isArray(key) ? [...key] : [key],
      ...Array.isArray(id) ? [...id] : [id]
    );
    super(["XREAD", ...commands], opts);
  }
};
var UNBALANCED_XREADGROUP_ERR = "ERR Unbalanced XREADGROUP list of streams: for each stream key an ID or '$' must be specified";
var XReadGroupCommand = class extends Command {
  constructor([group, consumer, key, id, options], opts) {
    if (Array.isArray(key) && Array.isArray(id) && key.length !== id.length) {
      throw new Error(UNBALANCED_XREADGROUP_ERR);
    }
    const commands = [];
    if (typeof options?.count === "number") {
      commands.push("COUNT", options.count);
    }
    if (typeof options?.blockMS === "number") {
      commands.push("BLOCK", options.blockMS);
    }
    if (typeof options?.NOACK === "boolean" && options.NOACK) {
      commands.push("NOACK");
    }
    commands.push(
      "STREAMS",
      ...Array.isArray(key) ? [...key] : [key],
      ...Array.isArray(id) ? [...id] : [id]
    );
    super(["XREADGROUP", "GROUP", group, consumer, ...commands], opts);
  }
};
var XRevRangeCommand = class extends Command {
  constructor([key, end, start, count], opts) {
    const command = ["XREVRANGE", key, end, start];
    if (typeof count === "number") {
      command.push("COUNT", count);
    }
    super(command, {
      deserialize: (result) => deserialize7(result),
      ...opts
    });
  }
};
function deserialize7(result) {
  const obj = {};
  for (const e of result) {
    for (let i = 0; i < e.length; i += 2) {
      const streamId = e[i];
      const entries = e[i + 1];
      if (!(streamId in obj)) {
        obj[streamId] = {};
      }
      for (let j = 0; j < entries.length; j += 2) {
        const field = entries[j];
        const value = entries[j + 1];
        try {
          obj[streamId][field] = JSON.parse(value);
        } catch {
          obj[streamId][field] = value;
        }
      }
    }
  }
  return obj;
}
var XTrimCommand = class extends Command {
  constructor([key, options], opts) {
    const { limit, strategy, threshold, exactness = "~" } = options;
    super(["XTRIM", key, strategy, exactness, threshold, ...limit ? ["LIMIT", limit] : []], opts);
  }
};
var ZAddCommand = class extends Command {
  constructor([key, arg1, ...arg2], opts) {
    const command = ["zadd", key];
    if ("nx" in arg1 && arg1.nx) {
      command.push("nx");
    } else if ("xx" in arg1 && arg1.xx) {
      command.push("xx");
    }
    if ("ch" in arg1 && arg1.ch) {
      command.push("ch");
    }
    if ("incr" in arg1 && arg1.incr) {
      command.push("incr");
    }
    if ("lt" in arg1 && arg1.lt) {
      command.push("lt");
    } else if ("gt" in arg1 && arg1.gt) {
      command.push("gt");
    }
    if ("score" in arg1 && "member" in arg1) {
      command.push(arg1.score, arg1.member);
    }
    command.push(...arg2.flatMap(({ score, member }) => [score, member]));
    super(command, opts);
  }
};
var ZCardCommand = class extends Command {
  constructor(cmd, opts) {
    super(["zcard", ...cmd], opts);
  }
};
var ZCountCommand = class extends Command {
  constructor(cmd, opts) {
    super(["zcount", ...cmd], opts);
  }
};
var ZIncrByCommand = class extends Command {
  constructor(cmd, opts) {
    super(["zincrby", ...cmd], opts);
  }
};
var ZInterStoreCommand = class extends Command {
  constructor([destination, numKeys, keyOrKeys, opts], cmdOpts) {
    const command = ["zinterstore", destination, numKeys];
    if (Array.isArray(keyOrKeys)) {
      command.push(...keyOrKeys);
    } else {
      command.push(keyOrKeys);
    }
    if (opts) {
      if ("weights" in opts && opts.weights) {
        command.push("weights", ...opts.weights);
      } else if ("weight" in opts && typeof opts.weight === "number") {
        command.push("weights", opts.weight);
      }
      if ("aggregate" in opts) {
        command.push("aggregate", opts.aggregate);
      }
    }
    super(command, cmdOpts);
  }
};
var ZLexCountCommand = class extends Command {
  constructor(cmd, opts) {
    super(["zlexcount", ...cmd], opts);
  }
};
var ZPopMaxCommand = class extends Command {
  constructor([key, count], opts) {
    const command = ["zpopmax", key];
    if (typeof count === "number") {
      command.push(count);
    }
    super(command, opts);
  }
};
var ZPopMinCommand = class extends Command {
  constructor([key, count], opts) {
    const command = ["zpopmin", key];
    if (typeof count === "number") {
      command.push(count);
    }
    super(command, opts);
  }
};
var ZRangeCommand = class extends Command {
  constructor([key, min, max, opts], cmdOpts) {
    const command = ["zrange", key, min, max];
    if (opts?.byScore) {
      command.push("byscore");
    }
    if (opts?.byLex) {
      command.push("bylex");
    }
    if (opts?.rev) {
      command.push("rev");
    }
    if (opts?.count !== void 0 && opts.offset !== void 0) {
      command.push("limit", opts.offset, opts.count);
    }
    if (opts?.withScores) {
      command.push("withscores");
    }
    super(command, cmdOpts);
  }
};
var ZRankCommand = class extends Command {
  constructor(cmd, opts) {
    super(["zrank", ...cmd], opts);
  }
};
var ZRemCommand = class extends Command {
  constructor(cmd, opts) {
    super(["zrem", ...cmd], opts);
  }
};
var ZRemRangeByLexCommand = class extends Command {
  constructor(cmd, opts) {
    super(["zremrangebylex", ...cmd], opts);
  }
};
var ZRemRangeByRankCommand = class extends Command {
  constructor(cmd, opts) {
    super(["zremrangebyrank", ...cmd], opts);
  }
};
var ZRemRangeByScoreCommand = class extends Command {
  constructor(cmd, opts) {
    super(["zremrangebyscore", ...cmd], opts);
  }
};
var ZRevRankCommand = class extends Command {
  constructor(cmd, opts) {
    super(["zrevrank", ...cmd], opts);
  }
};
var ZScanCommand = class extends Command {
  constructor([key, cursor, opts], cmdOpts) {
    const command = ["zscan", key, cursor];
    if (opts?.match) {
      command.push("match", opts.match);
    }
    if (typeof opts?.count === "number") {
      command.push("count", opts.count);
    }
    super(command, {
      deserialize: deserializeScanResponse,
      ...cmdOpts
    });
  }
};
var ZScoreCommand = class extends Command {
  constructor(cmd, opts) {
    super(["zscore", ...cmd], opts);
  }
};
var ZUnionCommand = class extends Command {
  constructor([numKeys, keyOrKeys, opts], cmdOpts) {
    const command = ["zunion", numKeys];
    if (Array.isArray(keyOrKeys)) {
      command.push(...keyOrKeys);
    } else {
      command.push(keyOrKeys);
    }
    if (opts) {
      if ("weights" in opts && opts.weights) {
        command.push("weights", ...opts.weights);
      } else if ("weight" in opts && typeof opts.weight === "number") {
        command.push("weights", opts.weight);
      }
      if ("aggregate" in opts) {
        command.push("aggregate", opts.aggregate);
      }
      if (opts.withScores) {
        command.push("withscores");
      }
    }
    super(command, cmdOpts);
  }
};
var ZUnionStoreCommand = class extends Command {
  constructor([destination, numKeys, keyOrKeys, opts], cmdOpts) {
    const command = ["zunionstore", destination, numKeys];
    if (Array.isArray(keyOrKeys)) {
      command.push(...keyOrKeys);
    } else {
      command.push(keyOrKeys);
    }
    if (opts) {
      if ("weights" in opts && opts.weights) {
        command.push("weights", ...opts.weights);
      } else if ("weight" in opts && typeof opts.weight === "number") {
        command.push("weights", opts.weight);
      }
      if ("aggregate" in opts) {
        command.push("aggregate", opts.aggregate);
      }
    }
    super(command, cmdOpts);
  }
};
var ZDiffStoreCommand = class extends Command {
  constructor(cmd, opts) {
    super(["zdiffstore", ...cmd], opts);
  }
};
var ZMScoreCommand = class extends Command {
  constructor(cmd, opts) {
    const [key, members] = cmd;
    super(["zmscore", key, ...members], opts);
  }
};
var Pipeline = class {
  client;
  commands;
  commandOptions;
  multiExec;
  constructor(opts) {
    this.client = opts.client;
    this.commands = [];
    this.commandOptions = opts.commandOptions;
    this.multiExec = opts.multiExec ?? false;
    if (this.commandOptions?.latencyLogging) {
      const originalExec = this.exec.bind(this);
      this.exec = async (options) => {
        const start = performance.now();
        const result = await (options ? originalExec(options) : originalExec());
        const end = performance.now();
        const loggerResult = (end - start).toFixed(2);
        console.log(
          `Latency for \x1B[38;2;19;185;39m${this.multiExec ? ["MULTI-EXEC"] : ["PIPELINE"].toString().toUpperCase()}\x1B[0m: \x1B[38;2;0;255;255m${loggerResult} ms\x1B[0m`
        );
        return result;
      };
    }
  }
  exec = async (options) => {
    if (this.commands.length === 0) {
      throw new Error("Pipeline is empty");
    }
    const path = this.multiExec ? ["multi-exec"] : ["pipeline"];
    const res = await this.client.request({
      path,
      body: Object.values(this.commands).map((c) => c.command)
    });
    return options?.keepErrors ? res.map(({ error, result }, i) => {
      return {
        error,
        result: this.commands[i].deserialize(result)
      };
    }) : res.map(({ error, result }, i) => {
      if (error) {
        throw new UpstashError(
          `Command ${i + 1} [ ${this.commands[i].command[0]} ] failed: ${error}`
        );
      }
      return this.commands[i].deserialize(result);
    });
  };
  /**
   * Returns the length of pipeline before the execution
   */
  length() {
    return this.commands.length;
  }
  /**
   * Pushes a command into the pipeline and returns a chainable instance of the
   * pipeline
   */
  chain(command) {
    this.commands.push(command);
    return this;
  }
  /**
   * @see https://redis.io/commands/append
   */
  append = (...args) => this.chain(new AppendCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/bitcount
   */
  bitcount = (...args) => this.chain(new BitCountCommand(args, this.commandOptions));
  /**
   * Returns an instance that can be used to execute `BITFIELD` commands on one key.
   *
   * @example
   * ```typescript
   * redis.set("mykey", 0);
   * const result = await redis.pipeline()
   *   .bitfield("mykey")
   *   .set("u4", 0, 16)
   *   .incr("u4", "#1", 1)
   *   .exec();
   * console.log(result); // [[0, 1]]
   * ```
   *
   * @see https://redis.io/commands/bitfield
   */
  bitfield = (...args) => new BitFieldCommand(args, this.client, this.commandOptions, this.chain.bind(this));
  /**
   * @see https://redis.io/commands/bitop
   */
  bitop = (op, destinationKey, sourceKey, ...sourceKeys) => this.chain(
    new BitOpCommand([op, destinationKey, sourceKey, ...sourceKeys], this.commandOptions)
  );
  /**
   * @see https://redis.io/commands/bitpos
   */
  bitpos = (...args) => this.chain(new BitPosCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/client-setinfo
   */
  clientSetinfo = (...args) => this.chain(new ClientSetInfoCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/copy
   */
  copy = (...args) => this.chain(new CopyCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/zdiffstore
   */
  zdiffstore = (...args) => this.chain(new ZDiffStoreCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/dbsize
   */
  dbsize = () => this.chain(new DBSizeCommand(this.commandOptions));
  /**
   * @see https://redis.io/commands/decr
   */
  decr = (...args) => this.chain(new DecrCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/decrby
   */
  decrby = (...args) => this.chain(new DecrByCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/del
   */
  del = (...args) => this.chain(new DelCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/echo
   */
  echo = (...args) => this.chain(new EchoCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/eval_ro
   */
  evalRo = (...args) => this.chain(new EvalROCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/eval
   */
  eval = (...args) => this.chain(new EvalCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/evalsha_ro
   */
  evalshaRo = (...args) => this.chain(new EvalshaROCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/evalsha
   */
  evalsha = (...args) => this.chain(new EvalshaCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/exists
   */
  exists = (...args) => this.chain(new ExistsCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/expire
   */
  expire = (...args) => this.chain(new ExpireCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/expireat
   */
  expireat = (...args) => this.chain(new ExpireAtCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/flushall
   */
  flushall = (args) => this.chain(new FlushAllCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/flushdb
   */
  flushdb = (...args) => this.chain(new FlushDBCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/geoadd
   */
  geoadd = (...args) => this.chain(new GeoAddCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/geodist
   */
  geodist = (...args) => this.chain(new GeoDistCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/geopos
   */
  geopos = (...args) => this.chain(new GeoPosCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/geohash
   */
  geohash = (...args) => this.chain(new GeoHashCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/geosearch
   */
  geosearch = (...args) => this.chain(new GeoSearchCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/geosearchstore
   */
  geosearchstore = (...args) => this.chain(new GeoSearchStoreCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/get
   */
  get = (...args) => this.chain(new GetCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/getbit
   */
  getbit = (...args) => this.chain(new GetBitCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/getdel
   */
  getdel = (...args) => this.chain(new GetDelCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/getex
   */
  getex = (...args) => this.chain(new GetExCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/getrange
   */
  getrange = (...args) => this.chain(new GetRangeCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/getset
   */
  getset = (key, value) => this.chain(new GetSetCommand([key, value], this.commandOptions));
  /**
   * @see https://redis.io/commands/hdel
   */
  hdel = (...args) => this.chain(new HDelCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/hexists
   */
  hexists = (...args) => this.chain(new HExistsCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/hexpire
   */
  hexpire = (...args) => this.chain(new HExpireCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/hexpireat
   */
  hexpireat = (...args) => this.chain(new HExpireAtCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/hexpiretime
   */
  hexpiretime = (...args) => this.chain(new HExpireTimeCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/httl
   */
  httl = (...args) => this.chain(new HTtlCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/hpexpire
   */
  hpexpire = (...args) => this.chain(new HPExpireCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/hpexpireat
   */
  hpexpireat = (...args) => this.chain(new HPExpireAtCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/hpexpiretime
   */
  hpexpiretime = (...args) => this.chain(new HPExpireTimeCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/hpttl
   */
  hpttl = (...args) => this.chain(new HPTtlCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/hpersist
   */
  hpersist = (...args) => this.chain(new HPersistCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/hget
   */
  hget = (...args) => this.chain(new HGetCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/hgetall
   */
  hgetall = (...args) => this.chain(new HGetAllCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/hgetdel
   */
  hgetdel = (...args) => this.chain(new HGetDelCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/hgetex
   */
  hgetex = (...args) => this.chain(new HGetExCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/hincrby
   */
  hincrby = (...args) => this.chain(new HIncrByCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/hincrbyfloat
   */
  hincrbyfloat = (...args) => this.chain(new HIncrByFloatCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/hkeys
   */
  hkeys = (...args) => this.chain(new HKeysCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/hlen
   */
  hlen = (...args) => this.chain(new HLenCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/hmget
   */
  hmget = (...args) => this.chain(new HMGetCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/hmset
   */
  hmset = (key, kv) => this.chain(new HMSetCommand([key, kv], this.commandOptions));
  /**
   * @see https://redis.io/commands/hrandfield
   */
  hrandfield = (key, count, withValues) => this.chain(new HRandFieldCommand([key, count, withValues], this.commandOptions));
  /**
   * @see https://redis.io/commands/hscan
   */
  hscan = (...args) => this.chain(new HScanCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/hset
   */
  hset = (key, kv) => this.chain(new HSetCommand([key, kv], this.commandOptions));
  /**
   * @see https://redis.io/commands/hsetex
   */
  hsetex = (...args) => this.chain(new HSetExCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/hsetnx
   */
  hsetnx = (key, field, value) => this.chain(new HSetNXCommand([key, field, value], this.commandOptions));
  /**
   * @see https://redis.io/commands/hstrlen
   */
  hstrlen = (...args) => this.chain(new HStrLenCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/hvals
   */
  hvals = (...args) => this.chain(new HValsCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/incr
   */
  incr = (...args) => this.chain(new IncrCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/incrby
   */
  incrby = (...args) => this.chain(new IncrByCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/incrbyfloat
   */
  incrbyfloat = (...args) => this.chain(new IncrByFloatCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/keys
   */
  keys = (...args) => this.chain(new KeysCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/lindex
   */
  lindex = (...args) => this.chain(new LIndexCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/linsert
   */
  linsert = (key, direction, pivot, value) => this.chain(new LInsertCommand([key, direction, pivot, value], this.commandOptions));
  /**
   * @see https://redis.io/commands/llen
   */
  llen = (...args) => this.chain(new LLenCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/lmove
   */
  lmove = (...args) => this.chain(new LMoveCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/lpop
   */
  lpop = (...args) => this.chain(new LPopCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/lmpop
   */
  lmpop = (...args) => this.chain(new LmPopCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/lpos
   */
  lpos = (...args) => this.chain(new LPosCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/lpush
   */
  lpush = (key, ...elements) => this.chain(new LPushCommand([key, ...elements], this.commandOptions));
  /**
   * @see https://redis.io/commands/lpushx
   */
  lpushx = (key, ...elements) => this.chain(new LPushXCommand([key, ...elements], this.commandOptions));
  /**
   * @see https://redis.io/commands/lrange
   */
  lrange = (...args) => this.chain(new LRangeCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/lrem
   */
  lrem = (key, count, value) => this.chain(new LRemCommand([key, count, value], this.commandOptions));
  /**
   * @see https://redis.io/commands/lset
   */
  lset = (key, index, value) => this.chain(new LSetCommand([key, index, value], this.commandOptions));
  /**
   * @see https://redis.io/commands/ltrim
   */
  ltrim = (...args) => this.chain(new LTrimCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/mget
   */
  mget = (...args) => this.chain(new MGetCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/mset
   */
  mset = (kv) => this.chain(new MSetCommand([kv], this.commandOptions));
  /**
   * @see https://redis.io/commands/msetnx
   */
  msetnx = (kv) => this.chain(new MSetNXCommand([kv], this.commandOptions));
  /**
   * @see https://redis.io/commands/persist
   */
  persist = (...args) => this.chain(new PersistCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/pexpire
   */
  pexpire = (...args) => this.chain(new PExpireCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/pexpireat
   */
  pexpireat = (...args) => this.chain(new PExpireAtCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/pfadd
   */
  pfadd = (...args) => this.chain(new PfAddCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/pfcount
   */
  pfcount = (...args) => this.chain(new PfCountCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/pfmerge
   */
  pfmerge = (...args) => this.chain(new PfMergeCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/ping
   */
  ping = (args) => this.chain(new PingCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/psetex
   */
  psetex = (key, ttl, value) => this.chain(new PSetEXCommand([key, ttl, value], this.commandOptions));
  /**
   * @see https://redis.io/commands/pttl
   */
  pttl = (...args) => this.chain(new PTtlCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/publish
   */
  publish = (...args) => this.chain(new PublishCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/randomkey
   */
  randomkey = () => this.chain(new RandomKeyCommand(this.commandOptions));
  /**
   * @see https://redis.io/commands/rename
   */
  rename = (...args) => this.chain(new RenameCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/renamenx
   */
  renamenx = (...args) => this.chain(new RenameNXCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/rpop
   */
  rpop = (...args) => this.chain(new RPopCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/rpush
   */
  rpush = (key, ...elements) => this.chain(new RPushCommand([key, ...elements], this.commandOptions));
  /**
   * @see https://redis.io/commands/rpushx
   */
  rpushx = (key, ...elements) => this.chain(new RPushXCommand([key, ...elements], this.commandOptions));
  /**
   * @see https://redis.io/commands/sadd
   */
  sadd = (key, member, ...members) => this.chain(new SAddCommand([key, member, ...members], this.commandOptions));
  /**
   * @see https://redis.io/commands/scan
   */
  scan = (...args) => this.chain(new ScanCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/scard
   */
  scard = (...args) => this.chain(new SCardCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/script-exists
   */
  scriptExists = (...args) => this.chain(new ScriptExistsCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/script-flush
   */
  scriptFlush = (...args) => this.chain(new ScriptFlushCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/script-load
   */
  scriptLoad = (...args) => this.chain(new ScriptLoadCommand(args, this.commandOptions));
  /*)*
   * @see https://redis.io/commands/sdiff
   */
  sdiff = (...args) => this.chain(new SDiffCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/sdiffstore
   */
  sdiffstore = (...args) => this.chain(new SDiffStoreCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/set
   */
  set = (key, value, opts) => this.chain(new SetCommand([key, value, opts], this.commandOptions));
  /**
   * @see https://redis.io/commands/setbit
   */
  setbit = (...args) => this.chain(new SetBitCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/setex
   */
  setex = (key, ttl, value) => this.chain(new SetExCommand([key, ttl, value], this.commandOptions));
  /**
   * @see https://redis.io/commands/setnx
   */
  setnx = (key, value) => this.chain(new SetNxCommand([key, value], this.commandOptions));
  /**
   * @see https://redis.io/commands/setrange
   */
  setrange = (...args) => this.chain(new SetRangeCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/sinter
   */
  sinter = (...args) => this.chain(new SInterCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/sintercard
   */
  sintercard = (...args) => this.chain(new SInterCardCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/sinterstore
   */
  sinterstore = (...args) => this.chain(new SInterStoreCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/sismember
   */
  sismember = (key, member) => this.chain(new SIsMemberCommand([key, member], this.commandOptions));
  /**
   * @see https://redis.io/commands/smembers
   */
  smembers = (...args) => this.chain(new SMembersCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/smismember
   */
  smismember = (key, members) => this.chain(new SMIsMemberCommand([key, members], this.commandOptions));
  /**
   * @see https://redis.io/commands/smove
   */
  smove = (source, destination, member) => this.chain(new SMoveCommand([source, destination, member], this.commandOptions));
  /**
   * @see https://redis.io/commands/spop
   */
  spop = (...args) => this.chain(new SPopCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/srandmember
   */
  srandmember = (...args) => this.chain(new SRandMemberCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/srem
   */
  srem = (key, ...members) => this.chain(new SRemCommand([key, ...members], this.commandOptions));
  /**
   * @see https://redis.io/commands/sscan
   */
  sscan = (...args) => this.chain(new SScanCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/strlen
   */
  strlen = (...args) => this.chain(new StrLenCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/sunion
   */
  sunion = (...args) => this.chain(new SUnionCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/sunionstore
   */
  sunionstore = (...args) => this.chain(new SUnionStoreCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/time
   */
  time = () => this.chain(new TimeCommand(this.commandOptions));
  /**
   * @see https://redis.io/commands/touch
   */
  touch = (...args) => this.chain(new TouchCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/ttl
   */
  ttl = (...args) => this.chain(new TtlCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/type
   */
  type = (...args) => this.chain(new TypeCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/unlink
   */
  unlink = (...args) => this.chain(new UnlinkCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/zadd
   */
  zadd = (...args) => {
    if ("score" in args[1]) {
      return this.chain(
        new ZAddCommand([args[0], args[1], ...args.slice(2)], this.commandOptions)
      );
    }
    return this.chain(
      new ZAddCommand(
        [args[0], args[1], ...args.slice(2)],
        this.commandOptions
      )
    );
  };
  /**
   * @see https://redis.io/commands/xadd
   */
  xadd = (...args) => this.chain(new XAddCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/xack
   */
  xack = (...args) => this.chain(new XAckCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/xackdel
   */
  xackdel = (...args) => this.chain(new XAckDelCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/xdel
   */
  xdel = (...args) => this.chain(new XDelCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/xdelex
   */
  xdelex = (...args) => this.chain(new XDelExCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/xgroup
   */
  xgroup = (...args) => this.chain(new XGroupCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/xread
   */
  xread = (...args) => this.chain(new XReadCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/xreadgroup
   */
  xreadgroup = (...args) => this.chain(new XReadGroupCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/xinfo
   */
  xinfo = (...args) => this.chain(new XInfoCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/xlen
   */
  xlen = (...args) => this.chain(new XLenCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/xpending
   */
  xpending = (...args) => this.chain(new XPendingCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/xclaim
   */
  xclaim = (...args) => this.chain(new XClaimCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/xautoclaim
   */
  xautoclaim = (...args) => this.chain(new XAutoClaim(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/xtrim
   */
  xtrim = (...args) => this.chain(new XTrimCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/xrange
   */
  xrange = (...args) => this.chain(new XRangeCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/xrevrange
   */
  xrevrange = (...args) => this.chain(new XRevRangeCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/zcard
   */
  zcard = (...args) => this.chain(new ZCardCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/zcount
   */
  zcount = (...args) => this.chain(new ZCountCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/zincrby
   */
  zincrby = (key, increment, member) => this.chain(new ZIncrByCommand([key, increment, member], this.commandOptions));
  /**
   * @see https://redis.io/commands/zinterstore
   */
  zinterstore = (...args) => this.chain(new ZInterStoreCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/zlexcount
   */
  zlexcount = (...args) => this.chain(new ZLexCountCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/zmscore
   */
  zmscore = (...args) => this.chain(new ZMScoreCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/zpopmax
   */
  zpopmax = (...args) => this.chain(new ZPopMaxCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/zpopmin
   */
  zpopmin = (...args) => this.chain(new ZPopMinCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/zrange
   */
  zrange = (...args) => this.chain(new ZRangeCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/zrank
   */
  zrank = (key, member) => this.chain(new ZRankCommand([key, member], this.commandOptions));
  /**
   * @see https://redis.io/commands/zrem
   */
  zrem = (key, ...members) => this.chain(new ZRemCommand([key, ...members], this.commandOptions));
  /**
   * @see https://redis.io/commands/zremrangebylex
   */
  zremrangebylex = (...args) => this.chain(new ZRemRangeByLexCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/zremrangebyrank
   */
  zremrangebyrank = (...args) => this.chain(new ZRemRangeByRankCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/zremrangebyscore
   */
  zremrangebyscore = (...args) => this.chain(new ZRemRangeByScoreCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/zrevrank
   */
  zrevrank = (key, member) => this.chain(new ZRevRankCommand([key, member], this.commandOptions));
  /**
   * @see https://redis.io/commands/zscan
   */
  zscan = (...args) => this.chain(new ZScanCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/zscore
   */
  zscore = (key, member) => this.chain(new ZScoreCommand([key, member], this.commandOptions));
  /**
   * @see https://redis.io/commands/zunionstore
   */
  zunionstore = (...args) => this.chain(new ZUnionStoreCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/zunion
   */
  zunion = (...args) => this.chain(new ZUnionCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/?group=json
   */
  get json() {
    return {
      /**
       * @see https://redis.io/commands/json.arrappend
       */
      arrappend: (...args) => this.chain(new JsonArrAppendCommand(args, this.commandOptions)),
      /**
       * @see https://redis.io/commands/json.arrindex
       */
      arrindex: (...args) => this.chain(new JsonArrIndexCommand(args, this.commandOptions)),
      /**
       * @see https://redis.io/commands/json.arrinsert
       */
      arrinsert: (...args) => this.chain(new JsonArrInsertCommand(args, this.commandOptions)),
      /**
       * @see https://redis.io/commands/json.arrlen
       */
      arrlen: (...args) => this.chain(new JsonArrLenCommand(args, this.commandOptions)),
      /**
       * @see https://redis.io/commands/json.arrpop
       */
      arrpop: (...args) => this.chain(new JsonArrPopCommand(args, this.commandOptions)),
      /**
       * @see https://redis.io/commands/json.arrtrim
       */
      arrtrim: (...args) => this.chain(new JsonArrTrimCommand(args, this.commandOptions)),
      /**
       * @see https://redis.io/commands/json.clear
       */
      clear: (...args) => this.chain(new JsonClearCommand(args, this.commandOptions)),
      /**
       * @see https://redis.io/commands/json.del
       */
      del: (...args) => this.chain(new JsonDelCommand(args, this.commandOptions)),
      /**
       * @see https://redis.io/commands/json.forget
       */
      forget: (...args) => this.chain(new JsonForgetCommand(args, this.commandOptions)),
      /**
       * @see https://redis.io/commands/json.get
       */
      get: (...args) => this.chain(new JsonGetCommand(args, this.commandOptions)),
      /**
       * @see https://redis.io/commands/json.merge
       */
      merge: (...args) => this.chain(new JsonMergeCommand(args, this.commandOptions)),
      /**
       * @see https://redis.io/commands/json.mget
       */
      mget: (...args) => this.chain(new JsonMGetCommand(args, this.commandOptions)),
      /**
       * @see https://redis.io/commands/json.mset
       */
      mset: (...args) => this.chain(new JsonMSetCommand(args, this.commandOptions)),
      /**
       * @see https://redis.io/commands/json.numincrby
       */
      numincrby: (...args) => this.chain(new JsonNumIncrByCommand(args, this.commandOptions)),
      /**
       * @see https://redis.io/commands/json.nummultby
       */
      nummultby: (...args) => this.chain(new JsonNumMultByCommand(args, this.commandOptions)),
      /**
       * @see https://redis.io/commands/json.objkeys
       */
      objkeys: (...args) => this.chain(new JsonObjKeysCommand(args, this.commandOptions)),
      /**
       * @see https://redis.io/commands/json.objlen
       */
      objlen: (...args) => this.chain(new JsonObjLenCommand(args, this.commandOptions)),
      /**
       * @see https://redis.io/commands/json.resp
       */
      resp: (...args) => this.chain(new JsonRespCommand(args, this.commandOptions)),
      /**
       * @see https://redis.io/commands/json.set
       */
      set: (...args) => this.chain(new JsonSetCommand(args, this.commandOptions)),
      /**
       * @see https://redis.io/commands/json.strappend
       */
      strappend: (...args) => this.chain(new JsonStrAppendCommand(args, this.commandOptions)),
      /**
       * @see https://redis.io/commands/json.strlen
       */
      strlen: (...args) => this.chain(new JsonStrLenCommand(args, this.commandOptions)),
      /**
       * @see https://redis.io/commands/json.toggle
       */
      toggle: (...args) => this.chain(new JsonToggleCommand(args, this.commandOptions)),
      /**
       * @see https://redis.io/commands/json.type
       */
      type: (...args) => this.chain(new JsonTypeCommand(args, this.commandOptions))
    };
  }
  get functions() {
    return {
      /**
       * @see https://redis.io/docs/latest/commands/function-load/
       */
      load: (...args) => this.chain(new FunctionLoadCommand(args, this.commandOptions)),
      /**
       * @see https://redis.io/docs/latest/commands/function-list/
       */
      list: (...args) => this.chain(new FunctionListCommand(args, this.commandOptions)),
      /**
       * @see https://redis.io/docs/latest/commands/function-delete/
       */
      delete: (...args) => this.chain(new FunctionDeleteCommand(args, this.commandOptions)),
      /**
       * @see https://redis.io/docs/latest/commands/function-flush/
       */
      flush: () => this.chain(new FunctionFlushCommand(this.commandOptions)),
      /**
       * @see https://redis.io/docs/latest/commands/function-stats/
       */
      stats: () => this.chain(new FunctionStatsCommand(this.commandOptions)),
      /**
       * @see https://redis.io/docs/latest/commands/fcall/
       */
      call: (...args) => this.chain(new FCallCommand(args, this.commandOptions)),
      /**
       * @see https://redis.io/docs/latest/commands/fcall_ro/
       */
      callRo: (...args) => this.chain(new FCallRoCommand(args, this.commandOptions))
    };
  }
};
var EXCLUDE_COMMANDS = /* @__PURE__ */ new Set([
  "scan",
  "keys",
  "flushdb",
  "flushall",
  "dbsize",
  "hscan",
  "hgetall",
  "hkeys",
  "lrange",
  "sscan",
  "smembers",
  "xrange",
  "xrevrange",
  "zscan",
  "zrange",
  "exec"
]);
function createAutoPipelineProxy(_redis, namespace = "root") {
  const redis = _redis;
  if (!redis.autoPipelineExecutor) {
    redis.autoPipelineExecutor = new AutoPipelineExecutor(redis);
  }
  return new Proxy(redis, {
    get: (redis2, command) => {
      if (command === "pipelineCounter") {
        return redis2.autoPipelineExecutor.pipelineCounter;
      }
      if (namespace === "root" && command === "json") {
        return createAutoPipelineProxy(redis2, "json");
      }
      if (namespace === "root" && command === "functions") {
        return createAutoPipelineProxy(redis2, "functions");
      }
      if (namespace === "root") {
        const commandInRedisButNotPipeline = command in redis2 && !(command in redis2.autoPipelineExecutor.pipeline);
        const isCommandExcluded = EXCLUDE_COMMANDS.has(command);
        if (commandInRedisButNotPipeline || isCommandExcluded) {
          return redis2[command];
        }
      }
      const pipeline = redis2.autoPipelineExecutor.pipeline;
      const targetFunction = namespace === "json" ? pipeline.json[command] : namespace === "functions" ? pipeline.functions[command] : pipeline[command];
      const isFunction = typeof targetFunction === "function";
      if (isFunction) {
        return (...args) => {
          return redis2.autoPipelineExecutor.withAutoPipeline((pipeline2) => {
            const targetFunction2 = namespace === "json" ? pipeline2.json[command] : namespace === "functions" ? pipeline2.functions[command] : pipeline2[command];
            targetFunction2(...args);
          });
        };
      }
      return targetFunction;
    }
  });
}
var AutoPipelineExecutor = class {
  pipelinePromises = /* @__PURE__ */ new WeakMap();
  activePipeline = null;
  indexInCurrentPipeline = 0;
  redis;
  pipeline;
  // only to make sure that proxy can work
  pipelineCounter = 0;
  // to keep track of how many times a pipeline was executed
  constructor(redis) {
    this.redis = redis;
    this.pipeline = redis.pipeline();
  }
  async withAutoPipeline(executeWithPipeline) {
    const pipeline = this.activePipeline ?? this.redis.pipeline();
    if (!this.activePipeline) {
      this.activePipeline = pipeline;
      this.indexInCurrentPipeline = 0;
    }
    const index = this.indexInCurrentPipeline++;
    executeWithPipeline(pipeline);
    const pipelineDone = this.deferExecution().then(() => {
      if (!this.pipelinePromises.has(pipeline)) {
        const pipelinePromise = pipeline.exec({ keepErrors: true });
        this.pipelineCounter += 1;
        this.pipelinePromises.set(pipeline, pipelinePromise);
        this.activePipeline = null;
      }
      return this.pipelinePromises.get(pipeline);
    });
    const results = await pipelineDone;
    const commandResult = results[index];
    if (commandResult.error) {
      throw new UpstashError(`Command failed: ${commandResult.error}`);
    }
    return commandResult.result;
  }
  async deferExecution() {
    await Promise.resolve();
    await Promise.resolve();
  }
};
var PSubscribeCommand = class extends Command {
  constructor(cmd, opts) {
    const sseHeaders = {
      Accept: "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive"
    };
    super([], {
      ...opts,
      headers: sseHeaders,
      path: ["psubscribe", ...cmd],
      streamOptions: {
        isStreaming: true,
        onMessage: opts?.streamOptions?.onMessage,
        signal: opts?.streamOptions?.signal
      }
    });
  }
};
var Subscriber = class extends EventTarget {
  subscriptions;
  client;
  listeners;
  opts;
  constructor(client, channels, isPattern = false, opts) {
    super();
    this.client = client;
    this.subscriptions = /* @__PURE__ */ new Map();
    this.listeners = /* @__PURE__ */ new Map();
    this.opts = opts;
    for (const channel2 of channels) {
      if (isPattern) {
        this.subscribeToPattern(channel2);
      } else {
        this.subscribeToChannel(channel2);
      }
    }
  }
  subscribeToChannel(channel2) {
    const controller = new AbortController();
    const command = new SubscribeCommand([channel2], {
      streamOptions: {
        signal: controller.signal,
        onMessage: (data) => this.handleMessage(data, false)
      }
    });
    command.exec(this.client).catch((error) => {
      if (error.name !== "AbortError") {
        this.dispatchToListeners("error", error);
      }
    });
    this.subscriptions.set(channel2, {
      command,
      controller,
      isPattern: false
    });
  }
  subscribeToPattern(pattern) {
    const controller = new AbortController();
    const command = new PSubscribeCommand([pattern], {
      streamOptions: {
        signal: controller.signal,
        onMessage: (data) => this.handleMessage(data, true)
      }
    });
    command.exec(this.client).catch((error) => {
      if (error.name !== "AbortError") {
        this.dispatchToListeners("error", error);
      }
    });
    this.subscriptions.set(pattern, {
      command,
      controller,
      isPattern: true
    });
  }
  handleMessage(data, isPattern) {
    const messageData = data.replace(/^data:\s*/, "");
    const firstCommaIndex = messageData.indexOf(",");
    const secondCommaIndex = messageData.indexOf(",", firstCommaIndex + 1);
    const thirdCommaIndex = isPattern ? messageData.indexOf(",", secondCommaIndex + 1) : -1;
    if (firstCommaIndex !== -1 && secondCommaIndex !== -1) {
      const type = messageData.slice(0, firstCommaIndex);
      if (isPattern && type === "pmessage" && thirdCommaIndex !== -1) {
        const pattern = messageData.slice(firstCommaIndex + 1, secondCommaIndex);
        const channel2 = messageData.slice(secondCommaIndex + 1, thirdCommaIndex);
        const messageStr = messageData.slice(thirdCommaIndex + 1);
        try {
          const message2 = this.opts?.automaticDeserialization === false ? messageStr : JSON.parse(messageStr);
          this.dispatchToListeners("pmessage", { pattern, channel: channel2, message: message2 });
          this.dispatchToListeners(`pmessage:${pattern}`, { pattern, channel: channel2, message: message2 });
        } catch (error) {
          this.dispatchToListeners("error", new Error(`Failed to parse message: ${error}`));
        }
      } else {
        const channel2 = messageData.slice(firstCommaIndex + 1, secondCommaIndex);
        const messageStr = messageData.slice(secondCommaIndex + 1);
        try {
          if (type === "subscribe" || type === "psubscribe" || type === "unsubscribe" || type === "punsubscribe") {
            const count = Number.parseInt(messageStr);
            this.dispatchToListeners(type, count);
          } else {
            const message2 = this.opts?.automaticDeserialization === false ? messageStr : parseWithTryCatch(messageStr);
            this.dispatchToListeners(type, { channel: channel2, message: message2 });
            this.dispatchToListeners(`${type}:${channel2}`, { channel: channel2, message: message2 });
          }
        } catch (error) {
          this.dispatchToListeners("error", new Error(`Failed to parse message: ${error}`));
        }
      }
    }
  }
  dispatchToListeners(type, data) {
    const listeners = this.listeners.get(type);
    if (listeners) {
      for (const listener of listeners) {
        listener(data);
      }
    }
  }
  on(type, listener) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, /* @__PURE__ */ new Set());
    }
    this.listeners.get(type)?.add(listener);
  }
  removeAllListeners() {
    this.listeners.clear();
  }
  async unsubscribe(channels) {
    if (channels) {
      for (const channel2 of channels) {
        const subscription = this.subscriptions.get(channel2);
        if (subscription) {
          try {
            subscription.controller.abort();
          } catch {
          }
          this.subscriptions.delete(channel2);
        }
      }
    } else {
      for (const subscription of this.subscriptions.values()) {
        try {
          subscription.controller.abort();
        } catch {
        }
      }
      this.subscriptions.clear();
      this.removeAllListeners();
    }
  }
  getSubscribedChannels() {
    return [...this.subscriptions.keys()];
  }
};
var SubscribeCommand = class extends Command {
  constructor(cmd, opts) {
    const sseHeaders = {
      Accept: "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive"
    };
    super([], {
      ...opts,
      headers: sseHeaders,
      path: ["subscribe", ...cmd],
      streamOptions: {
        isStreaming: true,
        onMessage: opts?.streamOptions?.onMessage,
        signal: opts?.streamOptions?.signal
      }
    });
  }
};
var parseWithTryCatch = (str) => {
  try {
    return JSON.parse(str);
  } catch {
    return str;
  }
};
var Script = class {
  script;
  /**
   * @deprecated This property is initialized to an empty string and will be set in the init method
   * asynchronously. Do not use this property immidiately after the constructor.
   *
   * This property is only exposed for backwards compatibility and will be removed in the
   * future major release.
   */
  sha1;
  initPromise;
  redis;
  constructor(redis, script) {
    this.redis = redis;
    this.script = script;
    this.sha1 = "";
    void this.init(script);
  }
  /**
   * Initialize the script by computing its SHA-1 hash.
   */
  init(script) {
    if (!this.initPromise) {
      this.initPromise = this.digest(script).then((sha1) => {
        this.sha1 = sha1;
      });
    }
    return this.initPromise;
  }
  /**
   * Send an `EVAL` command to redis.
   */
  async eval(keys, args) {
    await this.init(this.script);
    return await this.redis.eval(this.script, keys, args);
  }
  /**
   * Calculates the sha1 hash of the script and then calls `EVALSHA`.
   */
  async evalsha(keys, args) {
    await this.init(this.script);
    return await this.redis.evalsha(this.sha1, keys, args);
  }
  /**
   * Optimistically try to run `EVALSHA` first.
   * If the script is not loaded in redis, it will fall back and try again with `EVAL`.
   *
   * Following calls will be able to use the cached script
   */
  async exec(keys, args) {
    await this.init(this.script);
    const res = await this.redis.evalsha(this.sha1, keys, args).catch(async (error) => {
      if (error instanceof Error && error.message.toLowerCase().includes("noscript")) {
        return await this.redis.eval(this.script, keys, args);
      }
      throw error;
    });
    return res;
  }
  /**
   * Compute the sha1 hash of the script and return its hex representation.
   */
  async digest(s) {
    const data = new TextEncoder().encode(s);
    const hashBuffer = await subtle.digest("SHA-1", data);
    const hashArray = [...new Uint8Array(hashBuffer)];
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }
};
var ScriptRO = class {
  script;
  /**
   * @deprecated This property is initialized to an empty string and will be set in the init method
   * asynchronously. Do not use this property immidiately after the constructor.
   *
   * This property is only exposed for backwards compatibility and will be removed in the
   * future major release.
   */
  sha1;
  initPromise;
  redis;
  constructor(redis, script) {
    this.redis = redis;
    this.sha1 = "";
    this.script = script;
    void this.init(script);
  }
  init(script) {
    if (!this.initPromise) {
      this.initPromise = this.digest(script).then((sha1) => {
        this.sha1 = sha1;
      });
    }
    return this.initPromise;
  }
  /**
   * Send an `EVAL_RO` command to redis.
   */
  async evalRo(keys, args) {
    await this.init(this.script);
    return await this.redis.evalRo(this.script, keys, args);
  }
  /**
   * Calculates the sha1 hash of the script and then calls `EVALSHA_RO`.
   */
  async evalshaRo(keys, args) {
    await this.init(this.script);
    return await this.redis.evalshaRo(this.sha1, keys, args);
  }
  /**
   * Optimistically try to run `EVALSHA_RO` first.
   * If the script is not loaded in redis, it will fall back and try again with `EVAL_RO`.
   *
   * Following calls will be able to use the cached script
   */
  async exec(keys, args) {
    await this.init(this.script);
    const res = await this.redis.evalshaRo(this.sha1, keys, args).catch(async (error) => {
      if (error instanceof Error && error.message.toLowerCase().includes("noscript")) {
        return await this.redis.evalRo(this.script, keys, args);
      }
      throw error;
    });
    return res;
  }
  /**
   * Compute the sha1 hash of the script and return its hex representation.
   */
  async digest(s) {
    const data = new TextEncoder().encode(s);
    const hashBuffer = await subtle.digest("SHA-1", data);
    const hashArray = [...new Uint8Array(hashBuffer)];
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }
};
var Redis = class {
  client;
  opts;
  enableTelemetry;
  enableAutoPipelining;
  /**
   * Create a new redis client
   *
   * @example
   * ```typescript
   * const redis = new Redis({
   *  url: "<UPSTASH_REDIS_REST_URL>",
   *  token: "<UPSTASH_REDIS_REST_TOKEN>",
   * });
   * ```
   */
  constructor(client, opts) {
    this.client = client;
    this.opts = opts;
    this.enableTelemetry = opts?.enableTelemetry ?? true;
    if (opts?.readYourWrites === false) {
      this.client.readYourWrites = false;
    }
    this.enableAutoPipelining = opts?.enableAutoPipelining ?? true;
  }
  get readYourWritesSyncToken() {
    return this.client.upstashSyncToken;
  }
  set readYourWritesSyncToken(session) {
    this.client.upstashSyncToken = session;
  }
  get json() {
    return {
      /**
       * @see https://redis.io/commands/json.arrappend
       */
      arrappend: (...args) => new JsonArrAppendCommand(args, this.opts).exec(this.client),
      /**
       * @see https://redis.io/commands/json.arrindex
       */
      arrindex: (...args) => new JsonArrIndexCommand(args, this.opts).exec(this.client),
      /**
       * @see https://redis.io/commands/json.arrinsert
       */
      arrinsert: (...args) => new JsonArrInsertCommand(args, this.opts).exec(this.client),
      /**
       * @see https://redis.io/commands/json.arrlen
       */
      arrlen: (...args) => new JsonArrLenCommand(args, this.opts).exec(this.client),
      /**
       * @see https://redis.io/commands/json.arrpop
       */
      arrpop: (...args) => new JsonArrPopCommand(args, this.opts).exec(this.client),
      /**
       * @see https://redis.io/commands/json.arrtrim
       */
      arrtrim: (...args) => new JsonArrTrimCommand(args, this.opts).exec(this.client),
      /**
       * @see https://redis.io/commands/json.clear
       */
      clear: (...args) => new JsonClearCommand(args, this.opts).exec(this.client),
      /**
       * @see https://redis.io/commands/json.del
       */
      del: (...args) => new JsonDelCommand(args, this.opts).exec(this.client),
      /**
       * @see https://redis.io/commands/json.forget
       */
      forget: (...args) => new JsonForgetCommand(args, this.opts).exec(this.client),
      /**
       * @see https://redis.io/commands/json.get
       */
      get: (...args) => new JsonGetCommand(args, this.opts).exec(this.client),
      /**
       * @see https://redis.io/commands/json.merge
       */
      merge: (...args) => new JsonMergeCommand(args, this.opts).exec(this.client),
      /**
       * @see https://redis.io/commands/json.mget
       */
      mget: (...args) => new JsonMGetCommand(args, this.opts).exec(this.client),
      /**
       * @see https://redis.io/commands/json.mset
       */
      mset: (...args) => new JsonMSetCommand(args, this.opts).exec(this.client),
      /**
       * @see https://redis.io/commands/json.numincrby
       */
      numincrby: (...args) => new JsonNumIncrByCommand(args, this.opts).exec(this.client),
      /**
       * @see https://redis.io/commands/json.nummultby
       */
      nummultby: (...args) => new JsonNumMultByCommand(args, this.opts).exec(this.client),
      /**
       * @see https://redis.io/commands/json.objkeys
       */
      objkeys: (...args) => new JsonObjKeysCommand(args, this.opts).exec(this.client),
      /**
       * @see https://redis.io/commands/json.objlen
       */
      objlen: (...args) => new JsonObjLenCommand(args, this.opts).exec(this.client),
      /**
       * @see https://redis.io/commands/json.resp
       */
      resp: (...args) => new JsonRespCommand(args, this.opts).exec(this.client),
      /**
       * @see https://redis.io/commands/json.set
       */
      set: (...args) => new JsonSetCommand(args, this.opts).exec(this.client),
      /**
       * @see https://redis.io/commands/json.strappend
       */
      strappend: (...args) => new JsonStrAppendCommand(args, this.opts).exec(this.client),
      /**
       * @see https://redis.io/commands/json.strlen
       */
      strlen: (...args) => new JsonStrLenCommand(args, this.opts).exec(this.client),
      /**
       * @see https://redis.io/commands/json.toggle
       */
      toggle: (...args) => new JsonToggleCommand(args, this.opts).exec(this.client),
      /**
       * @see https://redis.io/commands/json.type
       */
      type: (...args) => new JsonTypeCommand(args, this.opts).exec(this.client)
    };
  }
  get functions() {
    return {
      /**
       * @see https://redis.io/docs/latest/commands/function-load/
       */
      load: (...args) => new FunctionLoadCommand(args, this.opts).exec(this.client),
      /**
       * @see https://redis.io/docs/latest/commands/function-list/
       */
      list: (...args) => new FunctionListCommand(args, this.opts).exec(this.client),
      /**
       * @see https://redis.io/docs/latest/commands/function-delete/
       */
      delete: (...args) => new FunctionDeleteCommand(args, this.opts).exec(this.client),
      /**
       * @see https://redis.io/docs/latest/commands/function-flush/
       */
      flush: () => new FunctionFlushCommand(this.opts).exec(this.client),
      /**
       * @see https://redis.io/docs/latest/commands/function-stats/
       *
       * Note: `running_script` field is not supported and therefore not included in the type.
       */
      stats: () => new FunctionStatsCommand(this.opts).exec(this.client),
      /**
       * @see https://redis.io/docs/latest/commands/fcall/
       */
      call: (...args) => new FCallCommand(args, this.opts).exec(this.client),
      /**
       * @see https://redis.io/docs/latest/commands/fcall_ro/
       */
      callRo: (...args) => new FCallRoCommand(args, this.opts).exec(this.client)
    };
  }
  /**
   * Wrap a new middleware around the HTTP client.
   */
  use = (middleware) => {
    const makeRequest = this.client.request.bind(this.client);
    this.client.request = (req) => middleware(req, makeRequest);
  };
  /**
   * Technically this is not private, we can hide it from intellisense by doing this
   */
  addTelemetry = (telemetry) => {
    if (!this.enableTelemetry) {
      return;
    }
    try {
      this.client.mergeTelemetry(telemetry);
    } catch {
    }
  };
  /**
   * Creates a new script.
   *
   * Scripts offer the ability to optimistically try to execute a script without having to send the
   * entire script to the server. If the script is loaded on the server, it tries again by sending
   * the entire script. Afterwards, the script is cached on the server.
   *
   * @param script - The script to create
   * @param opts - Optional options to pass to the script `{ readonly?: boolean }`
   * @returns A new script
   *
   * @example
   * ```ts
   * const redis = new Redis({...})
   *
   * const script = redis.createScript<string>("return ARGV[1];")
   * const arg1 = await script.eval([], ["Hello World"])
   * expect(arg1, "Hello World")
   * ```
   * @example
   * ```ts
   * const redis = new Redis({...})
   *
   * const script = redis.createScript<string>("return ARGV[1];", { readonly: true })
   * const arg1 = await script.evalRo([], ["Hello World"])
   * expect(arg1, "Hello World")
   * ```
   */
  createScript(script, opts) {
    return opts?.readonly ? new ScriptRO(this, script) : new Script(this, script);
  }
  get search() {
    return {
      createIndex: (params) => {
        return createIndex(this.client, params);
      },
      index: (params) => {
        return initIndex(this.client, params);
      },
      alias: {
        list: () => {
          return listAliases(this.client);
        },
        add: ({ indexName, alias }) => {
          return addAlias(this.client, { indexName, alias });
        },
        delete: ({ alias }) => {
          return delAlias(this.client, { alias });
        }
      }
    };
  }
  /**
   * Create a new pipeline that allows you to send requests in bulk.
   *
   * @see {@link Pipeline}
   */
  pipeline = () => new Pipeline({
    client: this.client,
    commandOptions: this.opts,
    multiExec: false
  });
  autoPipeline = () => {
    return createAutoPipelineProxy(this);
  };
  /**
   * Create a new transaction to allow executing multiple steps atomically.
   *
   * All the commands in a transaction are serialized and executed sequentially. A request sent by
   * another client will never be served in the middle of the execution of a Redis Transaction. This
   * guarantees that the commands are executed as a single isolated operation.
   *
   * @see {@link Pipeline}
   */
  multi = () => new Pipeline({
    client: this.client,
    commandOptions: this.opts,
    multiExec: true
  });
  /**
   * Returns an instance that can be used to execute `BITFIELD` commands on one key.
   *
   * @example
   * ```typescript
   * redis.set("mykey", 0);
   * const result = await redis.bitfield("mykey")
   *   .set("u4", 0, 16)
   *   .incr("u4", "#1", 1)
   *   .exec();
   * console.log(result); // [0, 1]
   * ```
   *
   * @see https://redis.io/commands/bitfield
   */
  bitfield = (...args) => new BitFieldCommand(args, this.client, this.opts);
  /**
   * @see https://redis.io/commands/append
   */
  append = (...args) => new AppendCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/bitcount
   */
  bitcount = (...args) => new BitCountCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/bitop
   */
  bitop = (op, destinationKey, sourceKey, ...sourceKeys) => new BitOpCommand([op, destinationKey, sourceKey, ...sourceKeys], this.opts).exec(
    this.client
  );
  /**
   * @see https://redis.io/commands/bitpos
   */
  bitpos = (...args) => new BitPosCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/client-setinfo
   */
  clientSetinfo = (...args) => new ClientSetInfoCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/copy
   */
  copy = (...args) => new CopyCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/dbsize
   */
  dbsize = () => new DBSizeCommand(this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/decr
   */
  decr = (...args) => new DecrCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/decrby
   */
  decrby = (...args) => new DecrByCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/del
   */
  del = (...args) => new DelCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/echo
   */
  echo = (...args) => new EchoCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/eval_ro
   */
  evalRo = (...args) => new EvalROCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/eval
   */
  eval = (...args) => new EvalCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/evalsha_ro
   */
  evalshaRo = (...args) => new EvalshaROCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/evalsha
   */
  evalsha = (...args) => new EvalshaCommand(args, this.opts).exec(this.client);
  /**
   * Generic method to execute any Redis command.
   */
  exec = (args) => new ExecCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/exists
   */
  exists = (...args) => new ExistsCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/expire
   */
  expire = (...args) => new ExpireCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/expireat
   */
  expireat = (...args) => new ExpireAtCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/flushall
   */
  flushall = (args) => new FlushAllCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/flushdb
   */
  flushdb = (...args) => new FlushDBCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/geoadd
   */
  geoadd = (...args) => new GeoAddCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/geopos
   */
  geopos = (...args) => new GeoPosCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/geodist
   */
  geodist = (...args) => new GeoDistCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/geohash
   */
  geohash = (...args) => new GeoHashCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/geosearch
   */
  geosearch = (...args) => new GeoSearchCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/geosearchstore
   */
  geosearchstore = (...args) => new GeoSearchStoreCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/get
   */
  get = (...args) => new GetCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/getbit
   */
  getbit = (...args) => new GetBitCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/getdel
   */
  getdel = (...args) => new GetDelCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/getex
   */
  getex = (...args) => new GetExCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/getrange
   */
  getrange = (...args) => new GetRangeCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/getset
   */
  getset = (key, value) => new GetSetCommand([key, value], this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/hdel
   */
  hdel = (...args) => new HDelCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/hexists
   */
  hexists = (...args) => new HExistsCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/hexpire
   */
  hexpire = (...args) => new HExpireCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/hexpireat
   */
  hexpireat = (...args) => new HExpireAtCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/hexpiretime
   */
  hexpiretime = (...args) => new HExpireTimeCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/httl
   */
  httl = (...args) => new HTtlCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/hpexpire
   */
  hpexpire = (...args) => new HPExpireCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/hpexpireat
   */
  hpexpireat = (...args) => new HPExpireAtCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/hpexpiretime
   */
  hpexpiretime = (...args) => new HPExpireTimeCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/hpttl
   */
  hpttl = (...args) => new HPTtlCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/hpersist
   */
  hpersist = (...args) => new HPersistCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/hget
   */
  hget = (...args) => new HGetCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/hgetall
   */
  hgetall = (...args) => new HGetAllCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/hgetdel
   */
  hgetdel = (...args) => new HGetDelCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/hgetex
   */
  hgetex = (...args) => new HGetExCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/hincrby
   */
  hincrby = (...args) => new HIncrByCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/hincrbyfloat
   */
  hincrbyfloat = (...args) => new HIncrByFloatCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/hkeys
   */
  hkeys = (...args) => new HKeysCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/hlen
   */
  hlen = (...args) => new HLenCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/hmget
   */
  hmget = (...args) => new HMGetCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/hmset
   */
  hmset = (key, kv) => new HMSetCommand([key, kv], this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/hrandfield
   */
  hrandfield = (key, count, withValues) => new HRandFieldCommand([key, count, withValues], this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/hscan
   */
  hscan = (...args) => new HScanCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/hset
   */
  hset = (key, kv) => new HSetCommand([key, kv], this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/hsetex
   */
  hsetex = (...args) => new HSetExCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/hsetnx
   */
  hsetnx = (key, field, value) => new HSetNXCommand([key, field, value], this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/hstrlen
   */
  hstrlen = (...args) => new HStrLenCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/hvals
   */
  hvals = (...args) => new HValsCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/incr
   */
  incr = (...args) => new IncrCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/incrby
   */
  incrby = (...args) => new IncrByCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/incrbyfloat
   */
  incrbyfloat = (...args) => new IncrByFloatCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/keys
   */
  keys = (...args) => new KeysCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/lindex
   */
  lindex = (...args) => new LIndexCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/linsert
   */
  linsert = (key, direction, pivot, value) => new LInsertCommand([key, direction, pivot, value], this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/llen
   */
  llen = (...args) => new LLenCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/lmove
   */
  lmove = (...args) => new LMoveCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/lpop
   */
  lpop = (...args) => new LPopCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/lmpop
   */
  lmpop = (...args) => new LmPopCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/lpos
   */
  lpos = (...args) => new LPosCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/lpush
   */
  lpush = (key, ...elements) => new LPushCommand([key, ...elements], this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/lpushx
   */
  lpushx = (key, ...elements) => new LPushXCommand([key, ...elements], this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/lrange
   */
  lrange = (...args) => new LRangeCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/lrem
   */
  lrem = (key, count, value) => new LRemCommand([key, count, value], this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/lset
   */
  lset = (key, index, value) => new LSetCommand([key, index, value], this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/ltrim
   */
  ltrim = (...args) => new LTrimCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/mget
   */
  mget = (...args) => new MGetCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/mset
   */
  mset = (kv) => new MSetCommand([kv], this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/msetnx
   */
  msetnx = (kv) => new MSetNXCommand([kv], this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/persist
   */
  persist = (...args) => new PersistCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/pexpire
   */
  pexpire = (...args) => new PExpireCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/pexpireat
   */
  pexpireat = (...args) => new PExpireAtCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/pfadd
   */
  pfadd = (...args) => new PfAddCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/pfcount
   */
  pfcount = (...args) => new PfCountCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/pfmerge
   */
  pfmerge = (...args) => new PfMergeCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/ping
   */
  ping = (args) => new PingCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/psetex
   */
  psetex = (key, ttl, value) => new PSetEXCommand([key, ttl, value], this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/psubscribe
   */
  psubscribe = (patterns) => {
    const patternArray = Array.isArray(patterns) ? patterns : [patterns];
    return new Subscriber(this.client, patternArray, true, this.opts);
  };
  /**
   * @see https://redis.io/commands/pttl
   */
  pttl = (...args) => new PTtlCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/publish
   */
  publish = (...args) => new PublishCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/randomkey
   */
  randomkey = () => new RandomKeyCommand().exec(this.client);
  /**
   * @see https://redis.io/commands/rename
   */
  rename = (...args) => new RenameCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/renamenx
   */
  renamenx = (...args) => new RenameNXCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/rpop
   */
  rpop = (...args) => new RPopCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/rpush
   */
  rpush = (key, ...elements) => new RPushCommand([key, ...elements], this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/rpushx
   */
  rpushx = (key, ...elements) => new RPushXCommand([key, ...elements], this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/sadd
   */
  sadd = (key, member, ...members) => new SAddCommand([key, member, ...members], this.opts).exec(this.client);
  scan(cursor, opts) {
    return new ScanCommand([cursor, opts], this.opts).exec(this.client);
  }
  /**
   * @see https://redis.io/commands/scard
   */
  scard = (...args) => new SCardCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/script-exists
   */
  scriptExists = (...args) => new ScriptExistsCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/script-flush
   */
  scriptFlush = (...args) => new ScriptFlushCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/script-load
   */
  scriptLoad = (...args) => new ScriptLoadCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/sdiff
   */
  sdiff = (...args) => new SDiffCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/sdiffstore
   */
  sdiffstore = (...args) => new SDiffStoreCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/set
   */
  set = (key, value, opts) => new SetCommand([key, value, opts], this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/setbit
   */
  setbit = (...args) => new SetBitCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/setex
   */
  setex = (key, ttl, value) => new SetExCommand([key, ttl, value], this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/setnx
   */
  setnx = (key, value) => new SetNxCommand([key, value], this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/setrange
   */
  setrange = (...args) => new SetRangeCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/sinter
   */
  sinter = (...args) => new SInterCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/sintercard
   */
  sintercard = (...args) => new SInterCardCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/sinterstore
   */
  sinterstore = (...args) => new SInterStoreCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/sismember
   */
  sismember = (key, member) => new SIsMemberCommand([key, member], this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/smismember
   */
  smismember = (key, members) => new SMIsMemberCommand([key, members], this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/smembers
   */
  smembers = (...args) => new SMembersCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/smove
   */
  smove = (source, destination, member) => new SMoveCommand([source, destination, member], this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/spop
   */
  spop = (...args) => new SPopCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/srandmember
   */
  srandmember = (...args) => new SRandMemberCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/srem
   */
  srem = (key, ...members) => new SRemCommand([key, ...members], this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/sscan
   */
  sscan = (...args) => new SScanCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/strlen
   */
  strlen = (...args) => new StrLenCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/subscribe
   */
  subscribe = (channels) => {
    const channelArray = Array.isArray(channels) ? channels : [channels];
    return new Subscriber(this.client, channelArray, false, this.opts);
  };
  /**
   * @see https://redis.io/commands/sunion
   */
  sunion = (...args) => new SUnionCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/sunionstore
   */
  sunionstore = (...args) => new SUnionStoreCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/time
   */
  time = () => new TimeCommand().exec(this.client);
  /**
   * @see https://redis.io/commands/touch
   */
  touch = (...args) => new TouchCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/ttl
   */
  ttl = (...args) => new TtlCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/type
   */
  type = (...args) => new TypeCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/unlink
   */
  unlink = (...args) => new UnlinkCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/xadd
   */
  xadd = (...args) => new XAddCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/xack
   */
  xack = (...args) => new XAckCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/xackdel
   */
  xackdel = (...args) => new XAckDelCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/xdel
   */
  xdel = (...args) => new XDelCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/xdelex
   */
  xdelex = (...args) => new XDelExCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/xgroup
   */
  xgroup = (...args) => new XGroupCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/xread
   */
  xread = (...args) => new XReadCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/xreadgroup
   */
  xreadgroup = (...args) => new XReadGroupCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/xinfo
   */
  xinfo = (...args) => new XInfoCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/xlen
   */
  xlen = (...args) => new XLenCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/xpending
   */
  xpending = (...args) => new XPendingCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/xclaim
   */
  xclaim = (...args) => new XClaimCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/xautoclaim
   */
  xautoclaim = (...args) => new XAutoClaim(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/xtrim
   */
  xtrim = (...args) => new XTrimCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/xrange
   */
  xrange = (...args) => new XRangeCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/xrevrange
   */
  xrevrange = (...args) => new XRevRangeCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/zadd
   */
  zadd = (...args) => {
    if ("score" in args[1]) {
      return new ZAddCommand([args[0], args[1], ...args.slice(2)], this.opts).exec(
        this.client
      );
    }
    return new ZAddCommand(
      [args[0], args[1], ...args.slice(2)],
      this.opts
    ).exec(this.client);
  };
  /**
   * @see https://redis.io/commands/zcard
   */
  zcard = (...args) => new ZCardCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/zcount
   */
  zcount = (...args) => new ZCountCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/zdiffstore
   */
  zdiffstore = (...args) => new ZDiffStoreCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/zincrby
   */
  zincrby = (key, increment, member) => new ZIncrByCommand([key, increment, member], this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/zinterstore
   */
  zinterstore = (...args) => new ZInterStoreCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/zlexcount
   */
  zlexcount = (...args) => new ZLexCountCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/zmscore
   */
  zmscore = (...args) => new ZMScoreCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/zpopmax
   */
  zpopmax = (...args) => new ZPopMaxCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/zpopmin
   */
  zpopmin = (...args) => new ZPopMinCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/zrange
   */
  zrange = (...args) => new ZRangeCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/zrank
   */
  zrank = (key, member) => new ZRankCommand([key, member], this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/zrem
   */
  zrem = (key, ...members) => new ZRemCommand([key, ...members], this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/zremrangebylex
   */
  zremrangebylex = (...args) => new ZRemRangeByLexCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/zremrangebyrank
   */
  zremrangebyrank = (...args) => new ZRemRangeByRankCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/zremrangebyscore
   */
  zremrangebyscore = (...args) => new ZRemRangeByScoreCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/zrevrank
   */
  zrevrank = (key, member) => new ZRevRankCommand([key, member], this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/zscan
   */
  zscan = (...args) => new ZScanCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/zscore
   */
  zscore = (key, member) => new ZScoreCommand([key, member], this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/zunion
   */
  zunion = (...args) => new ZUnionCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/zunionstore
   */
  zunionstore = (...args) => new ZUnionStoreCommand(args, this.opts).exec(this.client);
};
var VERSION = "v1.30.2";

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
var Redis2 = class _Redis extends Redis {
  /**
   * Create a new redis client by providing a custom `Requester` implementation
   *
   * @example
   * ```ts
   *
   * import { UpstashRequest, Requester, UpstashResponse, Redis } from "@upstash/redis"
   *
   *  const requester: Requester = {
   *    request: <TResult>(req: UpstashRequest): Promise<UpstashResponse<TResult>> => {
   *      // ...
   *    }
   *  }
   *
   * const redis = new Redis(requester)
   * ```
   */
  constructor(configOrRequester) {
    if ("request" in configOrRequester) {
      super(configOrRequester);
      return;
    }
    if (!configOrRequester.url) {
      console.warn(
        `[Upstash Redis] The 'url' property is missing or undefined in your Redis config.`
      );
    } else if (configOrRequester.url.startsWith(" ") || configOrRequester.url.endsWith(" ") || /\r|\n/.test(configOrRequester.url)) {
      console.warn(
        "[Upstash Redis] The redis url contains whitespace or newline, which can cause errors!"
      );
    }
    if (!configOrRequester.token) {
      console.warn(
        `[Upstash Redis] The 'token' property is missing or undefined in your Redis config.`
      );
    } else if (configOrRequester.token.startsWith(" ") || configOrRequester.token.endsWith(" ") || /\r|\n/.test(configOrRequester.token)) {
      console.warn(
        "[Upstash Redis] The redis token contains whitespace or newline, which can cause errors!"
      );
    }
    const client = new HttpClient({
      baseUrl: configOrRequester.url,
      retry: configOrRequester.retry,
      headers: { authorization: `Bearer ${configOrRequester.token}` },
      agent: configOrRequester.agent,
      responseEncoding: configOrRequester.responseEncoding,
      cache: configOrRequester.cache ?? "no-store",
      signal: configOrRequester.signal,
      keepAlive: configOrRequester.keepAlive,
      readYourWrites: configOrRequester.readYourWrites
    });
    const safeEnv = typeof process === "object" && process && typeof process.env === "object" && process.env ? process.env : {};
    super(client, {
      automaticDeserialization: configOrRequester.automaticDeserialization,
      enableTelemetry: configOrRequester.enableTelemetry ?? !safeEnv.UPSTASH_DISABLE_TELEMETRY,
      latencyLogging: configOrRequester.latencyLogging,
      enableAutoPipelining: configOrRequester.enableAutoPipelining
    });
    const nodeVersion = typeof process === "object" && process ? process.version : void 0;
    this.addTelemetry({
      runtime: (
        // @ts-expect-error to silence compiler
        typeof EdgeRuntime === "string" ? "edge-light" : nodeVersion ? `node@${nodeVersion}` : "unknown"
      ),
      platform: safeEnv.UPSTASH_CONSOLE ? "console" : safeEnv.VERCEL ? "vercel" : safeEnv.AWS_REGION ? "aws" : "unknown",
      sdk: `@upstash/redis@${VERSION}`
    });
    if (this.enableAutoPipelining) {
      return this.autoPipeline();
    }
  }
  /**
   * Create a new Upstash Redis instance from environment variables.
   *
   * Use this to automatically load connection secrets from your environment
   * variables. For instance when using the Vercel integration.
   *
   * This tries to load connection details from your environment using `process.env`:
   * - URL: `UPSTASH_REDIS_REST_URL` or fallback to `KV_REST_API_URL`
   * - Token: `UPSTASH_REDIS_REST_TOKEN` or fallback to `KV_REST_API_TOKEN`
   *
   * The fallback variables provide compatibility with Vercel KV and other platforms
   * that may use different naming conventions.
   */
  static fromEnv(config2) {
    if (typeof process !== "object" || !process || typeof process.env !== "object" || !process.env) {
      throw new TypeError(
        '[Upstash Redis] Unable to get environment variables, `process.env` is undefined. If you are deploying to cloudflare, please import from "@upstash/redis/cloudflare" instead'
      );
    }
    const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
    if (!url) {
      console.warn("[Upstash Redis] Unable to find environment variable: `UPSTASH_REDIS_REST_URL`");
    }
    const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
    if (!token) {
      console.warn(
        "[Upstash Redis] Unable to find environment variable: `UPSTASH_REDIS_REST_TOKEN`"
      );
    }
    return new _Redis({ ...config2, url, token });
  }
};

// server/_shared/rate-limit.ts
init_client_ip();

// api/_upstash-json.js
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

// api/_rate-limit-fallback.js
var FALLBACK_REDIS_TIMEOUT_MS = 1e3;
var luaUnsupported = false;
function durationToSeconds(window) {
  const match = /^(\d+)\s?(ms|s|m|h|d)$/.exec(window);
  if (!match) throw new Error(`Unable to parse rate-limit window: ${window}`);
  const value = Number(match[1]);
  const unit = match[2] ?? "s";
  const unitSeconds = { ms: 1e-3, s: 1, m: 60, h: 3600, d: 86400 };
  return Math.max(1, Math.ceil(value * (unitSeconds[unit] ?? 1)));
}
function commandError(entry, command) {
  if (!entry?.error) return null;
  return new Error(`rate-limit fallback: ${command} failed: ${entry.error}`);
}
async function fixedWindowLimit(key, limit, windowSeconds) {
  const result = await redisPipeline([
    ["INCR", key],
    ["EXPIRE", key, String(windowSeconds), "NX"],
    ["TTL", key]
  ], FALLBACK_REDIS_TIMEOUT_MS);
  if (!result) throw new Error("rate-limit fallback: Redis pipeline unavailable");
  const incrError = commandError(result[0], "INCR");
  if (incrError) throw incrError;
  const expireError = commandError(result[1], "EXPIRE");
  if (expireError) throw expireError;
  const ttlError = commandError(result[2], "TTL");
  if (ttlError) throw ttlError;
  const count = Number(result[0]?.result ?? 0);
  if (!Number.isFinite(count) || count < 1) {
    throw new Error(`rate-limit fallback: invalid Redis counter (${String(result[0]?.result)})`);
  }
  const ttlRaw = Number(result[2]?.result ?? -1);
  if (!Number.isFinite(ttlRaw) || ttlRaw < 0) {
    throw new Error(`rate-limit fallback: Redis key has no expiry (ttl=${String(result[2]?.result ?? "missing")})`);
  }
  return { success: count <= limit, limit, reset: Date.now() + ttlRaw * 1e3 };
}
async function limitWithFallback(rl, identifier, fallbackKey, limit, windowSeconds) {
  if (!luaUnsupported) {
    try {
      return await rl.limit(identifier);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (!/Command not allowed: (EVAL|EVALSHA|SCRIPT)\b/i.test(msg)) throw err;
      luaUnsupported = true;
      console.warn("[rate-limit] EVAL/EVALSHA rejected by this Redis endpoint \u2014 switching to the non-Lua fixed-window fallback for the rest of this process");
    }
  }
  try {
    return await fixedWindowLimit(fallbackKey, limit, windowSeconds);
  } catch (err) {
    throw new Error("rate-limit fallback: Redis unavailable", { cause: err });
  }
}

// server/_shared/rate-limit.ts
init_client_ip();
var REDIS_TEST_RETRY_OPTS = process.env.NODE_TEST_CONTEXT ? { retry: false } : {};
var ratelimit = null;
var GLOBAL_RATE_LIMIT = 600;
var GLOBAL_RATE_WINDOW = "60 s";
var GLOBAL_RATE_WINDOW_SECONDS = durationToSeconds(GLOBAL_RATE_WINDOW);
function getRatelimit() {
  if (ratelimit) return ratelimit;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  ratelimit = new import_ratelimit.Ratelimit({
    redis: new Redis2({ url, token, ...REDIS_TEST_RETRY_OPTS }),
    limiter: import_ratelimit.Ratelimit.slidingWindow(GLOBAL_RATE_LIMIT, GLOBAL_RATE_WINDOW),
    prefix: "rl",
    analytics: false
  });
  return ratelimit;
}
function rateLimitErrorLevel(stage, msg) {
  if (stage.includes("missing-config")) return "error";
  if (/Error running script|execution timed out|Command failed|ETIMEDOUT|ECONNRESET|ENOTFOUND|fetch failed|network|timed out|socket hang up|Redis unavailable|Redis unreachable/i.test(msg)) {
    return "warning";
  }
  return "error";
}
function logRateLimitDegraded(stage, err) {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(`[rate-limit] redis-error stage=${stage} msg=${msg}`);
  captureSilentError(err, {
    tags: { surface: "server", component: "rate-limit", stage },
    fingerprint: ["rate-limit", "redis-error", stage],
    level: rateLimitErrorLevel(stage, msg)
  });
}
var scopedMissingConfigStages = /* @__PURE__ */ new Set();
function logScopedRateLimitMissingConfig(scope) {
  const stage = `checkScopedRateLimit:${scope}:missing-config`;
  if (scopedMissingConfigStages.has(stage)) return;
  scopedMissingConfigStages.add(stage);
  logRateLimitDegraded(stage, new Error("UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN missing"));
}
var RATE_LIMIT_DEGRADED_HEADERS = {
  "X-RateLimit-Mode": "degraded",
  // Short Retry-After encourages clients to retry once the limiter is back,
  // rather than treating the 503 as a hard outage.
  "Retry-After": "5"
};
function tooManyRequestsResponse(limit, reset, corsHeaders, windowSeconds) {
  const resetSeconds = Math.max(0, Math.ceil((reset - Date.now()) / 1e3));
  return new Response(JSON.stringify({ error: "Too many requests" }), {
    status: 429,
    headers: {
      "Content-Type": "application/json",
      // IETF RateLimit fields (draft-ietf-httpapi-ratelimit-headers). The
      // combined RateLimit member references the "default" policy advertised on
      // every API response via vercel.json so agents can self-throttle. Mirrors
      // api/_rate-limit.js.
      "RateLimit-Policy": `"default";q=${limit};w=${windowSeconds}`,
      "RateLimit-Limit": String(limit),
      "RateLimit-Remaining": "0",
      "RateLimit-Reset": String(resetSeconds),
      RateLimit: `"default";r=0;t=${resetSeconds}`,
      // Legacy X-RateLimit-* retained for back-compat (Reset is epoch-ms).
      "X-RateLimit-Limit": String(limit),
      "X-RateLimit-Remaining": "0",
      "X-RateLimit-Reset": String(reset),
      "Retry-After": String(resetSeconds),
      ...corsHeaders
    }
  });
}
function rateLimitDegradedResponse(corsHeaders) {
  return new Response(JSON.stringify({ error: "Rate-limit service temporarily unavailable" }), {
    status: 503,
    headers: {
      "Content-Type": "application/json",
      ...RATE_LIMIT_DEGRADED_HEADERS,
      ...corsHeaders
    }
  });
}
async function checkRateLimit(request, corsHeaders, opts = {}) {
  const rl = getRatelimit();
  if (!rl) {
    if (opts.failClosed) {
      logRateLimitDegraded("checkRateLimit:missing-config", new Error("Upstash Redis is not configured"));
      return rateLimitDegradedResponse(corsHeaders);
    }
    return null;
  }
  const ip = getClientIp(request);
  try {
    const { success, limit, reset } = await limitWithFallback(rl, ip, `rl:fw:${ip}`, GLOBAL_RATE_LIMIT, GLOBAL_RATE_WINDOW_SECONDS);
    if (!success) {
      return tooManyRequestsResponse(limit, reset, corsHeaders, GLOBAL_RATE_WINDOW_SECONDS);
    }
    return null;
  } catch (err) {
    logRateLimitDegraded("checkRateLimit", err);
    if (opts.failClosed) return rateLimitDegradedResponse(corsHeaders);
    return null;
  }
}
var ENDPOINT_RATE_POLICIES = {
  // LLM article summarization is Pro-gated, but still needs a scoped,
  // fail-closed budget so Redis degradation cannot silently lift the
  // per-endpoint spend control.
  "/api/news/v1/summarize-article": { limit: 30, window: "60 s" },
  "/api/news/v1/summarize-article-cache": { limit: 3e3, window: "60 s" },
  "/api/intelligence/v1/classify-event": { limit: 600, window: "60 s" },
  // LLM-backed situational deduction (imports callLlmReasoning) can drive
  // provider spend on cache misses, so it must fail closed on Redis outage
  // rather than inherit the global fail-open fallback. Mirror the sibling
  // classify-event budget (same limit/window) — both are AI-backed Intelligence
  // RPCs. (#4676)
  "/api/intelligence/v1/deduct-situation": { limit: 600, window: "60 s" },
  // Batch humanitarian-summary fans out to the external HAPI (humdata) provider
  // on cache miss — up to 25 countries per request, 5 concurrent upstream
  // fetches. Batch aircraft-details fans out to the external Wingbits provider —
  // up to 10 ICAO24 lookups per request. Both proxy external providers, so keep
  // them at the same 30/min budget as the other provider-proxy routes
  // (sanctions lookup / resilience ranking); conservative because a single
  // request already amplifies into many upstream calls. (#4676)
  "/api/conflict/v1/get-humanitarian-summary-batch": { limit: 30, window: "60 s" },
  "/api/military/v1/get-aircraft-details-batch": { limit: 30, window: "60 s" },
  // Generic batch fan-out: one request re-dispatches up to 20 gateway GETs, so
  // cap the multiplier at the same 30/min budget as the other batch routes.
  "/api/batch/v1/execute": { limit: 30, window: "60 s" },
  // Legacy /api/sanctions-entity-search rate limit was 30/min per IP. Preserve
  // that budget now that LookupSanctionEntity proxies OpenSanctions live.
  "/api/sanctions/v1/lookup-sanction-entity": { limit: 30, window: "60 s" },
  // Lead capture: preserve the 3/hr and 5/hr budgets from legacy api/contact.js
  // and api/register-interest.js. Lower limits than normal IP rate limit since
  // these hit Convex + Resend per request.
  "/api/leads/v1/submit-contact": { limit: 3, window: "1 h" },
  "/api/leads/v1/register-interest": { limit: 5, window: "1 h" },
  // Scenario engine: legacy /api/scenario/v1/run capped at 10 jobs/min/IP via
  // inline Upstash INCR. Gateway now enforces the same budget with per-IP
  // keying in checkEndpointRateLimit.
  "/api/scenario/v1/run-scenario": { limit: 10, window: "60 s" },
  // #3734: trigger-simulation PRO endpoint, same shape as run-scenario.
  // Per-IP keying matches run-scenario's production behavior. Pro-identity
  // primitive deferred (checkScopedRateLimit available if needed).
  "/api/forecast/v1/trigger-simulation": { limit: 10, window: "60 s" },
  // Live tanker map (Energy Atlas): one user with 6 chokepoints × 1 call/min
  // = 6 req/min/IP base load. 60/min headroom covers tab refreshes + zoom
  // pans within a single user without flagging legitimate traffic.
  "/api/maritime/v1/get-vessel-snapshot": { limit: 60, window: "60 s" },
  // Country Resilience ranking can synchronously warm the full country table
  // on cold/stale cache paths; keep it well below the global 600/min fallback.
  "/api/resilience/v1/get-resilience-ranking": { limit: 30, window: "60 s" },
  // #3805 / PR #3821: MCP proxy is a top-level Vercel Edge Function in
  // `api/mcp-proxy.ts` (registered as `external-protocol` in
  // api/api-route-exceptions.json — JSON-RPC shape dictated by the MCP spec),
  // so it does NOT flow through the gateway and `checkEndpointRateLimit`
  // never fires for it. The handler reads this policy and enforces it
  // in-handler via `checkScopedRateLimit` — keeping the registry as the
  // single source of truth so future audit additions (and the
  // enforce-rate-limit-policies lint) see the endpoint. The audit script
  // resolves edge-function paths via api/api-route-exceptions.json instead
  // of the OpenAPI specs.
  "/api/mcp-proxy": { limit: 30, window: "60 s" },
  // A2A concierge endpoint (`api/a2a.ts`, external-protocol exception —
  // JSON-RPC shape dictated by the A2A spec, served at /a2a). Anonymous and
  // quota-free by design (routes over the public tool catalog + public
  // freshness envelope only), so the per-IP minute limit is the whole abuse
  // defence; 60/min mirrors the MCP public-method posture. Enforced
  // in-handler via `checkScopedRateLimit`, same pattern as /api/mcp-proxy.
  "/api/a2a": { limit: 60, window: "60 s" },
  // NLWeb /ask endpoint (`api/ask.ts`, external-protocol exception — request/
  // response shape dictated by the NLWeb spec, served at /ask). Same anonymous
  // cheap-catalog posture as /api/a2a, same in-handler enforcement.
  "/api/ask": { limit: 60, window: "60 s" }
};
var endpointLimiters = /* @__PURE__ */ new Map();
function getEndpointRatelimit(pathname) {
  const policy = ENDPOINT_RATE_POLICIES[pathname];
  if (!policy) return null;
  const cached = endpointLimiters.get(pathname);
  if (cached) return cached;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  const rl = new import_ratelimit.Ratelimit({
    redis: new Redis2({ url, token, ...REDIS_TEST_RETRY_OPTS }),
    limiter: import_ratelimit.Ratelimit.slidingWindow(policy.limit, policy.window),
    prefix: "rl:ep",
    analytics: false
  });
  endpointLimiters.set(pathname, rl);
  return rl;
}
function hasEndpointRatePolicy(pathname) {
  return pathname in ENDPOINT_RATE_POLICIES;
}
async function checkEndpointRateLimit(request, pathname, corsHeaders, opts = {}) {
  if (!hasEndpointRatePolicy(pathname)) return null;
  const rl = getEndpointRatelimit(pathname);
  if (!rl) {
    const failClosed = opts.failClosed ?? true;
    if (failClosed) {
      logRateLimitDegraded(`checkEndpointRateLimit:${pathname}:missing-config`, new Error("Upstash Redis is not configured"));
      return rateLimitDegradedResponse(corsHeaders);
    }
    return null;
  }
  const identifier = opts.principalUserId ? `user:${opts.principalUserId}` : `ip:${getClientIp(request)}`;
  const policy = ENDPOINT_RATE_POLICIES[pathname];
  if (!policy) return null;
  try {
    const { success, limit, reset } = await limitWithFallback(rl, `${pathname}:${identifier}`, `rl:ep:fw:${pathname}:${identifier}`, policy.limit, durationToSeconds(policy.window));
    if (!success) {
      return tooManyRequestsResponse(limit, reset, corsHeaders, durationToSeconds(policy.window));
    }
    return null;
  } catch (err) {
    logRateLimitDegraded(`checkEndpointRateLimit:${pathname}`, err);
    const failClosed = opts.failClosed ?? true;
    if (failClosed) return rateLimitDegradedResponse(corsHeaders);
    return null;
  }
}
var scopedLimiters = /* @__PURE__ */ new Map();
function getScopedRatelimit(scope, limit, window) {
  const cacheKey = `${scope}|${limit}|${window}`;
  const cached = scopedLimiters.get(cacheKey);
  if (cached) return cached;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  const rl = new import_ratelimit.Ratelimit({
    redis: new Redis2({ url, token, ...REDIS_TEST_RETRY_OPTS }),
    limiter: import_ratelimit.Ratelimit.slidingWindow(limit, window),
    prefix: "rl:scope",
    analytics: false
  });
  scopedLimiters.set(cacheKey, rl);
  return rl;
}
async function checkScopedRateLimit(scope, limit, window, identifier) {
  const rl = getScopedRatelimit(scope, limit, window);
  if (!rl) {
    logScopedRateLimitMissingConfig(scope);
    return { allowed: true, limit, reset: 0, degraded: true };
  }
  try {
    const result = await limitWithFallback(rl, `${scope}:${identifier}`, `rl:scope:fw:${scope}:${identifier}`, limit, durationToSeconds(window));
    return {
      allowed: result.success,
      limit: result.limit,
      reset: result.reset,
      degraded: false
    };
  } catch (err) {
    logRateLimitDegraded(`checkScopedRateLimit:${scope}`, err);
    return { allowed: true, limit, reset: 0, degraded: true };
  }
}
async function checkFailClosedScopedIpRateLimit(request, scope, limit, window, corsHeaders) {
  const result = await checkScopedRateLimit(scope, limit, window, getClientIp(request));
  if (result.degraded) return rateLimitDegradedResponse(corsHeaders);
  if (!result.allowed) {
    return tooManyRequestsResponse(result.limit, result.reset, corsHeaders, durationToSeconds(window));
  }
  return null;
}

// server/_shared/response-headers.ts
var channel = /* @__PURE__ */ new WeakMap();
function setResponseHeader(req, key, value) {
  let headers = channel.get(req);
  if (!headers) {
    headers = {};
    channel.set(req, headers);
  }
  headers[key] = value;
}
function markNoCacheResponse(req) {
  setResponseHeader(req, "X-No-Cache", "1");
}
function drainResponseHeaders(req) {
  const headers = channel.get(req);
  if (headers) channel.delete(req);
  return headers;
}
var statusOverrides = /* @__PURE__ */ new WeakMap();
function drainSuccessStatusOverride(req) {
  const status = statusOverrides.get(req);
  if (status !== void 0) statusOverrides.delete(req);
  return status;
}

// server/_shared/response-projection.ts
var import_jmespath = __toESM(require_jmespath(), 1);
var REST_JMESPATH_MAX_EXPR_BYTES = 1024;
var REST_JMESPATH_MAX_OUTPUT_BYTES = 256 * 1024;
function utf8ByteLength(value) {
  return new TextEncoder().encode(value).length;
}
function originalKeys(value) {
  if (Array.isArray(value)) return [`<array length=${value.length}>`];
  if (value !== null && typeof value === "object") {
    const keys = Object.keys(value);
    if (keys.length <= 50) return keys;
    return [...keys.slice(0, 50), `...<${keys.length - 50} more>`];
  }
  return [`<${typeof value}>`];
}
function projectJsonResponse(bodyStr, expr) {
  const exprBytes = utf8ByteLength(expr);
  if (exprBytes > REST_JMESPATH_MAX_EXPR_BYTES) {
    let parsed = null;
    try {
      parsed = JSON.parse(bodyStr);
    } catch {
    }
    return {
      ok: false,
      envelope: {
        _jmespath_error: `expression_too_long: ${exprBytes} > ${REST_JMESPATH_MAX_EXPR_BYTES}`,
        original_keys: originalKeys(parsed)
      }
    };
  }
  let value;
  try {
    value = JSON.parse(bodyStr);
  } catch {
    return { ok: true, body: bodyStr };
  }
  let projected;
  try {
    projected = import_jmespath.default.search(value, expr);
  } catch (err) {
    const message2 = err instanceof Error ? err.message : String(err);
    return {
      ok: false,
      envelope: {
        _jmespath_error: `invalid_expression: ${message2}`,
        original_keys: originalKeys(value)
      }
    };
  }
  const text = JSON.stringify(projected);
  const body = text === void 0 ? "null" : text;
  const outputBytes = utf8ByteLength(body);
  if (outputBytes > REST_JMESPATH_MAX_OUTPUT_BYTES) {
    return {
      ok: false,
      envelope: {
        _jmespath_error: `projection_too_large: ${outputBytes} > ${REST_JMESPATH_MAX_OUTPUT_BYTES}`,
        original_keys: originalKeys(value)
      }
    };
  }
  return { ok: true, body };
}

// server/gateway.ts
init_cache_contract();

// server/_shared/entitlement-check.ts
init_redis();
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
function getRequiredTier(_pathname) {
  return null;
}
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
async function checkEntitlementDetailed(userId, pathname, corsHeaders, options = {}) {
  const requiredTier = getRequiredTier(pathname);
  if (requiredTier === null) {
    return { response: null, entitlements: null };
  }
  if (!userId) {
    return {
      response: new Response(
        JSON.stringify({ error: "Authentication required", requiredTier }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      ),
      entitlements: null
    };
  }
  if (options.clerkRole === "pro" && requiredTier <= 1) {
    return { response: null, entitlements: null };
  }
  const ent = await getEntitlements(userId);
  if (!ent) {
    return {
      response: new Response(
        JSON.stringify({ error: "Unable to verify entitlements", requiredTier }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      ),
      entitlements: null
    };
  }
  if (ent.features.tier >= requiredTier) {
    return { response: null, entitlements: ent };
  }
  return {
    response: new Response(
      JSON.stringify({
        error: "Upgrade required",
        requiredTier,
        currentTier: ent.features.tier,
        planKey: ent.planKey
      }),
      {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      }
    ),
    entitlements: ent
  };
}

// server/_shared/auth-session.ts
init_auth_session();
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

// server/_shared/mcp-internal-hmac.ts
var INTERNAL_MCP_SIG_HEADER = "X-WM-MCP-Internal";
var INTERNAL_MCP_USER_ID_HEADER = "X-WM-MCP-User-Id";
var INTERNAL_MCP_NONCE_HEADER = "X-WM-MCP-Nonce";
var INTERNAL_MCP_VERIFIED_HEADER = "x-wm-mcp-internal-verified";
var TRUSTED_USER_ID_HEADER = "x-user-id";
var _verifiedNonce = null;
function getInternalMcpVerifiedNonce() {
  if (_verifiedNonce !== null) return _verifiedNonce;
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  _verifiedNonce = Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
  return _verifiedNonce;
}
var INTERNAL_MCP_TIMESTAMP_WINDOW_SECONDS = 30;
var INTERNAL_MCP_REPLAY_CACHE_TTL_SECONDS = 2 * INTERNAL_MCP_TIMESTAMP_WINDOW_SECONDS + 5;
async function sha256Hex(input) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
function canonicalQueryString(searchOrUrl) {
  let search;
  if (searchOrUrl instanceof URL) {
    search = searchOrUrl.search;
  } else if (typeof searchOrUrl === "string") {
    if (searchOrUrl.startsWith("http://") || searchOrUrl.startsWith("https://")) {
      try {
        search = new URL(searchOrUrl).search;
      } catch {
        return "";
      }
    } else {
      search = searchOrUrl;
    }
  } else {
    return "";
  }
  if (!search || search === "?") return "";
  const trimmed = search.startsWith("?") ? search.slice(1) : search;
  if (!trimmed) return "";
  const params = new URLSearchParams(trimmed);
  const entries = [];
  for (const [k, v] of params) entries.push([k, v]);
  entries.sort((a, b) => a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0);
  return entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join("&");
}
function buildHmacPayload(args) {
  return `${args.ts}:${args.method.toUpperCase()}:${args.pathname}:${args.queryHash}:${args.bodyHash}:${args.userId}:${args.nonce}`;
}
async function importHmacKey2(secret) {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}
function bufferToBase64Url2(buf) {
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
async function hmacSha256Base64Url(secret, payload) {
  const key = await importHmacKey2(secret);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return bufferToBase64Url2(sig);
}
function isValidInternalMcpNonce(nonce) {
  return /^[A-Za-z0-9_-]{16,128}$/.test(nonce);
}
async function timingSafeStringEqual(a, b) {
  const enc2 = new TextEncoder();
  const aHash = new Uint8Array(await crypto.subtle.digest("SHA-256", enc2.encode(a)));
  const bHash = new Uint8Array(await crypto.subtle.digest("SHA-256", enc2.encode(b)));
  let diff = 0;
  for (let i = 0; i < aHash.length; i++) diff |= aHash[i] ^ bHash[i];
  return diff === 0;
}
function parseSignatureHeader(value) {
  if (!value) return null;
  const dotIdx = value.indexOf(".");
  if (dotIdx <= 0 || dotIdx === value.length - 1) return null;
  if (value.indexOf(".", dotIdx + 1) !== -1) return null;
  const tsStr = value.slice(0, dotIdx);
  const sigB64u = value.slice(dotIdx + 1);
  if (!/^[0-9]{1,15}$/.test(tsStr)) return null;
  if (!/^[A-Za-z0-9_-]+$/.test(sigB64u)) return null;
  const ts = Number(tsStr);
  if (!Number.isFinite(ts) || ts < 0) return null;
  return { ts, sigB64u };
}
async function verifyInternalMcpRequest(req, secret, now) {
  if (!secret) return null;
  const sigHeader = req.headers.get(INTERNAL_MCP_SIG_HEADER);
  const userId = req.headers.get(INTERNAL_MCP_USER_ID_HEADER);
  const nonce = req.headers.get(INTERNAL_MCP_NONCE_HEADER);
  if (!sigHeader || !userId || !nonce || !isValidInternalMcpNonce(nonce)) return null;
  const parsed = parseSignatureHeader(sigHeader);
  if (!parsed) return null;
  const { ts, sigB64u } = parsed;
  const nowSec = Math.floor(now ?? Date.now() / 1e3);
  if (Math.abs(nowSec - ts) > INTERNAL_MCP_TIMESTAMP_WINDOW_SECONDS) return null;
  let url;
  try {
    url = new URL(req.url);
  } catch {
    return null;
  }
  const pathSegments = url.pathname.split("/").filter(Boolean);
  const lastSegment = pathSegments[pathSegments.length - 1] ?? "";
  const rpcParams = url.searchParams.getAll("rpc");
  if (rpcParams.length > 0 && rpcParams.every((v) => v === lastSegment)) {
    url.searchParams.delete("rpc");
  }
  let bodyBytes;
  try {
    const buf = await req.clone().arrayBuffer();
    bodyBytes = new Uint8Array(buf);
  } catch {
    return null;
  }
  const bodyAsString = bodyBytes.length === 0 ? "" : new TextDecoder().decode(bodyBytes);
  const queryHash = await sha256Hex(canonicalQueryString(url));
  const bodyHash = await sha256Hex(bodyAsString);
  const expectedPayload = buildHmacPayload({
    ts,
    method: req.method,
    pathname: url.pathname,
    queryHash,
    bodyHash,
    userId,
    nonce
  });
  const expectedSig = await hmacSha256Base64Url(secret, expectedPayload);
  const ok = await timingSafeStringEqual(expectedSig, sigB64u);
  if (!ok) return null;
  return { userId, nonce };
}

// server/_shared/usage-identity.ts
var ENTERPRISE_KEY_TO_CUSTOMER = {
  // 'wm_ent_xxxx': 'acme-corp',
};
function buildUsageIdentity(input) {
  const tier = input.tier ?? 0;
  if (input.isUserApiKey) {
    return {
      auth_kind: "user_api_key",
      principal_id: input.sessionUserId,
      customer_id: input.userApiKeyCustomerRef ?? input.sessionUserId,
      tier,
      plan_key: input.planKey
    };
  }
  if (input.sessionUserId) {
    return {
      auth_kind: "clerk_jwt",
      principal_id: input.sessionUserId,
      customer_id: input.clerkOrgId ?? input.sessionUserId,
      tier,
      plan_key: input.planKey
    };
  }
  if (input.enterpriseApiKey) {
    const customer = ENTERPRISE_KEY_TO_CUSTOMER[input.enterpriseApiKey] ?? "enterprise-unmapped";
    return {
      auth_kind: "enterprise_api_key",
      principal_id: hashKeySync(input.enterpriseApiKey),
      customer_id: customer,
      tier,
      plan_key: input.planKey ?? "enterprise"
    };
  }
  if (input.widgetKey) {
    return {
      auth_kind: "widget_key",
      principal_id: hashKeySync(input.widgetKey),
      customer_id: input.widgetKey,
      tier,
      plan_key: null
    };
  }
  return {
    auth_kind: "anon",
    principal_id: null,
    customer_id: null,
    tier: 0,
    plan_key: null
  };
}
function hashKeySync(key) {
  let h1 = 2166136261;
  let h2 = 2166136261 ^ 2746401236;
  for (let i = 0; i < key.length; i++) {
    const c = key.charCodeAt(i);
    h1 ^= c;
    h1 = Math.imul(h1, 16777619);
    h2 ^= c + 2654435761;
    h2 = Math.imul(h2, 16777619);
  }
  const lo = (h1 >>> 0).toString(36);
  const hi = (h2 >>> 0).toString(36);
  return `${hi}${lo}`;
}

// server/gateway.ts
init_redis();

// server/_shared/idempotency.ts
init_redis();
var IDEMPOTENCY_HEADER = "Idempotency-Key";
var IDEMPOTENT_REPLAYED_HEADER = "Idempotent-Replayed";
var KEY_MAX_LENGTH = 255;
var KEY_PATTERN = /^[\x21-\x7e]{1,255}$/;
var PROCESSING_TTL_SECONDS = 180;
var COMPLETED_TTL_SECONDS = 24 * 60 * 60;
var MAX_STORED_BODY_BYTES = 256 * 1024;
var PROCESSING_MARKER = JSON.stringify({ state: "processing" });
function isValidIdempotencyKey(key) {
  return key.length <= KEY_MAX_LENGTH && KEY_PATTERN.test(key);
}
async function sha256Hex2(input) {
  const data = typeof input === "string" ? new TextEncoder().encode(input) : input;
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
function isReplayableTextBody(contentType) {
  if (!contentType) return false;
  const ct = contentType.toLowerCase();
  return ct.includes("json") || ct.startsWith("text/");
}
function isRetryableStatus(status) {
  return status === 408 || status === 409 || status === 429 || status >= 500;
}
function anonScope(request) {
  const ip = request.headers.get("cf-connecting-ip") || request.headers.get("x-real-ip") || (request.headers.get("x-forwarded-for") || "").split(",")[0]?.trim() || "unknown";
  return `ip:${ip}`;
}
function jsonResponse(status, body, corsHeaders, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      ...corsHeaders,
      ...extraHeaders
    }
  });
}
async function getRequestHashAndRedisKey(request, pathname, scope, idempotencyKey) {
  try {
    const bodyBuf = await request.clone().arrayBuffer();
    const reqHash = await sha256Hex2(bodyBuf);
    const effectiveScope = scope || anonScope(request);
    const redisKey = `idem:v1:${await sha256Hex2(`${effectiveScope}
${pathname}
${idempotencyKey}`)}`;
    return { reqHash, redisKey };
  } catch {
    return null;
  }
}
function outcomeFromStoredRecord(raw, reqHash, idempotencyKey, corsHeaders) {
  if (raw == null) return { kind: "miss" };
  let record = null;
  if (typeof raw === "string") {
    try {
      record = JSON.parse(raw);
    } catch {
      record = null;
    }
  }
  if (!record) {
    return { kind: "disabled" };
  }
  if (record.state === "processing") {
    return {
      kind: "conflict",
      response: jsonResponse(
        409,
        {
          error: "idempotency_conflict",
          message: `A request with this ${IDEMPOTENCY_HEADER} is still being processed. Retry shortly.`
        },
        corsHeaders,
        { "Retry-After": "2", [IDEMPOTENCY_HEADER]: idempotencyKey }
      )
    };
  }
  if (record.reqHash !== reqHash) {
    return {
      kind: "mismatch",
      response: jsonResponse(
        422,
        {
          error: "idempotency_key_reused",
          message: `This ${IDEMPOTENCY_HEADER} was already used with a different request body.`
        },
        corsHeaders,
        { [IDEMPOTENCY_HEADER]: idempotencyKey }
      )
    };
  }
  return {
    kind: "replay",
    response: new Response(record.body, {
      status: record.status,
      headers: {
        "Content-Type": record.contentType ?? "application/json",
        "Cache-Control": "no-store",
        ...corsHeaders,
        [IDEMPOTENCY_HEADER]: idempotencyKey,
        [IDEMPOTENT_REPLAYED_HEADER]: "true"
      }
    })
  };
}
function isPipelineSuccess(entry, expected) {
  return entry?.error == null && entry?.result === expected;
}
async function releaseProcessingLock(redisKey) {
  await runRedisPipeline([["DEL", redisKey]]);
}
async function peekIdempotency(args) {
  const { request, pathname, scope, idempotencyKey, corsHeaders } = args;
  if (!isValidIdempotencyKey(idempotencyKey)) {
    return {
      kind: "invalid",
      response: jsonResponse(
        400,
        {
          error: "invalid_idempotency_key",
          message: `The ${IDEMPOTENCY_HEADER} header must be 1-${KEY_MAX_LENGTH} printable ASCII characters.`
        },
        corsHeaders
      )
    };
  }
  const resolved = await getRequestHashAndRedisKey(request, pathname, scope, idempotencyKey);
  if (!resolved) return { kind: "disabled" };
  const pipeline = await runRedisPipeline([["GET", resolved.redisKey]]);
  if (pipeline.length < 1) return { kind: "disabled" };
  const entry = pipeline[0];
  if (entry?.error) return { kind: "disabled" };
  return outcomeFromStoredRecord(entry?.result, resolved.reqHash, idempotencyKey, corsHeaders);
}
async function beginIdempotency(args) {
  const { request, pathname, scope, idempotencyKey, corsHeaders } = args;
  if (!isValidIdempotencyKey(idempotencyKey)) {
    return {
      kind: "invalid",
      response: jsonResponse(
        400,
        {
          error: "invalid_idempotency_key",
          message: `The ${IDEMPOTENCY_HEADER} header must be 1-${KEY_MAX_LENGTH} printable ASCII characters.`
        },
        corsHeaders
      )
    };
  }
  const resolved = await getRequestHashAndRedisKey(request, pathname, scope, idempotencyKey);
  if (!resolved) return { kind: "disabled" };
  const pipeline = await runRedisPipeline([
    ["SET", resolved.redisKey, PROCESSING_MARKER, "NX", "EX", String(PROCESSING_TTL_SECONDS)],
    ["GET", resolved.redisKey]
  ]);
  if (pipeline.length < 2) return { kind: "disabled" };
  const claim = pipeline[0];
  if (claim?.error) return { kind: "disabled" };
  const claimed = claim?.result === "OK";
  if (claimed) {
    return {
      kind: "proceed",
      key: idempotencyKey,
      store: (status, body, contentType) => storeResult(resolved.redisKey, status, body, contentType, resolved.reqHash)
    };
  }
  const raw = pipeline[1]?.result;
  const outcome = outcomeFromStoredRecord(raw, resolved.reqHash, idempotencyKey, corsHeaders);
  return outcome.kind === "miss" ? { kind: "disabled" } : outcome;
}
async function storeResult(redisKey, status, body, contentType, reqHash) {
  try {
    if (isRetryableStatus(status) || body.byteLength > MAX_STORED_BODY_BYTES || !isReplayableTextBody(contentType)) {
      await releaseProcessingLock(redisKey);
      return;
    }
    const record = {
      state: "completed",
      status,
      contentType,
      reqHash,
      body: new TextDecoder().decode(body)
    };
    const pipeline = await runRedisPipeline([
      ["SET", redisKey, JSON.stringify(record), "EX", String(COMPLETED_TTL_SECONDS)]
    ]);
    if (!isPipelineSuccess(pipeline[0], "OK")) {
      await releaseProcessingLock(redisKey);
    }
  } catch {
    try {
      await releaseProcessingLock(redisKey);
    } catch {
    }
  }
}

// server/_shared/api-key-rate-limit.ts
var import_ratelimit2 = __toESM(require_dist2(), 1);
init_redis();

// server/_shared/pro-mcp-token.ts
init_redis();
function secondsUntilUtcMidnight(now) {
  const d = now ?? /* @__PURE__ */ new Date();
  const next = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1, 0, 0, 0, 0));
  return Math.max(1, Math.ceil((next.getTime() - d.getTime()) / 1e3));
}
var PRO_DAILY_QUOTA_TTL_SECONDS = 172800;

// server/_shared/api-key-rate-limit.ts
var ENTERPRISE_API_RATE_LIMIT = 1e3;
var CEILING_MULTIPLIER = 10;
var redisSingleton = null;
var burstLimiters = /* @__PURE__ */ new Map();
function getRedis() {
  if (redisSingleton) return redisSingleton;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  redisSingleton = process.env.NODE_TEST_CONTEXT ? new Redis2({ url, token, retry: false }) : new Redis2({ url, token });
  return redisSingleton;
}
function getBurstLimiter(perMinute) {
  const existing = burstLimiters.get(perMinute);
  if (existing) return existing;
  const redis = getRedis();
  if (!redis) return null;
  const limiter = new import_ratelimit2.Ratelimit({
    redis,
    limiter: import_ratelimit2.Ratelimit.slidingWindow(perMinute, "60 s"),
    // Env-scope the prefix exactly like the daily meter (runRedisPipeline's
    // prefixKey) so a preview deployment sharing one Upstash database doesn't
    // consume/pollute the production burst namespace. Empty in production.
    prefix: `${getKeyPrefix()}rl:apikey:min`,
    analytics: false
  });
  burstLimiters.set(perMinute, limiter);
  return limiter;
}
async function checkBurst(perMinute, identity) {
  const limiter = getBurstLimiter(perMinute);
  if (!limiter) return { ok: true };
  try {
    const { success, limit, reset } = await limiter.limit(identity);
    if (!success) return { ok: false, limit, reset };
    return { ok: true };
  } catch {
    return { ok: true };
  }
}
function apiKeyDailyKey(userId, date) {
  if (!userId) return "";
  const d = date ?? /* @__PURE__ */ new Date();
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `rl:apikey:day:${userId}:${yyyy}-${mm}-${dd}`;
}
var API_DAILY_TTL_SECONDS = 172800;
async function reserveDailyMeter(opts) {
  const { userId, allowance, pipeline, date } = opts;
  const noop = async () => {
  };
  const retryAfterSec = secondsUntilUtcMidnight(date);
  if (allowance <= 0) {
    return { count: 0, overCeiling: false, metered: false, retryAfterSec, rollback: noop };
  }
  const key = apiKeyDailyKey(userId, date);
  if (!key) {
    return { count: 0, overCeiling: false, metered: false, retryAfterSec, rollback: noop };
  }
  let pipeResult;
  try {
    pipeResult = await pipeline([
      ["INCR", key],
      ["EXPIRE", key, API_DAILY_TTL_SECONDS]
    ]);
  } catch {
    pipeResult = null;
  }
  if (!pipeResult || !Array.isArray(pipeResult) || pipeResult.length === 0) {
    return { count: 0, overCeiling: false, metered: false, retryAfterSec, rollback: noop };
  }
  const incrRaw = pipeResult[0]?.result;
  const count = typeof incrRaw === "number" ? incrRaw : Number(incrRaw);
  if (!Number.isFinite(count) || count < 1) {
    return { count: 0, overCeiling: false, metered: false, retryAfterSec, rollback: noop };
  }
  let rolledBack = false;
  const rollback = async () => {
    if (rolledBack) return;
    rolledBack = true;
    try {
      await pipeline([["DECR", key]]);
    } catch {
    }
  };
  const ceiling = allowance * CEILING_MULTIPLIER;
  return { count, overCeiling: count > ceiling, metered: true, retryAfterSec, rollback };
}
function rateLimitHeaders(opts) {
  const remaining = Math.max(0, opts.remaining);
  const resetSeconds = Math.max(0, Math.ceil((opts.resetMs - Date.now()) / 1e3));
  const windowSec = opts.windowSec ?? 60;
  return {
    // IETF RateLimit fields.
    "RateLimit-Policy": `"default";q=${opts.limit};w=${windowSec}`,
    "RateLimit-Limit": String(opts.limit),
    "RateLimit-Remaining": String(remaining),
    "RateLimit-Reset": String(resetSeconds),
    RateLimit: `"default";r=${remaining};t=${resetSeconds}`,
    // Legacy X-RateLimit-* retained for back-compat (Reset is epoch-ms).
    "X-RateLimit-Limit": String(opts.limit),
    "X-RateLimit-Remaining": String(remaining),
    "X-RateLimit-Reset": String(opts.resetMs),
    "Retry-After": String(Math.max(1, opts.retryAfterSec))
  };
}

// server/_shared/direct-llm-quota.ts
init_redis();
var DIRECT_LLM_DAILY_QUOTA_LIMIT = 50;
var DIRECT_LLM_REDIS_UNAVAILABLE_RETRY_AFTER_SECONDS = 30;
var DIRECT_LLM_GATEWAY_QUOTA_PATHS = /* @__PURE__ */ new Set([
  "/api/intelligence/v1/classify-event",
  "/api/intelligence/v1/deduct-situation",
  "/api/intelligence/v1/get-country-intel-brief",
  "/api/market/v1/analyze-stock",
  "/api/news/v1/summarize-article"
]);
var DIRECT_LLM_SELF_METERED_QUOTA_PATHS = /* @__PURE__ */ new Set([
  "/api/chat-analyst"
]);
var DIRECT_LLM_QUOTA_PATHS = /* @__PURE__ */ new Set([
  ...DIRECT_LLM_GATEWAY_QUOTA_PATHS,
  ...DIRECT_LLM_SELF_METERED_QUOTA_PATHS
]);
function directLlmDailyQuotaKey(userId, date) {
  if (!userId) return "";
  const d = date ?? /* @__PURE__ */ new Date();
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${getKeyPrefix()}llm:direct-usage:${userId}:${yyyy}-${mm}-${dd}`;
}
async function reserveDirectLlmQuota(opts) {
  const retryAfterSec = secondsUntilUtcMidnight(opts.date);
  const key = directLlmDailyQuotaKey(opts.userId, opts.date);
  if (!key) {
    return {
      ok: false,
      reason: "redis-unavailable",
      retryAfterSec: DIRECT_LLM_REDIS_UNAVAILABLE_RETRY_AFTER_SECONDS
    };
  }
  let pipeResult;
  try {
    pipeResult = await opts.pipeline([
      ["INCR", key],
      ["EXPIRE", key, PRO_DAILY_QUOTA_TTL_SECONDS]
    ]);
  } catch {
    pipeResult = null;
  }
  if (!pipeResult || !Array.isArray(pipeResult) || pipeResult.length === 0) {
    return {
      ok: false,
      reason: "redis-unavailable",
      retryAfterSec: DIRECT_LLM_REDIS_UNAVAILABLE_RETRY_AFTER_SECONDS
    };
  }
  const incrRaw = pipeResult[0]?.result;
  const newCount = typeof incrRaw === "number" ? incrRaw : Number(incrRaw);
  if (!Number.isFinite(newCount) || newCount < 1) {
    return {
      ok: false,
      reason: "redis-unavailable",
      retryAfterSec: DIRECT_LLM_REDIS_UNAVAILABLE_RETRY_AFTER_SECONDS
    };
  }
  let rolledBack = false;
  const rollback = async () => {
    if (rolledBack) return;
    rolledBack = true;
    try {
      await opts.pipeline([["DECR", key]]);
    } catch {
    }
  };
  if (newCount > DIRECT_LLM_DAILY_QUOTA_LIMIT) {
    await rollback();
    return {
      ok: false,
      reason: "cap-exceeded",
      floor: DIRECT_LLM_DAILY_QUOTA_LIMIT,
      retryAfterSec
    };
  }
  return { ok: true, newCount, rollback };
}

// server/gateway.ts
init_usage();

// server/_shared/internal-auth.ts
async function timingSafeEqual(a, b) {
  const encoder2 = new TextEncoder();
  const aHash = new Uint8Array(await crypto.subtle.digest("SHA-256", encoder2.encode(a)));
  const bHash = new Uint8Array(await crypto.subtle.digest("SHA-256", encoder2.encode(b)));
  const n2 = bHash.length;
  let diff = 0;
  for (let i = 0; i < n2; i++) {
    diff |= aHash[i] ^ bHash[i];
  }
  return diff === 0;
}

// src/shared/premium-paths.ts
var PREMIUM_RPC_PATHS = /* @__PURE__ */ new Set([]);

// server/gateway.ts
var serverOptions = { onError: mapErrorToResponse };
var MAX_INTERNAL_MCP_BODY = 256 * 1024;
async function claimInternalMcpReplayNonce(userId, nonce) {
  const digest = await sha256Hex(`${userId}:${nonce}`);
  const key = `internal-mcp-replay:v1:${digest}`;
  const result = await runRedisPipeline([
    ["SET", key, "1", "EX", INTERNAL_MCP_REPLAY_CACHE_TTL_SECONDS, "NX"]
  ]);
  if (result.length === 0) return "unavailable";
  const claim = result[0];
  if (claim?.error) return "unavailable";
  return claim?.result === "OK" ? "fresh" : "replay";
}
var TIER_HEADERS = {
  fast: "public, max-age=60, s-maxage=300, stale-while-revalidate=60, stale-if-error=600",
  medium: "public, max-age=120, s-maxage=600, stale-while-revalidate=120, stale-if-error=900",
  slow: "public, max-age=300, s-maxage=1800, stale-while-revalidate=300, stale-if-error=3600",
  "slow-browser": "max-age=300, stale-while-revalidate=60, stale-if-error=1800",
  static: "public, max-age=600, s-maxage=3600, stale-while-revalidate=600, stale-if-error=14400",
  daily: "public, max-age=3600, s-maxage=14400, stale-while-revalidate=7200, stale-if-error=172800",
  "no-store": "no-store",
  live: "public, max-age=30, s-maxage=60, stale-while-revalidate=60, stale-if-error=300"
};
var TIER_CDN_CACHE = {
  fast: "public, s-maxage=600, stale-while-revalidate=300, stale-if-error=1200",
  medium: "public, s-maxage=1200, stale-while-revalidate=600, stale-if-error=1800",
  slow: "public, s-maxage=3600, stale-while-revalidate=900, stale-if-error=7200",
  "slow-browser": "public, s-maxage=900, stale-while-revalidate=60, stale-if-error=1800",
  static: "public, s-maxage=14400, stale-while-revalidate=3600, stale-if-error=28800",
  daily: "public, s-maxage=86400, stale-while-revalidate=14400, stale-if-error=172800",
  "no-store": null,
  live: "public, s-maxage=60, stale-while-revalidate=60, stale-if-error=300"
};
var RPC_CACHE_TIER = {
  // 'live' tier — bbox-quantized + tanker-aware caching upstream of the
  // 60s in-handler cache, absorbing identical-bbox requests at the CDN
  // before they hit this Vercel function. Energy Atlas live-tanker layer.
  "/api/maritime/v1/get-vessel-snapshot": "live",
  "/api/market/v1/list-market-quotes": "medium",
  "/api/market/v1/list-crypto-quotes": "medium",
  "/api/market/v1/list-crypto-sectors": "slow",
  "/api/market/v1/list-defi-tokens": "slow",
  "/api/market/v1/list-ai-tokens": "slow",
  "/api/market/v1/list-other-tokens": "slow",
  "/api/market/v1/list-commodity-quotes": "medium",
  "/api/market/v1/list-stablecoin-markets": "medium",
  "/api/market/v1/get-sector-summary": "medium",
  "/api/market/v1/get-fear-greed-index": "slow",
  "/api/market/v1/get-market-breadth-history": "daily",
  "/api/market/v1/list-gulf-quotes": "medium",
  "/api/market/v1/analyze-stock": "slow",
  "/api/market/v1/get-stock-analysis-history": "medium",
  "/api/market/v1/backtest-stock": "slow",
  "/api/market/v1/list-stored-stock-backtests": "medium",
  "/api/infrastructure/v1/list-service-statuses": "slow",
  "/api/seismology/v1/list-earthquakes": "slow",
  "/api/infrastructure/v1/list-internet-outages": "slow",
  "/api/infrastructure/v1/list-internet-ddos-attacks": "slow",
  "/api/infrastructure/v1/list-internet-traffic-anomalies": "slow",
  "/api/forecast/v1/get-forecast-scorecard": "fast",
  "/api/unrest/v1/list-unrest-events": "slow",
  "/api/cyber/v1/list-cyber-threats": "static",
  "/api/conflict/v1/list-acled-events": "slow",
  "/api/military/v1/get-theater-posture": "slow",
  "/api/infrastructure/v1/get-temporal-baseline": "slow",
  "/api/aviation/v1/list-airport-delays": "static",
  "/api/aviation/v1/get-airport-ops-summary": "static",
  "/api/aviation/v1/list-airport-flights": "static",
  "/api/aviation/v1/get-carrier-ops": "slow",
  "/api/aviation/v1/get-flight-status": "fast",
  "/api/aviation/v1/track-aircraft": "no-store",
  "/api/aviation/v1/search-flight-prices": "medium",
  "/api/aviation/v1/search-google-flights": "no-store",
  "/api/aviation/v1/search-google-dates": "medium",
  "/api/aviation/v1/list-aviation-news": "slow",
  "/api/market/v1/get-country-stock-index": "slow",
  "/api/natural/v1/list-natural-events": "slow",
  "/api/wildfire/v1/list-fire-detections": "static",
  "/api/maritime/v1/list-navigational-warnings": "static",
  "/api/supply-chain/v1/get-shipping-rates": "daily",
  "/api/supply-chain/v1/list-pipelines": "static",
  "/api/supply-chain/v1/get-pipeline-detail": "static",
  "/api/supply-chain/v1/list-storage-facilities": "static",
  "/api/supply-chain/v1/get-storage-facility-detail": "static",
  "/api/supply-chain/v1/list-fuel-shortages": "medium",
  "/api/supply-chain/v1/get-fuel-shortage-detail": "medium",
  "/api/supply-chain/v1/list-energy-disruptions": "medium",
  "/api/economic/v1/get-fred-series": "static",
  "/api/economic/v1/get-bls-series": "daily",
  "/api/economic/v1/get-energy-prices": "static",
  "/api/research/v1/list-arxiv-papers": "static",
  "/api/research/v1/list-trending-repos": "static",
  "/api/giving/v1/get-giving-summary": "static",
  "/api/intelligence/v1/get-country-intel-brief": "static",
  "/api/intelligence/v1/get-gdelt-topic-timeline": "medium",
  "/api/climate/v1/list-climate-anomalies": "daily",
  "/api/climate/v1/list-climate-disasters": "daily",
  "/api/climate/v1/get-co2-monitoring": "daily",
  "/api/climate/v1/get-ocean-ice-data": "daily",
  "/api/climate/v1/list-air-quality-data": "fast",
  "/api/climate/v1/list-climate-news": "slow",
  "/api/sanctions/v1/list-sanctions-pressure": "daily",
  "/api/sanctions/v1/lookup-sanction-entity": "no-store",
  "/api/radiation/v1/list-radiation-observations": "slow",
  "/api/thermal/v1/list-thermal-escalations": "slow",
  "/api/research/v1/list-tech-events": "daily",
  "/api/military/v1/get-usni-fleet-report": "daily",
  "/api/military/v1/list-defense-patents": "daily",
  "/api/conflict/v1/list-ucdp-events": "daily",
  "/api/conflict/v1/get-humanitarian-summary": "daily",
  "/api/conflict/v1/list-iran-events": "slow",
  "/api/displacement/v1/get-displacement-summary": "daily",
  "/api/displacement/v1/get-population-exposure": "daily",
  "/api/economic/v1/get-bis-policy-rates": "daily",
  "/api/economic/v1/get-bis-exchange-rates": "daily",
  "/api/economic/v1/get-bis-credit": "daily",
  "/api/trade/v1/get-tariff-trends": "daily",
  "/api/trade/v1/get-trade-flows": "daily",
  "/api/trade/v1/get-trade-barriers": "daily",
  "/api/trade/v1/get-trade-restrictions": "daily",
  "/api/trade/v1/get-customs-revenue": "daily",
  "/api/trade/v1/list-comtrade-flows": "daily",
  "/api/economic/v1/list-world-bank-indicators": "daily",
  "/api/economic/v1/get-energy-capacity": "daily",
  "/api/economic/v1/list-grocery-basket-prices": "daily",
  "/api/economic/v1/list-bigmac-prices": "daily",
  "/api/economic/v1/list-fuel-prices": "daily",
  "/api/economic/v1/get-fao-food-price-index": "daily",
  "/api/economic/v1/get-crude-inventories": "daily",
  "/api/economic/v1/get-nat-gas-storage": "daily",
  "/api/economic/v1/get-eu-yield-curve": "daily",
  "/api/supply-chain/v1/get-critical-minerals": "daily",
  "/api/military/v1/get-aircraft-details": "static",
  "/api/military/v1/get-wingbits-status": "static",
  "/api/military/v1/get-wingbits-live-flight": "no-store",
  "/api/military/v1/list-military-flights": "slow",
  "/api/market/v1/list-etf-flows": "slow",
  "/api/research/v1/list-hackernews-items": "slow",
  "/api/intelligence/v1/get-country-risk": "slow",
  "/api/intelligence/v1/get-risk-scores": "slow",
  "/api/intelligence/v1/get-pizzint-status": "slow",
  "/api/intelligence/v1/classify-event": "static",
  "/api/intelligence/v1/search-gdelt-documents": "slow",
  "/api/infrastructure/v1/get-cable-health": "slow",
  "/api/positive-events/v1/list-positive-geo-events": "slow",
  "/api/military/v1/list-military-bases": "daily",
  "/api/economic/v1/get-macro-signals": "medium",
  "/api/economic/v1/get-national-debt": "daily",
  "/api/prediction/v1/list-prediction-markets": "medium",
  "/api/forecast/v1/get-forecasts": "medium",
  "/api/forecast/v1/get-simulation-package": "slow",
  "/api/forecast/v1/get-simulation-outcome": "slow",
  "/api/supply-chain/v1/get-chokepoint-status": "medium",
  "/api/supply-chain/v1/get-chokepoint-history": "slow",
  "/api/news/v1/list-feed-digest": "slow",
  "/api/intelligence/v1/get-country-facts": "daily",
  "/api/intelligence/v1/list-security-advisories": "slow",
  "/api/intelligence/v1/list-satellites": "static",
  "/api/intelligence/v1/list-gps-interference": "slow",
  "/api/intelligence/v1/list-cross-source-signals": "medium",
  "/api/intelligence/v1/list-oref-alerts": "fast",
  "/api/intelligence/v1/list-telegram-feed": "fast",
  "/api/intelligence/v1/get-company-enrichment": "slow",
  "/api/intelligence/v1/list-company-signals": "slow",
  "/api/news/v1/summarize-article-cache": "slow",
  "/api/imagery/v1/search-imagery": "static",
  "/api/infrastructure/v1/list-temporal-anomalies": "medium",
  "/api/infrastructure/v1/get-ip-geo": "no-store",
  "/api/infrastructure/v1/reverse-geocode": "slow",
  "/api/infrastructure/v1/get-bootstrap-data": "no-store",
  "/api/webcam/v1/get-webcam-image": "no-store",
  "/api/webcam/v1/list-webcams": "no-store",
  "/api/consumer-prices/v1/get-consumer-price-overview": "slow",
  "/api/consumer-prices/v1/get-consumer-price-basket-series": "slow",
  "/api/consumer-prices/v1/list-consumer-price-categories": "slow",
  "/api/consumer-prices/v1/list-consumer-price-movers": "slow",
  "/api/consumer-prices/v1/list-retailer-price-spreads": "slow",
  "/api/consumer-prices/v1/get-consumer-price-freshness": "slow",
  "/api/aviation/v1/get-youtube-live-stream-info": "fast",
  "/api/market/v1/list-earnings-calendar": "slow",
  "/api/market/v1/get-cot-positioning": "slow",
  "/api/market/v1/get-gold-intelligence": "slow",
  "/api/market/v1/get-hyperliquid-flow": "medium",
  "/api/market/v1/get-insider-transactions": "slow",
  "/api/economic/v1/get-economic-calendar": "slow",
  "/api/economic/v1/get-china-macro-snapshot": "slow",
  "/api/intelligence/v1/list-market-implications": "slow",
  "/api/economic/v1/get-ecb-fx-rates": "slow",
  "/api/economic/v1/get-eurostat-country-data": "slow",
  "/api/economic/v1/get-eu-gas-storage": "slow",
  "/api/economic/v1/get-oil-stocks-analysis": "static",
  "/api/economic/v1/get-oil-inventories": "slow",
  "/api/economic/v1/get-energy-crisis-policies": "static",
  "/api/economic/v1/list-global-tenders": "medium",
  "/api/economic/v1/get-eu-fsi": "slow",
  "/api/economic/v1/get-economic-stress": "slow",
  "/api/supply-chain/v1/get-shipping-stress": "medium",
  "/api/supply-chain/v1/get-country-chokepoint-index": "slow-browser",
  "/api/supply-chain/v1/get-bypass-options": "slow-browser",
  "/api/supply-chain/v1/get-country-cost-shock": "slow-browser",
  "/api/supply-chain/v1/get-country-products": "slow-browser",
  "/api/supply-chain/v1/get-multi-sector-cost-shock": "slow-browser",
  "/api/supply-chain/v1/get-sector-dependency": "slow-browser",
  "/api/supply-chain/v1/get-route-explorer-lane": "slow-browser",
  "/api/supply-chain/v1/get-route-impact": "slow-browser",
  // Scenario engine: list-scenario-templates is a compile-time constant catalog;
  // daily tier gives browser max-age=3600 matching the legacy /api/scenario/v1/templates
  // endpoint header. get-scenario-status is premium-gated — gateway short-circuits
  // to 'slow-browser' but the entry is still required by tests/route-cache-tier.test.mjs.
  "/api/scenario/v1/list-scenario-templates": "daily",
  "/api/scenario/v1/get-scenario-status": "slow-browser",
  "/api/health/v1/list-disease-outbreaks": "slow",
  "/api/health/v1/list-air-quality-alerts": "fast",
  "/api/intelligence/v1/get-social-velocity": "fast",
  "/api/intelligence/v1/get-country-energy-profile": "slow",
  "/api/intelligence/v1/compute-energy-shock": "fast",
  "/api/intelligence/v1/get-country-port-activity": "slow",
  // NOTE: get-regional-snapshot is premium-gated via PREMIUM_RPC_PATHS; the
  // gateway short-circuits to 'slow-browser' before consulting this map. The
  // entry below exists to satisfy the parity contract enforced by
  // tests/route-cache-tier.test.mjs (every generated GET route needs a tier)
  // and documents the intended tier if the endpoint ever becomes non-premium.
  "/api/intelligence/v1/get-regional-snapshot": "slow",
  // get-regime-history is premium-gated same as get-regional-snapshot; this
  // entry is required by tests/route-cache-tier.test.mjs even though the
  // gateway short-circuits premium paths to slow-browser.
  "/api/intelligence/v1/get-regime-history": "slow",
  // get-regional-brief is premium-gated; slow-browser in practice, slow entry for route-parity.
  "/api/intelligence/v1/get-regional-brief": "slow",
  "/api/resilience/v1/get-resilience-score": "slow",
  "/api/resilience/v1/get-resilience-ranking": "slow",
  "/api/resilience/v1/get-runtime-manifest": "no-store",
  // Partner-facing shipping/v2. route-intelligence is premium-gated; gateway
  // short-circuits to slow-browser. Entry required by tests/route-cache-tier.test.mjs.
  "/api/v2/shipping/route-intelligence": "slow-browser",
  // GET /webhooks lists caller's webhooks — premium-gated; short-circuited to
  // slow-browser. Entry required by tests/route-cache-tier.test.mjs.
  "/api/v2/shipping/webhooks": "slow-browser"
};
var PUBLIC_NO_AUTH_RPC_PATHS = /* @__PURE__ */ new Set([
  "/api/conflict/v1/list-acled-events",
  "/api/natural/v1/list-natural-events",
  "/api/resilience/v1/get-runtime-manifest",
  "/api/seismology/v1/list-earthquakes",
  "/api/unrest/v1/list-unrest-events",
  // Lead-capture RPCs serve ANONYMOUS prospects by definition: the /pro
  // marketing page contact form and the waitlist/desktop signup both POST
  // without a wms_ session or API key (see pro-test/src/App.tsx onSubmit and
  // src/services/runtime.ts isKeyFreeApiTarget). A freely-mintable anonymous
  // session token would add zero abuse protection here — the real gates live
  // in the handlers: server-side Turnstile (fails closed in production),
  // honeypot, free-email-domain rejection, per-IP endpoint rate limits
  // (server/_shared/rate-limit.ts: 3/h and 5/h), and the Convex per-email
  // throttle. Pinned by tests/leads-gateway-public.test.mts.
  "/api/leads/v1/submit-contact",
  "/api/leads/v1/register-interest"
]);
var RELAY_WARM_PING_PATHS = /* @__PURE__ */ new Set([
  "/api/infrastructure/v1/list-service-statuses",
  "/api/infrastructure/v1/get-cable-health",
  "/api/infrastructure/v1/list-temporal-anomalies",
  "/api/intelligence/v1/get-risk-scores",
  "/api/supply-chain/v1/get-chokepoint-status"
]);
var POST_TO_GET_MAX_BODY_BYTES = 1048576;
var POST_TO_GET_MAX_ARRAY_VALUES_PER_KEY = 200;
var REQUIRED_BBOX_QUERY_PARAMS = ["sw_lat", "sw_lon", "ne_lat", "ne_lon"];
var REQUIRED_BBOX_RPC_PATHS = [
  "/api/military/v1/list-military-bases",
  "/api/military/v1/list-military-flights"
];
var REQUIRED_BBOX_RPC_PATH_SET = new Set(REQUIRED_BBOX_RPC_PATHS);
var MILITARY_BBOX_DIAGNOSTIC_PATH_SET = new Set(REQUIRED_BBOX_RPC_PATHS);
function isPostToGetCompatibleBodySize(headers) {
  const rawContentLength = headers.get("Content-Length");
  if (rawContentLength === null || !/^\d+$/.test(rawContentLength)) return false;
  const contentLength = Number(rawContentLength);
  return Number.isSafeInteger(contentLength) && contentLength < POST_TO_GET_MAX_BODY_BYTES;
}
function getRequiredBboxQueryProblems(searchParams) {
  const absent = [];
  const invalid = [];
  const values = [];
  for (const param of REQUIRED_BBOX_QUERY_PARAMS) {
    const raw = searchParams.get(param);
    if (raw == null) {
      absent.push(param);
      continue;
    }
    if (raw.trim() === "") {
      invalid.push(param);
      continue;
    }
    const value = Number(raw);
    if (!Number.isFinite(value)) {
      invalid.push(param);
      continue;
    }
    values.push(value);
  }
  const missing = absent.length === REQUIRED_BBOX_QUERY_PARAMS.length ? [...REQUIRED_BBOX_QUERY_PARAMS] : [];
  return {
    missing,
    invalid,
    allZero: absent.length === 0 && invalid.length === 0 && values.every((value) => value === 0)
  };
}
function getRequiredBboxDiagnostic(request, pathname) {
  if (!REQUIRED_BBOX_RPC_PATH_SET.has(pathname)) return null;
  const { searchParams } = new URL(request.url);
  const { missing, invalid, allZero } = getRequiredBboxQueryProblems(searchParams);
  if (missing.length === 0 && invalid.length === 0 && !allZero) return null;
  return {
    status: missing.length > 0 ? "missing" : "invalid",
    missing,
    invalid: allZero ? [...REQUIRED_BBOX_QUERY_PARAMS] : invalid
  };
}
function attachRequiredBboxDiagnosticHeaders(headers, pathname, diagnostic) {
  if (!diagnostic) return;
  headers.set("X-WorldMonitor-Bbox", diagnostic.status);
  if (diagnostic.missing.length > 0) headers.set("X-WorldMonitor-Bbox-Missing", diagnostic.missing.join(","));
  if (diagnostic.invalid.length > 0) headers.set("X-WorldMonitor-Bbox-Invalid", diagnostic.invalid.join(","));
  if (MILITARY_BBOX_DIAGNOSTIC_PATH_SET.has(pathname)) {
    headers.set("X-Military-Bbox", diagnostic.status);
  }
}
function cloneRequestWithHeaders(request, headers) {
  return new Request(request, { headers });
}
function stripClientUserIdHeader(request) {
  if (!request.headers.has(TRUSTED_USER_ID_HEADER)) return request;
  const headers = new Headers(request.headers);
  headers.delete(TRUSTED_USER_ID_HEADER);
  return cloneRequestWithHeaders(request, headers);
}
function withAuthenticatedUserId(request, userId) {
  const headers = new Headers(request.headers);
  headers.set(TRUSTED_USER_ID_HEADER, userId);
  return cloneRequestWithHeaders(request, headers);
}
function normalizeAuthError(error) {
  if (!error || error === USER_API_KEY_GATEWAY_VALIDATION_ERROR) return "Invalid API key";
  return error;
}
function createGatewayAuthErrorResponse(status, error, corsHeaders) {
  return new Response(JSON.stringify({ error: normalizeAuthError(error) }), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      ...corsHeaders
    }
  });
}
var GATEWAY_DIRECT_LLM_QUOTA_METHODS = {
  "/api/intelligence/v1/classify-event": "GET",
  "/api/intelligence/v1/deduct-situation": "POST",
  "/api/intelligence/v1/get-country-intel-brief": "GET",
  "/api/market/v1/analyze-stock": "GET",
  "/api/news/v1/summarize-article": "POST"
};
async function shouldReserveGatewayDirectLlmQuota(request, pathname) {
  if (DIRECT_LLM_GATEWAY_QUOTA_PATHS.size >= 0) return false;
  if (!DIRECT_LLM_GATEWAY_QUOTA_PATHS.has(pathname)) return false;
  if (GATEWAY_DIRECT_LLM_QUOTA_METHODS[pathname] !== request.method) return false;
  if (pathname !== "/api/news/v1/summarize-article") return true;
  const contentLength = Number(request.headers.get("Content-Length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength >= POST_TO_GET_MAX_BODY_BYTES) {
    return true;
  }
  try {
    const body = await request.clone().json();
    return body.mode !== "translate";
  } catch {
    return false;
  }
}
function createDirectLlmQuotaFailureResponse(reservation, corsHeaders) {
  if (reservation.ok) {
    throw new Error("createDirectLlmQuotaFailureResponse called for successful reservation");
  }
  if (reservation.reason === "cap-exceeded") {
    return new Response(JSON.stringify({
      error: "Direct LLM daily quota exceeded",
      limit: DIRECT_LLM_DAILY_QUOTA_LIMIT,
      resetsAt: "next UTC midnight"
    }), {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
        "Retry-After": String(reservation.retryAfterSec),
        ...corsHeaders
      }
    });
  }
  return new Response(JSON.stringify({ error: "Direct LLM quota unavailable" }), {
    status: 503,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      "Retry-After": String(reservation.retryAfterSec),
      ...corsHeaders
    }
  });
}
function markAuthErrorNoStore(response) {
  response.headers.set("Cache-Control", "no-store");
  response.headers.delete("CDN-Cache-Control");
  response.headers.delete("Vercel-CDN-Cache-Control");
  return response;
}
function hasCredentialBearingHeader(request) {
  return Boolean(
    request.headers.get("Authorization") || request.headers.get("X-WorldMonitor-Key") || request.headers.get("X-Api-Key") || request.headers.get("Cookie")
  );
}
async function isResilienceRankingSeedRefreshRequest(request, pathname) {
  if (pathname !== "/api/resilience/v1/get-resilience-ranking") return false;
  const expected = process.env.WORLDMONITOR_SEED_REFRESH_KEY?.trim() ?? "";
  if (!expected) return false;
  try {
    const url = new URL(request.url);
    if (url.searchParams.get("refresh") !== "1") return false;
  } catch {
    return false;
  }
  const candidate = request.headers.get("X-WorldMonitor-Key") ?? "";
  return timingSafeEqual(candidate, expected);
}
async function isRelayWarmPingRequest(request, pathname) {
  if (!RELAY_WARM_PING_PATHS.has(pathname)) return false;
  const expected = process.env.WORLDMONITOR_RELAY_KEY?.trim() ?? "";
  if (!expected) return false;
  const candidate = request.headers.get("X-WorldMonitor-Key") ?? "";
  return timingSafeEqual(candidate, expected);
}
function assertProMcpGatewayHmacConfig() {
  const proGrantSecret = process.env.MCP_PRO_GRANT_HMAC_SECRET?.trim() ?? "";
  const internalSecret = process.env.MCP_INTERNAL_HMAC_SECRET?.trim() ?? "";
  if (proGrantSecret && !internalSecret) {
    throw new Error("MCP_INTERNAL_HMAC_SECRET must be configured when MCP_PRO_GRANT_HMAC_SECRET is set");
  }
}
function createDomainGateway(routes) {
  assertProMcpGatewayHmacConfig();
  const router = createRouter(routes);
  return async function handler(originalRequest, ctx) {
    let request = stripClientUserIdHeader(originalRequest);
    const rawPathname = new URL(request.url).pathname;
    const pathname = rawPathname.length > 1 ? rawPathname.replace(/\/+$/, "") : rawPathname;
    const t0 = Date.now();
    const rawWidgetKey = request.headers.get("x-widget-key") ?? null;
    const widgetAgentKey = process.env.WIDGET_AGENT_KEY ?? "";
    const validatedWidgetKey = await timingSafeEqualSecret(rawWidgetKey, widgetAgentKey) ? rawWidgetKey : null;
    const usage = {
      sessionUserId: null,
      isUserApiKey: false,
      enterpriseApiKey: null,
      widgetKey: validatedWidgetKey,
      clerkOrgId: null,
      userApiKeyCustomerRef: null,
      tier: null,
      planKey: null
    };
    function recordUsageEntitlement(ent) {
      if (!ent) return;
      usage.tier = typeof ent.features.tier === "number" ? ent.features.tier : 0;
      usage.planKey = ent.planKey;
    }
    const _parts = pathname.split("/");
    const domain = (/^v\d+$/.test(_parts[2] ?? "") ? _parts[3] : _parts[2]) ?? "";
    const reqBytes = deriveReqBytes(request);
    let pendingShadowReason = null;
    function emitRequest(status, reason, cacheTier, resBytes = 0) {
      if (!ctx?.waitUntil) return;
      const effectiveReason = pendingShadowReason && status < 400 ? pendingShadowReason : reason;
      const identity = buildUsageIdentity(usage);
      ctx.waitUntil((async () => {
        const uaHash = await deriveUaHash(originalRequest);
        await deliverUsageEvents([
          buildRequestEvent({
            requestId: deriveRequestId(originalRequest),
            domain,
            route: pathname,
            method: originalRequest.method,
            status,
            durationMs: Date.now() - t0,
            reqBytes,
            resBytes,
            customerId: identity.customer_id,
            principalId: identity.principal_id,
            authKind: identity.auth_kind,
            tier: identity.tier,
            planKey: identity.plan_key,
            country: deriveCountry(originalRequest),
            ipCity: deriveIpCity(originalRequest),
            ipRegion: deriveIpRegion(originalRequest),
            executionRegion: deriveExecutionRegion(originalRequest),
            executionPlane: "vercel-edge",
            originKind: deriveOriginKind(originalRequest),
            cacheTier,
            ip: deriveIp(originalRequest),
            userAgent: deriveUserAgent(originalRequest),
            uaHash,
            referer: deriveReferer(originalRequest),
            acceptLanguage: deriveAcceptLanguage(originalRequest),
            host: deriveHost(originalRequest),
            sentryTraceId: deriveSentryTraceId(originalRequest),
            reason: effectiveReason
          })
        ]);
      })());
    }
    if (isDisallowedOrigin(request)) {
      emitRequest(403, "origin_403", null);
      return new Response(JSON.stringify({ error: "Origin not allowed" }), {
        status: 403,
        headers: { "Content-Type": "application/json" }
      });
    }
    let corsHeaders;
    try {
      corsHeaders = getCorsHeaders(request);
    } catch (err) {
      const captured = captureSilentError(err, {
        tags: { route: "gateway", step: "cors_headers" }
      });
      ctx?.waitUntil(captured);
      emitRequest(500, "cors_error", null);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          // Prevent CDN/edge from caching the 500 — a transient CORS
          // failure must not be pinned for downstream callers.
          "Cache-Control": "no-store"
        }
      });
    }
    if (request.method === "OPTIONS") {
      emitRequest(204, "preflight", null);
      return new Response(null, { status: 204, headers: corsHeaders });
    }
    {
      const inboundHeaders = request.headers;
      if (inboundHeaders.has(INTERNAL_MCP_VERIFIED_HEADER) || inboundHeaders.has(TRUSTED_USER_ID_HEADER)) {
        const stripped = new Headers(inboundHeaders);
        stripped.delete(INTERNAL_MCP_VERIFIED_HEADER);
        stripped.delete(TRUSTED_USER_ID_HEADER);
        const reInit = { method: request.method, headers: stripped };
        if (request.method !== "GET" && request.method !== "HEAD") {
          const contentLen = parseInt(request.headers.get("Content-Length") ?? "0", 10);
          if (Number.isFinite(contentLen) && contentLen > MAX_INTERNAL_MCP_BODY) {
            emitRequest(413, "malformed_request", null);
            return new Response(JSON.stringify({ error: "payload_too_large" }), {
              status: 413,
              headers: { "Content-Type": "application/json", ...corsHeaders }
            });
          }
          try {
            const bytes = await request.clone().arrayBuffer();
            if (bytes.byteLength > MAX_INTERNAL_MCP_BODY) {
              emitRequest(413, "malformed_request", null);
              return new Response(JSON.stringify({ error: "payload_too_large" }), {
                status: 413,
                headers: { "Content-Type": "application/json", ...corsHeaders }
              });
            }
            reInit.body = bytes;
          } catch {
            emitRequest(400, "malformed_request", null);
            return new Response(JSON.stringify({ error: "malformed_request" }), {
              status: 400,
              headers: { "Content-Type": "application/json", ...corsHeaders }
            });
          }
        }
        request = new Request(request.url, reInit);
      }
    }
    let internalMcpVerified = false;
    if (request.headers.has(INTERNAL_MCP_SIG_HEADER)) {
      const hmacSecret = process.env.MCP_INTERNAL_HMAC_SECRET ?? "";
      if (!hmacSecret) {
        emitRequest(500, "auth_401", null);
        return new Response(
          JSON.stringify({ error: "CONFIGURATION", detail: "MCP_INTERNAL_HMAC_SECRET not configured" }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
      let bodyBytes = null;
      if (request.method !== "GET" && request.method !== "HEAD") {
        const contentLen = parseInt(request.headers.get("Content-Length") ?? "0", 10);
        if (Number.isFinite(contentLen) && contentLen > MAX_INTERNAL_MCP_BODY) {
          emitRequest(413, "malformed_request", null);
          return new Response(JSON.stringify({ error: "payload_too_large" }), {
            status: 413,
            headers: { "Content-Type": "application/json", ...corsHeaders }
          });
        }
        try {
          bodyBytes = await request.clone().arrayBuffer();
        } catch {
          emitRequest(401, "auth_401", null);
          return new Response(
            JSON.stringify({ error: "invalid_internal_mcp_signature" }),
            { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }
        if (bodyBytes.byteLength > MAX_INTERNAL_MCP_BODY) {
          emitRequest(413, "malformed_request", null);
          return new Response(JSON.stringify({ error: "payload_too_large" }), {
            status: 413,
            headers: { "Content-Type": "application/json", ...corsHeaders }
          });
        }
        request = new Request(request.url, {
          method: request.method,
          headers: request.headers,
          body: bodyBytes
        });
      }
      const verified = await verifyInternalMcpRequest(request, hmacSecret);
      if (!verified) {
        emitRequest(401, "auth_401", null);
        return new Response(
          JSON.stringify({ error: "invalid_internal_mcp_signature" }),
          { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
      const replayClaim = await claimInternalMcpReplayNonce(verified.userId, verified.nonce);
      if (replayClaim === "unavailable") {
        emitRequest(503, "replay_cache_unavailable", null);
        return new Response(
          JSON.stringify({ error: "internal_mcp_replay_cache_unavailable" }),
          { status: 503, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
      if (replayClaim === "replay") {
        emitRequest(401, "auth_401", null);
        return new Response(
          JSON.stringify({ error: "invalid_internal_mcp_signature" }),
          { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
      const ent = await getEntitlements(verified.userId);
      if (!ent || ent.features.tier < 1 || // mcpAccess flag lands in U10 — undefined means "field not present
      // on this entitlement row", which we treat as false. This keeps
      // pre-U10 entitlement rows from accidentally granting MCP access.
      ent.features.mcpAccess !== true || ent.validUntil < Date.now()) {
        emitRequest(401, "auth_401", null);
        return new Response(
          JSON.stringify({ error: "insufficient_entitlement" }),
          { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
      const trusted = new Headers(request.headers);
      trusted.delete(INTERNAL_MCP_SIG_HEADER);
      trusted.delete(INTERNAL_MCP_USER_ID_HEADER);
      trusted.delete(INTERNAL_MCP_NONCE_HEADER);
      trusted.set(INTERNAL_MCP_VERIFIED_HEADER, getInternalMcpVerifiedNonce());
      trusted.set(TRUSTED_USER_ID_HEADER, verified.userId);
      const rebuildInit = { method: request.method, headers: trusted };
      if (bodyBytes !== null) rebuildInit.body = bodyBytes;
      request = new Request(request.url, rebuildInit);
      usage.sessionUserId = verified.userId;
      recordUsageEntitlement(ent);
      internalMcpVerified = true;
    }
    const isPublicNoAuthRpc = PUBLIC_NO_AUTH_RPC_PATHS.has(pathname) || isPublicSharedRpcRequest(request.url, request.method);
    const seedRefreshVerified = await isResilienceRankingSeedRefreshRequest(request, pathname);
    const relayWarmPingVerified = await isRelayWarmPingRequest(request, pathname);
    const requiresDirectLlmQuota = !internalMcpVerified && await shouldReserveGatewayDirectLlmQuota(request, pathname);
    const isTierGated = !internalMcpVerified && !isPublicNoAuthRpc && !seedRefreshVerified && !relayWarmPingVerified && getRequiredTier(pathname) !== null;
    const needsLegacyProBearerGate = !internalMcpVerified && !isPublicNoAuthRpc && PREMIUM_RPC_PATHS.has(pathname) && !isTierGated;
    let endpointRateLimitPrincipalUserId;
    let sessionUserId = null;
    let sessionRole = null;
    if (isTierGated || requiresDirectLlmQuota) {
      const session = await resolveClerkSession(request);
      sessionUserId = session?.userId ?? null;
      sessionRole = session?.role ?? null;
      usage.sessionUserId = sessionUserId;
      usage.clerkOrgId = session?.orgId ?? null;
      if (sessionUserId) {
        request = withAuthenticatedUserId(request, sessionUserId);
      }
    }
    let keyCheck = internalMcpVerified || isPublicNoAuthRpc || seedRefreshVerified || relayWarmPingVerified ? { valid: true, required: false } : await validateApiKey(request, {
      forceKey: isTierGated && !sessionUserId || needsLegacyProBearerGate
    });
    let isUserApiKey = false;
    const wmKey = request.headers.get("X-WorldMonitor-Key") ?? request.headers.get("X-Api-Key") ?? "";
    if (keyCheck.required && !keyCheck.valid && wmKey.startsWith("wm_")) {
      const { validateUserApiKey: validateUserApiKey2 } = await Promise.resolve().then(() => (init_user_api_key(), user_api_key_exports));
      const userKeyResult = await validateUserApiKey2(wmKey);
      if (userKeyResult) {
        isUserApiKey = true;
        usage.isUserApiKey = true;
        usage.userApiKeyCustomerRef = userKeyResult.userId;
        keyCheck = { valid: true, required: true };
        sessionUserId = userKeyResult.userId;
        sessionRole = null;
        usage.sessionUserId = sessionUserId;
        usage.clerkOrgId = null;
        request = withAuthenticatedUserId(request, sessionUserId);
      }
    }
    if ((isTierGated || requiresDirectLlmQuota) && sessionUserId && keyCheck.required && !keyCheck.valid) {
      keyCheck = { valid: true, required: false };
    }
    if (keyCheck.valid && wmKey && !isUserApiKey && keyCheck.kind === "enterprise") {
      usage.enterpriseApiKey = wmKey;
    }
    let userKeyEntitlement;
    if (isUserApiKey && sessionUserId) {
      userKeyEntitlement = await getEntitlements(sessionUserId);
      recordUsageEntitlement(userKeyEntitlement);
      if (userKeyEntitlement && (!userKeyEntitlement.features.apiAccess || userKeyEntitlement.validUntil < Date.now())) {
        emitRequest(403, "tier_403", null);
        return createGatewayAuthErrorResponse(
          403,
          "API access requires an active subscription",
          corsHeaders
        );
      }
    }
    if (keyCheck.required && !keyCheck.valid) {
      if (needsLegacyProBearerGate) {
        const authHeader = request.headers.get("Authorization");
        if (authHeader?.startsWith("Bearer ")) {
          const { validateBearerToken: validateBearerToken2 } = await Promise.resolve().then(() => (init_auth_session(), auth_session_exports));
          const session = await validateBearerToken2(authHeader.slice(7));
          if (!session.valid) {
            emitRequest(401, "auth_401", null);
            return createGatewayAuthErrorResponse(401, "Invalid or expired session", corsHeaders);
          }
          if (session.userId) {
            sessionUserId = session.userId;
            usage.sessionUserId = session.userId;
            request = withAuthenticatedUserId(request, session.userId);
          }
          let allowed = session.role === "pro";
          if (!allowed && session.userId) {
            const ent = await getEntitlements(session.userId);
            recordUsageEntitlement(ent);
            allowed = !!ent && ent.features.tier >= 1 && ent.validUntil >= Date.now();
          }
          if (!allowed) {
            emitRequest(403, "tier_403", null);
            return createGatewayAuthErrorResponse(403, "Pro subscription required", corsHeaders);
          }
        } else {
          emitRequest(401, "auth_401", null);
          return createGatewayAuthErrorResponse(401, keyCheck.error, corsHeaders);
        }
      } else {
        emitRequest(401, "auth_401", null);
        return createGatewayAuthErrorResponse(401, keyCheck.error, corsHeaders);
      }
    }
    const isEnterpriseAuth = keyCheck.valid && wmKey && !isUserApiKey && keyCheck.kind === "enterprise";
    if (!isEnterpriseAuth && !internalMcpVerified && !seedRefreshVerified && !relayWarmPingVerified) {
      const entitlementCheck = await checkEntitlementDetailed(sessionUserId, pathname, corsHeaders, {
        clerkRole: sessionRole
      });
      recordUsageEntitlement(entitlementCheck.entitlements);
      const entitlementResponse = entitlementCheck.response;
      if (entitlementResponse) {
        const entReason = entitlementResponse.status === 401 ? "auth_401" : entitlementResponse.status === 403 ? "tier_403" : "ok";
        emitRequest(entitlementResponse.status, entReason, null);
        return entitlementResponse.status === 401 || entitlementResponse.status === 403 ? markAuthErrorNoStore(entitlementResponse) : entitlementResponse;
      }
      if (pathname === "/api/news/v1/summarize-article" && requiresDirectLlmQuota && sessionUserId) {
        const attributionGuardResponse = await checkFailClosedScopedIpRateLimit(
          request,
          "summarize-article:principal-attribution",
          600,
          "60 s",
          corsHeaders
        );
        if (attributionGuardResponse) {
          const reason = attributionGuardResponse.status === 503 && attributionGuardResponse.headers.get("X-RateLimit-Mode") === "degraded" ? "rate_limit_degraded" : "rate_limit_429";
          emitRequest(attributionGuardResponse.status, reason, null);
          return attributionGuardResponse;
        }
        const ent = entitlementCheck.entitlements ?? (userKeyEntitlement !== void 0 ? userKeyEntitlement : await getEntitlements(sessionUserId));
        recordUsageEntitlement(ent);
        if (ent && ent.features.tier >= 1 && ent.validUntil >= Date.now()) {
          endpointRateLimitPrincipalUserId = sessionUserId;
        }
      }
    }
    let matchedHandler = router.match(request);
    if (!matchedHandler && request.method === "POST") {
      if (isPostToGetCompatibleBodySize(request.headers)) {
        const url = new URL(request.url);
        let oversizedKey = null;
        try {
          const bodyText = await request.clone().text();
          if (new TextEncoder().encode(bodyText).byteLength >= POST_TO_GET_MAX_BODY_BYTES) {
            emitRequest(400, "malformed_request", null);
            return new Response(JSON.stringify({ error: "malformed_request" }), {
              status: 400,
              headers: { "Content-Type": "application/json", ...corsHeaders }
            });
          }
          const body = JSON.parse(bodyText);
          const isScalar = (x) => typeof x === "string" || typeof x === "number" || typeof x === "boolean";
          for (const [k, v] of Object.entries(body)) {
            if (Array.isArray(v)) {
              if (v.length > POST_TO_GET_MAX_ARRAY_VALUES_PER_KEY) {
                oversizedKey = k;
                break;
              }
              v.forEach((item) => {
                if (isScalar(item)) url.searchParams.append(k, String(item));
              });
            } else if (isScalar(v)) url.searchParams.set(k, String(v));
          }
        } catch {
        }
        if (oversizedKey !== null) {
          emitRequest(400, "malformed_request", null);
          return new Response(JSON.stringify({
            error: "Too many values for POST compatibility parameter",
            parameter: oversizedKey,
            maxValues: POST_TO_GET_MAX_ARRAY_VALUES_PER_KEY
          }), {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders }
          });
        }
        const getReq = new Request(url.toString(), { method: "GET", headers: request.headers });
        matchedHandler = router.match(getReq);
        if (matchedHandler) request = getReq;
      }
    }
    if (!matchedHandler) {
      const allowed = router.allowedMethods(new URL(request.url).pathname);
      if (allowed.length > 0) {
        emitRequest(405, "method_not_allowed", null);
        return new Response(JSON.stringify({ error: "Method not allowed" }), {
          status: 405,
          headers: { "Content-Type": "application/json", Allow: allowed.join(", "), ...corsHeaders }
        });
      }
      emitRequest(404, "unknown_route", null);
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
    const requiredBboxDiagnostic = getRequiredBboxDiagnostic(request, pathname);
    const identityForScope = buildUsageIdentity(usage);
    let idempotency = null;
    const hasIdempotencyKey = request.method === "POST" && request.headers.has(IDEMPOTENCY_HEADER);
    const idScope = identityForScope.principal_id ?? identityForScope.customer_id;
    const idempotencyScope = idScope ? `${identityForScope.auth_kind}:${idScope}` : null;
    if (hasIdempotencyKey) {
      const peek = await peekIdempotency({
        request,
        pathname,
        scope: idempotencyScope,
        idempotencyKey: request.headers.get(IDEMPOTENCY_HEADER) ?? "",
        corsHeaders
      });
      switch (peek.kind) {
        case "invalid":
          emitRequest(400, "idempotency_invalid", null);
          return peek.response;
        case "replay":
          emitRequest(peek.response.status, "idempotent_replay", null);
          return peek.response;
        case "conflict":
          emitRequest(409, "idempotency_conflict", null);
          return peek.response;
        case "mismatch":
          emitRequest(422, "idempotency_mismatch", null);
          return peek.response;
      }
    }
    if (!internalMcpVerified) {
      const endpointRlResponse = endpointRateLimitPrincipalUserId ? await checkEndpointRateLimit(request, pathname, corsHeaders, {
        principalUserId: endpointRateLimitPrincipalUserId
      }) : await checkEndpointRateLimit(request, pathname, corsHeaders);
      if (endpointRlResponse) {
        const reason = endpointRlResponse.status === 503 && endpointRlResponse.headers.get("X-RateLimit-Mode") === "degraded" ? "rate_limit_degraded" : "rate_limit_429";
        emitRequest(endpointRlResponse.status, reason, null);
        return endpointRlResponse;
      }
      let governedByApiKeyLayer = false;
      if (keyCheck.valid && (isUserApiKey || isEnterpriseAuth)) {
        const enforce = process.env.API_RATE_LIMIT_ENFORCE === "true";
        let perMinute = 0;
        let allowance = -1;
        let identity = "";
        if (isEnterpriseAuth) {
          perMinute = ENTERPRISE_API_RATE_LIMIT;
          allowance = -1;
          usage.tier = 3;
          identity = wmKey ? hashKeySync(wmKey) : "";
        } else if (sessionUserId) {
          const ent = userKeyEntitlement !== void 0 ? userKeyEntitlement : await getEntitlements(sessionUserId);
          if (ent) {
            recordUsageEntitlement(ent);
          }
          if (ent && ent.features.apiAccess && ent.features.apiRateLimit > 0) {
            perMinute = ent.features.apiRateLimit;
            allowance = typeof ent.features.apiDailyAllowance === "number" ? ent.features.apiDailyAllowance : -1;
            identity = sessionUserId;
          }
        }
        if (perMinute > 0 && identity) {
          const burst = await checkBurst(perMinute, identity);
          if (!burst.ok) {
            if (enforce) {
              const retryAfterSec = Math.max(1, Math.ceil((burst.reset - Date.now()) / 1e3));
              emitRequest(429, "rl_min_429", null);
              return new Response(JSON.stringify({ error: "Too many requests" }), {
                status: 429,
                headers: {
                  "Content-Type": "application/json",
                  "Cache-Control": "no-store",
                  ...rateLimitHeaders({ limit: burst.limit, remaining: 0, resetMs: burst.reset, retryAfterSec, windowSec: 60 }),
                  ...corsHeaders
                }
              });
            }
            pendingShadowReason = "rl_min_shadow";
          } else if (allowance >= 0) {
            const meter = await reserveDailyMeter({
              userId: identity,
              allowance,
              pipeline: (cmds) => runRedisPipeline(cmds)
            });
            if (meter.overCeiling) {
              if (enforce) {
                await meter.rollback();
                emitRequest(429, "rl_ceiling_429", null);
                return new Response(JSON.stringify({ error: "Daily request ceiling exceeded" }), {
                  status: 429,
                  headers: {
                    "Content-Type": "application/json",
                    "Cache-Control": "no-store",
                    ...rateLimitHeaders({
                      limit: allowance * CEILING_MULTIPLIER,
                      remaining: 0,
                      resetMs: Date.now() + meter.retryAfterSec * 1e3,
                      retryAfterSec: meter.retryAfterSec,
                      // Daily ceiling window (24 h) for the advertised policy.
                      windowSec: 86400
                    }),
                    ...corsHeaders
                  }
                });
              }
              pendingShadowReason = "rl_ceiling_shadow";
            }
          }
          if (enforce) governedByApiKeyLayer = true;
        }
      }
      if (!governedByApiKeyLayer && !hasEndpointRatePolicy(pathname)) {
        const rateLimitResponse = await checkRateLimit(request, corsHeaders);
        if (rateLimitResponse) {
          const reason = rateLimitResponse.status === 503 && rateLimitResponse.headers.get("X-RateLimit-Mode") === "degraded" ? "rate_limit_degraded" : "rate_limit_429";
          emitRequest(rateLimitResponse.status, reason, null);
          return rateLimitResponse;
        }
      }
    }
    if (requiresDirectLlmQuota && !isEnterpriseAuth) {
      if (!sessionUserId) {
        emitRequest(401, "auth_401", null);
        return createGatewayAuthErrorResponse(401, "Pro authentication required", corsHeaders);
      }
      const reservation = await reserveDirectLlmQuota({
        userId: sessionUserId,
        pipeline: (cmds) => runRedisPipeline(cmds, true)
      });
      if (!reservation.ok) {
        const response2 = createDirectLlmQuotaFailureResponse(reservation, corsHeaders);
        emitRequest(response2.status, response2.status === 429 ? "rate_limit_429" : "rate_limit_degraded", null);
        return response2;
      }
    }
    if (hasIdempotencyKey) {
      idempotency = await beginIdempotency({
        request,
        pathname,
        // Tag the scope with the auth kind so value spaces (Clerk id vs hashed
        // key vs customer ref) can never collide across authentication methods.
        scope: idempotencyScope,
        idempotencyKey: request.headers.get(IDEMPOTENCY_HEADER) ?? "",
        corsHeaders
      });
      switch (idempotency.kind) {
        case "invalid":
          emitRequest(400, "idempotency_invalid", null);
          return idempotency.response;
        case "replay":
          emitRequest(idempotency.response.status, "idempotent_replay", null);
          return idempotency.response;
        case "conflict":
          emitRequest(409, "idempotency_conflict", null);
          return idempotency.response;
        case "mismatch":
          emitRequest(422, "idempotency_mismatch", null);
          return idempotency.response;
      }
    }
    let response;
    const handlerCall = matchedHandler;
    const requestForHandler = request;
    try {
      response = await runWithUsageScope(
        {
          ctx: ctx ?? { waitUntil: () => {
          } },
          requestId: deriveRequestId(originalRequest),
          customerId: identityForScope.customer_id,
          route: pathname,
          tier: identityForScope.tier
        },
        () => handlerCall(requestForHandler)
      );
    } catch (err) {
      console.error("[gateway] Unhandled handler error:", err);
      response = new Response(JSON.stringify({ message: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
    const mergedHeaders = new Headers(response.headers);
    for (const [key, value] of Object.entries(corsHeaders)) {
      mergedHeaders.set(key, value);
    }
    const extraHeaders = drainResponseHeaders(request);
    if (extraHeaders) {
      for (const [key, value] of Object.entries(extraHeaders)) {
        mergedHeaders.set(key, value);
      }
    }
    attachRequiredBboxDiagnosticHeaders(mergedHeaders, pathname, requiredBboxDiagnostic);
    const statusOverride = drainSuccessStatusOverride(request);
    const finalStatus = statusOverride !== void 0 && request.method === "POST" && response.status === 200 ? statusOverride : response.status;
    let resolvedCacheTier = null;
    if (response.status === 200 && request.method === "GET" && response.body) {
      const bodyBytes = await response.arrayBuffer();
      const bodyStr = new TextDecoder().decode(bodyBytes);
      const noStoreReason = getRpcNoStoreReasonFromJson(bodyStr, { pathname });
      if (mergedHeaders.get("X-No-Cache") || noStoreReason) {
        mergedHeaders.set("Cache-Control", "no-store");
        mergedHeaders.delete("CDN-Cache-Control");
        mergedHeaders.delete("Vercel-CDN-Cache-Control");
        mergedHeaders.set("X-Cache-Tier", "no-store");
        resolvedCacheTier = "no-store";
      } else {
        const rpcName = pathname.split("/").pop() ?? "";
        const envOverride = process.env[`CACHE_TIER_OVERRIDE_${rpcName.replace(/-/g, "_").toUpperCase()}`];
        const isPremium = PREMIUM_RPC_PATHS.has(pathname) || getRequiredTier(pathname) !== null;
        const hasCredentialedNonPublicGet = !isPublicNoAuthRpc && hasCredentialBearingHeader(request);
        const tier = isPremium || hasCredentialedNonPublicGet ? "slow-browser" : (envOverride && envOverride in TIER_HEADERS ? envOverride : null) ?? RPC_CACHE_TIER[pathname] ?? "medium";
        resolvedCacheTier = tier;
        mergedHeaders.set("Cache-Control", TIER_HEADERS[tier]);
        const reqOrigin = request.headers.get("origin") || "";
        const cdnCache = !isPremium && !hasCredentialedNonPublicGet && isAllowedOrigin(reqOrigin) ? TIER_CDN_CACHE[tier] : null;
        mergedHeaders.delete("CDN-Cache-Control");
        mergedHeaders.delete("Vercel-CDN-Cache-Control");
        if (cdnCache) mergedHeaders.set("CDN-Cache-Control", cdnCache);
        mergedHeaders.set("X-Cache-Tier", tier);
      }
      mergedHeaders.delete("X-No-Cache");
      if (!new URL(request.url).searchParams.has("_debug")) {
        mergedHeaders.delete("X-Cache-Tier");
      }
      let responseView = new Uint8Array(bodyBytes);
      const jmespathExpr = new URL(request.url).searchParams.get("jmespath");
      if (jmespathExpr && (mergedHeaders.get("Content-Type") ?? "").includes("application/json")) {
        const projection = projectJsonResponse(bodyStr, jmespathExpr);
        if (!projection.ok) {
          const errorBody = JSON.stringify(projection.envelope);
          emitRequest(400, "malformed_request", null, errorBody.length);
          maybeAttachDevHealthHeader(mergedHeaders);
          return new Response(errorBody, {
            status: 400,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json; charset=utf-8",
              "X-Content-Type-Options": "nosniff",
              "Cache-Control": "no-store"
            }
          });
        }
        responseView = new TextEncoder().encode(projection.body);
        mergedHeaders.delete("Content-Length");
      }
      let hash = 2166136261;
      const view = responseView;
      for (let i = 0; i < view.length; i++) {
        hash ^= view[i];
        hash = Math.imul(hash, 16777619);
      }
      const etag = `"${(hash >>> 0).toString(36)}-${view.length.toString(36)}"`;
      mergedHeaders.set("ETag", etag);
      const ifNoneMatch = request.headers.get("If-None-Match");
      if (ifNoneMatch === etag) {
        emitRequest(304, "ok", resolvedCacheTier, 0);
        maybeAttachDevHealthHeader(mergedHeaders);
        return new Response(null, { status: 304, headers: mergedHeaders });
      }
      emitRequest(response.status, "ok", resolvedCacheTier, view.length);
      maybeAttachDevHealthHeader(mergedHeaders);
      return new Response(responseView, {
        status: response.status,
        statusText: response.statusText,
        headers: mergedHeaders
      });
    }
    if (response.status === 200 && request.method === "GET") {
      if (mergedHeaders.get("X-No-Cache")) {
        mergedHeaders.set("Cache-Control", "no-store");
      }
      mergedHeaders.delete("X-No-Cache");
    }
    if (idempotency?.kind === "proceed") {
      const bodyBytes = response.body ? await response.arrayBuffer() : new ArrayBuffer(0);
      mergedHeaders.set(IDEMPOTENCY_HEADER, idempotency.key);
      mergedHeaders.set(IDEMPOTENT_REPLAYED_HEADER, "false");
      await idempotency.store(finalStatus, bodyBytes, response.headers.get("content-type"));
      emitRequest(finalStatus, "ok", resolvedCacheTier, bodyBytes.byteLength);
      maybeAttachDevHealthHeader(mergedHeaders);
      return new Response(bodyBytes, {
        status: finalStatus,
        statusText: response.statusText,
        headers: mergedHeaders
      });
    }
    const finalContentLen = response.headers.get("content-length");
    const finalResBytes = finalContentLen ? Number(finalContentLen) || 0 : 0;
    emitRequest(finalStatus, "ok", resolvedCacheTier, finalResBytes);
    maybeAttachDevHealthHeader(mergedHeaders);
    return new Response(response.body, {
      status: finalStatus,
      statusText: response.statusText,
      headers: mergedHeaders
    });
  };
}

// src/generated/server/worldmonitor/supply_chain/v1/service_server.ts
var ValidationError = class extends Error {
  violations;
  constructor(violations) {
    super("Validation failed");
    this.name = "ValidationError";
    this.violations = violations;
  }
};
function createSupplyChainServiceRoutes(handler, options) {
  return [
    {
      method: "GET",
      path: "/api/supply-chain/v1/get-shipping-rates",
      handler: async (req) => {
        try {
          const pathParams = {};
          const body = {};
          const ctx = {
            request: req,
            pathParams,
            headers: Object.fromEntries(req.headers.entries())
          };
          const result = await handler.getShippingRates(ctx, body);
          return new Response(JSON.stringify(result), {
            status: 200,
            headers: { "Content-Type": "application/json" }
          });
        } catch (err) {
          if (err instanceof ValidationError) {
            return new Response(JSON.stringify({ violations: err.violations }), {
              status: 400,
              headers: { "Content-Type": "application/json" }
            });
          }
          if (options?.onError) {
            return options.onError(err, req);
          }
          const message2 = err instanceof Error ? err.message : String(err);
          return new Response(JSON.stringify({ message: message2 }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
          });
        }
      }
    },
    {
      method: "GET",
      path: "/api/supply-chain/v1/get-chokepoint-status",
      handler: async (req) => {
        try {
          const pathParams = {};
          const body = {};
          const ctx = {
            request: req,
            pathParams,
            headers: Object.fromEntries(req.headers.entries())
          };
          const result = await handler.getChokepointStatus(ctx, body);
          return new Response(JSON.stringify(result), {
            status: 200,
            headers: { "Content-Type": "application/json" }
          });
        } catch (err) {
          if (err instanceof ValidationError) {
            return new Response(JSON.stringify({ violations: err.violations }), {
              status: 400,
              headers: { "Content-Type": "application/json" }
            });
          }
          if (options?.onError) {
            return options.onError(err, req);
          }
          const message2 = err instanceof Error ? err.message : String(err);
          return new Response(JSON.stringify({ message: message2 }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
          });
        }
      }
    },
    {
      method: "GET",
      path: "/api/supply-chain/v1/get-chokepoint-history",
      handler: async (req) => {
        try {
          const pathParams = {};
          const url = new URL(req.url, "http://localhost");
          const params = url.searchParams;
          const body = {
            chokepointId: params.get("chokepointId") ?? ""
          };
          if (options?.validateRequest) {
            const bodyViolations = options.validateRequest("getChokepointHistory", body);
            if (bodyViolations) {
              throw new ValidationError(bodyViolations);
            }
          }
          const ctx = {
            request: req,
            pathParams,
            headers: Object.fromEntries(req.headers.entries())
          };
          const result = await handler.getChokepointHistory(ctx, body);
          return new Response(JSON.stringify(result), {
            status: 200,
            headers: { "Content-Type": "application/json" }
          });
        } catch (err) {
          if (err instanceof ValidationError) {
            return new Response(JSON.stringify({ violations: err.violations }), {
              status: 400,
              headers: { "Content-Type": "application/json" }
            });
          }
          if (options?.onError) {
            return options.onError(err, req);
          }
          const message2 = err instanceof Error ? err.message : String(err);
          return new Response(JSON.stringify({ message: message2 }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
          });
        }
      }
    },
    {
      method: "GET",
      path: "/api/supply-chain/v1/get-critical-minerals",
      handler: async (req) => {
        try {
          const pathParams = {};
          const body = {};
          const ctx = {
            request: req,
            pathParams,
            headers: Object.fromEntries(req.headers.entries())
          };
          const result = await handler.getCriticalMinerals(ctx, body);
          return new Response(JSON.stringify(result), {
            status: 200,
            headers: { "Content-Type": "application/json" }
          });
        } catch (err) {
          if (err instanceof ValidationError) {
            return new Response(JSON.stringify({ violations: err.violations }), {
              status: 400,
              headers: { "Content-Type": "application/json" }
            });
          }
          if (options?.onError) {
            return options.onError(err, req);
          }
          const message2 = err instanceof Error ? err.message : String(err);
          return new Response(JSON.stringify({ message: message2 }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
          });
        }
      }
    },
    {
      method: "GET",
      path: "/api/supply-chain/v1/get-shipping-stress",
      handler: async (req) => {
        try {
          const pathParams = {};
          const body = {};
          const ctx = {
            request: req,
            pathParams,
            headers: Object.fromEntries(req.headers.entries())
          };
          const result = await handler.getShippingStress(ctx, body);
          return new Response(JSON.stringify(result), {
            status: 200,
            headers: { "Content-Type": "application/json" }
          });
        } catch (err) {
          if (err instanceof ValidationError) {
            return new Response(JSON.stringify({ violations: err.violations }), {
              status: 400,
              headers: { "Content-Type": "application/json" }
            });
          }
          if (options?.onError) {
            return options.onError(err, req);
          }
          const message2 = err instanceof Error ? err.message : String(err);
          return new Response(JSON.stringify({ message: message2 }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
          });
        }
      }
    },
    {
      method: "GET",
      path: "/api/supply-chain/v1/get-country-chokepoint-index",
      handler: async (req) => {
        try {
          const pathParams = {};
          const url = new URL(req.url, "http://localhost");
          const params = url.searchParams;
          const body = {
            iso2: params.get("iso2") ?? "",
            hs2: params.get("hs2") ?? ""
          };
          if (options?.validateRequest) {
            const bodyViolations = options.validateRequest("getCountryChokepointIndex", body);
            if (bodyViolations) {
              throw new ValidationError(bodyViolations);
            }
          }
          const ctx = {
            request: req,
            pathParams,
            headers: Object.fromEntries(req.headers.entries())
          };
          const result = await handler.getCountryChokepointIndex(ctx, body);
          return new Response(JSON.stringify(result), {
            status: 200,
            headers: { "Content-Type": "application/json" }
          });
        } catch (err) {
          if (err instanceof ValidationError) {
            return new Response(JSON.stringify({ violations: err.violations }), {
              status: 400,
              headers: { "Content-Type": "application/json" }
            });
          }
          if (options?.onError) {
            return options.onError(err, req);
          }
          const message2 = err instanceof Error ? err.message : String(err);
          return new Response(JSON.stringify({ message: message2 }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
          });
        }
      }
    },
    {
      method: "GET",
      path: "/api/supply-chain/v1/get-bypass-options",
      handler: async (req) => {
        try {
          const pathParams = {};
          const url = new URL(req.url, "http://localhost");
          const params = url.searchParams;
          const body = {
            chokepointId: params.get("chokepointId") ?? "",
            cargoType: params.get("cargoType") ?? "",
            closurePct: Number(params.get("closurePct") ?? "0")
          };
          if (options?.validateRequest) {
            const bodyViolations = options.validateRequest("getBypassOptions", body);
            if (bodyViolations) {
              throw new ValidationError(bodyViolations);
            }
          }
          const ctx = {
            request: req,
            pathParams,
            headers: Object.fromEntries(req.headers.entries())
          };
          const result = await handler.getBypassOptions(ctx, body);
          return new Response(JSON.stringify(result), {
            status: 200,
            headers: { "Content-Type": "application/json" }
          });
        } catch (err) {
          if (err instanceof ValidationError) {
            return new Response(JSON.stringify({ violations: err.violations }), {
              status: 400,
              headers: { "Content-Type": "application/json" }
            });
          }
          if (options?.onError) {
            return options.onError(err, req);
          }
          const message2 = err instanceof Error ? err.message : String(err);
          return new Response(JSON.stringify({ message: message2 }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
          });
        }
      }
    },
    {
      method: "GET",
      path: "/api/supply-chain/v1/get-country-cost-shock",
      handler: async (req) => {
        try {
          const pathParams = {};
          const url = new URL(req.url, "http://localhost");
          const params = url.searchParams;
          const body = {
            iso2: params.get("iso2") ?? "",
            chokepointId: params.get("chokepointId") ?? "",
            hs2: params.get("hs2") ?? ""
          };
          if (options?.validateRequest) {
            const bodyViolations = options.validateRequest("getCountryCostShock", body);
            if (bodyViolations) {
              throw new ValidationError(bodyViolations);
            }
          }
          const ctx = {
            request: req,
            pathParams,
            headers: Object.fromEntries(req.headers.entries())
          };
          const result = await handler.getCountryCostShock(ctx, body);
          return new Response(JSON.stringify(result), {
            status: 200,
            headers: { "Content-Type": "application/json" }
          });
        } catch (err) {
          if (err instanceof ValidationError) {
            return new Response(JSON.stringify({ violations: err.violations }), {
              status: 400,
              headers: { "Content-Type": "application/json" }
            });
          }
          if (options?.onError) {
            return options.onError(err, req);
          }
          const message2 = err instanceof Error ? err.message : String(err);
          return new Response(JSON.stringify({ message: message2 }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
          });
        }
      }
    },
    {
      method: "GET",
      path: "/api/supply-chain/v1/get-country-products",
      handler: async (req) => {
        try {
          const pathParams = {};
          const url = new URL(req.url, "http://localhost");
          const params = url.searchParams;
          const body = {
            iso2: params.get("iso2") ?? ""
          };
          if (options?.validateRequest) {
            const bodyViolations = options.validateRequest("getCountryProducts", body);
            if (bodyViolations) {
              throw new ValidationError(bodyViolations);
            }
          }
          const ctx = {
            request: req,
            pathParams,
            headers: Object.fromEntries(req.headers.entries())
          };
          const result = await handler.getCountryProducts(ctx, body);
          return new Response(JSON.stringify(result), {
            status: 200,
            headers: { "Content-Type": "application/json" }
          });
        } catch (err) {
          if (err instanceof ValidationError) {
            return new Response(JSON.stringify({ violations: err.violations }), {
              status: 400,
              headers: { "Content-Type": "application/json" }
            });
          }
          if (options?.onError) {
            return options.onError(err, req);
          }
          const message2 = err instanceof Error ? err.message : String(err);
          return new Response(JSON.stringify({ message: message2 }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
          });
        }
      }
    },
    {
      method: "GET",
      path: "/api/supply-chain/v1/get-multi-sector-cost-shock",
      handler: async (req) => {
        try {
          const pathParams = {};
          const url = new URL(req.url, "http://localhost");
          const params = url.searchParams;
          const body = {
            iso2: params.get("iso2") ?? "",
            chokepointId: params.get("chokepointId") ?? "",
            closureDays: Number(params.get("closureDays") ?? "0")
          };
          if (options?.validateRequest) {
            const bodyViolations = options.validateRequest("getMultiSectorCostShock", body);
            if (bodyViolations) {
              throw new ValidationError(bodyViolations);
            }
          }
          const ctx = {
            request: req,
            pathParams,
            headers: Object.fromEntries(req.headers.entries())
          };
          const result = await handler.getMultiSectorCostShock(ctx, body);
          return new Response(JSON.stringify(result), {
            status: 200,
            headers: { "Content-Type": "application/json" }
          });
        } catch (err) {
          if (err instanceof ValidationError) {
            return new Response(JSON.stringify({ violations: err.violations }), {
              status: 400,
              headers: { "Content-Type": "application/json" }
            });
          }
          if (options?.onError) {
            return options.onError(err, req);
          }
          const message2 = err instanceof Error ? err.message : String(err);
          return new Response(JSON.stringify({ message: message2 }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
          });
        }
      }
    },
    {
      method: "GET",
      path: "/api/supply-chain/v1/get-sector-dependency",
      handler: async (req) => {
        try {
          const pathParams = {};
          const url = new URL(req.url, "http://localhost");
          const params = url.searchParams;
          const body = {
            iso2: params.get("iso2") ?? "",
            hs2: params.get("hs2") ?? ""
          };
          if (options?.validateRequest) {
            const bodyViolations = options.validateRequest("getSectorDependency", body);
            if (bodyViolations) {
              throw new ValidationError(bodyViolations);
            }
          }
          const ctx = {
            request: req,
            pathParams,
            headers: Object.fromEntries(req.headers.entries())
          };
          const result = await handler.getSectorDependency(ctx, body);
          return new Response(JSON.stringify(result), {
            status: 200,
            headers: { "Content-Type": "application/json" }
          });
        } catch (err) {
          if (err instanceof ValidationError) {
            return new Response(JSON.stringify({ violations: err.violations }), {
              status: 400,
              headers: { "Content-Type": "application/json" }
            });
          }
          if (options?.onError) {
            return options.onError(err, req);
          }
          const message2 = err instanceof Error ? err.message : String(err);
          return new Response(JSON.stringify({ message: message2 }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
          });
        }
      }
    },
    {
      method: "GET",
      path: "/api/supply-chain/v1/get-route-explorer-lane",
      handler: async (req) => {
        try {
          const pathParams = {};
          const url = new URL(req.url, "http://localhost");
          const params = url.searchParams;
          const body = {
            fromIso2: params.get("fromIso2") ?? "",
            toIso2: params.get("toIso2") ?? "",
            hs2: params.get("hs2") ?? "",
            cargoType: params.get("cargoType") ?? ""
          };
          if (options?.validateRequest) {
            const bodyViolations = options.validateRequest("getRouteExplorerLane", body);
            if (bodyViolations) {
              throw new ValidationError(bodyViolations);
            }
          }
          const ctx = {
            request: req,
            pathParams,
            headers: Object.fromEntries(req.headers.entries())
          };
          const result = await handler.getRouteExplorerLane(ctx, body);
          return new Response(JSON.stringify(result), {
            status: 200,
            headers: { "Content-Type": "application/json" }
          });
        } catch (err) {
          if (err instanceof ValidationError) {
            return new Response(JSON.stringify({ violations: err.violations }), {
              status: 400,
              headers: { "Content-Type": "application/json" }
            });
          }
          if (options?.onError) {
            return options.onError(err, req);
          }
          const message2 = err instanceof Error ? err.message : String(err);
          return new Response(JSON.stringify({ message: message2 }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
          });
        }
      }
    },
    {
      method: "GET",
      path: "/api/supply-chain/v1/get-route-impact",
      handler: async (req) => {
        try {
          const pathParams = {};
          const url = new URL(req.url, "http://localhost");
          const params = url.searchParams;
          const body = {
            fromIso2: params.get("fromIso2") ?? "",
            toIso2: params.get("toIso2") ?? "",
            hs2: params.get("hs2") ?? ""
          };
          if (options?.validateRequest) {
            const bodyViolations = options.validateRequest("getRouteImpact", body);
            if (bodyViolations) {
              throw new ValidationError(bodyViolations);
            }
          }
          const ctx = {
            request: req,
            pathParams,
            headers: Object.fromEntries(req.headers.entries())
          };
          const result = await handler.getRouteImpact(ctx, body);
          return new Response(JSON.stringify(result), {
            status: 200,
            headers: { "Content-Type": "application/json" }
          });
        } catch (err) {
          if (err instanceof ValidationError) {
            return new Response(JSON.stringify({ violations: err.violations }), {
              status: 400,
              headers: { "Content-Type": "application/json" }
            });
          }
          if (options?.onError) {
            return options.onError(err, req);
          }
          const message2 = err instanceof Error ? err.message : String(err);
          return new Response(JSON.stringify({ message: message2 }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
          });
        }
      }
    },
    {
      method: "GET",
      path: "/api/supply-chain/v1/list-pipelines",
      handler: async (req) => {
        try {
          const pathParams = {};
          const url = new URL(req.url, "http://localhost");
          const params = url.searchParams;
          const body = {
            commodityType: params.get("commodityType") ?? ""
          };
          if (options?.validateRequest) {
            const bodyViolations = options.validateRequest("listPipelines", body);
            if (bodyViolations) {
              throw new ValidationError(bodyViolations);
            }
          }
          const ctx = {
            request: req,
            pathParams,
            headers: Object.fromEntries(req.headers.entries())
          };
          const result = await handler.listPipelines(ctx, body);
          return new Response(JSON.stringify(result), {
            status: 200,
            headers: { "Content-Type": "application/json" }
          });
        } catch (err) {
          if (err instanceof ValidationError) {
            return new Response(JSON.stringify({ violations: err.violations }), {
              status: 400,
              headers: { "Content-Type": "application/json" }
            });
          }
          if (options?.onError) {
            return options.onError(err, req);
          }
          const message2 = err instanceof Error ? err.message : String(err);
          return new Response(JSON.stringify({ message: message2 }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
          });
        }
      }
    },
    {
      method: "GET",
      path: "/api/supply-chain/v1/get-pipeline-detail",
      handler: async (req) => {
        try {
          const pathParams = {};
          const url = new URL(req.url, "http://localhost");
          const params = url.searchParams;
          const body = {
            pipelineId: params.get("pipelineId") ?? ""
          };
          if (options?.validateRequest) {
            const bodyViolations = options.validateRequest("getPipelineDetail", body);
            if (bodyViolations) {
              throw new ValidationError(bodyViolations);
            }
          }
          const ctx = {
            request: req,
            pathParams,
            headers: Object.fromEntries(req.headers.entries())
          };
          const result = await handler.getPipelineDetail(ctx, body);
          return new Response(JSON.stringify(result), {
            status: 200,
            headers: { "Content-Type": "application/json" }
          });
        } catch (err) {
          if (err instanceof ValidationError) {
            return new Response(JSON.stringify({ violations: err.violations }), {
              status: 400,
              headers: { "Content-Type": "application/json" }
            });
          }
          if (options?.onError) {
            return options.onError(err, req);
          }
          const message2 = err instanceof Error ? err.message : String(err);
          return new Response(JSON.stringify({ message: message2 }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
          });
        }
      }
    },
    {
      method: "GET",
      path: "/api/supply-chain/v1/list-storage-facilities",
      handler: async (req) => {
        try {
          const pathParams = {};
          const url = new URL(req.url, "http://localhost");
          const params = url.searchParams;
          const body = {
            facilityType: params.get("facilityType") ?? ""
          };
          if (options?.validateRequest) {
            const bodyViolations = options.validateRequest("listStorageFacilities", body);
            if (bodyViolations) {
              throw new ValidationError(bodyViolations);
            }
          }
          const ctx = {
            request: req,
            pathParams,
            headers: Object.fromEntries(req.headers.entries())
          };
          const result = await handler.listStorageFacilities(ctx, body);
          return new Response(JSON.stringify(result), {
            status: 200,
            headers: { "Content-Type": "application/json" }
          });
        } catch (err) {
          if (err instanceof ValidationError) {
            return new Response(JSON.stringify({ violations: err.violations }), {
              status: 400,
              headers: { "Content-Type": "application/json" }
            });
          }
          if (options?.onError) {
            return options.onError(err, req);
          }
          const message2 = err instanceof Error ? err.message : String(err);
          return new Response(JSON.stringify({ message: message2 }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
          });
        }
      }
    },
    {
      method: "GET",
      path: "/api/supply-chain/v1/get-storage-facility-detail",
      handler: async (req) => {
        try {
          const pathParams = {};
          const url = new URL(req.url, "http://localhost");
          const params = url.searchParams;
          const body = {
            facilityId: params.get("facilityId") ?? ""
          };
          if (options?.validateRequest) {
            const bodyViolations = options.validateRequest("getStorageFacilityDetail", body);
            if (bodyViolations) {
              throw new ValidationError(bodyViolations);
            }
          }
          const ctx = {
            request: req,
            pathParams,
            headers: Object.fromEntries(req.headers.entries())
          };
          const result = await handler.getStorageFacilityDetail(ctx, body);
          return new Response(JSON.stringify(result), {
            status: 200,
            headers: { "Content-Type": "application/json" }
          });
        } catch (err) {
          if (err instanceof ValidationError) {
            return new Response(JSON.stringify({ violations: err.violations }), {
              status: 400,
              headers: { "Content-Type": "application/json" }
            });
          }
          if (options?.onError) {
            return options.onError(err, req);
          }
          const message2 = err instanceof Error ? err.message : String(err);
          return new Response(JSON.stringify({ message: message2 }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
          });
        }
      }
    },
    {
      method: "GET",
      path: "/api/supply-chain/v1/list-fuel-shortages",
      handler: async (req) => {
        try {
          const pathParams = {};
          const url = new URL(req.url, "http://localhost");
          const params = url.searchParams;
          const body = {
            country: params.get("country") ?? "",
            product: params.get("product") ?? "",
            severity: params.get("severity") ?? ""
          };
          if (options?.validateRequest) {
            const bodyViolations = options.validateRequest("listFuelShortages", body);
            if (bodyViolations) {
              throw new ValidationError(bodyViolations);
            }
          }
          const ctx = {
            request: req,
            pathParams,
            headers: Object.fromEntries(req.headers.entries())
          };
          const result = await handler.listFuelShortages(ctx, body);
          return new Response(JSON.stringify(result), {
            status: 200,
            headers: { "Content-Type": "application/json" }
          });
        } catch (err) {
          if (err instanceof ValidationError) {
            return new Response(JSON.stringify({ violations: err.violations }), {
              status: 400,
              headers: { "Content-Type": "application/json" }
            });
          }
          if (options?.onError) {
            return options.onError(err, req);
          }
          const message2 = err instanceof Error ? err.message : String(err);
          return new Response(JSON.stringify({ message: message2 }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
          });
        }
      }
    },
    {
      method: "GET",
      path: "/api/supply-chain/v1/get-fuel-shortage-detail",
      handler: async (req) => {
        try {
          const pathParams = {};
          const url = new URL(req.url, "http://localhost");
          const params = url.searchParams;
          const body = {
            shortageId: params.get("shortageId") ?? ""
          };
          if (options?.validateRequest) {
            const bodyViolations = options.validateRequest("getFuelShortageDetail", body);
            if (bodyViolations) {
              throw new ValidationError(bodyViolations);
            }
          }
          const ctx = {
            request: req,
            pathParams,
            headers: Object.fromEntries(req.headers.entries())
          };
          const result = await handler.getFuelShortageDetail(ctx, body);
          return new Response(JSON.stringify(result), {
            status: 200,
            headers: { "Content-Type": "application/json" }
          });
        } catch (err) {
          if (err instanceof ValidationError) {
            return new Response(JSON.stringify({ violations: err.violations }), {
              status: 400,
              headers: { "Content-Type": "application/json" }
            });
          }
          if (options?.onError) {
            return options.onError(err, req);
          }
          const message2 = err instanceof Error ? err.message : String(err);
          return new Response(JSON.stringify({ message: message2 }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
          });
        }
      }
    },
    {
      method: "GET",
      path: "/api/supply-chain/v1/list-energy-disruptions",
      handler: async (req) => {
        try {
          const pathParams = {};
          const url = new URL(req.url, "http://localhost");
          const params = url.searchParams;
          const body = {
            assetId: params.get("assetId") ?? "",
            assetType: params.get("assetType") ?? "",
            ongoingOnly: params.get("ongoingOnly") === "true"
          };
          if (options?.validateRequest) {
            const bodyViolations = options.validateRequest("listEnergyDisruptions", body);
            if (bodyViolations) {
              throw new ValidationError(bodyViolations);
            }
          }
          const ctx = {
            request: req,
            pathParams,
            headers: Object.fromEntries(req.headers.entries())
          };
          const result = await handler.listEnergyDisruptions(ctx, body);
          return new Response(JSON.stringify(result), {
            status: 200,
            headers: { "Content-Type": "application/json" }
          });
        } catch (err) {
          if (err instanceof ValidationError) {
            return new Response(JSON.stringify({ violations: err.violations }), {
              status: 400,
              headers: { "Content-Type": "application/json" }
            });
          }
          if (options?.onError) {
            return options.onError(err, req);
          }
          const message2 = err instanceof Error ? err.message : String(err);
          return new Response(JSON.stringify({ message: message2 }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
          });
        }
      }
    }
  ];
}

// server/worldmonitor/supply-chain/v1/get-shipping-rates.ts
init_redis();
var REDIS_CACHE_KEY = "supply_chain:shipping:v2";
async function getShippingRates(_ctx, _req) {
  try {
    const result = await getCachedJson(REDIS_CACHE_KEY, true);
    return result ?? { indices: [], fetchedAt: (/* @__PURE__ */ new Date()).toISOString(), upstreamUnavailable: true };
  } catch {
    return { indices: [], fetchedAt: (/* @__PURE__ */ new Date()).toISOString(), upstreamUnavailable: true };
  }
}

// server/worldmonitor/supply-chain/v1/get-chokepoint-status.ts
init_redis();

// server/_shared/constants.ts
var CHROME_UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
var yahooQueue = Promise.resolve();
var finnhubQueue = Promise.resolve();

// server/worldmonitor/maritime/v1/list-navigational-warnings.ts
init_redis();
var REDIS_CACHE_KEY2 = "maritime:navwarnings:v1";
var REDIS_CACHE_TTL = 3600;
var NGA_WARNINGS_URL = "https://msi.nga.mil/api/publications/broadcast-warn?output=json&status=A";
function parseNgaDate(dateStr) {
  if (!dateStr || typeof dateStr !== "string") return 0;
  const match = dateStr.match(/(\d{2})(\d{4})Z\s+([A-Z]{3})\s+(\d{4})/i);
  if (!match) return Date.parse(dateStr) || 0;
  const months = {
    JAN: 0,
    FEB: 1,
    MAR: 2,
    APR: 3,
    MAY: 4,
    JUN: 5,
    JUL: 6,
    AUG: 7,
    SEP: 8,
    OCT: 9,
    NOV: 10,
    DEC: 11
  };
  const day2 = parseInt(match[1], 10);
  const hours = parseInt(match[2].slice(0, 2), 10);
  const minutes = parseInt(match[2].slice(2, 4), 10);
  const month = months[match[3].toUpperCase()] ?? 0;
  const year2 = parseInt(match[4], 10);
  return Date.UTC(year2, month, day2, hours, minutes);
}
async function fetchNgaWarnings(area) {
  try {
    const response = await fetch(NGA_WARNINGS_URL, {
      headers: { Accept: "application/json", "User-Agent": CHROME_UA },
      signal: AbortSignal.timeout(15e3)
    });
    if (!response.ok) return [];
    const data = await response.json();
    const rawWarnings = Array.isArray(data) ? data : data?.broadcast_warn ?? [];
    let warnings = rawWarnings.map((w) => ({
      id: `${w.navArea || ""}-${w.msgYear || ""}-${w.msgNumber || ""}`,
      title: `NAVAREA ${w.navArea || ""} ${w.msgNumber || ""}/${w.msgYear || ""}`,
      text: w.text || "",
      area: `${w.navArea || ""}${w.subregion ? " " + w.subregion : ""}`,
      location: void 0,
      issuedAt: parseNgaDate(w.issueDate),
      expiresAt: 0,
      authority: w.authority || ""
    }));
    if (area) {
      const areaLower = area.toLowerCase();
      warnings = warnings.filter(
        (w) => w.area.toLowerCase().includes(areaLower) || w.text.toLowerCase().includes(areaLower)
      );
    }
    return warnings;
  } catch {
    return [];
  }
}
async function listNavigationalWarnings(_ctx, req) {
  try {
    const cacheKey = `${REDIS_CACHE_KEY2}:${req.area || "all"}`;
    const result = await cachedFetchJson(cacheKey, REDIS_CACHE_TTL, async () => {
      const warnings = await fetchNgaWarnings(req.area);
      return warnings.length > 0 ? { warnings, pagination: void 0 } : null;
    });
    return result || { warnings: [], pagination: void 0 };
  } catch {
    return { warnings: [], pagination: void 0 };
  }
}

// server/_shared/relay.ts
function getRelayBaseUrl() {
  const relayUrl = process.env.WS_RELAY_URL;
  if (!relayUrl) return null;
  return relayUrl.replace(/^ws(s?):\/\//, "http$1://").replace(/\/$/, "");
}
function getRelayHeaders(extra = {}) {
  const headers = {
    Accept: "application/json",
    "User-Agent": CHROME_UA,
    ...extra
  };
  const relaySecret = process.env.RELAY_SHARED_SECRET;
  if (!relaySecret) return headers;
  const relayHeader = (process.env.RELAY_AUTH_HEADER || "x-relay-key").toLowerCase();
  headers[relayHeader] = relaySecret;
  if (relayHeader !== "authorization") {
    headers.Authorization = `Bearer ${relaySecret}`;
  }
  return headers;
}

// server/worldmonitor/maritime/v1/get-vessel-snapshot.ts
var DISRUPTION_TYPE_MAP = {
  gap_spike: "AIS_DISRUPTION_TYPE_GAP_SPIKE",
  chokepoint_congestion: "AIS_DISRUPTION_TYPE_CHOKEPOINT_CONGESTION"
};
var SEVERITY_MAP = {
  low: "AIS_DISRUPTION_SEVERITY_LOW",
  elevated: "AIS_DISRUPTION_SEVERITY_ELEVATED",
  high: "AIS_DISRUPTION_SEVERITY_HIGH"
};
var SNAPSHOT_CACHE_TTL_BASE_MS = 3e5;
var SNAPSHOT_CACHE_TTL_LIVE_MS = 6e4;
function quantize(v) {
  return Math.floor(v);
}
var SNAPSHOT_CACHE_MAX_SLOTS = 128;
var cache2 = /* @__PURE__ */ new Map();
function touchSlot(key, slot) {
  cache2.delete(key);
  cache2.set(key, slot);
}
function evictIfNeeded() {
  if (cache2.size < SNAPSHOT_CACHE_MAX_SLOTS) return;
  for (const [k, s] of cache2) {
    if (s.inFlight === null) {
      cache2.delete(k);
      return;
    }
  }
}
function cacheKeyFor(includeCandidates, includeTankers, bbox) {
  const c = includeCandidates ? "1" : "0";
  const t = includeTankers ? "1" : "0";
  if (!bbox) return `${c}${t}|null`;
  const sl = quantize(bbox.swLat);
  const so = quantize(bbox.swLon);
  const nl = quantize(bbox.neLat);
  const no = quantize(bbox.neLon);
  return `${c}${t}|${sl},${so},${nl},${no}`;
}
function ttlFor(includeTankers, bbox) {
  return includeTankers || bbox ? SNAPSHOT_CACHE_TTL_LIVE_MS : SNAPSHOT_CACHE_TTL_BASE_MS;
}
async function fetchVesselSnapshot(includeCandidates, includeTankers, bbox) {
  const key = cacheKeyFor(includeCandidates, includeTankers, bbox);
  let slot = cache2.get(key);
  if (!slot) {
    evictIfNeeded();
    slot = { snapshot: void 0, timestamp: 0, inFlight: null };
    cache2.set(key, slot);
  }
  const now = Date.now();
  const ttl = ttlFor(includeTankers, bbox);
  if (slot.snapshot && now - slot.timestamp < ttl) {
    touchSlot(key, slot);
    return slot.snapshot;
  }
  if (slot.inFlight) {
    touchSlot(key, slot);
    return slot.inFlight;
  }
  slot.inFlight = fetchVesselSnapshotFromRelay(includeCandidates, includeTankers, bbox);
  try {
    const result = await slot.inFlight;
    if (result) {
      slot.snapshot = result;
      slot.timestamp = Date.now();
      touchSlot(key, slot);
    }
    return result ?? slot.snapshot;
  } finally {
    slot.inFlight = null;
  }
}
function toCandidateReport(raw) {
  if (!raw || typeof raw !== "object") return null;
  const mmsi = String(raw.mmsi ?? "");
  if (!mmsi) return null;
  const lat = Number(raw.lat);
  const lon = Number(raw.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  return {
    mmsi,
    name: String(raw.name ?? ""),
    lat,
    lon,
    shipType: Number.isFinite(Number(raw.shipType)) ? Number(raw.shipType) : 0,
    heading: Number.isFinite(Number(raw.heading)) ? Number(raw.heading) : 0,
    speed: Number.isFinite(Number(raw.speed)) ? Number(raw.speed) : 0,
    course: Number.isFinite(Number(raw.course)) ? Number(raw.course) : 0,
    timestamp: Number.isFinite(Number(raw.timestamp)) ? Number(raw.timestamp) : Date.now()
  };
}
async function fetchVesselSnapshotFromRelay(includeCandidates, includeTankers, bbox) {
  try {
    const relayBaseUrl = getRelayBaseUrl();
    if (!relayBaseUrl) return void 0;
    const params = new URLSearchParams();
    params.set("candidates", includeCandidates ? "true" : "false");
    if (includeTankers) params.set("tankers", "true");
    if (bbox) {
      const sl = quantize(bbox.swLat);
      const so = quantize(bbox.swLon);
      const nl = quantize(bbox.neLat);
      const no = quantize(bbox.neLon);
      params.set("bbox", `${sl},${so},${nl},${no}`);
    }
    const response = await fetch(
      `${relayBaseUrl}/ais/snapshot?${params.toString()}`,
      {
        headers: getRelayHeaders(),
        signal: AbortSignal.timeout(1e4)
      }
    );
    if (!response.ok) return void 0;
    const data = await response.json();
    if (!data || !Array.isArray(data.disruptions) || !Array.isArray(data.density)) {
      return void 0;
    }
    const densityZones = data.density.map((z) => ({
      id: String(z.id || ""),
      name: String(z.name || ""),
      location: {
        latitude: Number(z.lat) || 0,
        longitude: Number(z.lon) || 0
      },
      intensity: Number(z.intensity) || 0,
      deltaPct: Number(z.deltaPct) || 0,
      shipsPerDay: Number(z.shipsPerDay) || 0,
      note: String(z.note || "")
    }));
    const disruptions = data.disruptions.map((d) => ({
      id: String(d.id || ""),
      name: String(d.name || ""),
      type: DISRUPTION_TYPE_MAP[d.type] || "AIS_DISRUPTION_TYPE_UNSPECIFIED",
      location: {
        latitude: Number(d.lat) || 0,
        longitude: Number(d.lon) || 0
      },
      severity: SEVERITY_MAP[d.severity] || "AIS_DISRUPTION_SEVERITY_UNSPECIFIED",
      changePct: Number(d.changePct) || 0,
      windowHours: Number(d.windowHours) || 0,
      darkShips: Number(d.darkShips) || 0,
      vesselCount: Number(d.vesselCount) || 0,
      region: String(d.region || ""),
      description: String(d.description || "")
    }));
    const rawStatus = data.status && typeof data.status === "object" ? data.status : {};
    const candidateReports = includeCandidates && Array.isArray(data.candidateReports) ? data.candidateReports.map(toCandidateReport).filter((r) => r !== null) : [];
    const tankerReports = includeTankers && Array.isArray(data.tankerReports) ? data.tankerReports.map(toCandidateReport).filter((r) => r !== null) : [];
    return {
      snapshotAt: Date.now(),
      densityZones,
      disruptions,
      sequence: Number.isFinite(Number(data.sequence)) ? Number(data.sequence) : 0,
      status: {
        connected: Boolean(rawStatus.connected),
        vessels: Number.isFinite(Number(rawStatus.vessels)) ? Number(rawStatus.vessels) : 0,
        messages: Number.isFinite(Number(rawStatus.messages)) ? Number(rawStatus.messages) : 0
      },
      candidateReports,
      tankerReports
    };
  } catch {
    return void 0;
  }
}
var MAX_BBOX_DEGREES = 10;
var BboxValidationError = class extends Error {
  statusCode = 400;
  constructor(reason) {
    super(`bbox invalid: ${reason}`);
    this.name = "BboxValidationError";
  }
};
function isValidLatLon(lat, lon) {
  return Number.isFinite(lat) && Number.isFinite(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
}
function extractAndValidateBbox(req) {
  const sw = { lat: Number(req.swLat), lon: Number(req.swLon) };
  const ne = { lat: Number(req.neLat), lon: Number(req.neLon) };
  if (sw.lat === 0 && sw.lon === 0 && ne.lat === 0 && ne.lon === 0) {
    return null;
  }
  if (!isValidLatLon(sw.lat, sw.lon)) {
    throw new BboxValidationError("sw corner outside lat/lon domain (-90..90 / -180..180)");
  }
  if (!isValidLatLon(ne.lat, ne.lon)) {
    throw new BboxValidationError("ne corner outside lat/lon domain (-90..90 / -180..180)");
  }
  if (sw.lat > ne.lat || sw.lon > ne.lon) {
    throw new BboxValidationError("sw corner must be south-west of ne corner");
  }
  if (ne.lat - sw.lat > MAX_BBOX_DEGREES || ne.lon - sw.lon > MAX_BBOX_DEGREES) {
    throw new BboxValidationError(`each dimension must be \u2264 ${MAX_BBOX_DEGREES} degrees`);
  }
  return { swLat: sw.lat, swLon: sw.lon, neLat: ne.lat, neLon: ne.lon };
}
async function getVesselSnapshot(_ctx, req) {
  try {
    const bbox = extractAndValidateBbox(req);
    const snapshot = await fetchVesselSnapshot(
      Boolean(req.includeCandidates),
      Boolean(req.includeTankers),
      bbox
    );
    return {
      snapshot,
      fetchedAt: snapshot?.snapshotAt ?? 0,
      dataAvailable: Boolean(snapshot)
    };
  } catch (err) {
    if (err instanceof BboxValidationError) throw err;
    return { snapshot: void 0, fetchedAt: 0, dataAvailable: false };
  }
}

// server/worldmonitor/supply-chain/v1/_scoring.mjs
var SEVERITY_SCORE = {
  "AIS_DISRUPTION_SEVERITY_LOW": 1,
  "AIS_DISRUPTION_SEVERITY_ELEVATED": 2,
  "AIS_DISRUPTION_SEVERITY_HIGH": 3
};
var THREAT_LEVEL = {
  war_zone: 70,
  critical: 40,
  high: 30,
  elevated: 15,
  normal: 0
};
function warningComponent(warningCount) {
  return Math.min(15, warningCount * 5);
}
function aisComponent(maxCongestionSeverity) {
  return Math.min(15, maxCongestionSeverity * 5);
}
function computeDisruptionScore(threatLevel, warningCount, maxCongestionSeverity) {
  return Math.min(100, threatLevel + warningComponent(warningCount) + aisComponent(maxCongestionSeverity));
}
function scoreToStatus(score) {
  if (score < 20) return "green";
  if (score < 50) return "yellow";
  return "red";
}
function computeHHI(shares) {
  if (!shares || shares.length === 0) return 0;
  return shares.reduce((sum, s) => sum + s * s, 0);
}
function riskRating(hhi) {
  if (hhi >= 5e3) return "critical";
  if (hhi >= 2500) return "high";
  if (hhi >= 1500) return "moderate";
  return "low";
}

// server/worldmonitor/supply-chain/v1/_insurance-tier.ts
function warRiskTierToInsurancePremiumBps(tier) {
  switch (tier) {
    case "WAR_RISK_TIER_WAR_ZONE":
      return 300;
    case "WAR_RISK_TIER_CRITICAL":
      return 100;
    case "WAR_RISK_TIER_HIGH":
      return 50;
    case "WAR_RISK_TIER_ELEVATED":
      return 20;
    default:
      return 5;
  }
}
function threatLevelToWarRiskTier(tl) {
  switch (tl) {
    case "war_zone":
      return "WAR_RISK_TIER_WAR_ZONE";
    case "critical":
      return "WAR_RISK_TIER_CRITICAL";
    case "high":
      return "WAR_RISK_TIER_HIGH";
    case "elevated":
      return "WAR_RISK_TIER_ELEVATED";
    case "normal":
      return "WAR_RISK_TIER_NORMAL";
    default: {
      /* @__PURE__ */ ((_) => {
      })(tl);
      return "WAR_RISK_TIER_NORMAL";
    }
  }
}
var TIER_RANK = {
  WAR_RISK_TIER_WAR_ZONE: 5,
  WAR_RISK_TIER_CRITICAL: 4,
  WAR_RISK_TIER_HIGH: 3,
  WAR_RISK_TIER_ELEVATED: 2,
  WAR_RISK_TIER_NORMAL: 1,
  WAR_RISK_TIER_UNSPECIFIED: 0
};

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
var SPR_POLICIES_KEY = "energy:spr-policies:v1";
var PIPELINES_GAS_KEY = "energy:pipelines:gas:v1";
var PIPELINES_OIL_KEY = "energy:pipelines:oil:v1";
var STORAGE_FACILITIES_KEY = "energy:storage-facilities:v1";
var FUEL_SHORTAGES_KEY = "energy:fuel-shortages:v1";
var ENERGY_DISRUPTIONS_KEY = "energy:disruptions:v1";
var CHOKEPOINT_EXPOSURE_KEY = (iso2, hs2) => `supply-chain:exposure:${iso2}:${hs2}:v1`;
var COST_SHOCK_KEY = (iso2, chokepointId) => `supply-chain:cost-shock:${iso2}:${chokepointId}:v1`;
var SECTOR_DEPENDENCY_KEY = (iso2, hs2) => `supply-chain:sector-dep:${iso2}:${hs2}:v1`;
var ROUTE_EXPLORER_LANE_KEY = (fromIso2, toIso2, hs2, cargoType) => `supply-chain:route-explorer-lane:${fromIso2}:${toIso2}:${hs2}:${cargoType}:v1`;
var ROUTE_IMPACT_KEY = (fromIso2, toIso2, hs2) => `supply-chain:route-impact:${fromIso2}:${toIso2}:${hs2}:v1`;
var CHOKEPOINT_STATUS_KEY = "supply_chain:chokepoints:v4";

// server/worldmonitor/supply-chain/v1/get-chokepoint-status.ts
var TRANSIT_SUMMARIES_KEY = "supply_chain:transit-summaries:v1";
var FLOWS_KEY = "energy:chokepoint-flows:v1";
var REDIS_CACHE_TTL2 = 300;
var THREAT_CONFIG_MAX_AGE_DAYS = 120;
var NEARBY_CHOKEPOINT_RADIUS_KM = 300;
var THREAT_CONFIG_STALE_NOTE = `Threat baseline last reviewed > ${THREAT_CONFIG_MAX_AGE_DAYS} days ago \u2014 review recommended`;
var THREAT_CONFIG_LAST_REVIEWED = "2026-03-04";
var CHOKEPOINTS = [
  { id: "suez", name: "Suez Canal", lat: 30.45, lon: 32.35, primaryKeywords: ["suez canal", "suez"], areaKeywords: ["suez canal", "suez", "gulf of suez", "red sea"], routes: ["China-Europe (Suez)", "Gulf-Europe Oil", "Qatar LNG-Europe"], threatLevel: "high", threatDescription: "JWC Listed Area \u2014 adjacent to active Red Sea conflict and Iran-Israel war spillover", directions: ["northbound", "southbound"] },
  { id: "malacca_strait", name: "Strait of Malacca", lat: 2.5, lon: 101.5, primaryKeywords: ["strait of malacca", "malacca"], areaKeywords: ["strait of malacca", "malacca", "singapore strait"], routes: ["China-Middle East Oil", "China-Europe (via Suez)", "Japan-Middle East Oil"], threatLevel: "normal", threatDescription: "", directions: ["northbound", "southbound"] },
  { id: "hormuz_strait", name: "Strait of Hormuz", lat: 26.56, lon: 56.25, primaryKeywords: ["strait of hormuz", "hormuz"], areaKeywords: ["strait of hormuz", "hormuz", "persian gulf", "arabian gulf", "gulf of oman", "iran naval", "iran military"], routes: ["Gulf Oil Exports", "Qatar LNG", "Iran Exports"], threatLevel: "war_zone", threatDescription: "Active conflict \u2014 Iran-Israel war; Iranian naval blockade risk and mines reported in Persian Gulf", directions: ["eastbound", "westbound"] },
  { id: "bab_el_mandeb", name: "Bab el-Mandeb", lat: 12.58, lon: 43.33, primaryKeywords: ["bab el-mandeb", "bab al-mandab"], areaKeywords: ["bab el-mandeb", "bab al-mandab", "mandeb", "aden", "houthi", "yemen", "gulf of aden", "red sea"], routes: ["Suez-Indian Ocean", "Gulf-Europe Oil", "Red Sea Transit"], threatLevel: "critical", threatDescription: "JWC Listed Area \u2014 active Houthi attacks on commercial shipping", directions: ["northbound", "southbound"] },
  { id: "panama", name: "Panama Canal", lat: 9.08, lon: -79.68, primaryKeywords: ["panama canal"], areaKeywords: ["panama canal", "panama"], routes: ["US East Coast-Asia", "US East Coast-South America", "Atlantic-Pacific Bulk"], threatLevel: "normal", threatDescription: "", directions: ["northbound", "southbound"] },
  { id: "taiwan_strait", name: "Taiwan Strait", lat: 24, lon: 119.5, primaryKeywords: ["taiwan strait", "formosa"], areaKeywords: ["taiwan strait", "formosa", "taiwan", "south china sea"], routes: ["China-Japan Trade", "Korea-Southeast Asia", "Pacific Semiconductor"], threatLevel: "elevated", threatDescription: "Cross-strait military tensions and PLA exercises", directions: ["northbound", "southbound"] },
  { id: "cape_of_good_hope", name: "Cape of Good Hope", lat: -34.36, lon: 18.49, primaryKeywords: ["cape of good hope", "good hope"], areaKeywords: ["cape of good hope", "good hope", "cape town", "south africa", "cape agulhas"], routes: ["Asia-Europe (Cape Route)", "Gulf-Americas Oil", "Suez Bypass"], threatLevel: "normal", threatDescription: "", directions: ["eastbound", "westbound"] },
  { id: "gibraltar", name: "Strait of Gibraltar", lat: 35.96, lon: -5.35, primaryKeywords: ["strait of gibraltar", "gibraltar"], areaKeywords: ["strait of gibraltar", "gibraltar", "mediterranean", "algeciras", "tangier"], routes: ["Atlantic-Mediterranean", "Gulf-Europe Oil (final leg)", "India-Europe"], threatLevel: "normal", threatDescription: "", directions: ["eastbound", "westbound"] },
  { id: "bosphorus", name: "Bosporus Strait", lat: 41.12, lon: 29.05, primaryKeywords: ["bosphorus", "bosporus", "dardanelles", "canakkale", "turkish straits"], areaKeywords: ["bosphorus", "bosporus", "dardanelles", "canakkale", "istanbul", "marmara", "black sea", "turkish straits", "gallipoli", "aegean"], routes: ["Russia Black Sea Exports", "Ukraine Grain", "Caspian Oil Transit", "Aegean-Marmara Transit"], threatLevel: "elevated", threatDescription: "Montreux Convention restrictions; elevated due to Russia-Ukraine war and periodic Turkish traffic controls", directions: ["northbound", "southbound"] },
  { id: "korea_strait", name: "Korea Strait", lat: 34, lon: 129, primaryKeywords: ["korea strait", "tsushima strait"], areaKeywords: ["korea strait", "tsushima", "busan", "shimonoseki", "sea of japan", "east sea"], routes: ["Japan-Korea Trade", "China-Japan (alternate)", "Pacific-East Asia"], threatLevel: "normal", threatDescription: "", directions: ["northbound", "southbound"] },
  { id: "dover_strait", name: "Dover Strait", lat: 51.05, lon: 1.45, primaryKeywords: ["dover strait", "strait of dover", "english channel"], areaKeywords: ["dover", "calais", "english channel", "north sea", "pas-de-calais"], routes: ["North Sea-Atlantic", "Europe Intra-Trade", "UK-Continental Europe"], threatLevel: "normal", threatDescription: "", directions: ["northbound", "southbound"] },
  { id: "kerch_strait", name: "Kerch Strait", lat: 45.33, lon: 36.6, primaryKeywords: ["kerch strait", "kerch bridge"], areaKeywords: ["kerch", "crimea", "azov", "sea of azov", "black sea"], routes: ["Ukraine Grain (Azov)", "Russia Azov Ports", "Crimea Supply"], threatLevel: "war_zone", threatDescription: "Active conflict zone; Russia controls Kerch Bridge; Ukraine grain exports via Azov severely restricted", directions: ["northbound", "southbound"] },
  { id: "lombok_strait", name: "Lombok Strait", lat: -8.47, lon: 115.72, primaryKeywords: ["lombok strait"], areaKeywords: ["lombok", "bali", "indonesia", "nusa tenggara"], routes: ["Malacca Bypass (VLCCs)", "Australia-Asia", "Indian Ocean-Pacific"], threatLevel: "normal", threatDescription: "", directions: ["northbound", "southbound"] }
];
function normalizeText(input) {
  return input.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}
function containsPhrase(normalizedHaystack, keyword) {
  const normalizedKeyword = normalizeText(keyword);
  if (!normalizedKeyword) return false;
  return ` ${normalizedHaystack} `.includes(` ${normalizedKeyword} `);
}
function haversineKm(aLat, aLon, bLat, bLon) {
  const toRad = (deg) => deg * Math.PI / 180;
  const dLat = toRad(bLat - aLat);
  const dLon = toRad(bLon - aLon);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLon / 2) ** 2;
  return 6371 * (2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x)));
}
function nearestChokepoint(location2) {
  if (!location2) return null;
  let closest = null;
  for (const cp of CHOKEPOINTS) {
    const distanceKm = haversineKm(location2.latitude, location2.longitude, cp.lat, cp.lon);
    if (!closest || distanceKm < closest.distanceKm) {
      closest = { id: cp.id, distanceKm };
    }
  }
  return closest;
}
function keywordScore(cp, normalizedText) {
  if (!normalizedText) return 0;
  const primaryMatches = cp.primaryKeywords.filter((kw) => containsPhrase(normalizedText, kw));
  const primarySet = new Set(primaryMatches.map(normalizeText));
  const areaMatches = cp.areaKeywords.filter((kw) => {
    const normalizedKw = normalizeText(kw);
    return !primarySet.has(normalizedKw) && containsPhrase(normalizedText, kw);
  });
  if (primaryMatches.length === 0 && areaMatches.length < 2) return 0;
  return primaryMatches.length * 3 + areaMatches.length;
}
function resolveChokepointId(input) {
  const normalizedText = normalizeText(input.text);
  let best = null;
  for (const cp of CHOKEPOINTS) {
    const score = keywordScore(cp, normalizedText);
    if (score <= 0) continue;
    const distanceKm = input.location ? haversineKm(input.location.latitude, input.location.longitude, cp.lat, cp.lon) : Number.POSITIVE_INFINITY;
    if (!best || score > best.score || score === best.score && distanceKm < best.distanceKm) {
      best = { id: cp.id, score, distanceKm };
    }
  }
  if (best) return best.id;
  const nearest = nearestChokepoint(input.location);
  if (nearest && nearest.distanceKm <= NEARBY_CHOKEPOINT_RADIUS_KM) {
    return nearest.id;
  }
  return null;
}
function groupWarningsByChokepoint(warnings) {
  const grouped = /* @__PURE__ */ new Map();
  for (const cp of CHOKEPOINTS) grouped.set(cp.id, []);
  for (const warning of warnings) {
    const id = resolveChokepointId({
      text: `${warning.title} ${warning.area} ${warning.text}`,
      location: warning.location
    });
    if (!id) continue;
    grouped.get(id).push(warning);
  }
  return grouped;
}
function groupDisruptionsByChokepoint(disruptions) {
  const grouped = /* @__PURE__ */ new Map();
  for (const cp of CHOKEPOINTS) grouped.set(cp.id, []);
  for (const disruption of disruptions) {
    if (disruption.type !== "AIS_DISRUPTION_TYPE_CHOKEPOINT_CONGESTION") continue;
    const id = resolveChokepointId({
      text: `${disruption.name} ${disruption.region} ${disruption.description}`,
      location: disruption.location
    });
    if (!id) continue;
    grouped.get(id).push(disruption);
  }
  return grouped;
}
function isThreatConfigFresh(asOfMs = Date.now()) {
  const reviewedAtMs = Date.parse(THREAT_CONFIG_LAST_REVIEWED);
  if (!Number.isFinite(reviewedAtMs)) return false;
  const maxAgeMs = THREAT_CONFIG_MAX_AGE_DAYS * 24 * 60 * 60 * 1e3;
  return asOfMs - reviewedAtMs <= maxAgeMs;
}
function makeInternalCtx() {
  return { request: new Request("http://internal"), pathParams: {}, headers: {} };
}
async function fetchChokepointData() {
  const ctx = makeInternalCtx();
  let navFailed = false;
  let vesselFailed = false;
  const [navResult, vesselResult, transitSummariesData, flowsData] = await Promise.all([
    listNavigationalWarnings(ctx, { area: "", pageSize: 0, cursor: "" }).catch(() => {
      navFailed = true;
      return { warnings: [], pagination: void 0 };
    }),
    // All-zero bbox = "no filter, full snapshot" per the new bbox extractor
    // in get-vessel-snapshot.ts. Previously this passed (-90, -180, 90, 180)
    // because the handler ignored bbox entirely; the new 10° max-bbox guard
    // (added for the live-tanker contract) would reject that range. This
    // call doesn't need bbox filtering — it wants the global density +
    // disruption surface — so pass zeros and skip both candidate and tanker
    // payload tiers.
    getVesselSnapshot(ctx, { neLat: 0, neLon: 0, swLat: 0, swLon: 0, includeCandidates: false, includeTankers: false }).catch(() => {
      vesselFailed = true;
      return { snapshot: void 0, fetchedAt: 0, dataAvailable: false };
    }),
    getCachedJson(TRANSIT_SUMMARIES_KEY, true).catch(() => null),
    getCachedJson(FLOWS_KEY, true).catch(() => null)
  ]);
  const summaries = transitSummariesData?.summaries ?? {};
  const transitSummariesMissing = Object.keys(summaries).length === 0;
  const warnings = navResult.warnings || [];
  const disruptions = vesselResult.snapshot?.disruptions || [];
  const upstreamUnavailable = transitSummariesMissing || navFailed && vesselFailed || navFailed && disruptions.length === 0 || vesselFailed && warnings.length === 0;
  const warningsByChokepoint = groupWarningsByChokepoint(warnings);
  const disruptionsByChokepoint = groupDisruptionsByChokepoint(disruptions);
  const threatConfigFresh = isThreatConfigFresh();
  const chokepoints = CHOKEPOINTS.map((cp) => {
    const matchedWarnings = warningsByChokepoint.get(cp.id) ?? [];
    const matchedDisruptions = disruptionsByChokepoint.get(cp.id) ?? [];
    const maxSeverity = matchedDisruptions.reduce((max, d) => {
      const score = SEVERITY_SCORE[d.severity] ?? 0;
      return Math.max(max, score);
    }, 0);
    const threatScore = THREAT_LEVEL[cp.threatLevel] ?? 0;
    const ts = summaries[cp.id];
    const anomaly = ts?.anomaly ?? { dropPct: 0, signal: false };
    const anomalyBonus = anomaly.signal ? 10 : 0;
    const disruptionScore = Math.min(100, computeDisruptionScore(threatScore, matchedWarnings.length, maxSeverity) + anomalyBonus);
    const status = scoreToStatus(disruptionScore);
    const congestionLevel = maxSeverity >= 3 ? "high" : maxSeverity >= 2 ? "elevated" : maxSeverity >= 1 ? "low" : "normal";
    const descriptions = [];
    if (cp.threatDescription) {
      descriptions.push(cp.threatDescription);
    }
    if (anomaly.signal) {
      descriptions.push(`Traffic down ${anomaly.dropPct}% vs 30-day baseline, vessels may be transiting dark (AIS off)`);
    }
    if (!threatConfigFresh) {
      descriptions.push(THREAT_CONFIG_STALE_NOTE);
    }
    if (descriptions.length === 0) {
      descriptions.push("No active disruptions");
    }
    return {
      id: cp.id,
      name: cp.name,
      lat: cp.lat,
      lon: cp.lon,
      disruptionScore,
      status,
      activeWarnings: matchedWarnings.length,
      aisDisruptions: matchedDisruptions.length,
      congestionLevel,
      affectedRoutes: cp.routes,
      description: descriptions.join("; "),
      directions: cp.directions,
      directionalDwt: [],
      transitSummary: ts ? {
        todayTotal: ts.todayTotal,
        todayTanker: ts.todayTanker,
        todayCargo: ts.todayCargo,
        todayOther: ts.todayOther,
        wowChangePct: ts.wowChangePct,
        // History is served separately by GetChokepointHistory (lazy-loaded on
        // card expand) — field stays declared for proto compat but is empty
        // on the main status response.
        history: [],
        riskLevel: ts.riskLevel,
        incidentCount7d: ts.incidentCount7d,
        disruptionPct: ts.disruptionPct,
        riskSummary: ts.riskSummary,
        riskReportAction: ts.riskReportAction,
        // Default true for pre-fix writers (absence = covered). New writers
        // explicitly emit false for canonical zero-state fills.
        dataAvailable: ts.dataAvailable ?? true
      } : { todayTotal: 0, todayTanker: 0, todayCargo: 0, todayOther: 0, wowChangePct: 0, history: [], riskLevel: "", incidentCount7d: 0, disruptionPct: 0, riskSummary: "", riskReportAction: "", dataAvailable: false },
      flowEstimate: flowsData?.[cp.id] ? {
        currentMbd: flowsData[cp.id].currentMbd,
        baselineMbd: flowsData[cp.id].baselineMbd,
        flowRatio: flowsData[cp.id].flowRatio,
        disrupted: flowsData[cp.id].disrupted,
        source: flowsData[cp.id].source,
        hazardAlertLevel: flowsData[cp.id].hazardAlertLevel ?? "",
        hazardAlertName: flowsData[cp.id].hazardAlertName ?? ""
      } : void 0,
      warRiskTier: threatLevelToWarRiskTier(cp.threatLevel)
    };
  });
  return { chokepoints, upstreamUnavailable };
}
async function getChokepointStatus(_ctx, _req) {
  try {
    const result = await cachedFetchJson(
      CHOKEPOINT_STATUS_KEY,
      REDIS_CACHE_TTL2,
      async () => {
        const { chokepoints, upstreamUnavailable } = await fetchChokepointData();
        if (upstreamUnavailable) return null;
        const coveredCount = chokepoints.filter((c) => c.transitSummary?.dataAvailable !== false).length;
        const partialCoverage = coveredCount < chokepoints.length;
        const response = {
          chokepoints,
          fetchedAt: (/* @__PURE__ */ new Date()).toISOString(),
          upstreamUnavailable: upstreamUnavailable || partialCoverage
        };
        setCachedJson("seed-meta:supply_chain:chokepoints", { fetchedAt: Date.now(), recordCount: coveredCount }, 604800).catch(() => {
        });
        return response;
      }
    );
    return result ?? { chokepoints: [], fetchedAt: "", upstreamUnavailable: true };
  } catch {
    return { chokepoints: [], fetchedAt: "", upstreamUnavailable: true };
  }
}

// server/worldmonitor/supply-chain/v1/get-chokepoint-history.ts
init_redis();

// src/config/chokepoint-registry.ts
var CHOKEPOINT_REGISTRY = [
  {
    id: "suez",
    displayName: "Suez Canal",
    geoId: "suez",
    relayName: "Suez Canal",
    portwatchName: "Suez Canal",
    corridorRiskName: "Suez",
    baselineId: "suez",
    shockModelSupported: true,
    routeIds: ["china-europe-suez", "china-us-east-suez", "gulf-europe-oil", "qatar-europe-lng", "singapore-med", "india-europe"],
    lat: 30.5,
    lon: 32.3
  },
  {
    id: "malacca_strait",
    displayName: "Strait of Malacca",
    geoId: "malacca_strait",
    relayName: "Malacca Strait",
    portwatchName: "Malacca Strait",
    corridorRiskName: "Malacca",
    baselineId: "malacca",
    shockModelSupported: true,
    routeIds: ["china-europe-suez", "china-us-east-suez", "gulf-asia-oil", "qatar-asia-lng", "india-se-asia", "china-africa", "cpec-route"],
    lat: 2.5,
    lon: 101.5
  },
  {
    id: "hormuz_strait",
    displayName: "Strait of Hormuz",
    geoId: "hormuz_strait",
    relayName: "Strait of Hormuz",
    portwatchName: "Strait of Hormuz",
    corridorRiskName: "Hormuz",
    baselineId: "hormuz",
    shockModelSupported: true,
    routeIds: ["gulf-europe-oil", "gulf-asia-oil", "qatar-europe-lng", "qatar-asia-lng", "gulf-americas-cape"],
    lat: 26.5,
    lon: 56.5
  },
  {
    id: "bab_el_mandeb",
    displayName: "Bab el-Mandeb",
    geoId: "bab_el_mandeb",
    relayName: "Bab el-Mandeb Strait",
    portwatchName: "Bab el-Mandeb Strait",
    corridorRiskName: "Bab el-Mandeb",
    baselineId: "babelm",
    shockModelSupported: true,
    routeIds: ["china-europe-suez", "china-us-east-suez", "gulf-europe-oil", "qatar-europe-lng", "singapore-med", "india-europe"],
    lat: 12.5,
    lon: 43.3
  },
  {
    id: "panama",
    displayName: "Panama Canal",
    geoId: "panama",
    relayName: "Panama Canal",
    portwatchName: "Panama Canal",
    corridorRiskName: "Panama",
    baselineId: "panama",
    shockModelSupported: false,
    routeIds: ["china-us-east-panama", "panama-transit"],
    lat: 9.1,
    lon: -79.7
  },
  {
    id: "taiwan_strait",
    displayName: "Taiwan Strait",
    geoId: "taiwan_strait",
    relayName: "Taiwan Strait",
    portwatchName: "Taiwan Strait",
    corridorRiskName: "Taiwan",
    baselineId: null,
    shockModelSupported: false,
    routeIds: ["china-us-west", "intra-asia-container"],
    lat: 24,
    lon: 119.5
  },
  {
    id: "cape_of_good_hope",
    displayName: "Cape of Good Hope",
    geoId: "cape_of_good_hope",
    relayName: "Cape of Good Hope",
    portwatchName: "Cape of Good Hope",
    corridorRiskName: "Cape of Good Hope",
    baselineId: null,
    shockModelSupported: false,
    routeIds: ["brazil-china-bulk", "gulf-americas-cape", "asia-europe-cape"],
    lat: -34.36,
    lon: 18.49
  },
  {
    id: "gibraltar",
    displayName: "Strait of Gibraltar",
    geoId: "gibraltar",
    relayName: "Gibraltar Strait",
    portwatchName: "Gibraltar Strait",
    corridorRiskName: null,
    baselineId: null,
    shockModelSupported: false,
    routeIds: ["gulf-europe-oil", "singapore-med", "india-europe", "asia-europe-cape"],
    lat: 35.9,
    lon: -5.6
  },
  {
    id: "bosphorus",
    displayName: "Bosporus Strait",
    geoId: "bosphorus",
    relayName: "Bosporus Strait",
    portwatchName: "Bosporus Strait",
    corridorRiskName: null,
    baselineId: "turkish",
    shockModelSupported: false,
    routeIds: ["russia-med-oil"],
    lat: 41.1,
    lon: 29
  },
  {
    id: "korea_strait",
    displayName: "Korea Strait",
    geoId: "korea_strait",
    relayName: "Korea Strait",
    portwatchName: "Korea Strait",
    corridorRiskName: null,
    baselineId: null,
    shockModelSupported: false,
    routeIds: [],
    lat: 34,
    lon: 129
  },
  {
    id: "dover_strait",
    displayName: "Dover Strait",
    geoId: "dover_strait",
    relayName: "Dover Strait",
    portwatchName: "Dover Strait",
    corridorRiskName: null,
    baselineId: "danish",
    shockModelSupported: false,
    routeIds: [],
    lat: 51,
    lon: 1.5
  },
  {
    id: "kerch_strait",
    displayName: "Kerch Strait",
    geoId: "kerch_strait",
    relayName: "Kerch Strait",
    portwatchName: "Kerch Strait",
    corridorRiskName: null,
    baselineId: null,
    shockModelSupported: false,
    routeIds: [],
    lat: 45.3,
    lon: 36.6
  },
  {
    id: "lombok_strait",
    displayName: "Lombok Strait",
    geoId: "lombok_strait",
    relayName: "Lombok Strait",
    portwatchName: "Lombok Strait",
    corridorRiskName: null,
    baselineId: null,
    shockModelSupported: false,
    routeIds: [],
    lat: -8.5,
    lon: 115.7
  }
];
var CANONICAL_CHOKEPOINT_IDS = new Set(CHOKEPOINT_REGISTRY.map((c) => c.id));
var SHOCK_MODEL_CHOKEPOINTS = CHOKEPOINT_REGISTRY.filter((c) => c.shockModelSupported);

// server/worldmonitor/supply-chain/v1/_chokepoint-ids.ts
var CANONICAL_CHOKEPOINTS = CHOKEPOINT_REGISTRY.map(
  (c) => ({
    id: c.id,
    relayName: c.relayName,
    portwatchName: c.portwatchName,
    corridorRiskName: c.corridorRiskName,
    baselineId: c.baselineId
  })
);

// server/worldmonitor/supply-chain/v1/get-chokepoint-history.ts
var HISTORY_KEY_PREFIX = "supply_chain:transit-summaries:history:v1:";
var VALID_IDS = new Set(CANONICAL_CHOKEPOINTS.map((c) => c.id));
async function getChokepointHistory(ctx, req) {
  const id = String(req.chokepointId || "").trim();
  if (!id || !VALID_IDS.has(id)) {
    markNoCacheResponse(ctx.request);
    return { chokepointId: "", history: [], fetchedAt: "0" };
  }
  try {
    const payload = await getCachedJson(`${HISTORY_KEY_PREFIX}${id}`, true);
    if (!payload || !Array.isArray(payload.history) || payload.history.length === 0) {
      markNoCacheResponse(ctx.request);
      return { chokepointId: id, history: [], fetchedAt: "0" };
    }
    return {
      chokepointId: id,
      history: payload.history,
      fetchedAt: String(payload.fetchedAt ?? 0)
    };
  } catch {
    markNoCacheResponse(ctx.request);
    return { chokepointId: id, history: [], fetchedAt: "0" };
  }
}

// server/worldmonitor/supply-chain/v1/get-critical-minerals.ts
init_redis();

// server/worldmonitor/supply-chain/v1/_minerals-data.ts
var MINERAL_PRODUCTION_2024 = [
  // Lithium (tonnes LCE)
  { mineral: "Lithium", country: "Australia", countryCode: "AU", productionTonnes: 86e3, unit: "tonnes LCE" },
  { mineral: "Lithium", country: "Chile", countryCode: "CL", productionTonnes: 44e3, unit: "tonnes LCE" },
  { mineral: "Lithium", country: "China", countryCode: "CN", productionTonnes: 33e3, unit: "tonnes LCE" },
  { mineral: "Lithium", country: "Argentina", countryCode: "AR", productionTonnes: 9600, unit: "tonnes LCE" },
  // Cobalt (tonnes)
  { mineral: "Cobalt", country: "DRC", countryCode: "CD", productionTonnes: 13e4, unit: "tonnes" },
  { mineral: "Cobalt", country: "Indonesia", countryCode: "ID", productionTonnes: 17e3, unit: "tonnes" },
  { mineral: "Cobalt", country: "Russia", countryCode: "RU", productionTonnes: 8900, unit: "tonnes" },
  { mineral: "Cobalt", country: "Australia", countryCode: "AU", productionTonnes: 5600, unit: "tonnes" },
  // Rare Earths (tonnes REO)
  { mineral: "Rare Earths", country: "China", countryCode: "CN", productionTonnes: 24e4, unit: "tonnes REO" },
  { mineral: "Rare Earths", country: "Myanmar", countryCode: "MM", productionTonnes: 38e3, unit: "tonnes REO" },
  { mineral: "Rare Earths", country: "USA", countryCode: "US", productionTonnes: 43e3, unit: "tonnes REO" },
  { mineral: "Rare Earths", country: "Australia", countryCode: "AU", productionTonnes: 18e3, unit: "tonnes REO" },
  // Gallium (tonnes)
  { mineral: "Gallium", country: "China", countryCode: "CN", productionTonnes: 600, unit: "tonnes" },
  { mineral: "Gallium", country: "Japan", countryCode: "JP", productionTonnes: 10, unit: "tonnes" },
  { mineral: "Gallium", country: "South Korea", countryCode: "KR", productionTonnes: 8, unit: "tonnes" },
  { mineral: "Gallium", country: "Russia", countryCode: "RU", productionTonnes: 5, unit: "tonnes" },
  // Germanium (tonnes)
  { mineral: "Germanium", country: "China", countryCode: "CN", productionTonnes: 95, unit: "tonnes" },
  { mineral: "Germanium", country: "Belgium", countryCode: "BE", productionTonnes: 15, unit: "tonnes" },
  { mineral: "Germanium", country: "Canada", countryCode: "CA", productionTonnes: 9, unit: "tonnes" },
  { mineral: "Germanium", country: "Russia", countryCode: "RU", productionTonnes: 5, unit: "tonnes" }
];

// server/worldmonitor/supply-chain/v1/get-critical-minerals.ts
var REDIS_CACHE_KEY3 = "supply_chain:minerals:v2";
var REDIS_CACHE_TTL3 = 86400;
function buildMineralsData() {
  const byMineral = /* @__PURE__ */ new Map();
  for (const entry of MINERAL_PRODUCTION_2024) {
    const existing = byMineral.get(entry.mineral) || [];
    existing.push(entry);
    byMineral.set(entry.mineral, existing);
  }
  const minerals = [];
  for (const [mineral, entries] of byMineral) {
    const globalProduction = entries.reduce((sum, e) => sum + e.productionTonnes, 0);
    const unit = entries[0]?.unit || "tonnes";
    const producers = entries.sort((a, b) => b.productionTonnes - a.productionTonnes).slice(0, 3).map((e) => ({
      country: e.country,
      countryCode: e.countryCode,
      productionTonnes: e.productionTonnes,
      sharePct: globalProduction > 0 ? e.productionTonnes / globalProduction * 100 : 0
    }));
    const shares = entries.map((e) => globalProduction > 0 ? e.productionTonnes / globalProduction * 100 : 0);
    const hhi = computeHHI(shares);
    minerals.push({
      mineral,
      topProducers: producers,
      hhi,
      riskRating: riskRating(hhi),
      globalProduction,
      unit
    });
  }
  return minerals.sort((a, b) => b.hhi - a.hhi);
}
async function getCriticalMinerals(_ctx, _req) {
  try {
    const result = await cachedFetchJson(
      REDIS_CACHE_KEY3,
      REDIS_CACHE_TTL3,
      async () => {
        const minerals = buildMineralsData();
        return { minerals, fetchedAt: (/* @__PURE__ */ new Date()).toISOString(), upstreamUnavailable: false };
      }
    );
    return result ?? { minerals: [], fetchedAt: (/* @__PURE__ */ new Date()).toISOString(), upstreamUnavailable: true };
  } catch {
    return { minerals: [], fetchedAt: (/* @__PURE__ */ new Date()).toISOString(), upstreamUnavailable: true };
  }
}

// server/worldmonitor/supply-chain/v1/get-shipping-stress.ts
init_redis();
var REDIS_KEY = "supply_chain:shipping_stress:v1";
var getShippingStress = async (_ctx, _req) => {
  const data = await getCachedJson(REDIS_KEY, true);
  return data ?? { carriers: [], stressScore: 0, stressLevel: "low", fetchedAt: 0, upstreamUnavailable: true };
};

// server/worldmonitor/supply-chain/v1/get-country-chokepoint-index.ts
init_redis();

// server/_shared/premium-check.ts
init_auth_session();
init_user_api_key();
async function isCallerPremium(_request) {
  return true;
}

// server/worldmonitor/supply-chain/v1/_bilateral-hs4-lazy.ts
init_redis();

// scripts/shared/un-to-iso2.json
var un_to_iso2_default = {
  "004": "AF",
  "008": "AL",
  "010": "AQ",
  "012": "DZ",
  "016": "AS",
  "020": "AD",
  "024": "AO",
  "028": "AG",
  "031": "AZ",
  "032": "AR",
  "036": "AU",
  "040": "AT",
  "044": "BS",
  "048": "BH",
  "050": "BD",
  "051": "AM",
  "052": "BB",
  "056": "BE",
  "060": "BM",
  "064": "BT",
  "068": "BO",
  "070": "BA",
  "072": "BW",
  "076": "BR",
  "084": "BZ",
  "086": "IO",
  "090": "SB",
  "092": "VG",
  "096": "BN",
  "100": "BG",
  "104": "MM",
  "108": "BI",
  "112": "BY",
  "116": "KH",
  "120": "CM",
  "124": "CA",
  "132": "CV",
  "136": "KY",
  "140": "CF",
  "144": "LK",
  "148": "TD",
  "152": "CL",
  "156": "CN",
  "158": "TW",
  "170": "CO",
  "174": "KM",
  "178": "CG",
  "180": "CD",
  "184": "CK",
  "188": "CR",
  "191": "HR",
  "192": "CU",
  "196": "CY",
  "203": "CZ",
  "204": "BJ",
  "208": "DK",
  "212": "DM",
  "214": "DO",
  "218": "EC",
  "222": "SV",
  "226": "GQ",
  "231": "ET",
  "232": "ER",
  "233": "EE",
  "234": "FO",
  "238": "FK",
  "239": "GS",
  "242": "FJ",
  "246": "FI",
  "248": "AX",
  "250": "FR",
  "258": "PF",
  "260": "TF",
  "262": "DJ",
  "266": "GA",
  "268": "GE",
  "270": "GM",
  "275": "PS",
  "276": "DE",
  "288": "GH",
  "292": "GI",
  "296": "KI",
  "300": "GR",
  "304": "GL",
  "308": "GD",
  "316": "GU",
  "320": "GT",
  "324": "GN",
  "328": "GY",
  "332": "HT",
  "334": "HM",
  "336": "VA",
  "340": "HN",
  "344": "HK",
  "348": "HU",
  "352": "IS",
  "356": "IN",
  "360": "ID",
  "364": "IR",
  "368": "IQ",
  "372": "IE",
  "376": "IL",
  "380": "IT",
  "384": "CI",
  "388": "JM",
  "392": "JP",
  "398": "KZ",
  "400": "JO",
  "404": "KE",
  "408": "KP",
  "410": "KR",
  "412": "XK",
  "414": "KW",
  "417": "KG",
  "418": "LA",
  "422": "LB",
  "426": "LS",
  "428": "LV",
  "430": "LR",
  "434": "LY",
  "438": "LI",
  "440": "LT",
  "442": "LU",
  "446": "MO",
  "450": "MG",
  "454": "MW",
  "458": "MY",
  "462": "MV",
  "466": "ML",
  "470": "MT",
  "478": "MR",
  "480": "MU",
  "484": "MX",
  "492": "MC",
  "496": "MN",
  "498": "MD",
  "499": "ME",
  "500": "MS",
  "504": "MA",
  "508": "MZ",
  "512": "OM",
  "516": "NA",
  "520": "NR",
  "524": "NP",
  "528": "NL",
  "531": "CW",
  "533": "AW",
  "534": "SX",
  "540": "NC",
  "548": "VU",
  "554": "NZ",
  "558": "NI",
  "562": "NE",
  "566": "NG",
  "570": "NU",
  "574": "NF",
  "578": "NO",
  "580": "MP",
  "581": "UM",
  "583": "FM",
  "584": "MH",
  "585": "PW",
  "586": "PK",
  "591": "PA",
  "598": "PG",
  "600": "PY",
  "604": "PE",
  "608": "PH",
  "612": "PN",
  "616": "PL",
  "620": "PT",
  "624": "GW",
  "626": "TL",
  "630": "PR",
  "634": "QA",
  "642": "RO",
  "643": "RU",
  "646": "RW",
  "652": "BL",
  "654": "SH",
  "659": "KN",
  "660": "AI",
  "662": "LC",
  "663": "MF",
  "666": "PM",
  "670": "VC",
  "674": "SM",
  "678": "ST",
  "682": "SA",
  "686": "SN",
  "688": "RS",
  "690": "SC",
  "694": "SL",
  "702": "SG",
  "703": "SK",
  "704": "VN",
  "705": "SI",
  "706": "SO",
  "710": "ZA",
  "716": "ZW",
  "724": "ES",
  "728": "SS",
  "729": "SD",
  "732": "EH",
  "740": "SR",
  "748": "SZ",
  "752": "SE",
  "756": "CH",
  "760": "SY",
  "762": "TJ",
  "764": "TH",
  "768": "TG",
  "776": "TO",
  "780": "TT",
  "784": "AE",
  "788": "TN",
  "792": "TR",
  "795": "TM",
  "796": "TC",
  "798": "TV",
  "800": "UG",
  "804": "UA",
  "807": "MK",
  "818": "EG",
  "826": "GB",
  "831": "GG",
  "832": "JE",
  "833": "IM",
  "834": "TZ",
  "840": "US",
  "850": "VI",
  "854": "BF",
  "858": "UY",
  "860": "UZ",
  "862": "VE",
  "876": "WF",
  "882": "WS",
  "887": "YE",
  "894": "ZM"
};

// scripts/shared/comtrade-reporter-overrides.json
var comtrade_reporter_overrides_default = {
  CH: "757",
  FR: "251",
  IN: "699",
  IT: "381",
  NO: "579",
  TW: "490",
  US: "842"
};

// server/worldmonitor/supply-chain/v1/_bilateral-hs4-lazy.ts
var COMTRADE_BASE = "https://comtradeapi.un.org/public/v1/preview/C/A/HS";
var CHROME_UA2 = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36";
var KEY_PREFIX = "comtrade:bilateral-hs4:";
var LAZY_SENTINEL_PREFIX = "comtrade:bilateral-hs4-lazy-sentinel:";
var SUCCESS_TTL = 2592e3;
var EMPTY_TTL = 86400;
var FETCH_TIMEOUT_MS = 5e3;
var HS4_CODES = [
  "2709",
  "2711",
  "8542",
  "8517",
  "8703",
  "3004",
  "7108",
  "2710",
  "8471",
  "8411",
  "7601",
  "7202",
  "3901",
  "2902",
  "1001",
  "1201",
  "6204",
  "0203",
  "8704",
  "8708"
];
var HS4_LABELS = {
  "2709": "Crude Petroleum",
  "2711": "LNG & Petroleum Gas",
  "8542": "Semiconductors",
  "8517": "Smartphones & Telecom",
  "8703": "Passenger Vehicles",
  "3004": "Pharmaceuticals",
  "7108": "Gold",
  "2710": "Refined Petroleum",
  "8471": "Computers",
  "8411": "Turbojets & Turbines",
  "7601": "Aluminium",
  "7202": "Ferroalloys (Steel)",
  "3901": "Plastics (Polyethylene)",
  "2902": "Chemicals (Hydrocarbons)",
  "1001": "Wheat",
  "1201": "Soybeans",
  "6204": "Women's Suits (Woven)",
  "0203": "Pork",
  "8704": "Commercial Vehicles",
  "8708": "Auto Parts"
};
var ISO2_TO_UN = Object.fromEntries(
  Object.entries(un_to_iso2_default).map(([un, iso]) => [iso, un])
);
for (const [iso2, code] of Object.entries(comtrade_reporter_overrides_default)) {
  ISO2_TO_UN[iso2] = code;
}
var fetchInFlight = false;
function parseRecords(data) {
  const records = data?.data ?? [];
  if (!Array.isArray(records)) return [];
  return records.filter((r) => r && Number(r.primaryValue ?? 0) > 0).map((r) => ({
    cmdCode: String(r.cmdCode ?? ""),
    partnerCode: String(r.partnerCode ?? r.partner2Code ?? "000"),
    primaryValue: Number(r.primaryValue ?? 0),
    year: Number(r.period ?? r.refYear ?? 0)
  }));
}
function groupByProduct(records) {
  const byCode = /* @__PURE__ */ new Map();
  for (const r of records) {
    if (!byCode.has(r.cmdCode)) byCode.set(r.cmdCode, /* @__PURE__ */ new Map());
    const partners = byCode.get(r.cmdCode);
    const existing = partners.get(r.partnerCode);
    if (!existing || r.primaryValue > existing.value) {
      partners.set(r.partnerCode, { value: r.primaryValue, year: r.year });
    }
  }
  const products = [];
  for (const [hs4, partners] of byCode) {
    const sorted = [...partners.entries()].sort((a, b) => b[1].value - a[1].value).filter(([pc]) => pc !== "0" && pc !== "000");
    const totalValue = sorted.reduce((s, [, v]) => s + v.value, 0);
    if (totalValue <= 0) continue;
    const top5 = sorted.slice(0, 5);
    const years = sorted.map(([, v]) => v.year).filter((y) => y > 0);
    const latestYear = years.length > 0 ? Math.max(...years) : 0;
    products.push({
      hs4,
      description: HS4_LABELS[hs4] ?? hs4,
      totalValue,
      topExporters: top5.map(([pc, v]) => ({
        partnerCode: Number(pc),
        partnerIso2: un_to_iso2_default[pc.padStart(3, "0")] ?? "",
        value: v.value,
        share: totalValue > 0 ? v.value / totalValue : 0
      })),
      year: latestYear
    });
  }
  return products;
}
async function fetchComtradeBilateral(reporterCode) {
  const url = new URL(COMTRADE_BASE);
  url.searchParams.set("reporterCode", reporterCode);
  url.searchParams.set("cmdCode", HS4_CODES.join(","));
  url.searchParams.set("flowCode", "M");
  const resp = await fetch(url.toString(), {
    headers: { "User-Agent": CHROME_UA2, Accept: "application/json" },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS)
  });
  if (resp.status === 429) return { products: [], rateLimited: true, serverError: false };
  if (!resp.ok) return { products: [], rateLimited: false, serverError: resp.status >= 500 };
  const data = await resp.json();
  const records = parseRecords(data);
  return { products: groupByProduct(records), rateLimited: false, serverError: false };
}
async function lazyFetchBilateralHs4(iso2) {
  const sentinelKey = `${LAZY_SENTINEL_PREFIX}${iso2}:v1`;
  const sentinel = await getCachedJson(sentinelKey, true).catch(() => null);
  if (sentinel) {
    if (sentinel.rateLimited) {
      return { products: [], comtradeSource: "lazy", rateLimited: true };
    }
    return { products: [], comtradeSource: "empty" };
  }
  if (fetchInFlight) return null;
  fetchInFlight = true;
  const unCode = ISO2_TO_UN[iso2];
  if (!unCode) {
    fetchInFlight = false;
    await setCachedJson(sentinelKey, { empty: true }, EMPTY_TTL, true);
    return { products: [], comtradeSource: "empty" };
  }
  try {
    const result = await fetchComtradeBilateral(unCode);
    if (result.rateLimited) {
      await setCachedJson(sentinelKey, { rateLimited: true }, EMPTY_TTL, true);
      return { products: [], comtradeSource: "empty", rateLimited: true };
    }
    if (result.serverError) {
      return { products: [], comtradeSource: "lazy" };
    }
    if (result.products.length === 0) {
      await setCachedJson(sentinelKey, { empty: true }, EMPTY_TTL, true);
      return { products: [], comtradeSource: "empty" };
    }
    const cacheKey = `${KEY_PREFIX}${iso2}:v1`;
    const payload = { iso2, products: result.products, fetchedAt: (/* @__PURE__ */ new Date()).toISOString() };
    await setCachedJson(cacheKey, payload, SUCCESS_TTL, true);
    return { products: result.products, comtradeSource: "bilateral-hs4" };
  } catch {
    return { products: [], comtradeSource: "lazy" };
  } finally {
    fetchInFlight = false;
  }
}

// scripts/shared/country-port-clusters.json
var country_port_clusters_default = {
  _comment: "Country port cluster config for HS2 chokepoint exposure seeding. Maps iso2 -> { nearestRouteIds, coastSide }. coastSide: 'atlantic'|'pacific'|'indian'|'med'|'landlocked'|'multi'. nearestRouteIds are TRADE_ROUTES.id values from src/config/trade-routes.ts.",
  US: { nearestRouteIds: ["china-us-west", "china-us-east-suez", "china-us-east-panama", "transatlantic", "us-europe-lng"], coastSide: "multi" },
  CN: { nearestRouteIds: ["china-europe-suez", "china-us-west", "china-us-east-suez", "china-us-east-panama", "gulf-asia-oil", "qatar-asia-lng", "intra-asia-container", "china-africa", "cpec-route"], coastSide: "pacific" },
  RU: { nearestRouteIds: ["russia-med-oil"], coastSide: "multi" },
  IR: { nearestRouteIds: ["gulf-europe-oil", "gulf-asia-oil"], coastSide: "indian" },
  IN: { nearestRouteIds: ["india-europe", "india-se-asia", "gulf-asia-oil"], coastSide: "indian" },
  TW: { nearestRouteIds: ["china-us-west", "intra-asia-container", "china-europe-suez", "asia-europe-cape"], coastSide: "pacific" },
  JP: { nearestRouteIds: ["gulf-asia-oil", "qatar-asia-lng", "intra-asia-container", "china-europe-suez", "asia-europe-cape"], coastSide: "pacific" },
  KR: { nearestRouteIds: ["gulf-asia-oil", "qatar-asia-lng", "intra-asia-container", "china-europe-suez", "asia-europe-cape"], coastSide: "pacific" },
  DE: { nearestRouteIds: ["china-europe-suez", "asia-europe-cape", "transatlantic", "india-europe"], coastSide: "atlantic" },
  GB: { nearestRouteIds: ["china-europe-suez", "transatlantic", "us-europe-lng", "india-europe"], coastSide: "atlantic" },
  FR: { nearestRouteIds: ["china-europe-suez", "transatlantic", "us-europe-lng", "india-europe"], coastSide: "atlantic" },
  IT: { nearestRouteIds: ["china-europe-suez", "gulf-europe-oil", "india-europe"], coastSide: "med" },
  ES: { nearestRouteIds: ["china-europe-suez", "singapore-med", "transatlantic", "india-europe"], coastSide: "multi" },
  NL: { nearestRouteIds: ["china-europe-suez", "gulf-europe-oil", "transatlantic", "india-europe"], coastSide: "atlantic" },
  BE: { nearestRouteIds: ["china-europe-suez", "transatlantic", "india-europe"], coastSide: "atlantic" },
  PL: { nearestRouteIds: ["china-europe-suez", "transatlantic", "india-europe"], coastSide: "atlantic" },
  SE: { nearestRouteIds: ["china-europe-suez", "transatlantic", "india-europe"], coastSide: "atlantic" },
  NO: { nearestRouteIds: ["transatlantic"], coastSide: "atlantic" },
  DK: { nearestRouteIds: ["china-europe-suez", "transatlantic", "india-europe"], coastSide: "atlantic" },
  FI: { nearestRouteIds: ["china-europe-suez", "india-europe"], coastSide: "atlantic" },
  TR: { nearestRouteIds: ["russia-med-oil", "gulf-europe-oil"], coastSide: "med" },
  GR: { nearestRouteIds: ["china-europe-suez", "gulf-europe-oil", "india-europe"], coastSide: "med" },
  PT: { nearestRouteIds: ["china-europe-suez", "transatlantic", "india-europe"], coastSide: "atlantic" },
  SA: { nearestRouteIds: ["gulf-europe-oil", "gulf-asia-oil"], coastSide: "indian" },
  AE: { nearestRouteIds: ["gulf-europe-oil", "gulf-asia-oil"], coastSide: "indian" },
  KW: { nearestRouteIds: ["gulf-europe-oil", "gulf-asia-oil"], coastSide: "indian" },
  IQ: { nearestRouteIds: ["gulf-europe-oil"], coastSide: "indian" },
  QA: { nearestRouteIds: ["qatar-europe-lng", "qatar-asia-lng"], coastSide: "indian" },
  EG: { nearestRouteIds: ["china-europe-suez", "gulf-europe-oil"], coastSide: "med" },
  ZA: { nearestRouteIds: ["brazil-china-bulk", "asia-europe-cape", "gulf-americas-cape"], coastSide: "multi" },
  BR: { nearestRouteIds: ["brazil-china-bulk", "transatlantic"], coastSide: "atlantic" },
  AR: { nearestRouteIds: ["transatlantic"], coastSide: "atlantic" },
  MX: { nearestRouteIds: ["china-us-west", "panama-transit"], coastSide: "multi" },
  CA: { nearestRouteIds: ["transatlantic", "china-us-west"], coastSide: "multi" },
  AU: { nearestRouteIds: ["brazil-china-bulk", "gulf-asia-oil"], coastSide: "multi" },
  NZ: { nearestRouteIds: ["brazil-china-bulk"], coastSide: "pacific" },
  SG: { nearestRouteIds: ["gulf-asia-oil", "china-europe-suez", "singapore-med"], coastSide: "indian" },
  MY: { nearestRouteIds: ["gulf-asia-oil", "china-europe-suez"], coastSide: "indian" },
  ID: { nearestRouteIds: ["china-europe-suez", "gulf-asia-oil"], coastSide: "multi" },
  TH: { nearestRouteIds: ["gulf-asia-oil", "intra-asia-container", "china-europe-suez", "asia-europe-cape"], coastSide: "indian" },
  VN: { nearestRouteIds: ["intra-asia-container", "china-us-west", "china-europe-suez", "asia-europe-cape"], coastSide: "pacific" },
  PH: { nearestRouteIds: ["intra-asia-container", "china-us-west", "china-europe-suez", "asia-europe-cape"], coastSide: "pacific" },
  PK: { nearestRouteIds: ["cpec-route", "india-se-asia"], coastSide: "indian" },
  BD: { nearestRouteIds: ["india-se-asia", "china-europe-suez"], coastSide: "indian" },
  LK: { nearestRouteIds: ["india-se-asia", "china-europe-suez"], coastSide: "indian" },
  NG: { nearestRouteIds: ["china-africa", "transatlantic"], coastSide: "atlantic" },
  GH: { nearestRouteIds: ["china-africa", "transatlantic"], coastSide: "atlantic" },
  CI: { nearestRouteIds: ["china-africa"], coastSide: "atlantic" },
  SN: { nearestRouteIds: ["china-africa", "transatlantic"], coastSide: "atlantic" },
  TZ: { nearestRouteIds: ["china-africa", "india-se-asia"], coastSide: "indian" },
  KE: { nearestRouteIds: ["china-africa", "india-se-asia"], coastSide: "indian" },
  ET: { nearestRouteIds: ["india-se-asia", "gulf-europe-oil"], coastSide: "landlocked" },
  MZ: { nearestRouteIds: ["brazil-china-bulk", "asia-europe-cape"], coastSide: "indian" },
  AO: { nearestRouteIds: ["brazil-china-bulk", "transatlantic"], coastSide: "atlantic" },
  MA: { nearestRouteIds: ["china-europe-suez", "transatlantic"], coastSide: "multi" },
  DZ: { nearestRouteIds: ["china-europe-suez", "transatlantic"], coastSide: "med" },
  TN: { nearestRouteIds: ["china-europe-suez"], coastSide: "med" },
  LY: { nearestRouteIds: ["china-europe-suez"], coastSide: "med" },
  IL: { nearestRouteIds: ["gulf-europe-oil", "china-europe-suez"], coastSide: "med" },
  JO: { nearestRouteIds: ["gulf-europe-oil"], coastSide: "indian" },
  LB: { nearestRouteIds: ["gulf-europe-oil"], coastSide: "med" },
  SY: { nearestRouteIds: ["russia-med-oil"], coastSide: "med" },
  OM: { nearestRouteIds: ["gulf-asia-oil", "gulf-europe-oil"], coastSide: "indian" },
  YE: { nearestRouteIds: ["gulf-europe-oil"], coastSide: "indian" },
  UA: { nearestRouteIds: ["russia-med-oil"], coastSide: "multi" },
  RO: { nearestRouteIds: ["russia-med-oil", "china-europe-suez"], coastSide: "multi" },
  BG: { nearestRouteIds: ["russia-med-oil"], coastSide: "multi" },
  HR: { nearestRouteIds: ["china-europe-suez"], coastSide: "med" },
  RS: { nearestRouteIds: ["russia-med-oil"], coastSide: "landlocked" },
  AT: { nearestRouteIds: ["china-europe-suez"], coastSide: "landlocked" },
  HU: { nearestRouteIds: ["china-europe-suez"], coastSide: "landlocked" },
  CZ: { nearestRouteIds: ["china-europe-suez"], coastSide: "landlocked" },
  SK: { nearestRouteIds: ["china-europe-suez"], coastSide: "landlocked" },
  CH: { nearestRouteIds: ["china-europe-suez"], coastSide: "landlocked" },
  CL: { nearestRouteIds: ["panama-transit", "brazil-china-bulk"], coastSide: "pacific" },
  PE: { nearestRouteIds: ["panama-transit"], coastSide: "pacific" },
  CO: { nearestRouteIds: ["panama-transit", "transatlantic"], coastSide: "multi" },
  VE: { nearestRouteIds: ["transatlantic"], coastSide: "atlantic" },
  EC: { nearestRouteIds: ["panama-transit"], coastSide: "pacific" },
  BO: { nearestRouteIds: ["brazil-china-bulk"], coastSide: "landlocked" },
  PY: { nearestRouteIds: ["brazil-china-bulk"], coastSide: "landlocked" },
  UY: { nearestRouteIds: ["transatlantic", "brazil-china-bulk"], coastSide: "atlantic" },
  KZ: { nearestRouteIds: ["russia-med-oil"], coastSide: "landlocked" },
  UZ: { nearestRouteIds: ["cpec-route"], coastSide: "landlocked" },
  AF: { nearestRouteIds: ["cpec-route"], coastSide: "landlocked" },
  MM: { nearestRouteIds: ["india-se-asia", "china-africa"], coastSide: "indian" },
  KH: { nearestRouteIds: ["intra-asia-container"], coastSide: "pacific" },
  LA: { nearestRouteIds: ["intra-asia-container"], coastSide: "landlocked" },
  MN: { nearestRouteIds: ["china-us-west"], coastSide: "landlocked" },
  NP: { nearestRouteIds: ["india-se-asia"], coastSide: "landlocked" },
  HK: { nearestRouteIds: ["china-europe-suez", "asia-europe-cape", "china-us-west", "intra-asia-container"], coastSide: "pacific" },
  MO: { nearestRouteIds: ["china-us-west"], coastSide: "pacific" },
  ZW: { nearestRouteIds: ["brazil-china-bulk", "asia-europe-cape"], coastSide: "landlocked" },
  ZM: { nearestRouteIds: ["brazil-china-bulk"], coastSide: "landlocked" },
  SD: { nearestRouteIds: ["gulf-europe-oil", "india-se-asia"], coastSide: "multi" },
  SS: { nearestRouteIds: ["china-africa"], coastSide: "landlocked" },
  CD: { nearestRouteIds: ["china-africa"], coastSide: "atlantic" },
  CG: { nearestRouteIds: ["china-africa"], coastSide: "atlantic" },
  CM: { nearestRouteIds: ["china-africa"], coastSide: "atlantic" },
  GA: { nearestRouteIds: ["china-africa"], coastSide: "atlantic" },
  GQ: { nearestRouteIds: ["china-africa"], coastSide: "atlantic" },
  CF: { nearestRouteIds: ["china-africa"], coastSide: "landlocked" },
  TD: { nearestRouteIds: ["china-africa"], coastSide: "landlocked" },
  NE: { nearestRouteIds: ["china-africa"], coastSide: "landlocked" },
  ML: { nearestRouteIds: ["china-africa"], coastSide: "landlocked" },
  BF: { nearestRouteIds: ["china-africa"], coastSide: "landlocked" },
  GN: { nearestRouteIds: ["china-africa"], coastSide: "atlantic" },
  GW: { nearestRouteIds: ["china-africa"], coastSide: "atlantic" },
  SL: { nearestRouteIds: ["china-africa"], coastSide: "atlantic" },
  LR: { nearestRouteIds: ["china-africa"], coastSide: "atlantic" },
  BJ: { nearestRouteIds: ["china-africa"], coastSide: "atlantic" },
  TG: { nearestRouteIds: ["china-africa"], coastSide: "atlantic" },
  MR: { nearestRouteIds: ["china-africa", "transatlantic"], coastSide: "atlantic" },
  SO: { nearestRouteIds: ["india-se-asia", "gulf-europe-oil"], coastSide: "indian" },
  DJ: { nearestRouteIds: ["india-se-asia", "gulf-europe-oil"], coastSide: "indian" },
  ER: { nearestRouteIds: ["gulf-europe-oil"], coastSide: "indian" },
  MG: { nearestRouteIds: ["asia-europe-cape", "brazil-china-bulk"], coastSide: "indian" },
  MW: { nearestRouteIds: ["brazil-china-bulk"], coastSide: "landlocked" },
  UG: { nearestRouteIds: ["china-africa"], coastSide: "landlocked" },
  RW: { nearestRouteIds: ["china-africa"], coastSide: "landlocked" },
  BI: { nearestRouteIds: ["china-africa"], coastSide: "landlocked" },
  NA: { nearestRouteIds: ["asia-europe-cape", "brazil-china-bulk"], coastSide: "atlantic" },
  BW: { nearestRouteIds: ["asia-europe-cape"], coastSide: "landlocked" },
  SZ: { nearestRouteIds: ["asia-europe-cape"], coastSide: "landlocked" },
  LS: { nearestRouteIds: ["asia-europe-cape"], coastSide: "landlocked" },
  MU: { nearestRouteIds: ["asia-europe-cape", "india-se-asia"], coastSide: "indian" },
  SC: { nearestRouteIds: ["india-se-asia"], coastSide: "indian" },
  KM: { nearestRouteIds: ["india-se-asia"], coastSide: "indian" },
  CV: { nearestRouteIds: ["transatlantic"], coastSide: "atlantic" },
  ST: { nearestRouteIds: ["china-africa"], coastSide: "atlantic" },
  MV: { nearestRouteIds: ["india-se-asia"], coastSide: "indian" },
  GE: { nearestRouteIds: ["russia-med-oil"], coastSide: "multi" },
  AM: { nearestRouteIds: ["russia-med-oil"], coastSide: "landlocked" },
  AZ: { nearestRouteIds: ["russia-med-oil"], coastSide: "landlocked" },
  TM: { nearestRouteIds: ["cpec-route"], coastSide: "landlocked" },
  TJ: { nearestRouteIds: ["cpec-route"], coastSide: "landlocked" },
  KG: { nearestRouteIds: ["cpec-route"], coastSide: "landlocked" },
  BY: { nearestRouteIds: ["russia-med-oil", "china-europe-suez"], coastSide: "landlocked" },
  MD: { nearestRouteIds: ["russia-med-oil"], coastSide: "landlocked" },
  LT: { nearestRouteIds: ["china-europe-suez", "transatlantic"], coastSide: "atlantic" },
  LV: { nearestRouteIds: ["china-europe-suez", "transatlantic"], coastSide: "atlantic" },
  EE: { nearestRouteIds: ["china-europe-suez", "transatlantic"], coastSide: "atlantic" },
  IE: { nearestRouteIds: ["transatlantic", "us-europe-lng"], coastSide: "atlantic" },
  IS: { nearestRouteIds: ["transatlantic"], coastSide: "atlantic" },
  LU: { nearestRouteIds: ["china-europe-suez", "transatlantic"], coastSide: "landlocked" },
  MT: { nearestRouteIds: ["china-europe-suez", "gulf-europe-oil"], coastSide: "med" },
  CY: { nearestRouteIds: ["china-europe-suez", "gulf-europe-oil"], coastSide: "med" },
  SI: { nearestRouteIds: ["china-europe-suez"], coastSide: "med" },
  AL: { nearestRouteIds: ["china-europe-suez"], coastSide: "med" },
  BA: { nearestRouteIds: ["china-europe-suez"], coastSide: "med" },
  ME: { nearestRouteIds: ["china-europe-suez"], coastSide: "med" },
  MK: { nearestRouteIds: ["russia-med-oil"], coastSide: "landlocked" },
  XK: { nearestRouteIds: ["russia-med-oil"], coastSide: "landlocked" },
  CU: { nearestRouteIds: ["panama-transit", "transatlantic"], coastSide: "multi" },
  JM: { nearestRouteIds: ["panama-transit", "transatlantic"], coastSide: "multi" },
  HT: { nearestRouteIds: ["transatlantic"], coastSide: "multi" },
  DO: { nearestRouteIds: ["transatlantic"], coastSide: "multi" },
  TT: { nearestRouteIds: ["transatlantic"], coastSide: "atlantic" },
  BB: { nearestRouteIds: ["transatlantic"], coastSide: "atlantic" },
  PA: { nearestRouteIds: ["panama-transit"], coastSide: "multi" },
  CR: { nearestRouteIds: ["panama-transit"], coastSide: "multi" },
  HN: { nearestRouteIds: ["panama-transit"], coastSide: "multi" },
  GT: { nearestRouteIds: ["panama-transit"], coastSide: "multi" },
  SV: { nearestRouteIds: ["panama-transit"], coastSide: "pacific" },
  NI: { nearestRouteIds: ["panama-transit"], coastSide: "multi" },
  BZ: { nearestRouteIds: ["panama-transit"], coastSide: "multi" },
  GY: { nearestRouteIds: ["transatlantic"], coastSide: "atlantic" },
  SR: { nearestRouteIds: ["transatlantic"], coastSide: "atlantic" },
  FJ: { nearestRouteIds: ["brazil-china-bulk"], coastSide: "pacific" },
  PG: { nearestRouteIds: ["brazil-china-bulk"], coastSide: "pacific" },
  PW: { nearestRouteIds: ["china-us-west"], coastSide: "pacific" },
  SB: { nearestRouteIds: ["brazil-china-bulk"], coastSide: "pacific" },
  TO: { nearestRouteIds: ["brazil-china-bulk"], coastSide: "pacific" },
  VU: { nearestRouteIds: ["brazil-china-bulk"], coastSide: "pacific" },
  WS: { nearestRouteIds: ["brazil-china-bulk"], coastSide: "pacific" },
  BH: { nearestRouteIds: ["gulf-europe-oil", "gulf-asia-oil", "qatar-asia-lng"], coastSide: "indian" },
  KP: { nearestRouteIds: ["intra-asia-container"], coastSide: "pacific" },
  KI: { nearestRouteIds: ["china-us-west"], coastSide: "pacific" },
  FM: { nearestRouteIds: ["intra-asia-container", "china-us-west"], coastSide: "pacific" },
  MH: { nearestRouteIds: ["china-us-west"], coastSide: "pacific" },
  NR: { nearestRouteIds: ["china-us-west"], coastSide: "pacific" },
  TV: { nearestRouteIds: ["china-us-west"], coastSide: "pacific" },
  AG: { nearestRouteIds: ["transatlantic"], coastSide: "atlantic" },
  BS: { nearestRouteIds: ["transatlantic", "panama-transit"], coastSide: "atlantic" },
  DM: { nearestRouteIds: ["transatlantic"], coastSide: "atlantic" },
  GD: { nearestRouteIds: ["transatlantic"], coastSide: "atlantic" },
  KN: { nearestRouteIds: ["transatlantic"], coastSide: "atlantic" },
  LC: { nearestRouteIds: ["transatlantic"], coastSide: "atlantic" },
  VC: { nearestRouteIds: ["transatlantic"], coastSide: "atlantic" },
  GM: { nearestRouteIds: ["china-africa", "transatlantic"], coastSide: "atlantic" },
  LI: { nearestRouteIds: [], coastSide: "landlocked" },
  AD: { nearestRouteIds: [], coastSide: "landlocked" },
  MC: { nearestRouteIds: ["singapore-med"], coastSide: "med" },
  SM: { nearestRouteIds: [], coastSide: "landlocked" },
  BT: { nearestRouteIds: [], coastSide: "landlocked" },
  BN: { nearestRouteIds: ["intra-asia-container"], coastSide: "pacific" },
  TL: { nearestRouteIds: ["intra-asia-container"], coastSide: "pacific" }
};

// server/worldmonitor/supply-chain/v1/chokepoint-exposure-utils.ts
var clusters = country_port_clusters_default;
function getRouteIdsForCountry(iso2) {
  return clusters[iso2]?.nearestRouteIds ?? [];
}
function getCoastSide(iso2) {
  return clusters[iso2]?.coastSide ?? "unknown";
}
function hs4ToHs2(hs4) {
  return String(Number.parseInt(hs4.slice(0, 2), 10));
}
function computeFlowWeightedExposures(importerIso2, hs2, products) {
  const isEnergy = hs2 === "27";
  const normalizedHs2 = String(Number.parseInt(hs2, 10));
  const matchingProducts = products.filter((p) => hs4ToHs2(p.hs4) === normalizedHs2);
  if (matchingProducts.length === 0) return [];
  const importerRoutes = new Set(getRouteIdsForCountry(importerIso2));
  const totalSectorValue = matchingProducts.reduce((s, p) => s + p.totalValue, 0);
  const cpScores = /* @__PURE__ */ new Map();
  for (const cp of CHOKEPOINT_REGISTRY) cpScores.set(cp.id, 0);
  for (const product of matchingProducts) {
    const productWeight = totalSectorValue > 0 ? product.totalValue / totalSectorValue : 0;
    for (const exporter of product.topExporters) {
      if (!exporter.partnerIso2) continue;
      const exporterRoutes = new Set(getRouteIdsForCountry(exporter.partnerIso2));
      for (const cp of CHOKEPOINT_REGISTRY) {
        const cpRoutes = cp.routeIds;
        let overlap = 0;
        for (const r of cpRoutes) {
          if (importerRoutes.has(r) || exporterRoutes.has(r)) overlap++;
        }
        const routeCoverage = overlap / Math.max(cpRoutes.length, 1);
        const contribution = routeCoverage * exporter.share * productWeight * 100;
        cpScores.set(cp.id, (cpScores.get(cp.id) ?? 0) + contribution);
      }
    }
  }
  const entries = CHOKEPOINT_REGISTRY.map((cp) => {
    let score = cpScores.get(cp.id) ?? 0;
    if (isEnergy && cp.shockModelSupported) score = Math.min(score * 1.5, 100);
    score = Math.min(score, 100);
    return {
      chokepointId: cp.id,
      chokepointName: cp.displayName,
      exposureScore: Math.round(score * 10) / 10,
      coastSide: "",
      shockSupported: cp.shockModelSupported
    };
  });
  return entries.sort((a, b) => b.exposureScore - a.exposureScore);
}
function computeFallbackExposures(nearestRouteIds, hs2) {
  const isEnergy = hs2 === "27";
  const routeSet = new Set(nearestRouteIds);
  const entries = CHOKEPOINT_REGISTRY.map((cp) => {
    const overlap = cp.routeIds.filter((r) => routeSet.has(r)).length;
    const maxRoutes = Math.max(cp.routeIds.length, 1);
    let score = overlap / maxRoutes * 100;
    if (isEnergy && cp.shockModelSupported) score = Math.min(score * 1.5, 100);
    return {
      chokepointId: cp.id,
      chokepointName: cp.displayName,
      exposureScore: Math.round(score * 10) / 10,
      coastSide: "",
      shockSupported: cp.shockModelSupported
    };
  });
  return entries.sort((a, b) => b.exposureScore - a.exposureScore);
}
function vulnerabilityIndex(sorted) {
  const weights = [0.5, 0.3, 0.2];
  const total = sorted.slice(0, 3).reduce((sum, e, i) => sum + e.exposureScore * weights[i], 0);
  return Math.round(total * 10) / 10;
}

// server/worldmonitor/supply-chain/v1/get-country-chokepoint-index.ts
var CACHE_TTL = 86400;
var TRANSIENT_CACHE_TTL = 60;
async function loadBilateralProducts(iso2) {
  const bilateralKey = `comtrade:bilateral-hs4:${iso2}:v1`;
  const rawPayload = await getCachedJson(bilateralKey, true).catch(() => null);
  if (rawPayload?.products?.length) return { products: rawPayload.products, transient: false };
  const lazyResult = await lazyFetchBilateralHs4(iso2);
  if (lazyResult && lazyResult.products.length > 0) return { products: lazyResult.products, transient: false };
  const isTransient = lazyResult === null || lazyResult.rateLimited === true || lazyResult.comtradeSource === "lazy" && lazyResult.products.length === 0;
  return { products: null, transient: isTransient };
}
function emptyResponse(iso2, hs2) {
  return {
    iso2,
    hs2,
    exposures: [],
    primaryChokepointId: "",
    vulnerabilityIndex: 0,
    fetchedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
}
async function getCountryChokepointIndex(ctx, req) {
  const isPro = await isCallerPremium(ctx.request);
  if (!isPro) return emptyResponse(req.iso2, req.hs2 || "27");
  const iso2 = req.iso2.trim().toUpperCase();
  const hs2 = (req.hs2?.trim() || "27").replace(/\D/g, "") || "27";
  if (!/^[A-Z]{2}$/.test(iso2) || !/^\d{1,2}$/.test(hs2)) {
    return emptyResponse(req.iso2, req.hs2 || "27");
  }
  const cacheKey = CHOKEPOINT_EXPOSURE_KEY(iso2, hs2);
  try {
    const cached = await getCachedJson(cacheKey);
    if (cached) return cached;
    const { products, transient } = await loadBilateralProducts(iso2);
    let exposures;
    if (products) {
      exposures = computeFlowWeightedExposures(iso2, hs2, products);
    } else {
      exposures = computeFallbackExposures(getRouteIdsForCountry(iso2), hs2);
    }
    if (exposures.length === 0) {
      exposures = computeFallbackExposures(getRouteIdsForCountry(iso2), hs2);
    }
    const coastSide = getCoastSide(iso2);
    if (exposures[0]) exposures[0] = { ...exposures[0], coastSide };
    const primaryId = exposures[0]?.chokepointId ?? "";
    const vulnIndex = vulnerabilityIndex(exposures);
    const result = {
      iso2,
      hs2,
      exposures,
      primaryChokepointId: primaryId,
      vulnerabilityIndex: vulnIndex,
      fetchedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    const ttl = transient ? TRANSIENT_CACHE_TTL : CACHE_TTL;
    await setCachedJson(cacheKey, result, ttl);
    return result;
  } catch {
    return emptyResponse(iso2, hs2);
  }
}

// src/config/bypass-corridors.ts
var BYPASS_CORRIDORS = [
  // ── Suez Canal bypasses ────────────────────────────────────────────────
  {
    id: "suez_cape_of_good_hope",
    name: "Cape of Good Hope Route",
    primaryChokepointId: "suez",
    type: "alternative_sea_route",
    waypointChokepointIds: ["cape_of_good_hope"],
    addedTransitDays: 12,
    addedCostMultiplier: 1.18,
    capacityConstraintTonnage: null,
    suitableCargoTypes: ["container", "tanker", "bulk", "roro"],
    activationThreshold: "partial_closure",
    notes: "Primary diversion route for Asia-Europe traffic avoiding the Red Sea"
  },
  {
    id: "sumed_pipeline",
    name: "SUMED Pipeline",
    primaryChokepointId: "suez",
    type: "pipeline",
    waypointChokepointIds: [],
    addedTransitDays: 2,
    addedCostMultiplier: 1.05,
    capacityConstraintTonnage: 210,
    suitableCargoTypes: ["tanker"],
    activationThreshold: "partial_closure",
    notes: "Suez-Mediterranean Pipeline; crude only; 210 Mt/yr capacity"
  },
  // ── Strait of Hormuz bypasses ─────────────────────────────────────────
  {
    id: "hormuz_cape_of_good_hope",
    name: "Cape of Good Hope Route",
    primaryChokepointId: "hormuz_strait",
    type: "alternative_sea_route",
    waypointChokepointIds: ["cape_of_good_hope"],
    addedTransitDays: 16,
    addedCostMultiplier: 1.25,
    capacityConstraintTonnage: null,
    suitableCargoTypes: ["container", "tanker", "bulk", "roro"],
    activationThreshold: "partial_closure",
    notes: "Long-haul diversion bypassing Gulf and Indian Ocean choke via the Cape"
  },
  {
    id: "aqaba_land_bridge",
    name: "Aqaba Land Bridge",
    primaryChokepointId: "hormuz_strait",
    type: "land_bridge",
    waypointChokepointIds: [],
    addedTransitDays: 5,
    addedCostMultiplier: 1.35,
    capacityConstraintTonnage: 15,
    suitableCargoTypes: ["container", "roro"],
    activationThreshold: "partial_closure",
    notes: "Road/rail transit via Jordan to the port of Aqaba; 15 Mt/yr capacity constraint"
  },
  {
    id: "btc_pipeline",
    name: "BTC Pipeline (Baku-Tbilisi-Ceyhan)",
    primaryChokepointId: "hormuz_strait",
    type: "pipeline",
    waypointChokepointIds: [],
    addedTransitDays: 3,
    addedCostMultiplier: 1.1,
    capacityConstraintTonnage: 28,
    suitableCargoTypes: ["tanker"],
    activationThreshold: "partial_closure",
    notes: "Crude oil pipeline from Caspian to Turkish Mediterranean; 28 Mt/yr capacity"
  },
  // ── Strait of Malacca bypasses ────────────────────────────────────────
  {
    id: "lombok_strait_bypass",
    name: "Lombok Strait",
    primaryChokepointId: "malacca_strait",
    type: "alternative_sea_route",
    waypointChokepointIds: ["lombok_strait"],
    addedTransitDays: 2,
    addedCostMultiplier: 1.05,
    capacityConstraintTonnage: null,
    suitableCargoTypes: ["tanker", "bulk"],
    activationThreshold: "partial_closure",
    notes: "Preferred tanker and bulk diversion for vessels too large for Malacca"
  },
  {
    id: "sunda_strait",
    name: "Sunda Strait",
    primaryChokepointId: "malacca_strait",
    type: "alternative_sea_route",
    waypointChokepointIds: [],
    addedTransitDays: 1,
    addedCostMultiplier: 1.03,
    capacityConstraintTonnage: null,
    suitableCargoTypes: ["container", "tanker", "bulk", "roro"],
    activationThreshold: "partial_closure",
    notes: "Narrower and shallower than Lombok; suitable for most vessel classes"
  },
  {
    id: "kra_canal_future",
    name: "Kra Canal (Proposed)",
    primaryChokepointId: "malacca_strait",
    type: "alternative_sea_route",
    waypointChokepointIds: [],
    addedTransitDays: 0,
    addedCostMultiplier: 0.95,
    capacityConstraintTonnage: null,
    suitableCargoTypes: ["container", "tanker", "bulk", "roro"],
    activationThreshold: "full_closure",
    notes: "Proposed; not yet constructed"
  },
  // ── Bab el-Mandeb bypasses ────────────────────────────────────────────
  {
    id: "bab_el_mandeb_cape_of_good_hope",
    name: "Cape of Good Hope Route",
    primaryChokepointId: "bab_el_mandeb",
    type: "alternative_sea_route",
    waypointChokepointIds: ["cape_of_good_hope"],
    addedTransitDays: 10,
    addedCostMultiplier: 1.15,
    capacityConstraintTonnage: null,
    suitableCargoTypes: ["container", "tanker", "bulk", "roro"],
    activationThreshold: "partial_closure",
    notes: "Standard diversion for vessels avoiding the Red Sea / Houthi threat zone"
  },
  {
    id: "djibouti_rail",
    name: "Djibouti-Addis Ababa Railway",
    primaryChokepointId: "bab_el_mandeb",
    type: "land_bridge",
    waypointChokepointIds: [],
    addedTransitDays: 7,
    addedCostMultiplier: 1.45,
    capacityConstraintTonnage: 1,
    suitableCargoTypes: ["container"],
    activationThreshold: "full_closure",
    notes: "Containerised cargo only; 1 Mt/yr capacity; requires full closure to justify costs"
  },
  // ── Bosporus Strait bypasses ──────────────────────────────────────────
  {
    id: "btc_pipeline_black_sea",
    name: "BTC Pipeline (Black Sea crude egress)",
    primaryChokepointId: "bosphorus",
    type: "pipeline",
    waypointChokepointIds: [],
    addedTransitDays: 2,
    addedCostMultiplier: 1.08,
    capacityConstraintTonnage: 28,
    suitableCargoTypes: ["tanker"],
    activationThreshold: "partial_closure",
    notes: "Crude oil pipeline from Baku; avoids tanker transit through the Bosphorus"
  },
  {
    id: "baku_tbilisi_batumi_rail",
    name: "Baku-Tbilisi-Batumi Rail Corridor",
    primaryChokepointId: "bosphorus",
    type: "land_bridge",
    waypointChokepointIds: [],
    addedTransitDays: 4,
    addedCostMultiplier: 1.3,
    capacityConstraintTonnage: 8,
    suitableCargoTypes: ["container", "bulk"],
    activationThreshold: "partial_closure",
    notes: "Multimodal corridor via Georgia to Black Sea port of Batumi; 8 Mt/yr capacity"
  },
  // ── Panama Canal bypasses ─────────────────────────────────────────────
  {
    id: "panama_cape_horn",
    name: "Cape Horn Route",
    primaryChokepointId: "panama",
    type: "alternative_sea_route",
    waypointChokepointIds: [],
    addedTransitDays: 22,
    addedCostMultiplier: 1.4,
    capacityConstraintTonnage: null,
    suitableCargoTypes: ["container", "tanker", "bulk", "roro"],
    activationThreshold: "full_closure",
    notes: "Historically significant; high seas and extreme weather make it a last resort"
  },
  {
    id: "us_rail_landbridge",
    name: "US Rail Land Bridge",
    primaryChokepointId: "panama",
    type: "land_bridge",
    waypointChokepointIds: [],
    addedTransitDays: 6,
    addedCostMultiplier: 1.55,
    capacityConstraintTonnage: 2,
    suitableCargoTypes: ["container"],
    activationThreshold: "partial_closure",
    notes: "Intermodal rail across the continental US; 2 Mt/yr capacity; containers only"
  },
  // ── Taiwan Strait bypasses ────────────────────────────────────────────
  {
    id: "bashi_channel",
    name: "Bashi Channel",
    primaryChokepointId: "taiwan_strait",
    type: "alternative_sea_route",
    waypointChokepointIds: [],
    addedTransitDays: 1,
    addedCostMultiplier: 1.04,
    capacityConstraintTonnage: null,
    suitableCargoTypes: ["container", "tanker", "bulk", "roro"],
    activationThreshold: "partial_closure",
    notes: "Deep-water channel between Taiwan and the Philippines; suitable for all vessel classes"
  },
  {
    id: "miyako_strait",
    name: "Miyako Strait",
    primaryChokepointId: "taiwan_strait",
    type: "alternative_sea_route",
    waypointChokepointIds: [],
    addedTransitDays: 1,
    addedCostMultiplier: 1.04,
    capacityConstraintTonnage: null,
    suitableCargoTypes: ["container", "tanker", "bulk", "roro"],
    activationThreshold: "partial_closure",
    notes: "Between Miyako Island and Okinawa; monitored by Japan Maritime Self-Defense Force"
  },
  // ── Dover Strait bypasses ─────────────────────────────────────────────
  {
    id: "north_sea_scotland",
    name: "North Sea / Scotland Route",
    primaryChokepointId: "dover_strait",
    type: "alternative_sea_route",
    waypointChokepointIds: [],
    addedTransitDays: 1,
    addedCostMultiplier: 1.02,
    capacityConstraintTonnage: null,
    suitableCargoTypes: ["container", "tanker", "bulk", "roro"],
    activationThreshold: "partial_closure",
    notes: "Northern route around Scotland; minor added distance for most vessel types"
  },
  {
    id: "channel_tunnel",
    name: "Channel Tunnel (Rail Freight)",
    primaryChokepointId: "dover_strait",
    type: "modal_shift",
    waypointChokepointIds: [],
    addedTransitDays: 1,
    addedCostMultiplier: 1.35,
    capacityConstraintTonnage: 0.5,
    suitableCargoTypes: ["container"],
    activationThreshold: "full_closure",
    notes: "Rail freight via Eurotunnel; 0.5 Mt/yr capacity; containers only; requires full closure to justify modal shift"
  },
  // ── Strait of Gibraltar ───────────────────────────────────────────────
  {
    id: "gibraltar_no_bypass",
    name: "No Practical Bypass",
    primaryChokepointId: "gibraltar",
    type: "alternative_sea_route",
    waypointChokepointIds: [],
    addedTransitDays: 0,
    addedCostMultiplier: 1,
    capacityConstraintTonnage: null,
    suitableCargoTypes: [],
    activationThreshold: "full_closure",
    notes: "No practical bypass \u2014 all Atlantic-Med traffic transits here"
  },
  // ── Cape of Good Hope ─────────────────────────────────────────────────
  {
    id: "cape_of_good_hope_is_bypass",
    name: "Cape of Good Hope (Is a Bypass Route)",
    primaryChokepointId: "cape_of_good_hope",
    type: "alternative_sea_route",
    waypointChokepointIds: [],
    addedTransitDays: 0,
    addedCostMultiplier: 1,
    capacityConstraintTonnage: null,
    suitableCargoTypes: [],
    activationThreshold: "full_closure",
    notes: "Cape of Good Hope IS a bypass route for Suez/Bab-el-Mandeb \u2014 no secondary bypass available"
  },
  // ── Korea Strait bypasses ─────────────────────────────────────────────
  {
    id: "la_perouse_strait",
    name: "La Perouse Strait (Soya Strait)",
    primaryChokepointId: "korea_strait",
    type: "alternative_sea_route",
    waypointChokepointIds: [],
    addedTransitDays: 2,
    addedCostMultiplier: 1.06,
    capacityConstraintTonnage: null,
    suitableCargoTypes: ["container", "tanker", "bulk"],
    activationThreshold: "partial_closure",
    notes: "Seasonal \u2014 limited ice conditions Nov-Apr"
  },
  {
    id: "tsugaru_strait",
    name: "Tsugaru Strait",
    primaryChokepointId: "korea_strait",
    type: "alternative_sea_route",
    waypointChokepointIds: [],
    addedTransitDays: 1,
    addedCostMultiplier: 1.04,
    capacityConstraintTonnage: null,
    suitableCargoTypes: ["container", "tanker", "bulk", "roro"],
    activationThreshold: "partial_closure",
    notes: "Between Hokkaido and Honshu; narrower but ice-free year-round"
  },
  // ── Kerch Strait bypasses ─────────────────────────────────────────────
  {
    id: "black_sea_western_ports",
    name: "Black Sea Western Ports Reroute",
    primaryChokepointId: "kerch_strait",
    type: "alternative_sea_route",
    waypointChokepointIds: [],
    addedTransitDays: 3,
    addedCostMultiplier: 1.2,
    capacityConstraintTonnage: null,
    suitableCargoTypes: ["tanker", "bulk"],
    activationThreshold: "partial_closure",
    notes: "Reroute to Constanta/Odesa/Varna; effectively blockaded since Feb 2022"
  },
  {
    id: "ukraine_rail_reroute",
    name: "Ukraine Rail Reroute",
    primaryChokepointId: "kerch_strait",
    type: "land_bridge",
    waypointChokepointIds: [],
    addedTransitDays: 5,
    addedCostMultiplier: 1.4,
    capacityConstraintTonnage: 2,
    suitableCargoTypes: ["container"],
    activationThreshold: "full_closure",
    notes: "Rail through Ukraine to EU entry points; 2 Mt/yr capacity; significant geopolitical risk"
  },
  // ── Lombok Strait bypasses ────────────────────────────────────────────
  {
    id: "sunda_strait_for_lombok",
    name: "Sunda Strait",
    primaryChokepointId: "lombok_strait",
    type: "alternative_sea_route",
    waypointChokepointIds: [],
    addedTransitDays: 1,
    addedCostMultiplier: 1.03,
    capacityConstraintTonnage: null,
    suitableCargoTypes: ["tanker", "bulk", "container"],
    activationThreshold: "partial_closure",
    notes: "Shallower than Lombok; suitable for most vessel classes except VLCCs"
  },
  {
    id: "ombai_strait",
    name: "Ombai Strait",
    primaryChokepointId: "lombok_strait",
    type: "alternative_sea_route",
    waypointChokepointIds: [],
    addedTransitDays: 1,
    addedCostMultiplier: 1.02,
    capacityConstraintTonnage: null,
    suitableCargoTypes: ["tanker", "bulk"],
    activationThreshold: "partial_closure",
    notes: "Deep-water passage between Alor and Timor; primarily tanker and bulk"
  }
];
var BYPASS_CORRIDORS_BY_CHOKEPOINT = BYPASS_CORRIDORS.reduce((acc, c) => {
  (acc[c.primaryChokepointId] ??= []).push(c);
  return acc;
}, {});

// server/worldmonitor/supply-chain/v1/get-bypass-options.ts
init_redis();
var SCORE_RISK_WEIGHT = 0.6;
var SCORE_COST_WEIGHT = 0.4;
async function getBypassOptions(ctx, req) {
  const isPro = await isCallerPremium(ctx.request);
  const empty = {
    chokepointId: req.chokepointId,
    cargoType: req.cargoType || "container",
    closurePct: req.closurePct ?? 100,
    options: [],
    primaryChokepointWarRiskTier: "WAR_RISK_TIER_UNSPECIFIED",
    fetchedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  if (!isPro) return empty;
  const chokepointId = req.chokepointId?.trim().toLowerCase();
  if (!chokepointId) return empty;
  const cargoType = req.cargoType?.trim().toLowerCase() || "container";
  const closurePct = Math.max(0, Math.min(100, req.closurePct ?? 100));
  const corridors = BYPASS_CORRIDORS_BY_CHOKEPOINT[chokepointId] ?? [];
  const relevant = corridors.filter((c) => {
    if (c.suitableCargoTypes.length === 0) return false;
    if (!c.suitableCargoTypes.includes(cargoType)) return false;
    if (closurePct < 100 && c.activationThreshold === "full_closure") return false;
    return true;
  });
  const statusRaw = await getCachedJson(CHOKEPOINT_STATUS_KEY).catch(() => null);
  const tierMap = {};
  const scoreMap = {};
  for (const cp of statusRaw?.chokepoints ?? []) {
    if (cp.warRiskTier) tierMap[cp.id] = cp.warRiskTier;
    if (typeof cp.disruptionScore === "number") scoreMap[cp.id] = cp.disruptionScore;
  }
  const primaryChokepointWarRiskTier = tierMap[chokepointId] ?? "WAR_RISK_TIER_UNSPECIFIED";
  const options = relevant.map((c) => {
    const waypointScores = c.waypointChokepointIds.map((id) => scoreMap[id] ?? 0);
    const avgWaypointScore = waypointScores.length > 0 ? waypointScores.reduce((a, b) => a + b, 0) / waypointScores.length : 0;
    const liveScore = Math.max(0, Math.min(
      100,
      avgWaypointScore * SCORE_RISK_WEIGHT + (c.addedCostMultiplier - 1) * 100 * SCORE_COST_WEIGHT
    ));
    const maxTierKey = c.waypointChokepointIds.reduce((best, id) => {
      const t = tierMap[id] ?? "WAR_RISK_TIER_UNSPECIFIED";
      return (TIER_RANK[t] ?? 0) > (TIER_RANK[best] ?? 0) ? t : best;
    }, "WAR_RISK_TIER_UNSPECIFIED");
    return {
      id: c.id,
      name: c.name,
      type: c.type,
      addedTransitDays: c.addedTransitDays,
      addedCostMultiplier: c.addedCostMultiplier,
      capacityConstraintTonnage: String(c.capacityConstraintTonnage ?? 0),
      suitableCargoTypes: [...c.suitableCargoTypes],
      activationThreshold: c.activationThreshold,
      waypointChokepointIds: [...c.waypointChokepointIds],
      liveScore: Math.round(liveScore * 10) / 10,
      bypassWarRiskTier: maxTierKey,
      notes: c.notes
    };
  });
  options.sort((a, b) => a.liveScore - b.liveScore);
  return {
    chokepointId,
    cargoType,
    closurePct,
    options,
    primaryChokepointWarRiskTier,
    fetchedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
}

// server/worldmonitor/supply-chain/v1/get-country-cost-shock.ts
init_redis();

// server/worldmonitor/intelligence/v1/compute-energy-shock.ts
init_redis();

// shared/openapi-filter-param-contracts.json
var openapi_filter_param_contracts_default = {
  economicBlsSeriesIds: [
    "USPRIV",
    "ECIALLCIV"
  ],
  forecastDomains: [
    "conflict",
    "market",
    "supply_chain",
    "political",
    "military",
    "cyber",
    "infrastructure"
  ],
  infrastructureTemporalBaselineTypes: [
    "military_flights",
    "vessels",
    "protests",
    "news",
    "ais_gaps",
    "satellite_fires"
  ],
  intelligenceChokepointIds: [
    "hormuz_strait",
    "malacca_strait",
    "suez",
    "bab_el_mandeb"
  ],
  intelligenceFuelModes: [
    "oil",
    "gas",
    "both"
  ],
  marketCountryStockIndexes: {
    US: {
      symbol: "^GSPC",
      name: "S&P 500"
    },
    GB: {
      symbol: "^FTSE",
      name: "FTSE 100"
    },
    DE: {
      symbol: "^GDAXI",
      name: "DAX"
    },
    FR: {
      symbol: "^FCHI",
      name: "CAC 40"
    },
    JP: {
      symbol: "^N225",
      name: "Nikkei 225"
    },
    CN: {
      symbol: "000001.SS",
      name: "SSE Composite"
    },
    HK: {
      symbol: "^HSI",
      name: "Hang Seng"
    },
    IN: {
      symbol: "^BSESN",
      name: "BSE Sensex"
    },
    KR: {
      symbol: "^KS11",
      name: "KOSPI"
    },
    TW: {
      symbol: "^TWII",
      name: "TAIEX"
    },
    AU: {
      symbol: "^AXJO",
      name: "ASX 200"
    },
    BR: {
      symbol: "^BVSP",
      name: "Bovespa"
    },
    CA: {
      symbol: "^GSPTSE",
      name: "TSX Composite"
    },
    MX: {
      symbol: "^MXX",
      name: "IPC Mexico"
    },
    AR: {
      symbol: "^MERV",
      name: "MERVAL"
    },
    RU: {
      symbol: "IMOEX.ME",
      name: "MOEX"
    },
    ZA: {
      symbol: "^J203.JO",
      name: "JSE All Share"
    },
    SA: {
      symbol: "^TASI.SR",
      name: "Tadawul"
    },
    AE: {
      symbol: "DFMGI.AE",
      name: "DFM General"
    },
    IL: {
      symbol: "^TA125.TA",
      name: "TA-125"
    },
    TR: {
      symbol: "XU100.IS",
      name: "BIST 100"
    },
    PL: {
      symbol: "^WIG20",
      name: "WIG 20"
    },
    NL: {
      symbol: "^AEX",
      name: "AEX"
    },
    CH: {
      symbol: "^SSMI",
      name: "SMI"
    },
    ES: {
      symbol: "^IBEX",
      name: "IBEX 35"
    },
    IT: {
      symbol: "FTSEMIB.MI",
      name: "FTSE MIB"
    },
    SE: {
      symbol: "^OMX",
      name: "OMX Stockholm 30"
    },
    NO: {
      symbol: "^OSEAX",
      name: "Oslo All Share"
    },
    SG: {
      symbol: "^STI",
      name: "STI"
    },
    TH: {
      symbol: "^SET.BK",
      name: "SET"
    },
    MY: {
      symbol: "^KLSE",
      name: "KLCI"
    },
    ID: {
      symbol: "^JKSE",
      name: "Jakarta Composite"
    },
    PH: {
      symbol: "PSEI.PS",
      name: "PSEi"
    },
    NZ: {
      symbol: "^NZ50",
      name: "NZX 50"
    },
    EG: {
      symbol: "^EGX30.CA",
      name: "EGX 30"
    },
    CL: {
      symbol: "^IPSA",
      name: "IPSA"
    },
    PE: {
      symbol: "^SPBLPGPT",
      name: "S&P Lima"
    },
    AT: {
      symbol: "^ATX",
      name: "ATX"
    },
    BE: {
      symbol: "^BFX",
      name: "BEL 20"
    },
    FI: {
      symbol: "^OMXH25",
      name: "OMX Helsinki 25"
    },
    DK: {
      symbol: "^OMXC25",
      name: "OMX Copenhagen 25"
    },
    IE: {
      symbol: "^ISEQ",
      name: "ISEQ Overall"
    },
    PT: {
      symbol: "^PSI20",
      name: "PSI 20"
    },
    CZ: {
      symbol: "^PX",
      name: "PX Prague"
    },
    HU: {
      symbol: "^BUX",
      name: "BUX"
    }
  },
  militaryBaseTypes: [
    "us-nato",
    "china",
    "russia",
    "uk",
    "france",
    "india",
    "italy",
    "uae",
    "turkey",
    "japan",
    "other"
  ],
  militaryBaseKinds: [
    "base",
    "airfield",
    "naval_base",
    "military",
    "barracks",
    "bunker",
    "trench",
    "training_area",
    "checkpoint",
    "shelter",
    "ammunition",
    "office",
    "obstacle_course",
    "nuclear_explosion_site",
    "range"
  ],
  newsSummarizeArticleCacheKeyPattern: "^summary:v\\d+:[a-z0-9:_-]{3,120}$",
  predictionMarketTechCategories: [
    "ai",
    "tech",
    "crypto",
    "science"
  ],
  predictionMarketFinanceCategories: [
    "economy",
    "fed",
    "inflation",
    "interest-rates",
    "recession",
    "trade",
    "tariffs",
    "debt-ceiling"
  ],
  researchTechEventTypes: [
    "all",
    "conference",
    "earnings",
    "ipo",
    "other"
  ],
  researchHackerNewsFeedTypes: [
    "top",
    "new",
    "best",
    "ask",
    "show",
    "job"
  ],
  tradeComtradeCmdCodePattern: "^\\d{4,6}$"
};

// server/worldmonitor/intelligence/v1/_shock-compute.ts
var GULF_PARTNER_CODES = /* @__PURE__ */ new Set(["682", "784", "368", "414", "364"]);
var VALID_CHOKEPOINTS = new Set(openapi_filter_param_contracts_default.intelligenceChokepointIds);
var VALID_FUEL_MODES = new Set(openapi_filter_param_contracts_default.intelligenceFuelModes);
var CHOKEPOINT_DISPLAY_NAMES = {
  hormuz_strait: "Strait of Hormuz",
  malacca_strait: "Strait of Malacca",
  suez: "Suez Canal",
  bab_el_mandeb: "Bab el-Mandeb"
};
function chokepointLabel(id) {
  return CHOKEPOINT_DISPLAY_NAMES[id] ?? id.replace(/_/g, " ");
}
var regionNames = null;
try {
  regionNames = new Intl.DisplayNames(["en"], { type: "region" });
} catch {
  regionNames = null;
}
function countryLabel(iso2) {
  const resolved = regionNames?.of(iso2);
  return resolved && resolved !== iso2 ? resolved : iso2;
}
var CHOKEPOINT_EXPOSURE = {
  hormuz_strait: 1,
  bab_el_mandeb: 1,
  suez: 0.6,
  malacca_strait: 0.7
};
var REFINERY_YIELD = {
  Gasoline: 0.44,
  Diesel: 0.3,
  "Jet fuel": 0.1,
  LPG: 0.05
};
var REFINERY_YIELD_BASIS = "refinery yields: US-average EIA basis, gasoline 44%, diesel 30%, jet 10%, LPG 5%";
function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}
function computeGulfShare(flows) {
  let totalImports = 0;
  let gulfImports = 0;
  for (const flow of flows) {
    const val = Number.isFinite(flow.tradeValueUsd) ? flow.tradeValueUsd : 0;
    if (val <= 0) continue;
    totalImports += val;
    if (GULF_PARTNER_CODES.has(String(flow.partnerCode))) {
      gulfImports += val;
    }
  }
  if (totalImports === 0) return { share: 0, hasData: false };
  return { share: gulfImports / totalImports, hasData: true };
}
var EFFECTIVE_COVER_DAYS_CAP = 730;
function computeEffectiveCoverDays(daysOfCover, netExporter, crudeLossKbd, crudeImportsKbd) {
  if (netExporter) return -1;
  if (daysOfCover > 0 && crudeLossKbd > 0 && crudeImportsKbd > 0) {
    const raw = Math.round(daysOfCover / (crudeLossKbd / crudeImportsKbd));
    return Math.min(raw, EFFECTIVE_COVER_DAYS_CAP);
  }
  return Math.min(daysOfCover, EFFECTIVE_COVER_DAYS_CAP);
}
function deriveCoverageLevel(jodiOil, comtrade, ieaStocksCoverage, degraded) {
  if (!jodiOil) return "unsupported";
  if (!comtrade) return "partial";
  if (ieaStocksCoverage === false || degraded) return "partial";
  return "full";
}
function deriveChokepointConfidence(liveFlowRatio, degraded) {
  if (degraded || liveFlowRatio === null || !Number.isFinite(liveFlowRatio)) return "none";
  return "high";
}
function buildAssessment(code, chokepointId, dataAvailable, gulfCrudeShare, effectiveCoverDays, daysOfCover, disruptionPct, products, coverageLevel, degraded, ieaStocksCoverage, comtradeCoverage) {
  const country = countryLabel(code);
  const cp = chokepointLabel(chokepointId);
  if (coverageLevel === "unsupported" || !dataAvailable) {
    return `Insufficient import data for ${country} to model ${cp} exposure.`;
  }
  if (effectiveCoverDays === -1) {
    return `${country} is a net oil exporter; ${cp} disruption affects export revenue, not domestic supply.`;
  }
  if (gulfCrudeShare < 0.1 && comtradeCoverage !== false) {
    return `${country} has low Gulf crude dependence (${Math.round(gulfCrudeShare * 100)}%); ${cp} disruption has limited direct impact.`;
  }
  const degradedNote = degraded ? " (live flow data unavailable, using historical baseline)" : "";
  const ieaCoverText = ieaStocksCoverage === false ? "unknown" : `${daysOfCover} days`;
  if (effectiveCoverDays >= EFFECTIVE_COVER_DAYS_CAP) {
    return `With ${daysOfCover} days IEA cover, ${code} is indefinitely bridgeable against a ${disruptionPct}% ${chokepointId} disruption at this deficit rate${degradedNote}.`;
  }
  if (effectiveCoverDays > 90) {
    return `With ${daysOfCover} days IEA cover, ${country} can bridge a ${disruptionPct}% ${cp} disruption for ~${effectiveCoverDays} days${degradedNote}.`;
  }
  const worst = products.reduce(
    (best, p) => p.deficitPct > best.deficitPct ? p : best,
    { product: "", deficitPct: 0 }
  );
  const worstDeficit = worst.deficitPct;
  const worstProduct = worst.product.toLowerCase();
  const proxyNote = comtradeCoverage === false ? ". Gulf share proxied at 40%" : "";
  return `${country} faces ${worstDeficit.toFixed(1)}% ${worstProduct} deficit under ${disruptionPct}% ${cp} disruption; IEA cover: ${ieaCoverText}${proxyNote}${degradedNote}.`;
}
var CHOKEPOINT_LNG_EXPOSURE = {
  hormuz_strait: 0.3,
  malacca_strait: 0.5,
  suez: 0.2,
  bab_el_mandeb: 0.2
};
var EU_GAS_STORAGE_COUNTRIES = /* @__PURE__ */ new Set([
  "AT",
  "BE",
  "BG",
  "HR",
  "CY",
  "CZ",
  "DK",
  "EE",
  "FI",
  "FR",
  "DE",
  "GR",
  "HU",
  "IE",
  "IT",
  "LV",
  "LT",
  "LU",
  "MT",
  "NL",
  "PL",
  "PT",
  "RO",
  "SK",
  "SI",
  "ES",
  "SE",
  "GB"
]);
var DEFAULT_FUEL_MODE = openapi_filter_param_contracts_default.intelligenceFuelModes[0] ?? "oil";
function parseFuelMode(raw) {
  const v = (raw ?? "").trim().toLowerCase();
  if (VALID_FUEL_MODES.has(v)) return v;
  return DEFAULT_FUEL_MODE;
}
function computeGasDisruption(lngImportsTj, totalDemandTj, chokepointId, disruptionPct, liveFlowRatio) {
  const baseExposure = CHOKEPOINT_LNG_EXPOSURE[chokepointId] ?? 0;
  const exposure = liveFlowRatio != null ? baseExposure * liveFlowRatio : baseExposure;
  const lngDisruptionTj = lngImportsTj * exposure * (disruptionPct / 100);
  const deficitPct = totalDemandTj > 0 ? clamp(lngDisruptionTj / totalDemandTj * 100, 0, 100) : 0;
  return {
    lngDisruptionTj: Math.round(lngDisruptionTj * 10) / 10,
    deficitPct: Math.round(deficitPct * 10) / 10
  };
}
function computeGasBufferDays(gasTwh, lngDisruptionTj) {
  if (lngDisruptionTj <= 0 || gasTwh <= 0) return 0;
  const storedTj = gasTwh * 3600;
  const dailyLossTj = lngDisruptionTj / 30;
  return Math.round(storedTj / dailyLossTj);
}
function buildGasAssessment(code, chokepointId, dataAvailable, lngImportsTj, lngShareOfImports, deficitPct, bufferDays, disruptionPct, hasStorage) {
  if (!dataAvailable) {
    return `Insufficient gas import data for ${code} to model ${chokepointId} LNG exposure.`;
  }
  if (lngImportsTj === 0) {
    return `${code} imports gas via pipeline only (no LNG); ${chokepointId} disruption has no direct LNG impact.`;
  }
  if (lngShareOfImports < 0.1) {
    return `${code} has low LNG dependence (${Math.round(lngShareOfImports * 100)}% of gas imports via LNG); ${chokepointId} disruption has limited gas impact.`;
  }
  if (hasStorage && bufferDays > 90) {
    return `${code} has ${bufferDays} days of gas storage buffer under ${disruptionPct}% ${chokepointId} LNG disruption.`;
  }
  const storageNote = hasStorage ? `; gas storage covers ~${bufferDays} days` : "";
  return `${code} faces ${deficitPct.toFixed(1)}% gas supply deficit under ${disruptionPct}% ${chokepointId} LNG disruption${storageNote}.`;
}

// server/worldmonitor/intelligence/v1/_comtrade-reporters.ts
function buildIso2ToComtrade() {
  const iso2ToComtrade = {};
  for (const [unCode, iso2] of Object.entries(un_to_iso2_default)) {
    iso2ToComtrade[iso2] = unCode;
  }
  for (const [iso2, reporterCode] of Object.entries(comtrade_reporter_overrides_default)) {
    iso2ToComtrade[iso2] = reporterCode;
  }
  return Object.freeze(iso2ToComtrade);
}
var ISO2_TO_COMTRADE = buildIso2ToComtrade();

// server/worldmonitor/intelligence/v1/compute-energy-shock.ts
var SHOCK_CACHE_TTL = 300;
var CP_TO_PORTWATCH = {
  hormuz_strait: "hormuz_strait",
  bab_el_mandeb: "bab_el_mandeb",
  suez: "suez",
  malacca_strait: "malacca_strait"
};
var PROXIED_GULF_SHARE = 0.4;
function n(v) {
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}
async function getGulfCrudeShare(countryCode) {
  const numericCode = ISO2_TO_COMTRADE[countryCode];
  if (!numericCode) return { share: 0, hasData: false };
  const key = `comtrade:flows:${numericCode}:2709`;
  const result = await getCachedJson(key, true);
  if (!result) return { share: 0, hasData: false };
  const flowsResult = result;
  const flows = Array.isArray(result) ? result : flowsResult.flows ?? [];
  if (flows.length === 0) return { share: 0, hasData: false };
  return computeGulfShare(flows);
}
async function computeEnergyShockScenario(_ctx, req) {
  const code = req.countryCode?.trim().toUpperCase() ?? "";
  const chokepointId = req.chokepointId?.trim().toLowerCase() ?? "";
  const disruptionPct = clamp(Math.round(req.disruptionPct ?? 0), 10, 100);
  const fuelMode = parseFuelMode(req.fuelMode);
  const needsOil = fuelMode === "oil" || fuelMode === "both";
  const needsGas = fuelMode === "gas" || fuelMode === "both";
  const EMPTY = {
    countryCode: code,
    chokepointId,
    disruptionPct,
    gulfCrudeShare: 0,
    crudeLossKbd: 0,
    products: [],
    effectiveCoverDays: 0,
    assessment: `Insufficient data to compute shock scenario for ${code}.`,
    dataAvailable: false,
    jodiOilCoverage: false,
    comtradeCoverage: false,
    ieaStocksCoverage: false,
    portwatchCoverage: false,
    coverageLevel: "unsupported",
    limitations: [],
    degraded: false,
    chokepointConfidence: "none",
    liveFlowRatio: void 0,
    gasImpact: void 0
  };
  if (!code || code.length !== 2) return EMPTY;
  if (!VALID_CHOKEPOINTS.has(chokepointId)) {
    return {
      ...EMPTY,
      assessment: `Unknown chokepoint: ${chokepointId}. Valid chokepoints: hormuz_strait, malacca_strait, suez, bab_el_mandeb.`
    };
  }
  const chokepointFlowsRaw2 = await getCachedJson("energy:chokepoint-flows:v1", true).then((v) => v).catch(() => null);
  const portWatchKey = CP_TO_PORTWATCH[chokepointId];
  const cpEntry = portWatchKey ? chokepointFlowsRaw2?.[portWatchKey] ?? null : null;
  const degraded = !chokepointFlowsRaw2 || cpEntry == null || !Number.isFinite(cpEntry.flowRatio);
  const rawFlowRatio = !degraded && cpEntry != null && Number.isFinite(cpEntry.flowRatio) ? cpEntry.flowRatio : null;
  const liveFlowRatio = rawFlowRatio !== null ? clamp(rawFlowRatio, 0, 1.5) : null;
  const cacheKey = `energy:shock:v2:${code}:${chokepointId}:${disruptionPct}:${degraded ? "d" : "l"}:${fuelMode}`;
  const cached = await getCachedJson(cacheKey);
  if (cached) return cached;
  const [jodiOilResult, ieaStocksResult, gulfShareResult, emberResult, jodiGasResult, gasStorageResult] = await Promise.allSettled([
    getCachedJson(`energy:jodi-oil:v1:${code}`, true),
    getCachedJson(`energy:iea-oil-stocks:v1:${code}`, true),
    getGulfCrudeShare(code),
    getCachedJson(`energy:ember:v1:${code}`, true),
    needsGas ? getCachedJson(`energy:jodi-gas:v1:${code}`, true) : Promise.resolve(null),
    needsGas && EU_GAS_STORAGE_COUNTRIES.has(code) ? getCachedJson(`energy:gas-storage:v1:${code}`, true) : Promise.resolve(null)
  ]);
  const jodiOil = jodiOilResult.status === "fulfilled" ? jodiOilResult.value : null;
  const ieaStocks = ieaStocksResult.status === "fulfilled" ? ieaStocksResult.value : null;
  const { share: rawGulfShare, hasData: comtradeHasData } = gulfShareResult.status === "fulfilled" ? gulfShareResult.value : { share: 0, hasData: false };
  const emberData = emberResult.status === "fulfilled" ? emberResult.value : null;
  const jodiGas = jodiGasResult.status === "fulfilled" ? jodiGasResult.value : null;
  const gasStorageData = gasStorageResult.status === "fulfilled" ? gasStorageResult.value : null;
  const baseExposure = CHOKEPOINT_EXPOSURE[chokepointId] ?? 1;
  const exposureMult = liveFlowRatio !== null ? baseExposure * liveFlowRatio : baseExposure;
  const jodiOilCoverage = jodiOil != null;
  const comtradeCoverage = comtradeHasData;
  const ieaStocksCoverage = ieaStocks != null && ieaStocks.anomaly !== true && (ieaStocks.netExporter === true || ieaStocks.daysOfCover != null && Number.isFinite(ieaStocks.daysOfCover) && ieaStocks.daysOfCover >= 0);
  const portwatchCoverage = liveFlowRatio !== null;
  const coverageLevel = deriveCoverageLevel(jodiOilCoverage, comtradeCoverage, ieaStocksCoverage, degraded);
  const limitations = [];
  if (!comtradeCoverage && jodiOilCoverage) {
    limitations.push("Gulf crude share proxied at 40% (no Comtrade data)");
  }
  if (!ieaStocksCoverage) {
    limitations.push("IEA strategic stock data unavailable");
  }
  limitations.push(REFINERY_YIELD_BASIS);
  if (degraded) {
    limitations.push("PortWatch flow data unavailable, using historical baseline multipliers");
  }
  const fossilShare = typeof emberData?.fossilShare === "number" ? emberData.fossilShare : null;
  if (fossilShare !== null && fossilShare > 70) {
    limitations.push("high fossil grid dependency: limited electricity substitution capacity");
  }
  if (needsOil) {
    const sprRegistryRaw = await getCachedJson(SPR_POLICIES_KEY, true).catch(() => null);
    const sprPolicies = sprRegistryRaw?.policies;
    const sprPolicy = sprPolicies?.[code];
    if (sprPolicy) {
      if (sprPolicy.regime === "government_spr" && !sprPolicy.ieaMember) {
        limitations.push(`strategic reserves: ${sprPolicy.regime} (${sprPolicy.operator ?? "state-run"}, ${sprPolicy.capacityMb ?? "?"}Mb capacity)`);
      }
    } else {
      limitations.push("strategic reserve policy: not classified for this country");
    }
  }
  const effectiveGulfShare = !comtradeCoverage ? PROXIED_GULF_SHARE : rawGulfShare;
  const gulfCrudeShare = effectiveGulfShare * exposureMult;
  const crudeImportsKbd = n(jodiOil?.crude?.importsKbd);
  const crudeLossKbd = crudeImportsKbd * gulfCrudeShare * (disruptionPct / 100);
  const productDefs = [
    { name: "Gasoline", demand: n(jodiOil?.gasoline?.demandKbd) },
    { name: "Diesel", demand: n(jodiOil?.diesel?.demandKbd) },
    { name: "Jet fuel", demand: n(jodiOil?.jet?.demandKbd) },
    { name: "LPG", demand: n(jodiOil?.lpg?.demandKbd) }
  ];
  const products = productDefs.filter((p) => p.demand > 0).map((p) => {
    const yieldFactor = REFINERY_YIELD[p.name] ?? 0.2;
    const outputLossKbd = crudeLossKbd * yieldFactor;
    const deficitPct = clamp(outputLossKbd / p.demand * 100, 0, 100);
    return {
      product: p.name,
      outputLossKbd: Math.round(outputLossKbd * 10) / 10,
      // Round to 1 decimal to match outputLossKbd precision; raw JODI values like
      // 136.5629 kbd wasted display space with fake precision (see #2971).
      demandKbd: Math.round(p.demand * 10) / 10,
      deficitPct: Math.round(deficitPct * 10) / 10
    };
  });
  const rawDaysOfCover = n(ieaStocks?.daysOfCover);
  const daysOfCover = ieaStocksCoverage ? rawDaysOfCover : 0;
  const netExporter = ieaStocksCoverage && ieaStocks?.netExporter === true;
  const effectiveCoverDays = computeEffectiveCoverDays(daysOfCover, netExporter, crudeLossKbd, crudeImportsKbd);
  const dataAvailable = jodiOilCoverage;
  const chokepointConfidence = deriveChokepointConfidence(liveFlowRatio, degraded);
  const assessment = buildAssessment(
    code,
    chokepointId,
    dataAvailable,
    gulfCrudeShare,
    effectiveCoverDays,
    daysOfCover,
    disruptionPct,
    products,
    coverageLevel,
    degraded,
    ieaStocksCoverage,
    comtradeCoverage
  );
  let gasImpact;
  if (needsGas && jodiGas) {
    const lngImportsTj = n(jodiGas.lngImportsTj);
    const lngShareOfImports = n(jodiGas.lngShareOfImports);
    const totalDemandTj = n(jodiGas.totalDemandTj);
    const { lngDisruptionTj, deficitPct: gasDeficitPct } = computeGasDisruption(
      lngImportsTj,
      totalDemandTj,
      chokepointId,
      disruptionPct,
      liveFlowRatio
    );
    let storage;
    let bufferDays = 0;
    const isEu = EU_GAS_STORAGE_COUNTRIES.has(code);
    if (isEu && gasStorageData) {
      const gasTwh = n(gasStorageData.gasTwh);
      bufferDays = computeGasBufferDays(gasTwh, lngDisruptionTj);
      storage = {
        fillPct: n(gasStorageData.fillPct),
        gasTwh,
        bufferDays,
        trend: gasStorageData.trend ?? "",
        date: gasStorageData.date ?? "",
        scope: "europe"
      };
    }
    const gasDataAvailable = jodiGas != null;
    gasImpact = {
      lngShareOfImports: Math.round(lngShareOfImports * 1e3) / 1e3,
      lngImportsTj,
      lngDisruptionTj,
      totalDemandTj,
      deficitPct: gasDeficitPct,
      dataAvailable: gasDataAvailable,
      assessment: buildGasAssessment(
        code,
        chokepointId,
        gasDataAvailable,
        lngImportsTj,
        lngShareOfImports,
        gasDeficitPct,
        bufferDays,
        disruptionPct,
        storage != null
      ),
      storage,
      dataSource: isEu && gasStorageData ? "gie_daily" : "jodi_monthly"
    };
    if (gasDataAvailable) {
      limitations.push("LNG chokepoint exposure estimates based on global trade route shares");
    }
  }
  const response = {
    countryCode: code,
    chokepointId,
    disruptionPct,
    gulfCrudeShare: Math.round(gulfCrudeShare * 1e3) / 1e3,
    crudeLossKbd: Math.round(crudeLossKbd * 10) / 10,
    products,
    effectiveCoverDays,
    assessment,
    dataAvailable,
    jodiOilCoverage,
    comtradeCoverage,
    ieaStocksCoverage,
    portwatchCoverage,
    coverageLevel,
    limitations,
    degraded,
    chokepointConfidence,
    liveFlowRatio: liveFlowRatio !== null ? Math.round(liveFlowRatio * 1e3) / 1e3 : void 0,
    gasImpact
  };
  if (!needsOil && gasImpact) {
    response.assessment = gasImpact.assessment;
    response.dataAvailable = gasImpact.dataAvailable;
    response.coverageLevel = gasImpact.dataAvailable ? degraded ? "partial" : "full" : "unsupported";
    response.limitations = response.limitations.filter(
      (l) => !l.includes("refinery yield") && !l.includes("Gulf crude share") && !l.includes("IEA strategic stock")
    );
    response.gulfCrudeShare = 0;
    response.crudeLossKbd = 0;
    response.products = [];
    response.effectiveCoverDays = 0;
    response.jodiOilCoverage = false;
    response.comtradeCoverage = false;
    response.ieaStocksCoverage = false;
  }
  if (needsOil && needsGas && gasImpact?.dataAvailable && !jodiOilCoverage) {
    response.coverageLevel = "partial";
    response.dataAvailable = true;
  }
  const cacheTtl = degraded ? 300 : SHOCK_CACHE_TTL;
  await setCachedJson(cacheKey, response, cacheTtl);
  return response;
}

// server/worldmonitor/supply-chain/v1/get-country-cost-shock.ts
async function getCountryCostShock(ctx, req) {
  const isPro = await isCallerPremium(ctx.request);
  const empty = {
    iso2: req.iso2,
    chokepointId: req.chokepointId,
    hs2: req.hs2 || "27",
    supplyDeficitPct: 0,
    coverageDays: 0,
    warRiskPremiumBps: 0,
    warRiskTier: "WAR_RISK_TIER_UNSPECIFIED",
    hasEnergyModel: false,
    unavailableReason: "",
    fetchedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  if (!isPro) return empty;
  const iso2 = req.iso2?.trim().toUpperCase();
  const chokepointId = req.chokepointId?.trim().toLowerCase();
  const hs2 = req.hs2?.trim() || "27";
  if (!/^[A-Z]{2}$/.test(iso2 ?? "") || !chokepointId) {
    return { ...empty, iso2: iso2 ?? "", chokepointId: chokepointId ?? "" };
  }
  if (!/^\d{1,2}$/.test(hs2)) {
    return { ...empty, iso2: iso2 ?? "", chokepointId: chokepointId ?? "" };
  }
  const registry = CHOKEPOINT_REGISTRY.find((c) => c.id === chokepointId);
  const statusRaw = await getCachedJson(CHOKEPOINT_STATUS_KEY).catch(() => null);
  const cpStatus = statusRaw?.chokepoints?.find((c) => c.id === chokepointId);
  const warRiskTier = cpStatus?.warRiskTier ?? "WAR_RISK_TIER_NORMAL";
  const premiumBps = warRiskTierToInsurancePremiumBps(warRiskTier);
  const isEnergy = hs2 === "27";
  const hasEnergyModel = isEnergy && (registry?.shockModelSupported ?? false);
  let supplyDeficitPct = 0;
  let coverageDays = 0;
  let unavailableReason = "";
  if (!isEnergy) {
    unavailableReason = `Energy stockpile coverage (coverageDays) is available for HS 27 (mineral fuels) only. HS ${hs2} cost modelling deferred to v2.`;
  } else if (!hasEnergyModel) {
    unavailableReason = `Cost shock modelling for ${registry?.displayName ?? chokepointId} is not yet supported. Only Suez, Hormuz, Malacca, and Bab el-Mandeb have energy models in v1.`;
  } else {
    const outerKey = COST_SHOCK_KEY(iso2, chokepointId);
    const shock = await cachedFetchJson(
      outerKey,
      300,
      () => computeEnergyShockScenario(ctx, {
        countryCode: iso2,
        chokepointId,
        disruptionPct: 100,
        fuelMode: "oil"
      }).catch(() => null)
    ).catch(() => null);
    coverageDays = Math.max(0, shock?.effectiveCoverDays ?? 0);
    const productDeficits = shock?.products?.map((p) => p.deficitPct) ?? [];
    supplyDeficitPct = productDeficits.length > 0 ? productDeficits.reduce((a, b) => a + b, 0) / productDeficits.length : 0;
  }
  return {
    iso2,
    chokepointId,
    hs2,
    supplyDeficitPct: Math.round(supplyDeficitPct * 10) / 10,
    coverageDays,
    warRiskPremiumBps: premiumBps,
    warRiskTier,
    hasEnergyModel,
    unavailableReason,
    fetchedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
}

// server/worldmonitor/supply-chain/v1/get-country-products.ts
init_redis();
async function getCountryProducts(ctx, req) {
  const iso2 = (req.iso2 ?? "").trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(iso2)) {
    throw new ValidationError([{ field: "iso2", description: "iso2 must be a 2-letter uppercase ISO country code" }]);
  }
  const isPro = await isCallerPremium(ctx.request);
  const empty = { iso2, products: [], fetchedAt: "" };
  if (!isPro) return empty;
  const key = `comtrade:bilateral-hs4:${iso2}:v1`;
  const payload = await getCachedJson(key, true).catch(() => null);
  if (payload?.products?.length) {
    return {
      iso2,
      products: payload.products,
      fetchedAt: payload.fetchedAt ?? ""
    };
  }
  const lazy = await lazyFetchBilateralHs4(iso2).catch(() => null);
  if (lazy?.products?.length) {
    return {
      iso2,
      products: lazy.products,
      fetchedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  return empty;
}

// server/worldmonitor/supply-chain/v1/get-multi-sector-cost-shock.ts
init_redis();

// server/_shared/chokepoint-registry.ts
var CHOKEPOINT_REGISTRY2 = [
  {
    id: "suez",
    displayName: "Suez Canal",
    geoId: "suez",
    relayName: "Suez Canal",
    portwatchName: "Suez Canal",
    corridorRiskName: "Suez",
    baselineId: "suez",
    shockModelSupported: true,
    routeIds: ["china-europe-suez", "china-us-east-suez", "gulf-europe-oil", "qatar-europe-lng", "singapore-med", "india-europe"],
    lat: 30.5,
    lon: 32.3
  },
  {
    id: "malacca_strait",
    displayName: "Strait of Malacca",
    geoId: "malacca_strait",
    relayName: "Malacca Strait",
    portwatchName: "Malacca Strait",
    corridorRiskName: "Malacca",
    baselineId: "malacca",
    shockModelSupported: true,
    routeIds: ["china-europe-suez", "china-us-east-suez", "gulf-asia-oil", "qatar-asia-lng", "india-se-asia", "china-africa", "cpec-route"],
    lat: 2.5,
    lon: 101.5
  },
  {
    id: "hormuz_strait",
    displayName: "Strait of Hormuz",
    geoId: "hormuz_strait",
    relayName: "Strait of Hormuz",
    portwatchName: "Strait of Hormuz",
    corridorRiskName: "Hormuz",
    baselineId: "hormuz",
    shockModelSupported: true,
    routeIds: ["gulf-europe-oil", "gulf-asia-oil", "qatar-europe-lng", "qatar-asia-lng", "gulf-americas-cape"],
    lat: 26.5,
    lon: 56.5
  },
  {
    id: "bab_el_mandeb",
    displayName: "Bab el-Mandeb",
    geoId: "bab_el_mandeb",
    relayName: "Bab el-Mandeb Strait",
    portwatchName: "Bab el-Mandeb Strait",
    corridorRiskName: "Bab el-Mandeb",
    baselineId: "babelm",
    shockModelSupported: true,
    routeIds: ["china-europe-suez", "china-us-east-suez", "gulf-europe-oil", "qatar-europe-lng", "singapore-med", "india-europe"],
    lat: 12.5,
    lon: 43.3
  },
  {
    id: "panama",
    displayName: "Panama Canal",
    geoId: "panama",
    relayName: "Panama Canal",
    portwatchName: "Panama Canal",
    corridorRiskName: "Panama",
    baselineId: "panama",
    shockModelSupported: false,
    routeIds: ["china-us-east-panama", "panama-transit"],
    lat: 9.1,
    lon: -79.7
  },
  {
    id: "taiwan_strait",
    displayName: "Taiwan Strait",
    geoId: "taiwan_strait",
    relayName: "Taiwan Strait",
    portwatchName: "Taiwan Strait",
    corridorRiskName: "Taiwan",
    baselineId: null,
    shockModelSupported: false,
    routeIds: ["china-us-west", "intra-asia-container"],
    lat: 24,
    lon: 119.5
  },
  {
    id: "cape_of_good_hope",
    displayName: "Cape of Good Hope",
    geoId: "cape_of_good_hope",
    relayName: "Cape of Good Hope",
    portwatchName: "Cape of Good Hope",
    corridorRiskName: "Cape of Good Hope",
    baselineId: null,
    shockModelSupported: false,
    routeIds: ["brazil-china-bulk", "gulf-americas-cape", "asia-europe-cape"],
    lat: -34.36,
    lon: 18.49
  },
  {
    id: "gibraltar",
    displayName: "Strait of Gibraltar",
    geoId: "gibraltar",
    relayName: "Gibraltar Strait",
    portwatchName: "Gibraltar Strait",
    corridorRiskName: null,
    baselineId: null,
    shockModelSupported: false,
    routeIds: ["gulf-europe-oil", "singapore-med", "india-europe", "asia-europe-cape"],
    lat: 35.9,
    lon: -5.6
  },
  {
    id: "bosphorus",
    displayName: "Bosporus Strait",
    geoId: "bosphorus",
    relayName: "Bosporus Strait",
    portwatchName: "Bosporus Strait",
    corridorRiskName: null,
    baselineId: "turkish",
    shockModelSupported: false,
    routeIds: ["russia-med-oil"],
    lat: 41.1,
    lon: 29
  },
  {
    id: "korea_strait",
    displayName: "Korea Strait",
    geoId: "korea_strait",
    relayName: "Korea Strait",
    portwatchName: "Korea Strait",
    corridorRiskName: null,
    baselineId: null,
    shockModelSupported: false,
    routeIds: [],
    lat: 34,
    lon: 129
  },
  {
    id: "dover_strait",
    displayName: "Dover Strait",
    geoId: "dover_strait",
    relayName: "Dover Strait",
    portwatchName: "Dover Strait",
    corridorRiskName: null,
    baselineId: "danish",
    shockModelSupported: false,
    routeIds: [],
    lat: 51,
    lon: 1.5
  },
  {
    id: "kerch_strait",
    displayName: "Kerch Strait",
    geoId: "kerch_strait",
    relayName: "Kerch Strait",
    portwatchName: "Kerch Strait",
    corridorRiskName: null,
    baselineId: null,
    shockModelSupported: false,
    routeIds: [],
    lat: 45.3,
    lon: 36.6
  },
  {
    id: "lombok_strait",
    displayName: "Lombok Strait",
    geoId: "lombok_strait",
    relayName: "Lombok Strait",
    portwatchName: "Lombok Strait",
    corridorRiskName: null,
    baselineId: null,
    shockModelSupported: false,
    routeIds: [],
    lat: -8.5,
    lon: 115.7
  }
];
var CANONICAL_CHOKEPOINT_IDS2 = new Set(CHOKEPOINT_REGISTRY2.map((c) => c.id));
var SHOCK_MODEL_CHOKEPOINTS2 = CHOKEPOINT_REGISTRY2.filter((c) => c.shockModelSupported);

// server/_shared/bypass-corridors.ts
var BYPASS_CORRIDORS2 = [
  // ── Suez Canal bypasses ────────────────────────────────────────────────
  {
    id: "suez_cape_of_good_hope",
    name: "Cape of Good Hope Route",
    primaryChokepointId: "suez",
    type: "alternative_sea_route",
    waypointChokepointIds: ["cape_of_good_hope"],
    addedTransitDays: 12,
    addedCostMultiplier: 1.18,
    capacityConstraintTonnage: null,
    suitableCargoTypes: ["container", "tanker", "bulk", "roro"],
    activationThreshold: "partial_closure",
    notes: "Primary diversion route for Asia-Europe traffic avoiding the Red Sea"
  },
  {
    id: "sumed_pipeline",
    name: "SUMED Pipeline",
    primaryChokepointId: "suez",
    type: "pipeline",
    waypointChokepointIds: [],
    addedTransitDays: 2,
    addedCostMultiplier: 1.05,
    capacityConstraintTonnage: 210,
    suitableCargoTypes: ["tanker"],
    activationThreshold: "partial_closure",
    notes: "Suez-Mediterranean Pipeline; crude only; 210 Mt/yr capacity"
  },
  // ── Strait of Hormuz bypasses ─────────────────────────────────────────
  {
    id: "hormuz_cape_of_good_hope",
    name: "Cape of Good Hope Route",
    primaryChokepointId: "hormuz_strait",
    type: "alternative_sea_route",
    waypointChokepointIds: ["cape_of_good_hope"],
    addedTransitDays: 16,
    addedCostMultiplier: 1.25,
    capacityConstraintTonnage: null,
    suitableCargoTypes: ["container", "tanker", "bulk", "roro"],
    activationThreshold: "partial_closure",
    notes: "Long-haul diversion bypassing Gulf and Indian Ocean choke via the Cape"
  },
  {
    id: "aqaba_land_bridge",
    name: "Aqaba Land Bridge",
    primaryChokepointId: "hormuz_strait",
    type: "land_bridge",
    waypointChokepointIds: [],
    addedTransitDays: 5,
    addedCostMultiplier: 1.35,
    capacityConstraintTonnage: 15,
    suitableCargoTypes: ["container", "roro"],
    activationThreshold: "partial_closure",
    notes: "Road/rail transit via Jordan to the port of Aqaba; 15 Mt/yr capacity constraint"
  },
  {
    id: "btc_pipeline",
    name: "BTC Pipeline (Baku-Tbilisi-Ceyhan)",
    primaryChokepointId: "hormuz_strait",
    type: "pipeline",
    waypointChokepointIds: [],
    addedTransitDays: 3,
    addedCostMultiplier: 1.1,
    capacityConstraintTonnage: 28,
    suitableCargoTypes: ["tanker"],
    activationThreshold: "partial_closure",
    notes: "Crude oil pipeline from Caspian to Turkish Mediterranean; 28 Mt/yr capacity"
  },
  // ── Strait of Malacca bypasses ────────────────────────────────────────
  {
    id: "lombok_strait_bypass",
    name: "Lombok Strait",
    primaryChokepointId: "malacca_strait",
    type: "alternative_sea_route",
    waypointChokepointIds: ["lombok_strait"],
    addedTransitDays: 2,
    addedCostMultiplier: 1.05,
    capacityConstraintTonnage: null,
    suitableCargoTypes: ["tanker", "bulk"],
    activationThreshold: "partial_closure",
    notes: "Preferred tanker and bulk diversion for vessels too large for Malacca"
  },
  {
    id: "sunda_strait",
    name: "Sunda Strait",
    primaryChokepointId: "malacca_strait",
    type: "alternative_sea_route",
    waypointChokepointIds: [],
    addedTransitDays: 1,
    addedCostMultiplier: 1.03,
    capacityConstraintTonnage: null,
    suitableCargoTypes: ["container", "tanker", "bulk", "roro"],
    activationThreshold: "partial_closure",
    notes: "Narrower and shallower than Lombok; suitable for most vessel classes"
  },
  {
    id: "kra_canal_future",
    name: "Kra Canal (Proposed)",
    primaryChokepointId: "malacca_strait",
    type: "alternative_sea_route",
    waypointChokepointIds: [],
    addedTransitDays: 0,
    addedCostMultiplier: 0.95,
    capacityConstraintTonnage: null,
    suitableCargoTypes: ["container", "tanker", "bulk", "roro"],
    activationThreshold: "full_closure",
    notes: "Proposed; not yet constructed"
  },
  // ── Bab el-Mandeb bypasses ────────────────────────────────────────────
  {
    id: "bab_el_mandeb_cape_of_good_hope",
    name: "Cape of Good Hope Route",
    primaryChokepointId: "bab_el_mandeb",
    type: "alternative_sea_route",
    waypointChokepointIds: ["cape_of_good_hope"],
    addedTransitDays: 10,
    addedCostMultiplier: 1.15,
    capacityConstraintTonnage: null,
    suitableCargoTypes: ["container", "tanker", "bulk", "roro"],
    activationThreshold: "partial_closure",
    notes: "Standard diversion for vessels avoiding the Red Sea / Houthi threat zone"
  },
  {
    id: "djibouti_rail",
    name: "Djibouti-Addis Ababa Railway",
    primaryChokepointId: "bab_el_mandeb",
    type: "land_bridge",
    waypointChokepointIds: [],
    addedTransitDays: 7,
    addedCostMultiplier: 1.45,
    capacityConstraintTonnage: 1,
    suitableCargoTypes: ["container"],
    activationThreshold: "full_closure",
    notes: "Containerised cargo only; 1 Mt/yr capacity; requires full closure to justify costs"
  },
  // ── Bosporus Strait bypasses ──────────────────────────────────────────
  {
    id: "btc_pipeline_black_sea",
    name: "BTC Pipeline (Black Sea crude egress)",
    primaryChokepointId: "bosphorus",
    type: "pipeline",
    waypointChokepointIds: [],
    addedTransitDays: 2,
    addedCostMultiplier: 1.08,
    capacityConstraintTonnage: 28,
    suitableCargoTypes: ["tanker"],
    activationThreshold: "partial_closure",
    notes: "Crude oil pipeline from Baku; avoids tanker transit through the Bosphorus"
  },
  {
    id: "baku_tbilisi_batumi_rail",
    name: "Baku-Tbilisi-Batumi Rail Corridor",
    primaryChokepointId: "bosphorus",
    type: "land_bridge",
    waypointChokepointIds: [],
    addedTransitDays: 4,
    addedCostMultiplier: 1.3,
    capacityConstraintTonnage: 8,
    suitableCargoTypes: ["container", "bulk"],
    activationThreshold: "partial_closure",
    notes: "Multimodal corridor via Georgia to Black Sea port of Batumi; 8 Mt/yr capacity"
  },
  // ── Panama Canal bypasses ─────────────────────────────────────────────
  {
    id: "panama_cape_horn",
    name: "Cape Horn Route",
    primaryChokepointId: "panama",
    type: "alternative_sea_route",
    waypointChokepointIds: [],
    addedTransitDays: 22,
    addedCostMultiplier: 1.4,
    capacityConstraintTonnage: null,
    suitableCargoTypes: ["container", "tanker", "bulk", "roro"],
    activationThreshold: "full_closure",
    notes: "Historically significant; high seas and extreme weather make it a last resort"
  },
  {
    id: "us_rail_landbridge",
    name: "US Rail Land Bridge",
    primaryChokepointId: "panama",
    type: "land_bridge",
    waypointChokepointIds: [],
    addedTransitDays: 6,
    addedCostMultiplier: 1.55,
    capacityConstraintTonnage: 2,
    suitableCargoTypes: ["container"],
    activationThreshold: "partial_closure",
    notes: "Intermodal rail across the continental US; 2 Mt/yr capacity; containers only"
  },
  // ── Taiwan Strait bypasses ────────────────────────────────────────────
  {
    id: "bashi_channel",
    name: "Bashi Channel",
    primaryChokepointId: "taiwan_strait",
    type: "alternative_sea_route",
    waypointChokepointIds: [],
    addedTransitDays: 1,
    addedCostMultiplier: 1.04,
    capacityConstraintTonnage: null,
    suitableCargoTypes: ["container", "tanker", "bulk", "roro"],
    activationThreshold: "partial_closure",
    notes: "Deep-water channel between Taiwan and the Philippines; suitable for all vessel classes"
  },
  {
    id: "miyako_strait",
    name: "Miyako Strait",
    primaryChokepointId: "taiwan_strait",
    type: "alternative_sea_route",
    waypointChokepointIds: [],
    addedTransitDays: 1,
    addedCostMultiplier: 1.04,
    capacityConstraintTonnage: null,
    suitableCargoTypes: ["container", "tanker", "bulk", "roro"],
    activationThreshold: "partial_closure",
    notes: "Between Miyako Island and Okinawa; monitored by Japan Maritime Self-Defense Force"
  },
  // ── Dover Strait bypasses ─────────────────────────────────────────────
  {
    id: "north_sea_scotland",
    name: "North Sea / Scotland Route",
    primaryChokepointId: "dover_strait",
    type: "alternative_sea_route",
    waypointChokepointIds: [],
    addedTransitDays: 1,
    addedCostMultiplier: 1.02,
    capacityConstraintTonnage: null,
    suitableCargoTypes: ["container", "tanker", "bulk", "roro"],
    activationThreshold: "partial_closure",
    notes: "Northern route around Scotland; minor added distance for most vessel types"
  },
  {
    id: "channel_tunnel",
    name: "Channel Tunnel (Rail Freight)",
    primaryChokepointId: "dover_strait",
    type: "modal_shift",
    waypointChokepointIds: [],
    addedTransitDays: 1,
    addedCostMultiplier: 1.35,
    capacityConstraintTonnage: 0.5,
    suitableCargoTypes: ["container"],
    activationThreshold: "full_closure",
    notes: "Rail freight via Eurotunnel; 0.5 Mt/yr capacity; containers only; requires full closure to justify modal shift"
  },
  // ── Strait of Gibraltar ───────────────────────────────────────────────
  {
    id: "gibraltar_no_bypass",
    name: "No Practical Bypass",
    primaryChokepointId: "gibraltar",
    type: "alternative_sea_route",
    waypointChokepointIds: [],
    addedTransitDays: 0,
    addedCostMultiplier: 1,
    capacityConstraintTonnage: null,
    suitableCargoTypes: [],
    activationThreshold: "full_closure",
    notes: "No practical bypass \u2014 all Atlantic-Med traffic transits here"
  },
  // ── Cape of Good Hope ─────────────────────────────────────────────────
  {
    id: "cape_of_good_hope_is_bypass",
    name: "Cape of Good Hope (Is a Bypass Route)",
    primaryChokepointId: "cape_of_good_hope",
    type: "alternative_sea_route",
    waypointChokepointIds: [],
    addedTransitDays: 0,
    addedCostMultiplier: 1,
    capacityConstraintTonnage: null,
    suitableCargoTypes: [],
    activationThreshold: "full_closure",
    notes: "Cape of Good Hope IS a bypass route for Suez/Bab-el-Mandeb \u2014 no secondary bypass available"
  },
  // ── Korea Strait bypasses ─────────────────────────────────────────────
  {
    id: "la_perouse_strait",
    name: "La Perouse Strait (Soya Strait)",
    primaryChokepointId: "korea_strait",
    type: "alternative_sea_route",
    waypointChokepointIds: [],
    addedTransitDays: 2,
    addedCostMultiplier: 1.06,
    capacityConstraintTonnage: null,
    suitableCargoTypes: ["container", "tanker", "bulk"],
    activationThreshold: "partial_closure",
    notes: "Seasonal \u2014 limited ice conditions Nov-Apr"
  },
  {
    id: "tsugaru_strait",
    name: "Tsugaru Strait",
    primaryChokepointId: "korea_strait",
    type: "alternative_sea_route",
    waypointChokepointIds: [],
    addedTransitDays: 1,
    addedCostMultiplier: 1.04,
    capacityConstraintTonnage: null,
    suitableCargoTypes: ["container", "tanker", "bulk", "roro"],
    activationThreshold: "partial_closure",
    notes: "Between Hokkaido and Honshu; narrower but ice-free year-round"
  },
  // ── Kerch Strait bypasses ─────────────────────────────────────────────
  {
    id: "black_sea_western_ports",
    name: "Black Sea Western Ports Reroute",
    primaryChokepointId: "kerch_strait",
    type: "alternative_sea_route",
    waypointChokepointIds: [],
    addedTransitDays: 3,
    addedCostMultiplier: 1.2,
    capacityConstraintTonnage: null,
    suitableCargoTypes: ["tanker", "bulk"],
    activationThreshold: "partial_closure",
    notes: "Reroute to Constanta/Odesa/Varna; effectively blockaded since Feb 2022"
  },
  {
    id: "ukraine_rail_reroute",
    name: "Ukraine Rail Reroute",
    primaryChokepointId: "kerch_strait",
    type: "land_bridge",
    waypointChokepointIds: [],
    addedTransitDays: 5,
    addedCostMultiplier: 1.4,
    capacityConstraintTonnage: 2,
    suitableCargoTypes: ["container"],
    activationThreshold: "full_closure",
    notes: "Rail through Ukraine to EU entry points; 2 Mt/yr capacity; significant geopolitical risk"
  },
  // ── Lombok Strait bypasses ────────────────────────────────────────────
  {
    id: "sunda_strait_for_lombok",
    name: "Sunda Strait",
    primaryChokepointId: "lombok_strait",
    type: "alternative_sea_route",
    waypointChokepointIds: [],
    addedTransitDays: 1,
    addedCostMultiplier: 1.03,
    capacityConstraintTonnage: null,
    suitableCargoTypes: ["tanker", "bulk", "container"],
    activationThreshold: "partial_closure",
    notes: "Shallower than Lombok; suitable for most vessel classes except VLCCs"
  },
  {
    id: "ombai_strait",
    name: "Ombai Strait",
    primaryChokepointId: "lombok_strait",
    type: "alternative_sea_route",
    waypointChokepointIds: [],
    addedTransitDays: 1,
    addedCostMultiplier: 1.02,
    capacityConstraintTonnage: null,
    suitableCargoTypes: ["tanker", "bulk"],
    activationThreshold: "partial_closure",
    notes: "Deep-water passage between Alor and Timor; primarily tanker and bulk"
  }
];
var BYPASS_CORRIDORS_BY_CHOKEPOINT2 = BYPASS_CORRIDORS2.reduce((acc, c) => {
  (acc[c.primaryChokepointId] ??= []).push(c);
  return acc;
}, {});

// server/worldmonitor/supply-chain/v1/_multi-sector-shock.ts
var SEEDED_HS2_CODES = ["27", "84", "85", "87", "30", "72", "39", "29", "10", "62"];
var MULTI_SECTOR_HS2_LABELS = {
  "27": "Energy",
  "84": "Machinery",
  "85": "Electronics",
  "87": "Vehicles",
  "30": "Pharma",
  "72": "Iron & Steel",
  "39": "Plastics",
  "29": "Chemicals",
  "10": "Cereals",
  "62": "Apparel"
};
function hs4ToHs22(hs4) {
  const padded = hs4.padStart(4, "0");
  return padded.slice(0, 2).replace(/^0+/, "") || "0";
}
function pickBestBypass(chokepointId) {
  const corridors = BYPASS_CORRIDORS_BY_CHOKEPOINT2[chokepointId] ?? [];
  const viable = corridors.filter(
    (c) => c.suitableCargoTypes.length > 0 && c.addedCostMultiplier >= 1 && c.activationThreshold === "partial_closure"
  );
  if (viable.length === 0) return null;
  return [...viable].sort((a, b) => {
    if (a.addedTransitDays !== b.addedTransitDays) return a.addedTransitDays - b.addedTransitDays;
    return a.addedCostMultiplier - b.addedCostMultiplier;
  })[0] ?? null;
}
function aggregateAnnualImportsByHs2(products) {
  const totals = {};
  for (const hs2 of SEEDED_HS2_CODES) totals[hs2] = 0;
  if (!Array.isArray(products)) return totals;
  for (const p of products) {
    if (!p || typeof p.totalValue !== "number" || !Number.isFinite(p.totalValue) || p.totalValue <= 0) continue;
    const hs2 = hs4ToHs22(String(p.hs4 ?? ""));
    if (!(hs2 in totals)) continue;
    totals[hs2] = (totals[hs2] ?? 0) + p.totalValue;
  }
  return totals;
}
function computeMultiSectorShock(hs2, importValueAnnual, chokepointId, warRiskTier, closureDays) {
  const normalizedDays = clampClosureDays(closureDays);
  const warRiskPremiumBps = warRiskTierToInsurancePremiumBps(warRiskTier);
  const bypass = pickBestBypass(chokepointId);
  const freightAddedPctPerTon = bypass ? Math.max(0, bypass.addedCostMultiplier - 1) : 0;
  const addedTransitDays = bypass?.addedTransitDays ?? 0;
  const annualImpactRate = freightAddedPctPerTon + warRiskPremiumBps / 1e4;
  const safeImports = Number.isFinite(importValueAnnual) && importValueAnnual > 0 ? importValueAnnual : 0;
  const dailyAddedCost = safeImports * annualImpactRate / 365;
  return {
    hs2,
    hs2Label: MULTI_SECTOR_HS2_LABELS[hs2] ?? `HS ${hs2}`,
    importValueAnnual: Math.round(safeImports),
    freightAddedPctPerTon: Math.round(freightAddedPctPerTon * 1e4) / 1e4,
    warRiskPremiumBps,
    addedTransitDays,
    totalCostShockPerDay: Math.round(dailyAddedCost),
    totalCostShock30Days: Math.round(dailyAddedCost * 30),
    totalCostShock90Days: Math.round(dailyAddedCost * 90),
    totalCostShock: Math.round(dailyAddedCost * normalizedDays),
    closureDays: normalizedDays
  };
}
function clampClosureDays(days) {
  if (!Number.isFinite(days)) return 30;
  const n2 = Math.floor(days);
  if (n2 < 1) return 1;
  if (n2 > 365) return 365;
  return n2;
}
function computeMultiSectorShocks(importsByHs2, chokepointId, warRiskTier, closureDays) {
  const shocks = SEEDED_HS2_CODES.map(
    (hs2) => computeMultiSectorShock(hs2, importsByHs2[hs2] ?? 0, chokepointId, warRiskTier, closureDays)
  );
  return shocks.sort((a, b) => b.totalCostShockPerDay - a.totalCostShockPerDay);
}

// server/worldmonitor/supply-chain/v1/get-multi-sector-cost-shock.ts
function emptySectorSkeleton(closureDays) {
  return SEEDED_HS2_CODES.map((hs2) => ({
    hs2,
    hs2Label: MULTI_SECTOR_HS2_LABELS[hs2] ?? `HS ${hs2}`,
    importValueAnnual: 0,
    freightAddedPctPerTon: 0,
    warRiskPremiumBps: 0,
    addedTransitDays: 0,
    totalCostShockPerDay: 0,
    totalCostShock30Days: 0,
    totalCostShock90Days: 0,
    totalCostShock: 0,
    closureDays
  }));
}
function emptyResponse2(iso2, chokepointId, closureDays, warRiskTier = "WAR_RISK_TIER_UNSPECIFIED", unavailableReason = "", sectors = []) {
  return {
    iso2,
    chokepointId,
    closureDays,
    warRiskTier,
    sectors,
    totalAddedCost: 0,
    fetchedAt: (/* @__PURE__ */ new Date()).toISOString(),
    unavailableReason
  };
}
async function getMultiSectorCostShock(ctx, req) {
  const iso2 = (req.iso2 ?? "").trim().toUpperCase();
  const chokepointId = (req.chokepointId ?? "").trim().toLowerCase();
  const closureDays = clampClosureDays(req.closureDays ?? 30);
  if (!/^[A-Z]{2}$/.test(iso2)) {
    throw new ValidationError([{ field: "iso2", description: "iso2 must be a 2-letter uppercase ISO country code" }]);
  }
  if (!chokepointId) {
    throw new ValidationError([{ field: "chokepointId", description: "chokepointId is required" }]);
  }
  if (!CHOKEPOINT_REGISTRY2.some((c) => c.id === chokepointId)) {
    throw new ValidationError([{ field: "chokepointId", description: `Unknown chokepointId: ${chokepointId}` }]);
  }
  const isPro = await isCallerPremium(ctx.request);
  if (!isPro) return emptyResponse2(iso2, chokepointId, closureDays);
  const productsKey = `comtrade:bilateral-hs4:${iso2}:v1`;
  const [productsCache, statusCache] = await Promise.all([
    getCachedJson(productsKey, true).catch(() => null),
    getCachedJson(CHOKEPOINT_STATUS_KEY).catch(() => null)
  ]);
  let products = Array.isArray(productsCache?.products) ? productsCache.products : [];
  if (products.length === 0) {
    const lazy = await lazyFetchBilateralHs4(iso2).catch(() => null);
    if (lazy?.products?.length) products = lazy.products;
  }
  const importsByHs2 = aggregateAnnualImportsByHs2(products);
  const hasAnyImports = Object.values(importsByHs2).some((v) => v > 0);
  const warRiskTier = statusCache?.chokepoints?.find((c) => c.id === chokepointId)?.warRiskTier ?? "WAR_RISK_TIER_NORMAL";
  if (!hasAnyImports) {
    return emptyResponse2(
      iso2,
      chokepointId,
      closureDays,
      warRiskTier,
      "\uC774 \uAD6D\uAC00\uC758 \uC218\uC785 \uB370\uC774\uD130\uB97C \uC544\uC9C1 \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uC5B4\uC694",
      emptySectorSkeleton(closureDays)
    );
  }
  const sectors = computeMultiSectorShocks(importsByHs2, chokepointId, warRiskTier, closureDays);
  const totalAddedCost = sectors.reduce((sum, s) => sum + s.totalCostShock, 0);
  return {
    iso2,
    chokepointId,
    closureDays,
    warRiskTier,
    sectors,
    totalAddedCost,
    fetchedAt: (/* @__PURE__ */ new Date()).toISOString(),
    unavailableReason: ""
  };
}

// server/worldmonitor/supply-chain/v1/get-sector-dependency.ts
init_redis();
var CACHE_TTL2 = 86400;
var HS2_LABELS = {
  "1": "Live Animals",
  "2": "Meat",
  "3": "Fish & Seafood",
  "4": "Dairy",
  "6": "Plants & Flowers",
  "7": "Vegetables",
  "8": "Fruit & Nuts",
  "10": "Cereals",
  "11": "Milling Products",
  "12": "Oilseeds",
  "15": "Animal & Vegetable Fats",
  "16": "Meat Preparations",
  "17": "Sugar",
  "18": "Cocoa",
  "19": "Food Preparations",
  "22": "Beverages & Spirits",
  "23": "Residues & Animal Feed",
  "24": "Tobacco",
  "25": "Salt & Cement",
  "26": "Ores, Slag & Ash",
  "27": "Mineral Fuels & Energy",
  "28": "Inorganic Chemicals",
  "29": "Organic Chemicals",
  "30": "Pharmaceuticals",
  "31": "Fertilizers",
  "38": "Chemical Products",
  "39": "Plastics",
  "40": "Rubber",
  "44": "Wood",
  "47": "Pulp & Paper",
  "48": "Paper & Paperboard",
  "52": "Cotton",
  "61": "Clothing (Knitted)",
  "62": "Clothing (Woven)",
  "71": "Precious Metals & Gems",
  "72": "Iron & Steel",
  "73": "Iron & Steel Articles",
  "74": "Copper",
  "76": "Aluminium",
  "79": "Zinc",
  "80": "Tin",
  "84": "Machinery & Mechanical Appliances",
  "85": "Electrical & Electronic Equipment",
  "86": "Railway",
  "87": "Vehicles",
  "88": "Aircraft",
  "89": "Ships & Boats",
  "90": "Optical & Medical Instruments",
  "93": "Arms & Ammunition"
};
function computeExposures(nearestRouteIds, hs2) {
  if (nearestRouteIds.length === 0) return [];
  const isEnergy = hs2 === "27";
  const routeSet = new Set(nearestRouteIds);
  return CHOKEPOINT_REGISTRY2.map((cp) => {
    const overlap = cp.routeIds.filter((r) => routeSet.has(r)).length;
    const maxRoutes = Math.max(cp.routeIds.length, 1);
    let score = overlap / maxRoutes * 100;
    if (isEnergy && cp.shockModelSupported) score = Math.min(score * 1.5, 100);
    return { chokepointId: cp.id, exposureScore: Math.round(score * 10) / 10 };
  }).sort((a, b) => b.exposureScore - a.exposureScore);
}
async function getTopExporterShare(iso2, hs2) {
  const numericCode = ISO2_TO_COMTRADE[iso2];
  if (!numericCode) return { exporterIso2: "", share: 0 };
  const key = `comtrade:flows:${numericCode}:${hs2.padStart(4, "0").slice(0, 4)}`;
  const result = await getCachedJson(key, true).catch(() => null);
  if (!result) return { exporterIso2: "", share: 0 };
  const raw = result;
  const flows = Array.isArray(result) ? result : raw.flows ?? [];
  if (flows.length === 0) return { exporterIso2: "", share: 0 };
  const totals = /* @__PURE__ */ new Map();
  let grandTotal = 0;
  for (const f of flows) {
    if (!f.partnerCode || f.partnerCode === "0" || f.partnerCode === "899") continue;
    const prev = totals.get(f.partnerCode) ?? 0;
    totals.set(f.partnerCode, prev + (f.tradeValueUsd ?? 0));
    grandTotal += f.tradeValueUsd ?? 0;
  }
  if (grandTotal === 0) return { exporterIso2: "", share: 0 };
  let topCode = "";
  let topValue = 0;
  for (const [code, val] of totals) {
    if (val > topValue) {
      topValue = val;
      topCode = code;
    }
  }
  const share = topValue / grandTotal;
  const exporterIso2 = Object.entries(ISO2_TO_COMTRADE).find(([, v]) => v === topCode)?.[0] ?? "";
  return { exporterIso2, share };
}
async function getSectorDependency(ctx, req) {
  const isPro = await isCallerPremium(ctx.request);
  const empty = {
    iso2: req.iso2,
    hs2: req.hs2 || "27",
    hs2Label: HS2_LABELS[req.hs2 || "27"] ?? `HS ${req.hs2}`,
    flags: [],
    primaryExporterIso2: "",
    primaryExporterShare: 0,
    primaryChokepointId: "",
    primaryChokepointExposure: 0,
    hasViableBypass: false,
    fetchedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  if (!isPro) return empty;
  const iso2 = req.iso2?.trim().toUpperCase();
  const hs2 = req.hs2?.trim().replace(/\D/g, "") || "27";
  if (!/^[A-Z]{2}$/.test(iso2 ?? "") || !/^\d{1,2}$/.test(hs2)) {
    return { ...empty, iso2: iso2 ?? "", hs2 };
  }
  const cacheKey = SECTOR_DEPENDENCY_KEY(iso2, hs2);
  try {
    const result = await cachedFetchJson(
      cacheKey,
      CACHE_TTL2,
      async () => {
        const clusters2 = country_port_clusters_default;
        const cluster = clusters2[iso2];
        const nearestRouteIds = cluster?.nearestRouteIds ?? [];
        const exposures = computeExposures(nearestRouteIds, hs2);
        const primary = exposures[0];
        const primaryChokepointId = primary?.chokepointId ?? "";
        const primaryChokepointExposure = primary?.exposureScore ?? 0;
        const bypassCorridors = BYPASS_CORRIDORS_BY_CHOKEPOINT2[primaryChokepointId] ?? [];
        const hasViableBypass = bypassCorridors.some((c) => c.suitableCargoTypes.length > 0);
        const { exporterIso2, share: primaryExporterShare } = await getTopExporterShare(iso2, hs2);
        const isSingleSource = primaryExporterShare > 0.8;
        const isSingleCorridor = primaryChokepointExposure > 80 && !hasViableBypass;
        const isDiversifiable = hasViableBypass && !isSingleSource;
        const flags = [];
        if (isSingleSource && isSingleCorridor) {
          flags.push("DEPENDENCY_FLAG_COMPOUND_RISK");
        } else if (isSingleSource) {
          flags.push("DEPENDENCY_FLAG_SINGLE_SOURCE_CRITICAL");
        } else if (isSingleCorridor) {
          flags.push("DEPENDENCY_FLAG_SINGLE_CORRIDOR_CRITICAL");
        } else if (isDiversifiable) {
          flags.push("DEPENDENCY_FLAG_DIVERSIFIABLE");
        }
        return {
          iso2,
          hs2,
          hs2Label: HS2_LABELS[hs2] ?? `HS ${hs2}`,
          flags,
          primaryExporterIso2: exporterIso2,
          primaryExporterShare: Math.round(primaryExporterShare * 1e3) / 1e3,
          primaryChokepointId,
          primaryChokepointExposure,
          hasViableBypass,
          fetchedAt: (/* @__PURE__ */ new Date()).toISOString()
        };
      }
    );
    return result ?? { ...empty, iso2, hs2 };
  } catch {
    return { ...empty, iso2, hs2 };
  }
}

// server/worldmonitor/supply-chain/v1/get-route-explorer-lane.ts
init_redis();

// src/config/ports.ts
var PORTS = [
  // Top Container Ports
  { id: "shanghai", name: "Port of Shanghai", lat: 31.23, lon: 121.47, country: "China", type: "container", rank: 1, note: "World's busiest container port. 47M+ TEU." },
  { id: "singapore", name: "Port of Singapore", lat: 1.26, lon: 103.84, country: "Singapore", type: "mixed", rank: 2, note: "Major transshipment hub. Malacca Strait gateway. 37M+ TEU." },
  { id: "ningbo", name: "Ningbo-Zhoushan", lat: 29.87, lon: 121.55, country: "China", type: "mixed", rank: 3, note: "Largest cargo throughput globally. 33M+ TEU." },
  { id: "shenzhen", name: "Port of Shenzhen", lat: 22.52, lon: 114.05, country: "China", type: "container", rank: 4, note: "South China gateway. Yantian terminal. 30M+ TEU." },
  { id: "guangzhou", name: "Port of Guangzhou", lat: 23.08, lon: 113.24, country: "China", type: "mixed", rank: 5, note: "Pearl River Delta. Nansha terminal. 24M+ TEU." },
  { id: "qingdao", name: "Port of Qingdao", lat: 36.07, lon: 120.31, country: "China", type: "mixed", rank: 6, note: "North China hub. PLA Navy North Sea Fleet nearby." },
  { id: "busan", name: "\uBD80\uC0B0\uD56D", lat: 35.1, lon: 129.04, country: "South Korea", type: "container", rank: 7, note: "Northeast Asia transshipment hub. 22M+ TEU." },
  { id: "tianjin", name: "Port of Tianjin", lat: 38.99, lon: 117.7, country: "China", type: "mixed", rank: 8, note: "Beijing's maritime gateway. 21M+ TEU." },
  { id: "hong_kong", name: "Port of Hong Kong", lat: 22.29, lon: 114.15, country: "China (SAR)", type: "container", rank: 9, note: "Historic transshipment hub. 16M+ TEU." },
  { id: "rotterdam", name: "Port of Rotterdam", lat: 51.9, lon: 4.5, country: "Netherlands", type: "mixed", rank: 10, note: "Europe's largest port. Gateway to EU. 14M+ TEU." },
  { id: "jebel_ali", name: "Jebel Ali (Dubai)", lat: 25.01, lon: 55.06, country: "UAE", type: "container", rank: 11, note: "Middle East's largest port. DP World hub. 14M+ TEU." },
  { id: "antwerp", name: "Port of Antwerp-Bruges", lat: 51.26, lon: 4.4, country: "Belgium", type: "mixed", rank: 12, note: "Europe's second largest. Petrochemicals hub. 13M+ TEU." },
  { id: "klang", name: "Port Klang", lat: 3, lon: 101.39, country: "Malaysia", type: "container", rank: 13, note: "Malacca Strait. Westports terminal. 13M+ TEU." },
  { id: "xiamen", name: "Port of Xiamen", lat: 24.45, lon: 118.08, country: "China", type: "container", rank: 14, note: "Taiwan Strait. Strategic location. 12M+ TEU." },
  { id: "kaohsiung", name: "Port of Kaohsiung", lat: 22.61, lon: 120.28, country: "Taiwan", type: "container", rank: 15, note: "Taiwan's largest port. Semiconductor exports. 9M+ TEU." },
  { id: "los_angeles", name: "Port of Los Angeles", lat: 33.73, lon: -118.26, country: "USA", type: "container", rank: 16, note: "Western Hemisphere busiest. US-Asia trade gateway. 9M+ TEU." },
  { id: "long_beach", name: "Port of Long Beach", lat: 33.75, lon: -118.2, country: "USA", type: "container", rank: 17, note: "Handles 40% of US container imports with LA. 8M+ TEU." },
  { id: "tanjung_pelepas", name: "Tanjung Pelepas", lat: 1.37, lon: 103.55, country: "Malaysia", type: "container", rank: 18, note: "Maersk hub. Singapore competitor. 11M+ TEU." },
  { id: "hamburg", name: "Port of Hamburg", lat: 53.54, lon: 9.99, country: "Germany", type: "container", rank: 19, note: "Germany's largest. North Sea-Baltic connector. 8M+ TEU." },
  { id: "laem_chabang", name: "Laem Chabang", lat: 13.08, lon: 100.88, country: "Thailand", type: "container", rank: 20, note: "Thailand's main port. EEC hub. 8M+ TEU." },
  { id: "new_york_nj", name: "Port of NY/NJ", lat: 40.67, lon: -74.04, country: "USA", type: "container", rank: 21, note: "US East Coast largest. Newark/Elizabeth terminals. 9M+ TEU." },
  { id: "piraeus", name: "Port of Piraeus", lat: 37.94, lon: 23.65, country: "Greece", type: "container", rank: 25, note: "COSCO-operated. China's Mediterranean gateway. 5M+ TEU." },
  // Critical Oil/LNG Terminals
  { id: "ras_tanura", name: "Ras Tanura", lat: 26.64, lon: 50.16, country: "Saudi Arabia", type: "oil", note: "World's largest offshore oil terminal. Saudi Aramco. 6.5M+ bpd." },
  { id: "fujairah", name: "Port of Fujairah", lat: 25.12, lon: 56.35, country: "UAE", type: "oil", note: "Major bunkering hub. Hormuz bypass. Outside Persian Gulf." },
  { id: "kharg_island", name: "Kharg Island", lat: 29.23, lon: 50.31, country: "Iran", type: "oil", note: "Iran's main oil export terminal. 90%+ of oil exports." },
  { id: "ras_laffan", name: "Ras Laffan", lat: 25.93, lon: 51.54, country: "Qatar", type: "lng", note: "World's largest LNG export facility. 77M+ tonnes/year." },
  { id: "houston", name: "Port of Houston", lat: 29.73, lon: -95.02, country: "USA", type: "mixed", note: "US oil/petrochemical hub. 2nd busiest US port by tonnage." },
  { id: "sabine_pass", name: "Sabine Pass LNG", lat: 29.73, lon: -93.87, country: "USA", type: "lng", note: "Largest US LNG export terminal. Cheniere Energy." },
  { id: "novorossiysk", name: "Novorossiysk", lat: 44.72, lon: 37.77, country: "Russia", type: "oil", note: "Russia's largest Black Sea port. CPC terminal. 140M+ tonnes/year." },
  { id: "primorsk", name: "Primorsk", lat: 60.35, lon: 28.62, country: "Russia", type: "oil", note: "Baltic Sea oil terminal. Russia's largest oil port." },
  // Strategic Chokepoint Ports
  { id: "port_said", name: "Port Said", lat: 31.26, lon: 32.3, country: "Egypt", type: "mixed", note: "Suez Canal northern entrance. 12% of global trade." },
  { id: "suez_port", name: "Port of Suez", lat: 29.97, lon: 32.55, country: "Egypt", type: "mixed", note: "Suez Canal southern terminus. Red Sea access." },
  { id: "gibraltar", name: "Port of Gibraltar", lat: 36.14, lon: -5.35, country: "UK (Gibraltar)", type: "naval", note: "Mediterranean-Atlantic gateway. UK naval base." },
  { id: "djibouti", name: "Port of Djibouti", lat: 11.59, lon: 43.15, country: "Djibouti", type: "mixed", note: "Bab el-Mandeb gateway. Chinese + US military bases." },
  { id: "aden", name: "Port of Aden", lat: 12.79, lon: 45.03, country: "Yemen", type: "mixed", note: "Red Sea strategic port. Houthi conflict area." },
  { id: "hodeidah", name: "Port of Hodeidah", lat: 14.8, lon: 42.95, country: "Yemen", type: "bulk", note: "Yemen's main humanitarian port. Houthi-controlled." },
  { id: "bandar_abbas", name: "Bandar Abbas", lat: 27.18, lon: 56.28, country: "Iran", type: "mixed", note: "Iran's largest container port. Hormuz Strait." },
  { id: "colon", name: "Port of Colon", lat: 9.35, lon: -79.9, country: "Panama", type: "container", note: "Panama Canal Atlantic side. Major transshipment." },
  { id: "balboa", name: "Port of Balboa", lat: 8.95, lon: -79.56, country: "Panama", type: "container", note: "Panama Canal Pacific terminus. Americas hub." },
  { id: "algeciras", name: "Port of Algeciras", lat: 36.13, lon: -5.43, country: "Spain", type: "container", note: "Gibraltar Strait. Maersk transshipment hub. 5M+ TEU." },
  // Strategic Naval Ports
  { id: "zhanjiang", name: "Zhanjiang", lat: 21.2, lon: 110.4, country: "China", type: "naval", note: "PLA Navy South Sea Fleet HQ. Carrier base." },
  { id: "yulin", name: "Yulin Naval Base", lat: 18.23, lon: 109.52, country: "China", type: "naval", note: "Hainan Island. Nuclear submarine base. SCS control." },
  { id: "vladivostok", name: "Port of Vladivostok", lat: 43.12, lon: 131.88, country: "Russia", type: "naval", note: "Russian Pacific Fleet HQ. Trans-Siberian terminus." },
  { id: "murmansk", name: "Port of Murmansk", lat: 68.97, lon: 33.05, country: "Russia", type: "naval", note: "Arctic ice-free port. Northern Fleet base." },
  { id: "gwadar", name: "Gwadar", lat: 25.12, lon: 62.33, country: "Pakistan", type: "mixed", note: "Chinese CPEC port. Strategic PLA Navy interest." },
  { id: "hambantota", name: "Hambantota", lat: 6.12, lon: 81.12, country: "Sri Lanka", type: "mixed", note: "Chinese 99-year lease. Indian Ocean strategic." },
  { id: "chabahar", name: "Chabahar", lat: 25.3, lon: 60.6, country: "Iran", type: "mixed", note: "India-developed port. Hormuz bypass. Afghanistan access." },
  // Major Regional Ports
  { id: "colombo", name: "Port of Colombo", lat: 6.94, lon: 79.84, country: "Sri Lanka", type: "container", note: "Indian Ocean transshipment hub. 7M+ TEU." },
  { id: "yokohama", name: "Port of Yokohama", lat: 35.44, lon: 139.64, country: "Japan", type: "container", note: "Tokyo Bay. Japan's 2nd largest. US 7th Fleet logistics." },
  { id: "nagoya", name: "Port of Nagoya", lat: 35.05, lon: 136.88, country: "Japan", type: "mixed", note: "Japan's largest by cargo. Toyota/auto exports." },
  { id: "felixstowe", name: "Port of Felixstowe", lat: 51.95, lon: 1.33, country: "UK", type: "container", note: "UK's busiest container port. 4M+ TEU." },
  { id: "le_havre", name: "Port of Le Havre", lat: 49.48, lon: 0.11, country: "France", type: "container", note: "France's largest container port. Paris gateway." },
  { id: "savannah", name: "Port of Savannah", lat: 32.08, lon: -81.09, country: "USA", type: "container", note: "Fastest growing US port. 5M+ TEU." },
  { id: "norfolk", name: "Port of Virginia", lat: 36.95, lon: -76.33, country: "USA", type: "mixed", note: "Adjacent to Norfolk Naval Base. 3M+ TEU." },
  { id: "santos", name: "Port of Santos", lat: -23.95, lon: -46.3, country: "Brazil", type: "mixed", note: "Latin America's busiest port. Sao Paulo gateway." },
  { id: "manzanillo", name: "Port of Manzanillo", lat: 19.05, lon: -104.32, country: "Mexico", type: "container", note: "Mexico's busiest port. Pacific gateway. USMCA trade corridor." },
  { id: "lazaro_cardenas", name: "Lazaro Cardenas", lat: 17.94, lon: -102.18, country: "Mexico", type: "mixed", note: "Mexico's 2nd largest. Asia-Mexico deep-water. Cartel smuggling route." },
  { id: "veracruz", name: "Port of Veracruz", lat: 19.2, lon: -96.13, country: "Mexico", type: "mixed", note: "Largest Gulf of Mexico port in Mexico. US-Mexico trade hub." },
  { id: "karachi", name: "Port of Karachi", lat: 24.84, lon: 67, country: "Pakistan", type: "mixed", note: "Pakistan's largest port. Naval HQ. 2M+ TEU." },
  { id: "nhava_sheva", name: "Nhava Sheva (JNPT)", lat: 18.95, lon: 72.95, country: "India", type: "container", note: "India's busiest container port. Mumbai gateway. 6M+ TEU." },
  { id: "chennai", name: "Port of Chennai", lat: 13.1, lon: 80.29, country: "India", type: "container", note: "India's 2nd largest. Auto industry. Bay of Bengal." },
  { id: "mundra", name: "Mundra Port", lat: 22.73, lon: 69.72, country: "India", type: "mixed", note: "India's largest private port. Adani Group." }
];

// src/config/trade-routes.ts
var TRADE_ROUTES = [
  {
    id: "china-europe-suez",
    name: "China \u2192 Europe (Suez)",
    from: "shanghai",
    to: "rotterdam",
    category: "container",
    status: "active",
    volumeDesc: "47M+ TEU/year",
    waypoints: ["malacca_strait", "bab_el_mandeb", "suez"]
  },
  {
    id: "china-us-west",
    name: "China \u2192 US West Coast",
    from: "shanghai",
    to: "los_angeles",
    category: "container",
    status: "active",
    volumeDesc: "24M+ TEU/year",
    waypoints: ["taiwan_strait"]
  },
  {
    id: "china-us-east-suez",
    name: "China \u2192 US East Coast (Suez)",
    from: "shenzhen",
    to: "new_york_nj",
    category: "container",
    status: "active",
    volumeDesc: "12M+ TEU/year",
    waypoints: ["malacca_strait", "bab_el_mandeb", "suez"]
  },
  {
    id: "china-us-east-panama",
    name: "China \u2192 US East Coast (Panama)",
    from: "guangzhou",
    to: "new_york_nj",
    category: "container",
    status: "active",
    volumeDesc: "8M+ TEU/year",
    waypoints: ["panama"]
  },
  {
    id: "gulf-europe-oil",
    name: "Persian Gulf \u2192 Europe (Oil)",
    from: "ras_tanura",
    to: "rotterdam",
    category: "energy",
    status: "active",
    volumeDesc: "6.5M+ bpd",
    waypoints: ["hormuz_strait", "bab_el_mandeb", "suez", "gibraltar"]
  },
  {
    id: "gulf-asia-oil",
    name: "Persian Gulf \u2192 Asia (Oil)",
    from: "ras_tanura",
    to: "singapore",
    category: "energy",
    status: "active",
    volumeDesc: "15M+ bpd",
    waypoints: ["hormuz_strait", "malacca_strait"]
  },
  {
    id: "qatar-europe-lng",
    name: "Qatar LNG \u2192 Europe",
    from: "ras_laffan",
    to: "felixstowe",
    category: "energy",
    status: "active",
    volumeDesc: "77M+ tonnes/year",
    waypoints: ["hormuz_strait", "bab_el_mandeb", "suez"]
  },
  {
    id: "qatar-asia-lng",
    name: "Qatar LNG \u2192 Asia",
    from: "ras_laffan",
    to: "busan",
    category: "energy",
    status: "active",
    volumeDesc: "40M+ tonnes/year",
    waypoints: ["hormuz_strait", "malacca_strait"]
  },
  {
    id: "us-europe-lng",
    name: "US LNG \u2192 Europe",
    from: "sabine_pass",
    to: "rotterdam",
    category: "energy",
    status: "active",
    volumeDesc: "80M+ tonnes/year",
    waypoints: []
  },
  {
    id: "russia-med-oil",
    name: "Russia \u2192 Mediterranean (Oil)",
    from: "novorossiysk",
    to: "piraeus",
    category: "energy",
    status: "active",
    volumeDesc: "140M+ tonnes/year",
    waypoints: ["bosphorus"]
  },
  {
    id: "intra-asia-container",
    name: "Intra-Asia Container",
    from: "singapore",
    to: "busan",
    category: "container",
    status: "active",
    volumeDesc: "30M+ TEU/year",
    waypoints: ["taiwan_strait"]
  },
  {
    id: "singapore-med",
    name: "Singapore \u2192 Mediterranean",
    from: "singapore",
    to: "algeciras",
    category: "container",
    status: "active",
    volumeDesc: "10M+ TEU/year",
    waypoints: ["bab_el_mandeb", "suez", "gibraltar"]
  },
  {
    id: "brazil-china-bulk",
    name: "Brazil \u2192 China (Bulk)",
    from: "santos",
    to: "shanghai",
    category: "bulk",
    status: "active",
    volumeDesc: "350M+ tonnes/year",
    waypoints: ["cape_of_good_hope"]
  },
  {
    id: "gulf-americas-cape",
    name: "Persian Gulf \u2192 Americas (Cape Route)",
    from: "ras_tanura",
    to: "santos",
    category: "energy",
    status: "active",
    volumeDesc: "2M+ bpd",
    waypoints: ["hormuz_strait", "cape_of_good_hope"]
  },
  {
    id: "asia-europe-cape",
    name: "Asia \u2192 Europe (Cape Route)",
    from: "singapore",
    to: "rotterdam",
    category: "container",
    status: "active",
    volumeDesc: "5M+ TEU/year",
    waypoints: ["cape_of_good_hope", "gibraltar"]
  },
  {
    id: "india-europe",
    name: "India \u2192 Europe",
    from: "nhava_sheva",
    to: "rotterdam",
    category: "container",
    status: "active",
    volumeDesc: "6M+ TEU/year",
    waypoints: ["bab_el_mandeb", "suez", "gibraltar"]
  },
  {
    id: "india-se-asia",
    name: "India \u2192 SE Asia",
    from: "mundra",
    to: "singapore",
    category: "container",
    status: "active",
    volumeDesc: "4M+ TEU/year",
    waypoints: ["malacca_strait"]
  },
  {
    id: "china-africa",
    name: "China \u2192 Africa",
    from: "guangzhou",
    to: "djibouti",
    category: "container",
    status: "active",
    volumeDesc: "5M+ TEU/year",
    waypoints: ["malacca_strait"]
  },
  {
    id: "cpec-route",
    name: "CPEC Route",
    from: "gwadar",
    to: "guangzhou",
    category: "container",
    status: "active",
    volumeDesc: "1M+ TEU/year",
    waypoints: ["malacca_strait"]
  },
  {
    id: "panama-transit",
    name: "Panama Transit",
    from: "colon",
    to: "balboa",
    category: "container",
    status: "active",
    volumeDesc: "14K+ transits/year",
    waypoints: ["panama"]
  },
  {
    id: "transatlantic",
    name: "TransAtlantic",
    from: "new_york_nj",
    to: "felixstowe",
    category: "container",
    status: "active",
    volumeDesc: "8M+ TEU/year",
    waypoints: []
  }
];

// server/worldmonitor/supply-chain/v1/_route-explorer-static-tables.ts
var TRANSIT_DAYS_BY_ROUTE_ID = {
  "china-europe-suez": [28, 35],
  "china-us-west": [14, 18],
  "china-us-east-suez": [30, 38],
  "china-us-east-panama": [24, 30],
  "gulf-europe-oil": [18, 25],
  "gulf-asia-oil": [16, 22],
  "qatar-europe-lng": [18, 24],
  "qatar-asia-lng": [12, 18],
  "us-europe-lng": [10, 14],
  "russia-med-oil": [8, 14],
  "intra-asia-container": [3, 10],
  "singapore-med": [16, 22],
  "brazil-china-bulk": [35, 45],
  "gulf-americas-cape": [30, 42],
  "asia-europe-cape": [40, 52],
  "india-europe": [18, 26],
  "india-se-asia": [6, 12],
  "china-africa": [22, 32],
  "cpec-route": [10, 16],
  "panama-transit": [1, 2],
  "transatlantic": [8, 14]
};
var TRANSIT_DAYS_FALLBACK = [14, 28];
var FREIGHT_USD_BY_CARGO_TYPE = {
  container: [1800, 3200],
  tanker: [25, 65],
  bulk: [12, 30],
  roro: [900, 1800]
};
var FREIGHT_USD_FALLBACK = [1800, 3200];
var BYPASS_CORRIDOR_GEOMETRY_BY_ID = {
  // ── Sea alternatives (use CHOKEPOINT_REGISTRY for endpoints) ───────────
  suez_cape_of_good_hope: {
    fromPort: [32.3, 30.5],
    // Suez
    toPort: [18.49, -34.36]
    // Cape of Good Hope
  },
  sumed_pipeline: {
    fromPort: [32.58, 29.95],
    // Ain Sukhna terminal, Gulf of Suez
    toPort: [28.88, 31.33]
    // Sidi Kerir terminal, Mediterranean
  },
  hormuz_cape_of_good_hope: {
    fromPort: [56.5, 26.5],
    // Hormuz Strait
    toPort: [18.49, -34.36]
    // Cape of Good Hope
  },
  btc_pipeline: {
    fromPort: [49.85, 40.4],
    // Baku
    toPort: [35.24, 36.87]
    // Ceyhan, Turkey
  },
  lombok_strait_bypass: {
    fromPort: [101.5, 2.5],
    // Malacca Strait
    toPort: [115.7, -8.5]
    // Lombok Strait
  },
  sunda_strait: {
    fromPort: [101.5, 2.5],
    // Malacca Strait
    toPort: [105.8, -6]
    // Sunda Strait
  },
  kra_canal_future: {
    fromPort: [101.5, 2.5],
    // Malacca Strait
    toPort: [99.3, 10]
    // Kra Isthmus (notional)
  },
  bab_el_mandeb_cape_of_good_hope: {
    fromPort: [43.3, 12.5],
    // Bab el-Mandeb
    toPort: [18.49, -34.36]
    // Cape of Good Hope
  },
  btc_pipeline_black_sea: {
    fromPort: [49.85, 40.4],
    // Baku
    toPort: [41.65, 41.65]
    // Batumi
  },
  panama_cape_horn: {
    fromPort: [-79.7, 9.1],
    // Panama
    toPort: [-67.3, -55.98]
    // Cape Horn
  },
  bashi_channel: {
    fromPort: [119.5, 24],
    // Taiwan Strait
    toPort: [121.5, 21.9]
    // Bashi Channel
  },
  miyako_strait: {
    fromPort: [129, 34],
    // Korea Strait
    toPort: [125.3, 24.85]
    // Miyako Strait
  },
  north_sea_scotland: {
    fromPort: [1.5, 51],
    // Dover Strait
    toPort: [-4, 58.5]
    // North-of-Scotland route
  },
  channel_tunnel: {
    fromPort: [1.5, 51],
    // Dover Strait
    toPort: [1.85, 50.92]
    // Eurotunnel Coquelles
  },
  gibraltar_no_bypass: {
    fromPort: [-5.6, 35.9],
    // Gibraltar (degenerate "no bypass" placeholder)
    toPort: [-5.6, 35.9]
  },
  cape_of_good_hope_is_bypass: {
    fromPort: [18.49, -34.36],
    // Cape of Good Hope
    toPort: [18.49, -34.36]
  },
  la_perouse_strait: {
    fromPort: [129, 34],
    // Korea Strait
    toPort: [142, 45.7]
    // La Perouse Strait
  },
  tsugaru_strait: {
    fromPort: [129, 34],
    // Korea Strait
    toPort: [140.7, 41.5]
    // Tsugaru Strait
  },
  black_sea_western_ports: {
    fromPort: [36.6, 45.3],
    // Kerch Strait
    toPort: [28.65, 44.18]
    // Constanta
  },
  sunda_strait_for_lombok: {
    fromPort: [115.7, -8.5],
    // Lombok Strait
    toPort: [105.8, -6]
    // Sunda Strait
  },
  ombai_strait: {
    fromPort: [115.7, -8.5],
    // Lombok Strait
    toPort: [124.5, -8.4]
    // Ombai Strait
  },
  // ── Land-bridge corridors (hand-curated rail/road endpoints) ──────────
  aqaba_land_bridge: {
    fromPort: [56.5, 26.5],
    // Hormuz Strait (origin side)
    toPort: [35, 29.53]
    // Aqaba, Jordan
  },
  djibouti_rail: {
    fromPort: [43.15, 11.6],
    // Djibouti port
    toPort: [38.74, 9.03]
    // Addis Ababa
  },
  baku_tbilisi_batumi_rail: {
    fromPort: [49.85, 40.4],
    // Baku
    toPort: [41.65, 41.65]
    // Batumi
  },
  us_rail_landbridge: {
    fromPort: [-118.25, 33.74],
    // Port of Los Angeles
    toPort: [-74.15, 40.67]
    // Port of New York/New Jersey
  },
  ukraine_rail_reroute: {
    fromPort: [30.74, 46.48],
    // Odesa
    toPort: [21, 52.23]
    // Warsaw (notional EU entry)
  }
};
function getCorridorGeometryOrFallback(corridorId, primaryChokepointId) {
  const explicit = BYPASS_CORRIDOR_GEOMETRY_BY_ID[corridorId];
  if (explicit) return explicit;
  const cp = CHOKEPOINT_REGISTRY2.find((c) => c.id === primaryChokepointId);
  if (cp) {
    const pt = [cp.lon, cp.lat];
    return { fromPort: pt, toPort: pt };
  }
  const zero = [0, 0];
  return { fromPort: zero, toPort: zero };
}

// server/worldmonitor/supply-chain/v1/get-route-explorer-lane.ts
var CACHE_TTL_SECONDS2 = 60;
var CARGO_TYPES = /* @__PURE__ */ new Set(["container", "tanker", "bulk", "roro"]);
var CARGO_TO_ROUTE_CATEGORY = {
  container: "container",
  tanker: "energy",
  bulk: "bulk",
  roro: "container"
};
function rankSharedRoutesByCargo(sharedRoutes, cargoType) {
  const preferredCategory = CARGO_TO_ROUTE_CATEGORY[cargoType] ?? "container";
  const routeMap = new Map(TRADE_ROUTES.map((r) => [r.id, r]));
  return [...sharedRoutes].sort((a, b) => {
    const catA = routeMap.get(a)?.category ?? "";
    const catB = routeMap.get(b)?.category ?? "";
    const matchA = catA === preferredCategory ? 0 : 1;
    const matchB = catB === preferredCategory ? 0 : 1;
    return matchA - matchB;
  });
}
function emptyResponse3(req, fallbackHs2, fallbackCargo) {
  return {
    fromIso2: req.fromIso2,
    toIso2: req.toIso2,
    hs2: fallbackHs2,
    cargoType: fallbackCargo,
    primaryRouteId: "",
    primaryRouteGeometry: [],
    chokepointExposures: [],
    bypassOptions: [],
    warRiskTier: "WAR_RISK_TIER_NORMAL",
    disruptionScore: 0,
    noModeledLane: true,
    fetchedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
}
function rangeOf(tuple) {
  return { min: tuple[0], max: tuple[1] };
}
function geoPoint(lon, lat) {
  return { lon, lat };
}
function lookupWaypointCoord(waypointId) {
  const port = PORTS.find((p) => p.id === waypointId);
  if (port) return geoPoint(port.lon, port.lat);
  const cp = CHOKEPOINT_REGISTRY2.find((c) => c.id === waypointId);
  if (cp) return geoPoint(cp.lon, cp.lat);
  return null;
}
function buildRouteGeometry(routeId) {
  if (!routeId) return [];
  const route = TRADE_ROUTES.find((r) => r.id === routeId);
  if (!route) return [];
  const coords = [];
  const fromCoord = lookupWaypointCoord(route.from);
  if (fromCoord) coords.push(fromCoord);
  for (const wp of route.waypoints) {
    const c = lookupWaypointCoord(wp);
    if (c) coords.push(c);
  }
  const toCoord = lookupWaypointCoord(route.to);
  if (toCoord) coords.push(toCoord);
  return coords;
}
function deriveCorridorStatus(corridor) {
  const notes = (corridor.notes ?? "").toLowerCase();
  const name = (corridor.name ?? "").toLowerCase();
  if (/proposed|not yet constructed|notional/.test(notes) || /proposed|\(future\)/.test(name)) {
    return "CORRIDOR_STATUS_PROPOSED";
  }
  if (/blockaded|effectively closed|not usable|suspended/.test(notes)) {
    return "CORRIDOR_STATUS_UNAVAILABLE";
  }
  return "CORRIDOR_STATUS_ACTIVE";
}
function deriveBypassWarRiskTier(corridor, statusMap) {
  if (corridor.waypointChokepointIds.length > 0) {
    return corridor.waypointChokepointIds.reduce((best, id) => {
      const t = statusMap.get(id)?.warRiskTier ?? "WAR_RISK_TIER_UNSPECIFIED";
      return (TIER_RANK[t] ?? 0) > (TIER_RANK[best] ?? 0) ? t : best;
    }, "WAR_RISK_TIER_UNSPECIFIED");
  }
  const status = deriveCorridorStatus(corridor);
  if (status === "CORRIDOR_STATUS_UNAVAILABLE") return "WAR_RISK_TIER_WAR_ZONE";
  return "WAR_RISK_TIER_UNSPECIFIED";
}
function buildBypassOption(corridor, primaryChokepointId, statusMap) {
  const geom = getCorridorGeometryOrFallback(corridor.id, primaryChokepointId);
  return {
    id: corridor.id,
    name: corridor.name,
    type: corridor.type,
    addedTransitDays: corridor.addedTransitDays,
    addedCostMultiplier: corridor.addedCostMultiplier,
    warRiskTier: deriveBypassWarRiskTier(corridor, statusMap),
    status: deriveCorridorStatus(corridor),
    fromPort: geoPoint(geom.fromPort[0], geom.fromPort[1]),
    toPort: geoPoint(geom.toPort[0], geom.toPort[1])
  };
}
async function computeLane(req, injectedStatusMap) {
  const fromIso2 = req.fromIso2.trim().toUpperCase();
  const toIso2 = req.toIso2.trim().toUpperCase();
  const hs2 = req.hs2.trim().replace(/\D/g, "") || "27";
  const cargoLower = req.cargoType.trim().toLowerCase();
  const cargoType = CARGO_TYPES.has(cargoLower) ? cargoLower : "container";
  if (!/^[A-Z]{2}$/.test(fromIso2) || !/^[A-Z]{2}$/.test(toIso2)) {
    return emptyResponse3(req, hs2, cargoType);
  }
  const clusters2 = country_port_clusters_default;
  const fromCluster = clusters2[fromIso2];
  const toCluster = clusters2[toIso2];
  const fromRoutes = new Set(fromCluster?.nearestRouteIds ?? []);
  const toRoutes = new Set(toCluster?.nearestRouteIds ?? []);
  const sharedRoutes = [...fromRoutes].filter((r) => toRoutes.has(r));
  const noModeledLane = sharedRoutes.length === 0;
  const rankedRoutes = rankSharedRoutesByCargo(sharedRoutes, cargoType);
  const primaryRouteId = rankedRoutes[0] ?? fromCluster?.nearestRouteIds[0] ?? "";
  let statusMap;
  if (injectedStatusMap) {
    statusMap = injectedStatusMap;
  } else {
    const statusRaw = await getCachedJson(CHOKEPOINT_STATUS_KEY).catch(
      () => null
    );
    statusMap = new Map(
      (statusRaw?.chokepoints ?? []).map((cp) => [cp.id, cp])
    );
  }
  const primaryRouteSet = new Set(primaryRouteId ? [primaryRouteId] : []);
  const chokepointExposures = CHOKEPOINT_REGISTRY2.filter((cp) => cp.routeIds.some((r) => primaryRouteSet.has(r))).map((cp) => {
    const overlap = cp.routeIds.filter((r) => primaryRouteSet.has(r)).length;
    const exposurePct = Math.round(overlap / Math.max(cp.routeIds.length, 1) * 100);
    return {
      chokepointId: cp.id,
      chokepointName: cp.displayName,
      exposurePct
    };
  }).filter((e) => e.exposurePct > 0).sort((a, b) => b.exposurePct - a.exposurePct);
  const primaryChokepoint = chokepointExposures[0];
  const primaryCpStatus = primaryChokepoint ? statusMap.get(primaryChokepoint.chokepointId) : null;
  const disruptionScore = primaryCpStatus?.disruptionScore ?? 0;
  const warRiskTier = primaryCpStatus?.warRiskTier ?? "WAR_RISK_TIER_NORMAL";
  const PLACEHOLDER_CORRIDOR_IDS = /* @__PURE__ */ new Set(["gibraltar_no_bypass", "cape_of_good_hope_is_bypass"]);
  const bypassOptions = primaryChokepoint ? (BYPASS_CORRIDORS_BY_CHOKEPOINT2[primaryChokepoint.chokepointId] ?? []).filter((c) => {
    if (PLACEHOLDER_CORRIDOR_IDS.has(c.id)) return false;
    if (c.suitableCargoTypes.length > 0 && !c.suitableCargoTypes.includes(cargoType)) return false;
    return true;
  }).slice(0, 5).map((c) => buildBypassOption(c, primaryChokepoint.chokepointId, statusMap)) : [];
  const transitTuple = TRANSIT_DAYS_BY_ROUTE_ID[primaryRouteId] ?? TRANSIT_DAYS_FALLBACK;
  const freightTuple = FREIGHT_USD_BY_CARGO_TYPE[cargoType] ?? FREIGHT_USD_FALLBACK;
  return {
    fromIso2,
    toIso2,
    hs2,
    cargoType,
    primaryRouteId: noModeledLane ? "" : primaryRouteId,
    primaryRouteGeometry: noModeledLane ? [] : buildRouteGeometry(primaryRouteId),
    chokepointExposures: noModeledLane ? [] : chokepointExposures,
    bypassOptions: noModeledLane ? [] : bypassOptions,
    warRiskTier: noModeledLane ? "WAR_RISK_TIER_NORMAL" : warRiskTier,
    disruptionScore: noModeledLane ? 0 : disruptionScore,
    estTransitDaysRange: noModeledLane ? void 0 : rangeOf(transitTuple),
    estFreightUsdPerTeuRange: noModeledLane ? void 0 : rangeOf(freightTuple),
    noModeledLane,
    fetchedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
}
async function getRouteExplorerLane(ctx, req) {
  const isPro = await isCallerPremium(ctx.request);
  const hs2 = req.hs2?.trim().replace(/\D/g, "") || "27";
  const cargo = CARGO_TYPES.has(req.cargoType?.trim().toLowerCase() ?? "") ? req.cargoType.trim().toLowerCase() : "container";
  if (!isPro) return emptyResponse3(req, hs2, cargo);
  const fromIso2 = req.fromIso2?.trim().toUpperCase() ?? "";
  const toIso2 = req.toIso2?.trim().toUpperCase() ?? "";
  if (!/^[A-Z]{2}$/.test(fromIso2) || !/^[A-Z]{2}$/.test(toIso2)) {
    return emptyResponse3(req, hs2, cargo);
  }
  const cacheKey = ROUTE_EXPLORER_LANE_KEY(fromIso2, toIso2, hs2, cargo);
  const result = await cachedFetchJson(
    cacheKey,
    CACHE_TTL_SECONDS2,
    async () => computeLane({ fromIso2, toIso2, hs2, cargoType: cargo })
  );
  return result ?? emptyResponse3(req, hs2, cargo);
}

// server/worldmonitor/supply-chain/v1/get-route-impact.ts
init_redis();

// server/worldmonitor/resilience/v1/_shared.ts
init_redis();
init_seed_envelope();

// scripts/shared/sovereign-status.json
var sovereign_status_default = {
  name: "sovereign-status",
  description: "Authoritative whitelist of countries eligible for the WorldMonitor Country Resilience Index headline ranking. Plan 2026-04-26-002 \xA7U2 (PR 1). Membership = 193 UN member states + 3 standalone SARs (HK, MO, TW) per Q1 decision. Non-eligible territories (American Samoa, Guam, Greenland, Falkland Islands, Isle of Man, Gibraltar, etc.) are filtered at universe-build time in seed-resilience-static.mjs and seed-resilience-scores.mjs. Status field carries 'un-member' or 'sar'; entries not in this list are implicitly excluded.",
  entries: [
    { iso2: "AF", status: "un-member" },
    { iso2: "AL", status: "un-member" },
    { iso2: "DZ", status: "un-member" },
    { iso2: "AD", status: "un-member" },
    { iso2: "AO", status: "un-member" },
    { iso2: "AG", status: "un-member" },
    { iso2: "AR", status: "un-member" },
    { iso2: "AM", status: "un-member" },
    { iso2: "AU", status: "un-member" },
    { iso2: "AT", status: "un-member" },
    { iso2: "AZ", status: "un-member" },
    { iso2: "BS", status: "un-member" },
    { iso2: "BH", status: "un-member" },
    { iso2: "BD", status: "un-member" },
    { iso2: "BB", status: "un-member" },
    { iso2: "BY", status: "un-member" },
    { iso2: "BE", status: "un-member" },
    { iso2: "BZ", status: "un-member" },
    { iso2: "BJ", status: "un-member" },
    { iso2: "BT", status: "un-member" },
    { iso2: "BO", status: "un-member" },
    { iso2: "BA", status: "un-member" },
    { iso2: "BW", status: "un-member" },
    { iso2: "BR", status: "un-member" },
    { iso2: "BN", status: "un-member" },
    { iso2: "BG", status: "un-member" },
    { iso2: "BF", status: "un-member" },
    { iso2: "BI", status: "un-member" },
    { iso2: "CV", status: "un-member" },
    { iso2: "KH", status: "un-member" },
    { iso2: "CM", status: "un-member" },
    { iso2: "CA", status: "un-member" },
    { iso2: "CF", status: "un-member" },
    { iso2: "TD", status: "un-member" },
    { iso2: "CL", status: "un-member" },
    { iso2: "CN", status: "un-member" },
    { iso2: "CO", status: "un-member" },
    { iso2: "KM", status: "un-member" },
    { iso2: "CG", status: "un-member" },
    { iso2: "CD", status: "un-member" },
    { iso2: "CR", status: "un-member" },
    { iso2: "CI", status: "un-member" },
    { iso2: "HR", status: "un-member" },
    { iso2: "CU", status: "un-member" },
    { iso2: "CY", status: "un-member" },
    { iso2: "CZ", status: "un-member" },
    { iso2: "DK", status: "un-member" },
    { iso2: "DJ", status: "un-member" },
    { iso2: "DM", status: "un-member" },
    { iso2: "DO", status: "un-member" },
    { iso2: "EC", status: "un-member" },
    { iso2: "EG", status: "un-member" },
    { iso2: "SV", status: "un-member" },
    { iso2: "GQ", status: "un-member" },
    { iso2: "ER", status: "un-member" },
    { iso2: "EE", status: "un-member" },
    { iso2: "SZ", status: "un-member" },
    { iso2: "ET", status: "un-member" },
    { iso2: "FJ", status: "un-member" },
    { iso2: "FI", status: "un-member" },
    { iso2: "FR", status: "un-member" },
    { iso2: "GA", status: "un-member" },
    { iso2: "GM", status: "un-member" },
    { iso2: "GE", status: "un-member" },
    { iso2: "DE", status: "un-member" },
    { iso2: "GH", status: "un-member" },
    { iso2: "GR", status: "un-member" },
    { iso2: "GD", status: "un-member" },
    { iso2: "GT", status: "un-member" },
    { iso2: "GN", status: "un-member" },
    { iso2: "GW", status: "un-member" },
    { iso2: "GY", status: "un-member" },
    { iso2: "HT", status: "un-member" },
    { iso2: "HN", status: "un-member" },
    { iso2: "HU", status: "un-member" },
    { iso2: "IS", status: "un-member" },
    { iso2: "IN", status: "un-member" },
    { iso2: "ID", status: "un-member" },
    { iso2: "IR", status: "un-member" },
    { iso2: "IQ", status: "un-member" },
    { iso2: "IE", status: "un-member" },
    { iso2: "IL", status: "un-member" },
    { iso2: "IT", status: "un-member" },
    { iso2: "JM", status: "un-member" },
    { iso2: "JP", status: "un-member" },
    { iso2: "JO", status: "un-member" },
    { iso2: "KZ", status: "un-member" },
    { iso2: "KE", status: "un-member" },
    { iso2: "KI", status: "un-member" },
    { iso2: "KP", status: "un-member" },
    { iso2: "KR", status: "un-member" },
    { iso2: "KW", status: "un-member" },
    { iso2: "KG", status: "un-member" },
    { iso2: "LA", status: "un-member" },
    { iso2: "LV", status: "un-member" },
    { iso2: "LB", status: "un-member" },
    { iso2: "LS", status: "un-member" },
    { iso2: "LR", status: "un-member" },
    { iso2: "LY", status: "un-member" },
    { iso2: "LI", status: "un-member" },
    { iso2: "LT", status: "un-member" },
    { iso2: "LU", status: "un-member" },
    { iso2: "MG", status: "un-member" },
    { iso2: "MW", status: "un-member" },
    { iso2: "MY", status: "un-member" },
    { iso2: "MV", status: "un-member" },
    { iso2: "ML", status: "un-member" },
    { iso2: "MT", status: "un-member" },
    { iso2: "MH", status: "un-member" },
    { iso2: "MR", status: "un-member" },
    { iso2: "MU", status: "un-member" },
    { iso2: "MX", status: "un-member" },
    { iso2: "FM", status: "un-member" },
    { iso2: "MD", status: "un-member" },
    { iso2: "MC", status: "un-member" },
    { iso2: "MN", status: "un-member" },
    { iso2: "ME", status: "un-member" },
    { iso2: "MA", status: "un-member" },
    { iso2: "MZ", status: "un-member" },
    { iso2: "MM", status: "un-member" },
    { iso2: "NA", status: "un-member" },
    { iso2: "NR", status: "un-member" },
    { iso2: "NP", status: "un-member" },
    { iso2: "NL", status: "un-member" },
    { iso2: "NZ", status: "un-member" },
    { iso2: "NI", status: "un-member" },
    { iso2: "NE", status: "un-member" },
    { iso2: "NG", status: "un-member" },
    { iso2: "MK", status: "un-member" },
    { iso2: "NO", status: "un-member" },
    { iso2: "OM", status: "un-member" },
    { iso2: "PK", status: "un-member" },
    { iso2: "PW", status: "un-member" },
    { iso2: "PA", status: "un-member" },
    { iso2: "PG", status: "un-member" },
    { iso2: "PY", status: "un-member" },
    { iso2: "PE", status: "un-member" },
    { iso2: "PH", status: "un-member" },
    { iso2: "PL", status: "un-member" },
    { iso2: "PT", status: "un-member" },
    { iso2: "QA", status: "un-member" },
    { iso2: "RO", status: "un-member" },
    { iso2: "RU", status: "un-member" },
    { iso2: "RW", status: "un-member" },
    { iso2: "KN", status: "un-member" },
    { iso2: "LC", status: "un-member" },
    { iso2: "VC", status: "un-member" },
    { iso2: "WS", status: "un-member" },
    { iso2: "SM", status: "un-member" },
    { iso2: "ST", status: "un-member" },
    { iso2: "SA", status: "un-member" },
    { iso2: "SN", status: "un-member" },
    { iso2: "RS", status: "un-member" },
    { iso2: "SC", status: "un-member" },
    { iso2: "SL", status: "un-member" },
    { iso2: "SG", status: "un-member" },
    { iso2: "SK", status: "un-member" },
    { iso2: "SI", status: "un-member" },
    { iso2: "SB", status: "un-member" },
    { iso2: "SO", status: "un-member" },
    { iso2: "ZA", status: "un-member" },
    { iso2: "SS", status: "un-member" },
    { iso2: "ES", status: "un-member" },
    { iso2: "LK", status: "un-member" },
    { iso2: "SD", status: "un-member" },
    { iso2: "SR", status: "un-member" },
    { iso2: "SE", status: "un-member" },
    { iso2: "CH", status: "un-member" },
    { iso2: "SY", status: "un-member" },
    { iso2: "TJ", status: "un-member" },
    { iso2: "TZ", status: "un-member" },
    { iso2: "TH", status: "un-member" },
    { iso2: "TL", status: "un-member" },
    { iso2: "TG", status: "un-member" },
    { iso2: "TO", status: "un-member" },
    { iso2: "TT", status: "un-member" },
    { iso2: "TN", status: "un-member" },
    { iso2: "TR", status: "un-member" },
    { iso2: "TM", status: "un-member" },
    { iso2: "TV", status: "un-member" },
    { iso2: "UG", status: "un-member" },
    { iso2: "UA", status: "un-member" },
    { iso2: "AE", status: "un-member" },
    { iso2: "GB", status: "un-member" },
    { iso2: "US", status: "un-member" },
    { iso2: "UY", status: "un-member" },
    { iso2: "UZ", status: "un-member" },
    { iso2: "VU", status: "un-member" },
    { iso2: "VE", status: "un-member" },
    { iso2: "VN", status: "un-member" },
    { iso2: "YE", status: "un-member" },
    { iso2: "ZM", status: "un-member" },
    { iso2: "ZW", status: "un-member" },
    { iso2: "HK", status: "sar" },
    { iso2: "MO", status: "sar" },
    { iso2: "TW", status: "sar" }
  ]
};

// server/worldmonitor/resilience/v1/_rankable-universe.ts
var FILE = sovereign_status_default;
var RANKABLE_UNIVERSE = new Map(
  FILE.entries.filter((e) => e?.iso2 && (e.status === "un-member" || e.status === "sar")).map((e) => [e.iso2.toUpperCase(), e.status])
);
var RANKABLE_UNIVERSE_SIZE = RANKABLE_UNIVERSE.size;

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

// server/_shared/country-token.ts
function normalizeCountryToken(value) {
  return String(value || "").normalize("NFKD").replace(new RegExp("\\p{Diacritic}", "gu"), "").toLowerCase().replace(/&/g, " and ").replace(/[''.(),/-]/g, " ").replace(/\s+/g, " ").trim();
}

// server/worldmonitor/resilience/v1/_dimension-scorers.ts
init_redis();

// server/_shared/resilience-freshness.ts
var CADENCE_UNIT_MS = {
  realtime: 60 * 60 * 1e3,
  // 1 hour
  daily: 24 * 60 * 60 * 1e3,
  // 1 day
  weekly: 7 * 24 * 60 * 60 * 1e3,
  // 7 days
  monthly: 30 * 24 * 60 * 60 * 1e3,
  // 30 days
  quarterly: 91 * 24 * 60 * 60 * 1e3,
  // 91 days
  annual: 365 * 24 * 60 * 60 * 1e3
  // 365 days
};

// server/worldmonitor/resilience/v1/_macro-fiscal-weights.ts
var MACRO_FISCAL_INDICATOR_WEIGHTS = {
  govRevenuePct: 0.4,
  debtGrowthRate: 0.2,
  currentAccountPct: 0.2,
  unemploymentPct: 0.15,
  householdDebtService: 0.05
};

// server/worldmonitor/resilience/v1/_indicator-registry.ts
var INDICATOR_REGISTRY = [
  // ── macroFiscal (5 sub-metrics) ───────────────────────────────────────────
  {
    id: "govRevenuePct",
    dimension: "macroFiscal",
    description: "Government revenue as % of GDP (IMF GGR_G01_GDP_PT); fiscal capacity proxy",
    direction: "higherBetter",
    goalposts: { worst: 5, best: 45 },
    weight: MACRO_FISCAL_INDICATOR_WEIGHTS.govRevenuePct,
    sourceKey: "economic:imf:macro:v2",
    scope: "global",
    cadence: "annual",
    tier: "core",
    coverage: 212,
    license: "open-data",
    comprehensive: true
  },
  {
    id: "debtGrowthRate",
    dimension: "macroFiscal",
    description: "Annual debt growth rate; rapid accumulation signals fiscal stress",
    direction: "lowerBetter",
    goalposts: { worst: 20, best: 0 },
    weight: MACRO_FISCAL_INDICATOR_WEIGHTS.debtGrowthRate,
    sourceKey: "economic:national-debt:v1",
    scope: "global",
    cadence: "annual",
    tier: "core",
    coverage: 190,
    license: "open-data",
    comprehensive: true
  },
  {
    id: "currentAccountPct",
    dimension: "macroFiscal",
    description: "Current account balance as % of GDP (IMF); external position vulnerability",
    direction: "higherBetter",
    goalposts: { worst: -20, best: 20 },
    weight: MACRO_FISCAL_INDICATOR_WEIGHTS.currentAccountPct,
    sourceKey: "economic:imf:macro:v2",
    scope: "global",
    cadence: "annual",
    tier: "core",
    coverage: 190,
    license: "open-data",
    comprehensive: true
  },
  {
    id: "unemploymentPct",
    dimension: "macroFiscal",
    description: "Unemployment rate (IMF WEO LUR); higher = labor-market slack & lower fiscal absorption capacity",
    direction: "lowerBetter",
    goalposts: { worst: 25, best: 3 },
    weight: MACRO_FISCAL_INDICATOR_WEIGHTS.unemploymentPct,
    sourceKey: "economic:imf:labor:v1",
    scope: "global",
    cadence: "annual",
    tier: "enrichment",
    coverage: 150,
    license: "open-data",
    comprehensive: true
  },
  {
    id: "householdDebtService",
    dimension: "macroFiscal",
    description: "BIS household debt service ratio (% income, quarterly). DSR > 10% precedes banking crises (Drehmann 2011). Lower is safer; goalposts anchor 20% \u2192 0, 0% \u2192 100.",
    direction: "lowerBetter",
    goalposts: { worst: 20, best: 0 },
    weight: MACRO_FISCAL_INDICATOR_WEIGHTS.householdDebtService,
    sourceKey: "economic:bis:dsr:v1",
    scope: "curated",
    cadence: "quarterly",
    imputation: { type: "conservative", score: 60, certainty: 0.3 },
    tier: "enrichment",
    coverage: 40,
    license: "non-commercial",
    comprehensive: false
  },
  // ── currencyExternal ─────────────────────────────────────────────────────
  // PR 3 §3.5 point 3 rebalanced the dimension's core scoring:
  //   - BIS-dependent signals (fxVolatility, fxDeviation) moved to
  //     tier='experimental'. BIS EER covers ~64 economies, which is too
  //     narrow for a world-ranking Core signal. They remain in the registry
  //     for drill-down / enrichment panels but scoreCurrencyExternal no
  //     longer reads them.
  //   - Core scoring is now: inflationStability (IMF CPI, ~185 countries)
  //     at weight 0.6, fxReservesAdequacy (WB FI.RES.TOTL.MO, ~188 countries)
  //     at weight 0.4. Both are global-coverage, so every country gets the
  //     same construct regardless of BIS membership.
  {
    id: "inflationStability",
    dimension: "currencyExternal",
    description: "IMF CPI inflation target-band score. 1-3% YoY scores best; deflation at <=-5% and high inflation at >=50% score 0. Global-coverage primary signal for currency stability. Core input to scoreCurrencyExternal under PR 3 \xA73.5.",
    direction: "lowerBetter",
    goalposts: { worst: 50, best: 3 },
    normalization: {
      kind: "targetBand",
      targetBand: { min: 1, max: 3 },
      zeroScoreAt: { min: -5, max: 50 },
      disclaimer: "scoreInflationStability is non-linear: 1-3% maps to 100, <=-5% and >=50% map to 0. goalposts are documentation anchors, not generic lowerBetter inputs."
    },
    weight: 0.6,
    sourceKey: "economic:imf:macro:v2",
    scope: "global",
    cadence: "annual",
    tier: "core",
    coverage: 185,
    license: "open-data",
    comprehensive: true
  },
  {
    id: "fxReservesAdequacy",
    dimension: "currencyExternal",
    description: "Total reserves in months of imports (World Bank FI.RES.TOTL.MO). Global-coverage core signal for currency stability; paired with inflationStability in scoreCurrencyExternal after PR 3 \xA73.5 rebalancing.",
    direction: "higherBetter",
    goalposts: { worst: 1, best: 12 },
    weight: 0.4,
    sourceKey: "resilience:static:*",
    scope: "global",
    cadence: "annual",
    tier: "core",
    coverage: 188,
    license: "open-data",
    comprehensive: true
  },
  {
    id: "fxVolatility",
    dimension: "currencyExternal",
    description: "Annualized BIS real effective exchange rate volatility (std-dev of monthly changes * sqrt(12)). Enrichment-only for the ~64 BIS-tracked economies after PR 3 \xA73.5 \u2014 NOT read by scoreCurrencyExternal. Available via drill-down panels only.",
    direction: "lowerBetter",
    goalposts: { worst: 50, best: 0 },
    weight: 0.6,
    sourceKey: "economic:bis:eer:v1",
    scope: "curated",
    cadence: "monthly",
    imputation: { type: "conservative", score: 50, certainty: 0.3 },
    tier: "experimental",
    coverage: 60,
    license: "non-commercial",
    comprehensive: false
  },
  {
    id: "fxDeviation",
    dimension: "currencyExternal",
    description: "Absolute deviation of latest BIS real EER from 100 (equilibrium index). Enrichment-only for the ~64 BIS-tracked economies after PR 3 \xA73.5 \u2014 NOT read by scoreCurrencyExternal. Available via drill-down panels only.",
    direction: "lowerBetter",
    goalposts: { worst: 35, best: 0 },
    weight: 0.25,
    sourceKey: "economic:bis:eer:v1",
    scope: "curated",
    cadence: "monthly",
    imputation: { type: "conservative", score: 50, certainty: 0.3 },
    tier: "experimental",
    coverage: 60,
    license: "non-commercial",
    comprehensive: false
  },
  // ── tradePolicy (3 sub-metrics) ───────────────────────────────────────────
  // Renamed from tradeSanctions in plan 2026-04-25-004 Phase 1 (Ship 1).
  // The OFAC `sanctionCount` indicator binding (was weight 0.45) is DROPPED;
  // domicile-of-designated-entities is a corporate-finance liability metric,
  // not a country-resilience indicator. Remaining 3 components reweighted
  // to total 1.0 (0.30 / 0.30 / 0.40).
  {
    id: "tradeRestrictions",
    dimension: "tradePolicy",
    description: "WTO trade restriction severity (low=0, moderate=1, high=2); curated reporter set",
    direction: "lowerBetter",
    goalposts: { worst: 2, best: 0 },
    weight: 0.3,
    sourceKey: "trade:restrictions:v1:tariff-overview:50",
    scope: "curated",
    cadence: "weekly",
    imputation: { type: "conservative", score: 60, certainty: 0.4 },
    // WTO tariff-overview reporter set is the curated top-50 reporters; below
    // the Core 180 gate so the signal sits in Enrichment until a wider seeder
    // ships in a future PR.
    tier: "enrichment",
    coverage: 50,
    license: "open-data",
    comprehensive: false
  },
  {
    id: "tradeBarriers",
    dimension: "tradePolicy",
    description: "WTO trade barrier severity (low=0, moderate=1, high=2); curated reporter set",
    direction: "lowerBetter",
    goalposts: { worst: 2, best: 0 },
    weight: 0.3,
    sourceKey: "trade:barriers:v1:tariff-gap:50",
    scope: "curated",
    cadence: "weekly",
    imputation: { type: "conservative", score: 60, certainty: 0.4 },
    tier: "enrichment",
    coverage: 50,
    license: "open-data",
    comprehensive: false
  },
  {
    id: "appliedTariffRate",
    dimension: "tradePolicy",
    description: "World Bank applied tariff rate, weighted mean, all products (TM.TAX.MRCH.WM.AR.ZS); 0%=free trade, 20%+=heavily restricted",
    direction: "lowerBetter",
    goalposts: { worst: 20, best: 0 },
    weight: 0.4,
    sourceKey: "resilience:static:{ISO2}",
    scope: "global",
    cadence: "annual",
    tier: "core",
    coverage: 188,
    license: "open-data",
    comprehensive: true
  },
  // ── financialSystemExposure (4 sub-metrics) ───────────────────────────────
  // plan 2026-04-25-004 Phase 2: structural sanctions vulnerability built
  // from BIS Consolidated Banking Statistics (CBS, WS_CBS_PUB) + WB IDS
  // short-term external debt + FATF AML/CFT listing status. Replaces the
  // dropped OFAC-domicile signal (Phase 1) with audited cross-border banking
  // + AML/CFT data that doesn't conflate transit-hub corporate domicile with
  // host-country risk. Components 2 + 4 share the retained
  // `economic:bis-lbs:v1` payload (no separate seed).
  // Dim is 'core' (contributes to headline score) but BIS-derived
  // indicators are 'enrichment' / 'non-commercial' per Codex R1 #8 to
  // match the existing BIS classification convention.
  {
    id: "shortTermExternalDebtPctGni",
    dimension: "financialSystemExposure",
    description: "Short-term external debt as % of GNI ((WB IDS DT.DOD.DSTC.CD / NY.GNP.MKTP.CD) \xD7 100); IMF Article IV vulnerability threshold is 15% GNI",
    direction: "lowerBetter",
    goalposts: { worst: 15, best: 0 },
    weight: 0.35,
    sourceKey: "economic:wb-external-debt:v1",
    scope: "global",
    cadence: "annual",
    imputation: { type: "conservative", score: 50, certainty: 0.3 },
    // WB IDS publishes for ~125 LMICs only; HIC fall through to the BIS CBS structural-exposure component.
    // Tagged 'enrichment' (not 'core') because the lint test enforces
    // core indicators must have coverage >= 180; LMIC-only is below
    // that gate by definition. Component carries weight 0.35 inside the
    // dim regardless of tier — the tier is a documentation classification.
    tier: "enrichment",
    coverage: 125,
    license: "open-data",
    // §U5 review fix: comprehensive=false. WB IDS coverage is the LMIC
    // subset (~125 countries), NOT the universe. HIC absence from this
    // source is NOT a stable-absence signal — those countries fall through
    // to the BIS CBS structural-exposure component instead. Marking
    // comprehensive=true would let any future IMPUTE caller treat HIC
    // absence as the high stable-absence anchor (85+), which would
    // misrepresent HIC financial-system exposure.
    comprehensive: false
  },
  {
    id: "bisLbsXborderPctGdp",
    dimension: "financialSystemExposure",
    description: "BIS CBS (WS_CBS_PUB) sum of by-parent foreign claims (US/UK/major-EU/CH/JP/CA/AU/SG) as % of GDP; U-shape band \u2014 both isolation (<5%) and over-exposure (>60%) score low",
    direction: "lowerBetter",
    // U-shape is "lowerBetter" in semantic sense (concentrated exposure penalized)
    // NOTE (Greptile P2 catch, PR #3407 review): goalposts here are
    // DOCUMENTATION-ONLY for the over-exposed branch. The actual scorer
    // uses `normalizeBandLowerBetter` (a U-shape, not a linear lowerBetter
    // mapping), which peaks at 25% and penalizes both extremes. A linear
    // `{worst, best}` cannot represent a U-shape; we set goalposts to the
    // peak (best=25) and the over-exposed worst-anchor (worst=60). Tooling
    // / lints that read these values to compute "expected" component
    // scores must consult `normalizeBandLowerBetter` directly, not assume
    // these are the inputs to a generic linear normalizer.
    goalposts: { worst: 60, best: 25 },
    normalization: {
      kind: "uShape",
      disclaimer: "normalizeBandLowerBetter peaks around diversified middle exposure and penalizes both isolation and over-exposure. goalposts summarize the over-exposed documentation branch only."
    },
    weight: 0.3,
    sourceKey: "economic:bis-lbs:v1",
    scope: "global",
    cadence: "quarterly",
    tier: "enrichment",
    coverage: 200,
    license: "non-commercial",
    // BIS terms of use; redistributed under attribution
    comprehensive: false
  },
  {
    id: "fatfListingStatus",
    dimension: "financialSystemExposure",
    description: "FATF AML/CFT listing status \u2014 black list (call for action) \u2192 0, gray list (increased monitoring) \u2192 30, compliant \u2192 100",
    direction: "higherBetter",
    goalposts: { worst: 0, best: 100 },
    normalization: {
      kind: "discrete",
      disclaimer: "fatfStatusToScore maps black=0, gray=30, compliant=100; goalposts are categorical documentation anchors."
    },
    weight: 0.2,
    sourceKey: "economic:fatf-listing:v1",
    scope: "global",
    cadence: "monthly",
    tier: "core",
    coverage: 200,
    license: "open-data",
    comprehensive: true
  },
  {
    id: "financialCenterRedundancy",
    dimension: "financialSystemExposure",
    description: "Count of distinct BIS CBS by-parent reporters with non-trivial (>1% GDP) foreign claims on the country; rewards multi-counterparty financial centers, balances Component 2 over-exposure penalty",
    direction: "higherBetter",
    goalposts: { worst: 1, best: 10 },
    weight: 0.15,
    sourceKey: "economic:bis-lbs:v1",
    // historical key; shares BIS CBS seed with Component 2
    scope: "global",
    cadence: "quarterly",
    tier: "enrichment",
    coverage: 200,
    license: "non-commercial",
    comprehensive: false
  },
  // ── cyberDigital (3 sub-metrics) ──────────────────────────────────────────
  {
    id: "cyberThreats",
    dimension: "cyberDigital",
    description: "Discovery-day decayed severity-weighted cyber threat count (critical=3x, high=2x, medium=1x, low=0.5x)",
    direction: "lowerBetter",
    goalposts: { worst: 25, best: 0 },
    weight: 0.45,
    sourceKey: "cyber:threats:v2",
    scope: "global",
    cadence: "daily",
    tier: "core",
    coverage: 195,
    license: "open-attribution",
    comprehensive: false
  },
  {
    id: "internetOutages",
    dimension: "cyberDigital",
    description: "Internet outage penalty (total=4x, major=2x, partial=1x)",
    direction: "lowerBetter",
    goalposts: { worst: 20, best: 0 },
    weight: 0.35,
    sourceKey: "infra:outages:v1",
    scope: "global",
    cadence: "realtime",
    tier: "core",
    coverage: 195,
    license: "open-attribution",
    comprehensive: false
  },
  {
    id: "gpsJamming",
    dimension: "cyberDigital",
    description: "GPS jamming hex penalty (high=3x, medium=1x)",
    direction: "lowerBetter",
    goalposts: { worst: 20, best: 0 },
    weight: 0.2,
    sourceKey: "intelligence:gpsjam:v2",
    scope: "global",
    cadence: "daily",
    tier: "core",
    coverage: 195,
    license: "open-attribution",
    comprehensive: false
  },
  // ── logisticsSupply (3 sub-metrics) ───────────────────────────────────────
  {
    id: "roadsPavedLogistics",
    dimension: "logisticsSupply",
    description: "Paved roads as % of total road network (World Bank IS.ROD.PAVE.ZS)",
    direction: "higherBetter",
    goalposts: { worst: 0, best: 100 },
    weight: 0.5,
    sourceKey: "resilience:static:{ISO2}",
    scope: "global",
    cadence: "annual",
    tier: "core",
    coverage: 188,
    license: "open-data",
    comprehensive: true
  },
  {
    id: "shippingStress",
    dimension: "logisticsSupply",
    description: "Global shipping stress score from supply-chain monitor",
    direction: "lowerBetter",
    goalposts: { worst: 100, best: 0 },
    weight: 0.25,
    sourceKey: "supply_chain:shipping_stress:v1",
    scope: "global",
    cadence: "daily",
    tier: "core",
    coverage: 195,
    license: "open-attribution",
    comprehensive: false
  },
  {
    id: "transitDisruption",
    dimension: "logisticsSupply",
    description: "Mean transit corridor disruption (disruptionPct + incidentCount7d * 0.5)",
    direction: "lowerBetter",
    goalposts: { worst: 30, best: 0 },
    weight: 0.25,
    sourceKey: "supply_chain:transit-summaries:v1",
    scope: "global",
    cadence: "daily",
    tier: "core",
    coverage: 195,
    license: "open-attribution",
    comprehensive: false
  },
  // ── infrastructure (4 sub-metrics) ────────────────────────────────────────
  {
    id: "electricityAccess",
    dimension: "infrastructure",
    description: "Access to electricity as % of population (World Bank EG.ELC.ACCS.ZS)",
    direction: "higherBetter",
    goalposts: { worst: 40, best: 100 },
    weight: 0.3,
    sourceKey: "resilience:static:{ISO2}",
    scope: "global",
    cadence: "annual",
    tier: "core",
    coverage: 217,
    license: "open-data",
    comprehensive: true
  },
  {
    id: "roadsPavedInfra",
    dimension: "infrastructure",
    description: "Paved roads as % of total road network (World Bank IS.ROD.PAVE.ZS)",
    direction: "higherBetter",
    goalposts: { worst: 0, best: 100 },
    weight: 0.3,
    sourceKey: "resilience:static:{ISO2}",
    scope: "global",
    cadence: "annual",
    tier: "core",
    coverage: 188,
    license: "open-data",
    comprehensive: true
  },
  {
    id: "infraOutages",
    dimension: "infrastructure",
    description: "Internet outage penalty (total=4x, major=2x, partial=1x); shared source with cyberDigital",
    direction: "lowerBetter",
    goalposts: { worst: 20, best: 0 },
    weight: 0.25,
    sourceKey: "infra:outages:v1",
    scope: "global",
    cadence: "realtime",
    tier: "core",
    coverage: 195,
    license: "open-attribution",
    comprehensive: false
  },
  {
    id: "broadband",
    dimension: "infrastructure",
    description: "Fixed broadband subscriptions per 100 people (World Bank IT.NET.BBND.P2)",
    direction: "higherBetter",
    goalposts: { worst: 0, best: 40 },
    weight: 0.15,
    sourceKey: "resilience:static:{ISO2}",
    scope: "global",
    cadence: "annual",
    tier: "core",
    coverage: 188,
    license: "open-data",
    comprehensive: true
  },
  // ── energy (active production construct = v2) ─────────────────────────────
  // The legacy standalone indicators remain registered for rollback/docs and
  // the compare harness, but the production runtime manifest reports
  // constructVersions.energy='v2'. The flat tier field therefore represents
  // the active production construct, not the dormant rollback path.
  {
    id: "energyImportDependency",
    dimension: "energy",
    description: "LEGACY rollback standalone input: IEA energy import dependency (% of total energy supply from imports). In active energy v2 this source is absorbed into importedFossilDependence rather than scored as its own indicator.",
    direction: "lowerBetter",
    goalposts: { worst: 100, best: 0 },
    weight: 0.25,
    sourceKey: "resilience:static:{ISO2}",
    scope: "global",
    cadence: "annual",
    tier: "experimental",
    coverage: 188,
    license: "open-data",
    comprehensive: true
  },
  {
    id: "gasShare",
    dimension: "energy",
    description: "LEGACY rollback standalone input: natural gas share of energy mix (%). Retired under active energy v2 because it conflates domestic fossil generation with import exposure.",
    direction: "lowerBetter",
    goalposts: { worst: 100, best: 0 },
    weight: 0.12,
    sourceKey: "energy:mix:v1:{ISO2}",
    scope: "global",
    cadence: "annual",
    tier: "experimental",
    coverage: 195,
    license: "open-attribution",
    comprehensive: true
  },
  {
    id: "coalShare",
    dimension: "energy",
    description: "LEGACY rollback standalone input: coal share of energy mix (%). Retired under active energy v2 because domestic coal is not an import-dependence signal.",
    direction: "lowerBetter",
    goalposts: { worst: 100, best: 0 },
    weight: 0.08,
    sourceKey: "energy:mix:v1:{ISO2}",
    scope: "global",
    cadence: "annual",
    tier: "experimental",
    coverage: 195,
    license: "open-attribution",
    comprehensive: true
  },
  {
    id: "renewShare",
    dimension: "energy",
    description: "LEGACY rollback standalone input: renewable energy share of energy mix (%). Absorbed by active energy v2 lowCarbonGenerationShare, which also credits nuclear and hydroelectric generation.",
    direction: "higherBetter",
    goalposts: { worst: 0, best: 100 },
    weight: 0.05,
    sourceKey: "energy:mix:v1:{ISO2}",
    scope: "global",
    cadence: "annual",
    tier: "experimental",
    coverage: 195,
    license: "open-attribution",
    comprehensive: true
  },
  {
    id: "euGasStorageStress",
    dimension: "energy",
    description: "EU gas storage fill stress: (80 - fillPct) / 80 clamped to [0,1], scaled to 0-100. Active energy v2 scopes the signal to EU gas-storage countries and contributes null outside that set.",
    direction: "lowerBetter",
    goalposts: { worst: 100, best: 0 },
    weight: 0.1,
    sourceKey: "energy:gas-storage:v1:{ISO2}",
    scope: "global",
    cadence: "daily",
    // GIE AGSI+ covers EU + a few neighbours; below the Core 180 gate so the
    // signal lives in Enrichment until a wider gas-storage feed lands.
    tier: "enrichment",
    coverage: 38,
    license: "open-attribution",
    comprehensive: false
  },
  {
    id: "energyPriceStress",
    dimension: "energy",
    description: "Mean absolute energy price change across commodities",
    direction: "lowerBetter",
    goalposts: { worst: 25, best: 0 },
    weight: 0.15,
    sourceKey: "economic:energy:v1:all",
    scope: "global",
    cadence: "daily",
    tier: "core",
    coverage: 195,
    license: "public-domain",
    comprehensive: true
  },
  {
    id: "electricityConsumption",
    dimension: "energy",
    description: "LEGACY rollback standalone input: per-capita electricity consumption (kWh/year, World Bank EG.USE.ELEC.KH.PC). Retired under active energy v2 because it is a wealth/load proxy rather than a resilience mechanism.",
    direction: "higherBetter",
    goalposts: { worst: 200, best: 8e3 },
    weight: 0.3,
    sourceKey: "resilience:static:{ISO2}",
    scope: "global",
    cadence: "annual",
    tier: "experimental",
    coverage: 217,
    license: "open-data",
    comprehensive: true
  },
  // ── energy v2 global inputs ───────────────────────────────────────────────
  // Production is flipped to energy v2, so these now participate in the Core
  // coverage/license gates. The required seed coverage is >=188 countries.
  {
    id: "importedFossilDependence",
    dimension: "energy",
    description: "Composite: fossil share of electricity (EG.ELC.FOSL.ZS) \xD7 max(net energy imports % of primary energy use, 0) / 100. Lower is better. Replaces gasShare + coalShare + dependency under the Option B (power-system security) framing.",
    direction: "lowerBetter",
    goalposts: { worst: 100, best: 0 },
    weight: 0.35,
    sourceKey: "resilience:fossil-electricity-share:v1",
    sourceKeys: [
      "resilience:fossil-electricity-share:v1",
      "resilience:static:{ISO2}"
    ],
    scope: "global",
    cadence: "annual",
    imputation: { type: "conservative", score: 50, certainty: 0.3 },
    tier: "core",
    coverage: 190,
    license: "open-data",
    comprehensive: true
  },
  {
    id: "lowCarbonGenerationShare",
    dimension: "energy",
    description: "Low-carbon share of electricity generation from OWID Grapher share-electricity-low-carbon: renewables plus nuclear as a percent of electricity produced. OWID renewables already include hydropower, so the seeder uses the pre-aggregated low-carbon field to preserve nuclear credit without double-counting hydro-heavy grids such as Norway, Paraguay, Brazil, and Canada. Absorbs the legacy renewShare and adds firm low-carbon credit.",
    direction: "higherBetter",
    goalposts: { worst: 0, best: 80 },
    weight: 0.2,
    sourceKey: "resilience:low-carbon-generation:v1",
    scope: "global",
    cadence: "annual",
    imputation: { type: "conservative", score: 30, certainty: 0.3 },
    tier: "core",
    coverage: 190,
    license: "open-attribution",
    comprehensive: true
  },
  {
    id: "powerLossesPct",
    dimension: "energy",
    description: "Electric power transmission + distribution losses (World Bank EG.ELC.LOSS.ZS). Direct grid-integrity measure. Weight is 0.20 in PR 1 \u2014 it temporarily absorbs the deferred reserveMarginPct slot (plan \xA73.1 open-question); when the IEA electricity-balance seeder lands, split 0.10 back out and restore reserveMarginPct at 0.10. Keep this field in lockstep with scoreEnergyV2 in _dimension-scorers.ts, because the PR 0 compare harness copies spec.weight into nominalWeight for gate-9 reporting.",
    direction: "lowerBetter",
    goalposts: { worst: 25, best: 3 },
    weight: 0.2,
    sourceKey: "resilience:power-losses:v1",
    scope: "global",
    cadence: "annual",
    imputation: { type: "conservative", score: 50, certainty: 0.3 },
    tier: "core",
    coverage: 188,
    license: "open-data",
    comprehensive: true
  },
  // reserveMarginPct is DEFERRED per plan §3.1 open-question: IEA
  // electricity-balance data is sparse outside OECD+G20 and the
  // indicator will likely ship as tier='unmonitored' with weight 0.05
  // if it lands at all. Registering the indicator before a seeder
  // exists would orphan its sourceKey in the seed-meta coverage
  // test. The v2 scorer still READS from resilience:reserve-margin:v1
  // (key reserved in _dimension-scorers.ts) so the scorer shape
  // stays stable for the commit that provides data. Add the registry
  // entry in that follow-up commit.
  // ── governanceInstitutional (6 sub-metrics, equal weight) ─────────────────
  {
    id: "wgiVoiceAccountability",
    dimension: "governanceInstitutional",
    description: "World Bank WGI: Voice and Accountability (-2.5 to +2.5)",
    direction: "higherBetter",
    goalposts: { worst: -2.5, best: 2.5 },
    weight: 1 / 6,
    sourceKey: "resilience:static:{ISO2}",
    scope: "global",
    cadence: "annual",
    tier: "core",
    coverage: 214,
    license: "public-domain",
    comprehensive: true
  },
  {
    id: "wgiPoliticalStability",
    dimension: "governanceInstitutional",
    description: "World Bank WGI: Political Stability and Absence of Violence (-2.5 to +2.5)",
    direction: "higherBetter",
    goalposts: { worst: -2.5, best: 2.5 },
    weight: 1 / 6,
    sourceKey: "resilience:static:{ISO2}",
    scope: "global",
    cadence: "annual",
    tier: "core",
    coverage: 214,
    license: "public-domain",
    comprehensive: true
  },
  {
    id: "wgiGovernmentEffectiveness",
    dimension: "governanceInstitutional",
    description: "World Bank WGI: Government Effectiveness (-2.5 to +2.5)",
    direction: "higherBetter",
    goalposts: { worst: -2.5, best: 2.5 },
    weight: 1 / 6,
    sourceKey: "resilience:static:{ISO2}",
    scope: "global",
    cadence: "annual",
    tier: "core",
    coverage: 214,
    license: "public-domain",
    comprehensive: true
  },
  {
    id: "wgiRegulatoryQuality",
    dimension: "governanceInstitutional",
    description: "World Bank WGI: Regulatory Quality (-2.5 to +2.5)",
    direction: "higherBetter",
    goalposts: { worst: -2.5, best: 2.5 },
    weight: 1 / 6,
    sourceKey: "resilience:static:{ISO2}",
    scope: "global",
    cadence: "annual",
    tier: "core",
    coverage: 214,
    license: "public-domain",
    comprehensive: true
  },
  {
    id: "wgiRuleOfLaw",
    dimension: "governanceInstitutional",
    description: "World Bank WGI: Rule of Law (-2.5 to +2.5)",
    direction: "higherBetter",
    goalposts: { worst: -2.5, best: 2.5 },
    weight: 1 / 6,
    sourceKey: "resilience:static:{ISO2}",
    scope: "global",
    cadence: "annual",
    tier: "core",
    coverage: 214,
    license: "public-domain",
    comprehensive: true
  },
  {
    id: "wgiControlOfCorruption",
    dimension: "governanceInstitutional",
    description: "World Bank WGI: Control of Corruption (-2.5 to +2.5)",
    direction: "higherBetter",
    goalposts: { worst: -2.5, best: 2.5 },
    weight: 1 / 6,
    sourceKey: "resilience:static:{ISO2}",
    scope: "global",
    cadence: "annual",
    tier: "core",
    coverage: 214,
    license: "public-domain",
    comprehensive: true
  },
  // ── socialCohesion (3 sub-metrics) ────────────────────────────────────────
  {
    id: "gpiScore",
    dimension: "socialCohesion",
    description: "Global Peace Index score; empirical range 1.1 (Iceland) to 3.4 (Yemen 2024)",
    direction: "lowerBetter",
    goalposts: { worst: 3.6, best: 1 },
    weight: 0.55,
    sourceKey: "resilience:static:{ISO2}",
    scope: "global",
    cadence: "annual",
    // GPI/IEP covers 163 economies, below the Phase 2 A4 Core gate of 180.
    // Demoted to Enrichment so the overall public score is not driven by a
    // signal that misses ~30 countries; PR 4 (T2.3) aggregation will respect
    // this. The license is also non-commercial (IEP carve-out), which would
    // independently disqualify Core. See parent plan, "Signal tiering" section.
    tier: "enrichment",
    coverage: 163,
    license: "non-commercial",
    comprehensive: true
  },
  {
    id: "displacementTotal",
    dimension: "socialCohesion",
    description: "UNHCR total displaced persons (log10 scale); absent = null (excluded from blend, no imputation)",
    direction: "lowerBetter",
    goalposts: { worst: 7, best: 0 },
    weight: 0.25,
    sourceKey: "displacement:summary:v1:{year}",
    scope: "global",
    cadence: "annual",
    tier: "core",
    coverage: 200,
    license: "open-data",
    comprehensive: true
  },
  {
    id: "unrestEvents",
    dimension: "socialCohesion",
    description: "Unrest event count (severity-weighted) + sqrt(fatalities)",
    direction: "lowerBetter",
    goalposts: { worst: 10, best: 0 },
    weight: 0.2,
    sourceKey: "unrest:events:v1",
    scope: "global",
    cadence: "realtime",
    tier: "core",
    coverage: 195,
    license: "open-attribution",
    comprehensive: false
  },
  // ── borderSecurity / "Conflict & Displacement" (2 sub-metrics) ───────────
  // #3737 — internal id stays `borderSecurity` for proto / cache stability,
  // but the dimension measures armed-conflict event intensity + refugee
  // displacement, not border-control infrastructure. User-facing label is
  // "Conflict" (widget) / "Conflict & Displacement" (methodology doc).
  {
    id: "ucdpConflict",
    dimension: "borderSecurity",
    description: "UCDP armed conflict metric: eventCount*2 + typeWeight + sqrt(deaths)",
    direction: "lowerBetter",
    goalposts: { worst: 15, best: 0 },
    weight: 0.65,
    sourceKey: "conflict:ucdp-events:v1",
    scope: "global",
    cadence: "annual",
    // UCDP is global (193 countries) but the license is research-only
    // (Uppsala). The parent plan keeps UCDP Core; the linter allowlist
    // KNOWN_EXCEPTIONS in tests/resilience-indicator-tiering.test.mts holds
    // the carve-out until Phase 2 A9 licensing review resolves it.
    tier: "core",
    coverage: 193,
    license: "research-only",
    comprehensive: true
  },
  {
    id: "displacementHosted",
    dimension: "borderSecurity",
    description: "UNHCR hosted/total displaced persons (log10 scale); refugee pressure proxy",
    direction: "lowerBetter",
    goalposts: { worst: 7, best: 0 },
    weight: 0.35,
    sourceKey: "displacement:summary:v1:{year}",
    scope: "global",
    cadence: "annual",
    imputation: { type: "absenceSignal", score: 85, certainty: 0.6 },
    tier: "core",
    coverage: 200,
    license: "open-data",
    comprehensive: true
  },
  // ── informationCognitive (3 sub-metrics) ──────────────────────────────────
  // The velocity + news-threat sub-indicators are weight-attenuated by
  // `getLanguageCoverageFactor` (_language-coverage.ts) so that countries with
  // sparse English-language news coverage lean more heavily on the static RSF
  // press-freedom indicator (which is coverage-independent). See #3736 for the
  // earlier divide-amplification bug this replaced.
  {
    id: "rsfPressFreedom",
    dimension: "informationCognitive",
    description: "Reporters Sans Frontieres press freedom score (0-100)",
    direction: "lowerBetter",
    goalposts: { worst: 100, best: 0 },
    weight: 0.55,
    sourceKey: "resilience:static:{ISO2}",
    scope: "global",
    cadence: "annual",
    tier: "core",
    coverage: 180,
    license: "open-attribution",
    comprehensive: true
  },
  {
    id: "socialVelocity",
    dimension: "informationCognitive",
    description: "Reddit social velocity score (log10(velocity+1)); sub-indicator weight scales with English-language coverage",
    direction: "lowerBetter",
    goalposts: { worst: 3, best: 0 },
    weight: 0.15,
    sourceKey: "intelligence:social:reddit:v1",
    scope: "global",
    cadence: "realtime",
    tier: "core",
    coverage: 195,
    license: "open-attribution",
    comprehensive: false
  },
  {
    id: "newsThreatScore",
    dimension: "informationCognitive",
    description: "AI news threat summary (critical=4x, high=2x, medium=1x, low=0.5x); sub-indicator weight scales with English-language coverage",
    direction: "lowerBetter",
    goalposts: { worst: 20, best: 0 },
    weight: 0.3,
    sourceKey: "news:threat:summary:v1",
    scope: "global",
    cadence: "daily",
    tier: "core",
    coverage: 195,
    license: "open-attribution",
    comprehensive: false
  },
  // ── healthPublicService (5 sub-metrics) ───────────────────────────────────
  {
    id: "uhcIndex",
    dimension: "healthPublicService",
    description: "WHO Universal Health Coverage service coverage index (0-100)",
    direction: "higherBetter",
    goalposts: { worst: 40, best: 90 },
    weight: 0.35,
    sourceKey: "resilience:static:{ISO2}",
    scope: "global",
    cadence: "annual",
    tier: "core",
    coverage: 194,
    license: "public-domain",
    comprehensive: true
  },
  {
    id: "measlesCoverage",
    dimension: "healthPublicService",
    description: "WHO measles immunization coverage among 1-year-olds (%)",
    direction: "higherBetter",
    goalposts: { worst: 50, best: 99 },
    weight: 0.25,
    sourceKey: "resilience:static:{ISO2}",
    scope: "global",
    cadence: "annual",
    tier: "core",
    coverage: 194,
    license: "public-domain",
    comprehensive: true
  },
  {
    id: "hospitalBeds",
    dimension: "healthPublicService",
    description: "WHO hospital beds per 1,000 people",
    direction: "higherBetter",
    goalposts: { worst: 0, best: 8 },
    weight: 0.1,
    sourceKey: "resilience:static:{ISO2}",
    scope: "global",
    cadence: "annual",
    tier: "core",
    coverage: 194,
    license: "public-domain",
    comprehensive: true
  },
  {
    id: "physiciansPer1k",
    dimension: "healthPublicService",
    description: "WHO physicians per 1,000 people (HWF_0001 converted from per 10,000)",
    direction: "higherBetter",
    goalposts: { worst: 0, best: 5 },
    weight: 0.15,
    sourceKey: "resilience:static:{ISO2}",
    scope: "global",
    cadence: "annual",
    tier: "core",
    coverage: 194,
    license: "public-domain",
    comprehensive: true
  },
  {
    id: "healthExpPerCapitaUsd",
    dimension: "healthPublicService",
    description: "WHO current health expenditure per capita, USD (GHED_CHE_pc_US_SHA2011)",
    direction: "higherBetter",
    goalposts: { worst: 20, best: 3e3 },
    weight: 0.15,
    sourceKey: "resilience:static:{ISO2}",
    scope: "global",
    cadence: "annual",
    tier: "core",
    coverage: 194,
    license: "public-domain",
    comprehensive: true
  },
  // ── foodWater (3 sub-metrics) ─────────────────────────────────────────────
  {
    id: "ipcPeopleInCrisis",
    dimension: "foodWater",
    description: "IPC/FAO people in food crisis (log10 scale)",
    direction: "lowerBetter",
    goalposts: { worst: 7, best: 0 },
    weight: 0.45,
    sourceKey: "resilience:static:{ISO2}",
    scope: "global",
    cadence: "annual",
    imputation: { type: "absenceSignal", score: 88, certainty: 0.7 },
    // IPC measured coverage is ~52 crisis-tracked countries; absence is a
    // strong positive signal (stable-absence imputation, score 88), so the
    // effective country coverage is global. Stays Core per the parent plan.
    tier: "core",
    coverage: 195,
    license: "open-data",
    comprehensive: true
  },
  {
    id: "ipcPhase",
    dimension: "foodWater",
    description: "IPC food crisis phase (1-5 scale)",
    direction: "lowerBetter",
    goalposts: { worst: 5, best: 1 },
    weight: 0.15,
    sourceKey: "resilience:static:{ISO2}",
    scope: "global",
    cadence: "annual",
    imputation: { type: "absenceSignal", score: 88, certainty: 0.7 },
    tier: "core",
    coverage: 195,
    license: "open-data",
    comprehensive: true
  },
  {
    id: "aquastatScore",
    dimension: "foodWater",
    description: "FAO AQUASTAT value scored by indicator semantics: stress/withdrawal/dependency readings are lower-better on 0-100; availability/renewable/access readings are higher-better on 0-100 or 0-5000 m3/capita.",
    direction: "indicatorSemantics",
    goalposts: { worst: 100, best: 0 },
    weight: 0.4,
    sourceKey: "resilience:static:{ISO2}",
    scope: "global",
    cadence: "annual",
    tier: "core",
    coverage: 188,
    license: "open-data",
    comprehensive: true
  },
  // ── fiscalSpace (4 sub-metrics) ──────────────────────────────────────────
  // Weights rebalanced from 0.4/0.3/0.3 → 0.25/0.20/0.20/0.35 to make room
  // for debtSustainabilityGap as the largest single slice (it's the most
  // informative single signal — integrates pb, r, g, d, and their
  // interaction). Sum invariant: 0.25 + 0.20 + 0.20 + 0.35 = 1.0.
  {
    id: "recoveryGovRevenue",
    dimension: "fiscalSpace",
    description: "Government revenue as % of GDP (IMF GGR_G01_GDP_PT); fiscal mobilization capacity for recovery",
    direction: "higherBetter",
    goalposts: { worst: 5, best: 45 },
    weight: 0.25,
    sourceKey: "resilience:recovery:fiscal-space:v1",
    scope: "global",
    cadence: "annual",
    tier: "core",
    coverage: 190,
    license: "open-data",
    comprehensive: true
  },
  {
    id: "recoveryFiscalBalance",
    dimension: "fiscalSpace",
    description: "General government net lending/borrowing as % of GDP (IMF GGXCNL_G01_GDP_PT); deficit signals reduced recovery firepower",
    direction: "higherBetter",
    goalposts: { worst: -15, best: 5 },
    weight: 0.2,
    sourceKey: "resilience:recovery:fiscal-space:v1",
    scope: "global",
    cadence: "annual",
    tier: "core",
    coverage: 190,
    license: "open-data",
    comprehensive: true
  },
  {
    id: "recoveryDebtToGdp",
    dimension: "fiscalSpace",
    description: "General government gross debt as % of GDP (IMF GGXWDG_NGDP_PT); high debt limits recovery borrowing capacity",
    direction: "lowerBetter",
    goalposts: { worst: 150, best: 0 },
    weight: 0.2,
    sourceKey: "resilience:recovery:fiscal-space:v1",
    scope: "global",
    cadence: "annual",
    tier: "core",
    coverage: 190,
    license: "open-data",
    comprehensive: true
  },
  {
    id: "debtSustainabilityGap",
    dimension: "fiscalSpace",
    description: "Primary-balance gap to debt-stabilizing level: gap = pb \u2212 ((r\u2212g)/(1+g))\xB7d (IMF DSA construct). Positive = debt path declining, negative = rising. r derived from interest expense / debt (overall balance minus primary balance); g from compounded real growth \xD7 (1+CPI). Inflation cap at 10% drops gap to null for inflation-tax-regime countries (Argentina, Turkey, Lebanon, Egypt, Nigeria, Ethiopia, etc.) where high nominal-GDP growth mechanically erodes debt while masking underlying fiscal pathology; fiscal-3 still scores them.",
    direction: "higherBetter",
    goalposts: { worst: -5, best: 3 },
    weight: 0.35,
    sourceKey: "resilience:recovery:fiscal-space:v1",
    scope: "global",
    cadence: "annual",
    // Tier: 'enrichment' — the indicator excludes inflation-tax-regime
    // countries by design (CPI > 10% → gap=null), so it structurally cannot
    // meet the Core-tier ≥180 countries coverage invariant. Scorer doesn't
    // filter by tier; this is a quality classification. The 3 sibling
    // fiscalSpace indicators (revenue/balance/debt) remain Core at coverage
    // 190. Cap tightened from 25% in 2026-05-19 follow-up to PR #3669 after
    // Lebanon scored #1 at 14.6% inflation.
    tier: "enrichment",
    coverage: 140,
    license: "open-data",
    comprehensive: true
  },
  // ── reserveAdequacy (RETIRED in PR 2 §3.4) ───────────────────────────────
  // Replaced by liquidReserveAdequacy + sovereignFiscalBuffer. The legacy
  // indicator is kept in the registry at tier='experimental' so drill-
  // down views that consult the registry by dimension still see
  // something structural; it does not contribute to the core score.
  {
    id: "recoveryReserveMonths",
    dimension: "reserveAdequacy",
    description: "RETIRED in PR 2 \xA73.4. Legacy total-reserves-in-months-of-imports (WB FI.RES.TOTL.MO) at the 1..18 anchor. Does not contribute to the score \u2014 scoreReserveAdequacy returns coverage=0 + imputationClass=null. Superseded by recoveryLiquidReserveMonths (same source, re-anchored 1..12) + the new sovereign-wealth indicator.",
    direction: "higherBetter",
    goalposts: { worst: 1, best: 18 },
    weight: 1,
    sourceKey: "resilience:recovery:reserve-adequacy:v1",
    scope: "global",
    cadence: "annual",
    tier: "experimental",
    coverage: 188,
    license: "open-data",
    comprehensive: true
  },
  // ── liquidReserveAdequacy (1 sub-metric) ─────────────────────────────────
  // PR 2 §3.4 replacement for the liquid-reserves half of the retired
  // reserveAdequacy. Same source (WB FI.RES.TOTL.MO) but re-anchored
  // 1..12 months instead of 1..18. Twelve months ≈ IMF "full reserve
  // adequacy" ballpark for a diversified emerging-market importer.
  {
    id: "recoveryLiquidReserveMonths",
    dimension: "liquidReserveAdequacy",
    description: "Total reserves in months of imports (World Bank FI.RES.TOTL.MO), re-anchored 1..12 per plan \xA73.4. Immediate-liquidity buffer against short external shocks, measured at central-bank reserves only \u2014 sovereign-wealth assets are scored separately in sovereignFiscalBuffer.",
    direction: "higherBetter",
    goalposts: { worst: 1, best: 12 },
    weight: 1,
    sourceKey: "resilience:recovery:reserve-adequacy:v1",
    sourceKeys: [
      "resilience:recovery:reserve-adequacy:v1",
      "resilience:recovery:reexport-share:v1"
    ],
    scope: "global",
    cadence: "annual",
    tier: "core",
    coverage: 188,
    license: "open-data",
    comprehensive: true
  },
  // ── sovereignFiscalBuffer (1 sub-metric) ─────────────────────────────────
  // PR 2 §3.4 — scored on the SWF haircut manifest. Payload produced by
  // scripts/seed-sovereign-wealth.mjs (landed in #3305, wired into
  // Railway cron in #3319). Per-country totalEffectiveMonths is the sum
  // across a country's manifest funds of (aum / annualImports × 12) ×
  // (access × liquidity × transparency). Scorer applies a saturating
  // transform: score = 100 × (1 − exp(−effectiveMonths / 12)) to prevent
  // Norway-type outliers from dominating the recovery pillar.
  //
  // Registry coverage remains 8 as conservative metadata from the first
  // SWF seed rollout; it is not the live YAML manifest count and not the
  // per-country Path 3 coverage. Countries NOT in the manifest are
  // not-applicable for this construct when the SWF payload is present
  // (score 0, coverage 0, imputationClass 'not-applicable'), distinct
  // from missing-seed IMPUTE.
  {
    id: "recoverySovereignWealthEffectiveMonths",
    dimension: "sovereignFiscalBuffer",
    description: "Sovereign-wealth fiscal-buffer signal per plan \xA73.4. Seeded from Wikipedia SWF list + per-fund article infoboxes (CC-BY-SA), haircut by the classification manifest (scripts/shared/swf-classification-manifest.yaml): effectiveMonths = rawSwfMonths \xD7 access \xD7 liquidity \xD7 transparency, summed across a country's manifest funds. Scorer applies a saturating transform score = 100 \xD7 (1 \u2212 exp(\u2212effectiveMonths / 12)).",
    direction: "higherBetter",
    goalposts: { worst: 0, best: 60 },
    normalization: {
      kind: "saturating",
      disclaimer: "scoreSovereignFiscalBuffer uses 100 * (1 - exp(-effectiveMonths / 12)); goalposts document the display range, not a linear scorer anchor."
    },
    weight: 1,
    sourceKey: "resilience:recovery:sovereign-wealth:v1",
    scope: "global",
    cadence: "quarterly",
    // tier='experimental' because the manifest ships below the
    // 180-country core-tier threshold / 137-country §3.6 gate). Non-SWF
    // countries are scored as dim-not-applicable (score 0, coverage 0,
    // imputationClass 'not-applicable') per plan 2026-04-26-001 §U3 —
    // reframed from the original "substantive absence" decision in plan
    // 2026-04-25-001 §3.4. The §3.6 coverage-and-influence gate counts
    // upstream-data coverage, which is 8. Graduating to 'core' requires
    // expanding the manifest past 137 entries, which is a follow-up PR
    // after external data partners are identified.
    tier: "experimental",
    coverage: 8,
    license: "open-data",
    comprehensive: false
  },
  // ── externalDebtCoverage (1 sub-metric) ──────────────────────────────────
  {
    id: "recoveryDebtToReserves",
    dimension: "externalDebtCoverage",
    description: "Short-term external debt to reserves ratio (World Bank DT.DOD.DSTC.CD / FI.RES.TOTL.CD); Greenspan-Guidotti rule treats ratio\u22651 as reserve inadequacy, ratio\u22652 as acute rollover-shock exposure",
    direction: "lowerBetter",
    // PR 3 §3.5 point 3: re-goalposted from (0..5) to (0..2). Old goalpost
    // saturated at 100 across the full 9-country probe including stressed
    // states. New anchor: ratio=1.0 (Greenspan-Guidotti reserve-adequacy
    // threshold) maps to score 50; ratio=2.0 (double the threshold, acute
    // distress) maps to 0. Ratios above 2.0 clamp to 0 — consistent with
    // "beyond this point the precise value stops mattering, the country
    // is already in a rollover-crisis regime."
    goalposts: { worst: 2, best: 0 },
    weight: 1,
    sourceKey: "resilience:recovery:external-debt:v1",
    scope: "global",
    cadence: "annual",
    tier: "core",
    coverage: 185,
    license: "open-data",
    comprehensive: true
  },
  // ── importConcentration (1 sub-metric) ───────────────────────────────────
  {
    id: "recoveryImportHhi",
    dimension: "importConcentration",
    description: "Herfindahl-Hirschman Index of import partner concentration (UN Comtrade HS2 bilateral); higher HHI = more dependent on fewer partners = slower recovery if a key partner is disrupted. Missing source years and years outside the normal 4-year Comtrade window derate certainty coverage.",
    direction: "lowerBetter",
    goalposts: { worst: 5e3, best: 0 },
    weight: 1,
    sourceKey: "resilience:recovery:import-hhi:v1",
    scope: "global",
    cadence: "annual",
    tier: "core",
    coverage: 190,
    license: "public-domain",
    comprehensive: true
  },
  // ── stateContinuity (3 sub-metrics, derived from existing keys) ──────────
  {
    id: "recoveryWgiContinuity",
    dimension: "stateContinuity",
    description: "Mean WGI score as institutional durability proxy; higher governance = better state continuity under shock",
    direction: "higherBetter",
    goalposts: { worst: -2.5, best: 2.5 },
    weight: 0.5,
    sourceKey: "resilience:static:{ISO2}",
    scope: "global",
    cadence: "annual",
    tier: "core",
    coverage: 214,
    license: "public-domain",
    comprehensive: true
  },
  {
    id: "recoveryConflictPressure",
    dimension: "stateContinuity",
    description: "UCDP conflict metric inverted to state continuity; active conflict directly undermines state continuity",
    direction: "lowerBetter",
    goalposts: { worst: 30, best: 0 },
    weight: 0.3,
    sourceKey: "conflict:ucdp-events:v1",
    scope: "global",
    cadence: "annual",
    tier: "core",
    coverage: 193,
    license: "research-only",
    comprehensive: true
  },
  {
    id: "recoveryDisplacementVelocity",
    dimension: "stateContinuity",
    description: "UNHCR displacement as state continuity signal; mass displacement signals state function breakdown",
    direction: "lowerBetter",
    goalposts: { worst: 7, best: 0 },
    weight: 0.2,
    sourceKey: "displacement:summary:v1:{year}",
    scope: "global",
    cadence: "annual",
    tier: "core",
    coverage: 200,
    license: "open-data",
    comprehensive: true
  },
  // ── fuelStockDays (1 sub-metric) ─────────────────────────────────────────
  // PR 3 §3.5 point 1: RETIRED from the core score. IEA emergency-
  // stockholding is defined in days of NET IMPORTS; the net-importer
  // vs net-exporter framings are incomparable, so no global resilience
  // signal can be built from this data. scoreFuelStockDays now returns
  // coverage=0 + imputationClass=null for every country (filtered out
  // of confidence/coverage averages via the RESILIENCE_RETIRED_DIMENSIONS
  // registry in _dimension-scorers.ts). imputationClass is deliberately
  // `null` rather than 'source-failure' — a retirement is structural,
  // not a runtime outage, and surfacing 'source-failure' would manufacture
  // a false "Source down" label in the widget for every country. The
  // registry entry stays at tier='experimental' so the Core coverage
  // gate treats it as out-of-score; the dimension itself remains
  // registered for structural continuity (PR 4 structural-audit may
  // remove it entirely).
  {
    id: "recoveryFuelStockDays",
    dimension: "fuelStockDays",
    description: "RETIRED in PR 3. Legacy days-of-fuel-stock-cover (IEA Oil Stocks / EIA Weekly Petroleum Status). Does not contribute to the score \u2014 scoreFuelStockDays returns coverage=0 + imputationClass=null, and the dimension is excluded from confidence/coverage averages via the RESILIENCE_RETIRED_DIMENSIONS registry. Kept in the registry as tier=experimental for structural continuity; a globally-comparable recovery-fuel concept could replace this in a future PR. NOTE: the seed-recovery-fuel-stocks Railway slot continues to populate `sourceKey` weekly even though scoreFuelStockDays does not read it \u2014 the data is preserved so a replacement dimension has historical timeseries to draw on. The matching /api/health probe was removed in PR #3764 because reporting STATUS:OK on data nothing reads was actively misleading.",
    direction: "higherBetter",
    goalposts: { worst: 0, best: 120 },
    weight: 1,
    sourceKey: "resilience:recovery:fuel-stocks:v1",
    scope: "global",
    cadence: "monthly",
    tier: "experimental",
    coverage: 45,
    license: "open-data",
    comprehensive: false
  }
];
var INDICATOR_BY_ID = new Map(
  INDICATOR_REGISTRY.map((spec) => [spec.id, spec])
);

// server/worldmonitor/resilience/v1/_dimension-freshness.ts
var MINUTE_MS = 60 * 1e3;

// server/worldmonitor/resilience/v1/_source-failure.ts
var MINUTE_MS2 = 60 * 1e3;

// server/worldmonitor/resilience/v1/_dimension-scorers.ts
var IMPUTATION = {
  // Country not in IPC/UNHCR/UCDP because it's stable, not because data is missing.
  // Absence = strong positive signal.
  crisis_monitoring_absent: { score: 85, certaintyCoverage: 0.7, imputationClass: "stable-absence" },
  // Country not in BIS/WTO curated list. Data exists but country wasn't selected.
  // Absence = neutral-to-negative (unknown, penalized conservatively).
  curated_list_absent: { score: 50, certaintyCoverage: 0.3, imputationClass: "unmonitored" }
};
var IMPUTE = {
  ipcFood: { score: 88, certaintyCoverage: 0.7, imputationClass: "stable-absence" },
  // crisis_monitoring_absent, food-specific
  wtoData: { score: 60, certaintyCoverage: 0.4, imputationClass: "unmonitored" },
  // curated_list_absent, trade-specific
  bisEer: IMPUTATION.curated_list_absent,
  bisCredit: IMPUTATION.curated_list_absent,
  unhcrDisplacement: { score: 85, certaintyCoverage: 0.6, imputationClass: "stable-absence" },
  // crisis_monitoring_absent, displacement-specific
  recoveryFiscalSpace: { score: 50, certaintyCoverage: 0.3, imputationClass: "unmonitored" },
  // recoveryReserveAdequacy removed in PR 2 §3.4 — the retired
  // scoreReserveAdequacy stub no longer reads from IMPUTE (it hardcodes
  // coverage=0 / imputationClass=null per the retirement pattern). The
  // replacement dimension's IMPUTE entry lives at
  // `recoveryLiquidReserveAdequacy` below.
  recoveryExternalDebt: { score: 50, certaintyCoverage: 0.3, imputationClass: "unmonitored" },
  recoveryImportHhi: { score: 50, certaintyCoverage: 0.3, imputationClass: "unmonitored" },
  recoveryStateContinuity: { score: 50, certaintyCoverage: 0.3, imputationClass: "unmonitored" },
  recoveryFuelStocks: { score: 50, certaintyCoverage: 0.3, imputationClass: "unmonitored" },
  // PR 2 §3.4 — same source as the retired reserveAdequacy
  // (WB FI.RES.TOTL.MO) but the new dim re-anchors 1..12 months instead
  // of 1..18. Fallback coverage identical because the upstream source
  // has not changed.
  recoveryLiquidReserveAdequacy: { score: 50, certaintyCoverage: 0.3, imputationClass: "unmonitored" },
  // PR 2 §3.4 — used when the sovereign-wealth seed key is absent
  // entirely (Railway cron has not fired yet on a fresh deploy).
  // Countries NOT in the manifest but payload present are handled
  // separately by the scorer as "no SWF → score 0, coverage 0,
  // imputationClass 'not-applicable'" (dim-not-applicable, plan
  // 2026-04-26-001 §U3 — reframed from the original "substantive
  // absence" decision in plan 2026-04-25-001 §3.4 because the
  // deliberate penalty over-fired for advanced economies that hold
  // reserves through Treasury / central-bank channels).
  recoverySovereignFiscalBuffer: { score: 50, certaintyCoverage: 0.3, imputationClass: "unmonitored" },
  // Plan 2026-04-26-001 §U2 — gated GPI-only impute for socialCohesion.
  // This entry fires ONLY when the dimension is operating in degraded
  // GPI-only mode (i.e. country is absent from the displacement registry).
  // It pulls tiny peaceful states (TV, PW, NR, MC) down from a near-perfect
  // GPI-only score. Zero-unrest rows in that same GPI-only mode now use
  // curated_list_absent (50/0.3) because unrest:events:v1 is not
  // comprehensive; countries WITH observed displacement and zero unrest
  // events still use `unhcrDisplacement.score` (85).
  socialCohesionGpiOnlyDisplacement: { score: 70, certaintyCoverage: 0.6, imputationClass: "stable-absence" }
};
var COUNTRY_NAME_ALIASES = /* @__PURE__ */ new Map();
for (const [name, iso2] of Object.entries(country_names_default)) {
  const code = String(iso2 || "").toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) continue;
  const current = COUNTRY_NAME_ALIASES.get(code) ?? /* @__PURE__ */ new Set();
  current.add(normalizeCountryToken(name));
  COUNTRY_NAME_ALIASES.set(code, current);
}
var MINUTE_MS3 = 60 * 1e3;
var DAY_MS = 24 * 60 * 60 * 1e3;

// server/worldmonitor/resilience/v1/_shared.ts
var RESILIENCE_SCHEMA_V2_ENABLED = (process.env.RESILIENCE_SCHEMA_V2_ENABLED ?? "true").toLowerCase() === "true";
function isPillarCombineEnabled() {
  return process.env.RESILIENCE_PILLAR_COMBINE_ENABLED?.trim().toLowerCase() !== "false";
}
var RESILIENCE_SCORE_CACHE_TTL_SECONDS = 6 * 60 * 60;
var RESILIENCE_RANKING_CACHE_TTL_SECONDS = 12 * 60 * 60;
var RESILIENCE_SCORE_CACHE_PREFIX = "resilience:score:v25:";
var RESILIENCE_RANKING_META_TTL_SECONDS = 7 * 24 * 60 * 60;
function currentCacheFormula() {
  return isPillarCombineEnabled() && RESILIENCE_SCHEMA_V2_ENABLED ? "pc" : "d6";
}
function getCurrentCacheFormula() {
  return currentCacheFormula();
}

// server/worldmonitor/supply-chain/v1/get-route-impact.ts
var CACHE_TTL_SECONDS3 = 86400;
function hs4ToHs23(hs4) {
  const n2 = Number.parseInt(hs4.slice(0, 2), 10);
  return String(n2);
}
function computePrimaryChokepointId(toIso2, hs2) {
  const clusters2 = country_port_clusters_default;
  const cluster = clusters2[toIso2];
  if (!cluster?.nearestRouteIds?.length) return "";
  const isEnergy = hs2 === "27";
  const routeSet = new Set(cluster.nearestRouteIds);
  let bestId = "";
  let bestScore = 0;
  for (const cp of CHOKEPOINT_REGISTRY2) {
    const overlap = cp.routeIds.filter((r) => routeSet.has(r)).length;
    let score = overlap / Math.max(cp.routeIds.length, 1) * 100;
    if (isEnergy && cp.shockModelSupported) score = Math.min(score * 1.5, 100);
    if (score > bestScore) {
      bestScore = score;
      bestId = cp.id;
    }
  }
  return bestId;
}
function computeRealExposureScore(toIso2, hs2) {
  const clusters2 = country_port_clusters_default;
  const cluster = clusters2[toIso2];
  if (!cluster?.nearestRouteIds?.length) return { primaryChokepointId: "", primaryExposure: 0 };
  const isEnergy = hs2 === "27";
  const routeSet = new Set(cluster.nearestRouteIds);
  let bestId = "";
  let bestScore = 0;
  for (const cp of CHOKEPOINT_REGISTRY2) {
    const overlap = cp.routeIds.filter((r) => routeSet.has(r)).length;
    let score = overlap / Math.max(cp.routeIds.length, 1) * 100;
    if (isEnergy && cp.shockModelSupported) score = Math.min(score * 1.5, 100);
    if (score > bestScore) {
      bestScore = score;
      bestId = cp.id;
    }
  }
  return { primaryChokepointId: bestId, primaryExposure: Math.round(bestScore) };
}
function computeDependencyFlags(toIso2, hs2, primaryExporterShare) {
  const { primaryChokepointId, primaryExposure } = computeRealExposureScore(toIso2, hs2);
  const flags = [];
  const singleSource = primaryExporterShare > 0.8;
  const hasViableBypass = primaryChokepointId ? (BYPASS_CORRIDORS_BY_CHOKEPOINT2[primaryChokepointId] ?? []).length > 0 : false;
  const singleCorridor = primaryExposure > 80 && !hasViableBypass;
  if (singleSource && singleCorridor) flags.push("DEPENDENCY_FLAG_COMPOUND_RISK");
  else if (singleSource) flags.push("DEPENDENCY_FLAG_SINGLE_SOURCE_CRITICAL");
  else if (singleCorridor) flags.push("DEPENDENCY_FLAG_SINGLE_CORRIDOR_CRITICAL");
  if (hasViableBypass && !singleSource) flags.push("DEPENDENCY_FLAG_DIVERSIFIABLE");
  return flags;
}
function emptyResponse4(_req, comtradeSource) {
  return {
    laneValueUsd: 0,
    primaryExporterIso2: "",
    primaryExporterShare: 0,
    topStrategicProducts: [],
    resilienceScore: 0,
    dependencyFlags: [],
    hs2InSeededUniverse: false,
    comtradeSource,
    fetchedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
}
async function readResilienceScore(iso2) {
  try {
    const raw = await getCachedJson(`${RESILIENCE_SCORE_CACHE_PREFIX}${iso2}`, true);
    if (!raw || typeof raw !== "object" || !("overallScore" in raw)) {
      return 0;
    }
    const tag2 = raw._formula;
    const current = getCurrentCacheFormula();
    if (tag2 !== current) return 0;
    return raw.overallScore;
  } catch {
    return 0;
  }
}
async function computeImpact(req) {
  const fromIso2 = req.fromIso2.trim().toUpperCase();
  const toIso2 = req.toIso2.trim().toUpperCase();
  const hs2 = req.hs2.trim().replace(/\D/g, "") || "27";
  if (!/^[A-Z]{2}$/.test(fromIso2) || !/^[A-Z]{2}$/.test(toIso2)) {
    return emptyResponse4(req, "missing");
  }
  const bilateralKey = `comtrade:bilateral-hs4:${toIso2}:v1`;
  let rawPayload = await getCachedJson(bilateralKey, true).catch(() => null);
  if (!rawPayload) {
    const lazyResult = await lazyFetchBilateralHs4(toIso2);
    if (!lazyResult) {
      return null;
    }
    if (lazyResult.products.length === 0) {
      if (lazyResult.comtradeSource === "lazy" || lazyResult.rateLimited) {
        return null;
      }
      return emptyResponse4(req, "empty");
    }
    rawPayload = { iso2: toIso2, products: lazyResult.products, fetchedAt: (/* @__PURE__ */ new Date()).toISOString() };
  }
  const payload = rawPayload;
  if (!payload.products?.length) return emptyResponse4(req, "empty");
  const normalizedHs2 = String(Number.parseInt(hs2, 10));
  const matchingHs4s = payload.products.filter((p) => hs4ToHs23(p.hs4) === normalizedHs2);
  const hs2InSeededUniverse = matchingHs4s.length > 0;
  let laneValueUsd = 0;
  let primaryExporterIso2 = "";
  let primaryExporterShare = 0;
  let bestExporterValue = 0;
  for (const product of matchingHs4s) {
    const exporter = product.topExporters.find((e) => e.partnerIso2 === fromIso2);
    if (exporter) {
      laneValueUsd += exporter.value;
      if (exporter.value > bestExporterValue) {
        bestExporterValue = exporter.value;
        primaryExporterIso2 = exporter.partnerIso2;
        primaryExporterShare = exporter.share;
      }
    }
  }
  const sortedProducts = [...payload.products].sort((a, b) => b.totalValue - a.totalValue);
  const top5 = sortedProducts.slice(0, 5);
  const topStrategicProducts = top5.map((p) => ({
    hs4: p.hs4,
    label: p.description,
    totalValueUsd: p.totalValue,
    topExporterIso2: p.topExporters[0]?.partnerIso2 ?? "",
    topExporterShare: p.topExporters[0]?.share ?? 0,
    primaryChokepointId: computePrimaryChokepointId(toIso2, hs4ToHs23(p.hs4))
  }));
  const resilienceScore = await readResilienceScore(toIso2);
  const dependencyFlags = computeDependencyFlags(toIso2, hs2, primaryExporterShare);
  return {
    laneValueUsd,
    primaryExporterIso2,
    primaryExporterShare,
    topStrategicProducts,
    resilienceScore,
    dependencyFlags,
    hs2InSeededUniverse,
    comtradeSource: "bilateral-hs4",
    fetchedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
}
async function getRouteImpact(ctx, req) {
  const isPro = await isCallerPremium(ctx.request);
  if (!isPro) return emptyResponse4(req, "missing");
  const fromIso2 = req.fromIso2?.trim().toUpperCase() ?? "";
  const toIso2 = req.toIso2?.trim().toUpperCase() ?? "";
  const hs2 = req.hs2?.trim().replace(/\D/g, "") || "27";
  if (!/^[A-Z]{2}$/.test(fromIso2) || !/^[A-Z]{2}$/.test(toIso2)) {
    return emptyResponse4(req, "missing");
  }
  const cacheKey = ROUTE_IMPACT_KEY(fromIso2, toIso2, hs2);
  const result = await cachedFetchJson(
    cacheKey,
    CACHE_TTL_SECONDS3,
    async () => computeImpact({ fromIso2, toIso2, hs2 })
  );
  return result ?? emptyResponse4(req, "lazy");
}

// server/worldmonitor/supply-chain/v1/list-pipelines.ts
init_redis();

// src/shared/pipeline-evidence.ts
var EVIDENCE_STALENESS_DAYS = 14;
function derivePipelinePublicBadge(evidence, nowMs = Date.now()) {
  if (!evidence) return "disputed";
  const stale = isStale(evidence.lastEvidenceUpdate, nowMs);
  const physical = evidence.physicalState;
  if (physical === "offline") {
    const hasSanctionEvidence = (evidence.sanctionRefs?.length ?? 0) > 0;
    const hasCommercialHalt = evidence.commercialState === "expired" || evidence.commercialState === "suspended";
    const hasOperatorStatement = evidence.operatorStatement != null && (evidence.operatorStatement.text?.length ?? 0) > 0;
    const hasExternalSignal = ["press", "ais-relay", "satellite", "gem"].includes(
      evidence.physicalStateSource ?? ""
    );
    if (hasSanctionEvidence || hasCommercialHalt) {
      return stale ? "disputed" : "offline";
    }
    if (hasOperatorStatement) {
      return stale ? "disputed" : "offline";
    }
    if (hasExternalSignal) return "disputed";
    return "disputed";
  }
  if (physical === "reduced") {
    return stale ? "disputed" : "reduced";
  }
  if (physical === "flowing") {
    return "flowing";
  }
  return "disputed";
}
function isStale(iso, nowMs) {
  if (!iso) return true;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return true;
  const ageDays = (nowMs - t) / (1e3 * 60 * 60 * 24);
  return ageDays > EVIDENCE_STALENESS_DAYS;
}
function pickNewerClassifierVersion(a, b) {
  const va = (a || "").trim();
  const vb = (b || "").trim();
  if (!va) return vb || "v1";
  if (!vb) return va;
  if (va === vb) return va;
  const numA = parseVNum(va);
  const numB = parseVNum(vb);
  if (numA != null && numB != null) {
    return numA >= numB ? va : vb;
  }
  return va >= vb ? va : vb;
}
function parseVNum(v) {
  const m = v.match(/^v(\d+)$/i);
  if (!m) return null;
  const n2 = Number(m[1]);
  return Number.isFinite(n2) ? n2 : null;
}
function pickNewerIsoTimestamp(a, b) {
  const ta = a ? Date.parse(a) : NaN;
  const tb = b ? Date.parse(b) : NaN;
  if (Number.isFinite(ta) && Number.isFinite(tb)) {
    return ta >= tb ? a || "" : b || "";
  }
  if (Number.isFinite(ta)) return a || "";
  if (Number.isFinite(tb)) return b || "";
  return a || b || "";
}

// server/worldmonitor/supply-chain/v1/list-pipelines.ts
function coerceString(v, fallback = "") {
  return typeof v === "string" ? v : fallback;
}
function coerceNumber(v, fallback = 0) {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}
function coerceLatLon(v) {
  if (v && typeof v === "object" && !Array.isArray(v)) {
    const obj = v;
    return { lat: coerceNumber(obj.lat), lon: coerceNumber(obj.lon) };
  }
  return { lat: 0, lon: 0 };
}
function projectPipeline(raw) {
  if (!raw || typeof raw !== "object") return null;
  const r = raw;
  if (typeof r.id !== "string" || r.id.length === 0) return null;
  const evidence = r.evidence ?? null;
  const operatorStatement = evidence && typeof evidence.operatorStatement === "object" && evidence.operatorStatement ? {
    text: coerceString(evidence.operatorStatement.text),
    url: coerceString(evidence.operatorStatement.url),
    date: coerceString(evidence.operatorStatement.date)
  } : void 0;
  const sanctionRefs = Array.isArray(evidence?.sanctionRefs) ? evidence.sanctionRefs.map((s) => {
    const ref = s ?? {};
    return {
      authority: coerceString(ref.authority),
      listId: coerceString(ref.listId),
      date: coerceString(ref.date),
      url: coerceString(ref.url)
    };
  }) : [];
  const ev = evidence ? {
    physicalState: coerceString(evidence.physicalState, "unknown"),
    physicalStateSource: coerceString(evidence.physicalStateSource, "operator"),
    operatorStatement,
    commercialState: coerceString(evidence.commercialState, "unknown"),
    sanctionRefs,
    lastEvidenceUpdate: coerceString(evidence.lastEvidenceUpdate),
    classifierVersion: coerceString(evidence.classifierVersion, "v1"),
    classifierConfidence: coerceNumber(evidence.classifierConfidence, 0)
  } : void 0;
  const publicBadge = derivePipelinePublicBadge(ev);
  const waypoints = Array.isArray(r.waypoints) ? r.waypoints.map(coerceLatLon) : [];
  return {
    id: coerceString(r.id),
    name: coerceString(r.name),
    operator: coerceString(r.operator),
    commodityType: coerceString(r.commodityType),
    fromCountry: coerceString(r.fromCountry),
    toCountry: coerceString(r.toCountry),
    transitCountries: Array.isArray(r.transitCountries) ? r.transitCountries.map((t) => coerceString(t)) : [],
    capacityBcmYr: coerceNumber(r.capacityBcmYr),
    capacityMbd: coerceNumber(r.capacityMbd),
    lengthKm: coerceNumber(r.lengthKm),
    inService: coerceNumber(r.inService),
    startPoint: coerceLatLon(r.startPoint),
    endPoint: coerceLatLon(r.endPoint),
    waypoints,
    evidence: ev,
    publicBadge
  };
}
function collect(raw) {
  if (!raw?.pipelines) return [];
  return Object.values(raw.pipelines).map(projectPipeline).filter((p) => p != null);
}
async function listPipelines(_ctx, req) {
  const wantGas = !req.commodityType || req.commodityType === "gas";
  const wantOil = !req.commodityType || req.commodityType === "oil";
  const [gasRaw, oilRaw] = await Promise.all([
    wantGas ? getCachedJson(PIPELINES_GAS_KEY) : Promise.resolve(null),
    wantOil ? getCachedJson(PIPELINES_OIL_KEY) : Promise.resolve(null)
  ]);
  const anyRequested = wantGas || wantOil;
  const anyReturned = wantGas && gasRaw || wantOil && oilRaw;
  if (anyRequested && !anyReturned) {
    return {
      pipelines: [],
      fetchedAt: (/* @__PURE__ */ new Date()).toISOString(),
      classifierVersion: "",
      upstreamUnavailable: true
    };
  }
  const pipelines = [...collect(gasRaw), ...collect(oilRaw)];
  const classifierVersion = pickNewerClassifierVersion(
    gasRaw?.classifierVersion,
    oilRaw?.classifierVersion
  );
  const fetchedAt = pickNewerIsoTimestamp(gasRaw?.updatedAt, oilRaw?.updatedAt) || (/* @__PURE__ */ new Date()).toISOString();
  return {
    pipelines,
    fetchedAt,
    classifierVersion,
    upstreamUnavailable: false
  };
}

// server/worldmonitor/supply-chain/v1/get-pipeline-detail.ts
init_redis();
async function getPipelineDetail(_ctx, req) {
  if (!req.pipelineId || req.pipelineId.length === 0) {
    return {
      pipeline: void 0,
      revisions: [],
      fetchedAt: (/* @__PURE__ */ new Date()).toISOString(),
      unavailable: true
    };
  }
  const [gasRaw, oilRaw] = await Promise.all([
    getCachedJson(PIPELINES_GAS_KEY),
    getCachedJson(PIPELINES_OIL_KEY)
  ]);
  const raw = gasRaw?.pipelines?.[req.pipelineId] ?? oilRaw?.pipelines?.[req.pipelineId];
  if (!raw) {
    return {
      pipeline: void 0,
      revisions: [],
      fetchedAt: (/* @__PURE__ */ new Date()).toISOString(),
      unavailable: true
    };
  }
  const pipeline = projectPipeline(raw);
  if (!pipeline) {
    return {
      pipeline: void 0,
      revisions: [],
      fetchedAt: (/* @__PURE__ */ new Date()).toISOString(),
      unavailable: true
    };
  }
  return {
    pipeline,
    // Revision log arrives in Week 3 alongside the disruption-event log;
    // see §13 of docs/internal/global-energy-flow-parity-and-surpass.md.
    revisions: [],
    // Gas and oil seeders cron independently; report the newer cycle's
    // timestamp rather than always preferring gas.
    fetchedAt: pickNewerIsoTimestamp(gasRaw?.updatedAt, oilRaw?.updatedAt) || (/* @__PURE__ */ new Date()).toISOString(),
    unavailable: false
  };
}

// server/worldmonitor/supply-chain/v1/list-storage-facilities.ts
init_redis();

// src/shared/storage-evidence.ts
var EVIDENCE_STALENESS_DAYS2 = 14;
function deriveStoragePublicBadge(evidence, nowMs = Date.now()) {
  if (!evidence) return "disputed";
  const stale = isStale2(evidence.lastEvidenceUpdate, nowMs);
  const physical = evidence.physicalState;
  if (physical === "offline") {
    const hasSanctionEvidence = (evidence.sanctionRefs?.length ?? 0) > 0;
    const hasCommercialHalt = evidence.commercialState === "expired" || evidence.commercialState === "suspended";
    const hasOperatorStatement = evidence.operatorStatement != null && (evidence.operatorStatement.text?.length ?? 0) > 0;
    const hasExternalSignal = ["press", "ais-relay", "satellite"].includes(
      evidence.physicalStateSource ?? ""
    );
    if (hasSanctionEvidence || hasCommercialHalt) {
      return stale ? "disputed" : "offline";
    }
    if (hasOperatorStatement) {
      return stale ? "disputed" : "offline";
    }
    if (hasExternalSignal) return "disputed";
    return "disputed";
  }
  if (physical === "reduced") {
    return stale ? "disputed" : "reduced";
  }
  if (physical === "operational") {
    return "operational";
  }
  return "disputed";
}
function isStale2(iso, nowMs) {
  if (!iso) return true;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return true;
  const ageDays = (nowMs - t) / (1e3 * 60 * 60 * 24);
  return ageDays > EVIDENCE_STALENESS_DAYS2;
}

// server/worldmonitor/supply-chain/v1/list-storage-facilities.ts
function coerceString2(v, fallback = "") {
  return typeof v === "string" ? v : fallback;
}
function coerceNumber2(v, fallback = 0) {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}
function coerceBoolean(v, fallback = false) {
  return typeof v === "boolean" ? v : fallback;
}
function coerceLatLon2(v) {
  if (v && typeof v === "object" && !Array.isArray(v)) {
    const obj = v;
    return { lat: coerceNumber2(obj.lat), lon: coerceNumber2(obj.lon) };
  }
  return { lat: 0, lon: 0 };
}
function projectStorageFacility(raw) {
  if (!raw || typeof raw !== "object") return null;
  const r = raw;
  if (typeof r.id !== "string" || r.id.length === 0) return null;
  const evidence = r.evidence ?? null;
  const operatorStatement = evidence && typeof evidence.operatorStatement === "object" && evidence.operatorStatement ? {
    text: coerceString2(evidence.operatorStatement.text),
    url: coerceString2(evidence.operatorStatement.url),
    date: coerceString2(evidence.operatorStatement.date)
  } : void 0;
  const sanctionRefs = Array.isArray(evidence?.sanctionRefs) ? evidence.sanctionRefs.map((s) => {
    const ref = s ?? {};
    return {
      authority: coerceString2(ref.authority),
      listId: coerceString2(ref.listId),
      date: coerceString2(ref.date),
      url: coerceString2(ref.url)
    };
  }) : [];
  const ev = evidence ? {
    physicalState: coerceString2(evidence.physicalState, "unknown"),
    physicalStateSource: coerceString2(evidence.physicalStateSource, "operator"),
    operatorStatement,
    commercialState: coerceString2(evidence.commercialState, "unknown"),
    sanctionRefs,
    fillDisclosed: coerceBoolean(evidence.fillDisclosed),
    fillSource: coerceString2(evidence.fillSource),
    lastEvidenceUpdate: coerceString2(evidence.lastEvidenceUpdate),
    classifierVersion: coerceString2(evidence.classifierVersion, "v1"),
    classifierConfidence: coerceNumber2(evidence.classifierConfidence, 0)
  } : void 0;
  const publicBadge = deriveStoragePublicBadge(ev);
  return {
    id: coerceString2(r.id),
    name: coerceString2(r.name),
    operator: coerceString2(r.operator),
    facilityType: coerceString2(r.facilityType),
    country: coerceString2(r.country),
    location: coerceLatLon2(r.location),
    capacityTwh: coerceNumber2(r.capacityTwh),
    capacityMb: coerceNumber2(r.capacityMb),
    capacityMtpa: coerceNumber2(r.capacityMtpa),
    workingCapacityUnit: coerceString2(r.workingCapacityUnit),
    inService: coerceNumber2(r.inService),
    evidence: ev,
    publicBadge
  };
}
function collect2(raw, filterType) {
  if (!raw?.facilities) return [];
  const entries = Object.values(raw.facilities).map(projectStorageFacility).filter((f) => f != null);
  if (!filterType) return entries;
  return entries.filter((f) => f.facilityType === filterType);
}
async function listStorageFacilities(_ctx, req) {
  const raw = await getCachedJson(STORAGE_FACILITIES_KEY);
  if (!raw) {
    return {
      facilities: [],
      fetchedAt: (/* @__PURE__ */ new Date()).toISOString(),
      classifierVersion: "",
      upstreamUnavailable: true
    };
  }
  const facilities = collect2(raw, req.facilityType ?? "");
  return {
    facilities,
    fetchedAt: raw.updatedAt ?? (/* @__PURE__ */ new Date()).toISOString(),
    classifierVersion: raw.classifierVersion ?? "v1",
    upstreamUnavailable: false
  };
}

// server/worldmonitor/supply-chain/v1/get-storage-facility-detail.ts
init_redis();
async function getStorageFacilityDetail(_ctx, req) {
  if (!req.facilityId || req.facilityId.length === 0) {
    return {
      facility: void 0,
      revisions: [],
      fetchedAt: (/* @__PURE__ */ new Date()).toISOString(),
      unavailable: true
    };
  }
  const raw = await getCachedJson(STORAGE_FACILITIES_KEY);
  const entry = raw?.facilities?.[req.facilityId];
  if (!entry) {
    return {
      facility: void 0,
      revisions: [],
      fetchedAt: (/* @__PURE__ */ new Date()).toISOString(),
      unavailable: true
    };
  }
  const facility = projectStorageFacility(entry);
  if (!facility) {
    return {
      facility: void 0,
      revisions: [],
      fetchedAt: (/* @__PURE__ */ new Date()).toISOString(),
      unavailable: true
    };
  }
  return {
    facility,
    revisions: [],
    fetchedAt: raw?.updatedAt ?? (/* @__PURE__ */ new Date()).toISOString(),
    unavailable: false
  };
}

// server/worldmonitor/supply-chain/v1/list-fuel-shortages.ts
init_redis();
function coerceString3(v, fallback = "") {
  return typeof v === "string" ? v : fallback;
}
function coerceNumber3(v, fallback = 0) {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}
function coerceStringArray(v) {
  if (!Array.isArray(v)) return [];
  return v.map((t) => coerceString3(t)).filter((s) => s.length > 0);
}
function projectFuelShortage(raw) {
  if (!raw || typeof raw !== "object") return null;
  const r = raw;
  if (typeof r.id !== "string" || r.id.length === 0) return null;
  const ev = r.evidence ?? null;
  const evidenceSources = Array.isArray(ev?.evidenceSources) ? ev.evidenceSources.map((s) => {
    const o = s ?? {};
    return {
      authority: coerceString3(o.authority),
      title: coerceString3(o.title),
      url: coerceString3(o.url),
      date: coerceString3(o.date),
      sourceType: coerceString3(o.sourceType)
    };
  }) : [];
  const evidence = ev ? {
    evidenceSources,
    firstRegulatorConfirmation: coerceString3(ev.firstRegulatorConfirmation),
    classifierVersion: coerceString3(ev.classifierVersion, "v1"),
    classifierConfidence: coerceNumber3(ev.classifierConfidence, 0),
    lastEvidenceUpdate: coerceString3(ev.lastEvidenceUpdate)
  } : void 0;
  return {
    id: coerceString3(r.id),
    country: coerceString3(r.country),
    product: coerceString3(r.product),
    severity: coerceString3(r.severity, "watch"),
    firstSeen: coerceString3(r.firstSeen),
    lastConfirmed: coerceString3(r.lastConfirmed),
    // Proto has no nullable, so empty string = unresolved.
    resolvedAt: typeof r.resolvedAt === "string" ? r.resolvedAt : "",
    impactTypes: coerceStringArray(r.impactTypes),
    causeChain: coerceStringArray(r.causeChain),
    shortDescription: coerceString3(r.shortDescription),
    evidence
  };
}
function matches(entry, req) {
  if (req.country && entry.country !== req.country) return false;
  if (req.product && entry.product !== req.product) return false;
  if (req.severity && entry.severity !== req.severity) return false;
  return true;
}
async function listFuelShortages(_ctx, req) {
  const raw = await getCachedJson(FUEL_SHORTAGES_KEY);
  if (!raw?.shortages) {
    return {
      shortages: [],
      fetchedAt: (/* @__PURE__ */ new Date()).toISOString(),
      classifierVersion: "",
      upstreamUnavailable: true
    };
  }
  const shortages = Object.values(raw.shortages).map(projectFuelShortage).filter((s) => s != null).filter((s) => matches(s, req));
  return {
    shortages,
    fetchedAt: raw.updatedAt ?? (/* @__PURE__ */ new Date()).toISOString(),
    classifierVersion: raw.classifierVersion ?? "v1",
    upstreamUnavailable: false
  };
}

// server/worldmonitor/supply-chain/v1/get-fuel-shortage-detail.ts
init_redis();
async function getFuelShortageDetail(_ctx, req) {
  if (!req.shortageId || req.shortageId.length === 0) {
    return {
      shortage: void 0,
      fetchedAt: (/* @__PURE__ */ new Date()).toISOString(),
      unavailable: true
    };
  }
  const raw = await getCachedJson(FUEL_SHORTAGES_KEY);
  const entry = raw?.shortages?.[req.shortageId];
  if (!entry) {
    return {
      shortage: void 0,
      fetchedAt: (/* @__PURE__ */ new Date()).toISOString(),
      unavailable: true
    };
  }
  const shortage = projectFuelShortage(entry);
  if (!shortage) {
    return {
      shortage: void 0,
      fetchedAt: (/* @__PURE__ */ new Date()).toISOString(),
      unavailable: true
    };
  }
  return {
    shortage,
    fetchedAt: raw?.updatedAt ?? (/* @__PURE__ */ new Date()).toISOString(),
    unavailable: false
  };
}

// server/worldmonitor/supply-chain/v1/list-energy-disruptions.ts
init_redis();
function coerceString4(v, fallback = "") {
  return typeof v === "string" ? v : fallback;
}
function coerceNumber4(v, fallback = 0) {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}
function coerceStringArray2(v) {
  if (!Array.isArray(v)) return [];
  return v.map((t) => coerceString4(t)).filter((s) => s.length > 0);
}
function projectDisruption(raw) {
  if (!raw || typeof raw !== "object") return null;
  const r = raw;
  if (typeof r.id !== "string" || r.id.length === 0) return null;
  const sources = Array.isArray(r.sources) ? r.sources.map((s) => {
    const o = s ?? {};
    return {
      authority: coerceString4(o.authority),
      title: coerceString4(o.title),
      url: coerceString4(o.url),
      date: coerceString4(o.date),
      sourceType: coerceString4(o.sourceType)
    };
  }) : [];
  return {
    id: coerceString4(r.id),
    assetId: coerceString4(r.assetId),
    assetType: coerceString4(r.assetType),
    eventType: coerceString4(r.eventType),
    startAt: coerceString4(r.startAt),
    // `endAt: null` in seed → empty string in proto.
    endAt: typeof r.endAt === "string" ? r.endAt : "",
    capacityOfflineBcmYr: coerceNumber4(r.capacityOfflineBcmYr),
    capacityOfflineMbd: coerceNumber4(r.capacityOfflineMbd),
    causeChain: coerceStringArray2(r.causeChain),
    shortDescription: coerceString4(r.shortDescription),
    sources,
    classifierVersion: coerceString4(r.classifierVersion, "v1"),
    classifierConfidence: coerceNumber4(r.classifierConfidence),
    lastEvidenceUpdate: coerceString4(r.lastEvidenceUpdate),
    // Seed-denormalised countries[] (plan §R/#5 decision B). The registry
    // seeder joins each event's assetId against the pipeline/storage
    // registries and emits the touched ISO2 set. Legacy rows written
    // before the denorm shipped can still exist in Redis transiently; we
    // surface an empty array there so the field is always present on the
    // wire but consumers can detect pre-denorm data by checking length.
    countries: coerceStringArray2(r.countries)
  };
}
function matches2(event, req) {
  if (req.assetId && event.assetId !== req.assetId) return false;
  if (req.assetType && event.assetType !== req.assetType) return false;
  if (req.ongoingOnly && event.endAt !== "") return false;
  return true;
}
async function listEnergyDisruptions(_ctx, req) {
  const raw = await getCachedJson(ENERGY_DISRUPTIONS_KEY);
  if (!raw) {
    return {
      events: [],
      fetchedAt: (/* @__PURE__ */ new Date()).toISOString(),
      classifierVersion: "",
      upstreamUnavailable: true
    };
  }
  const events = Object.values(raw.events ?? {}).map(projectDisruption).filter((e) => e != null).filter((e) => matches2(e, req)).sort((a, b) => b.startAt.localeCompare(a.startAt));
  return {
    events,
    fetchedAt: raw.updatedAt ?? (/* @__PURE__ */ new Date()).toISOString(),
    classifierVersion: raw.classifierVersion ?? "v1",
    upstreamUnavailable: false
  };
}

// server/worldmonitor/supply-chain/v1/handler.ts
var supplyChainHandler = {
  getShippingRates,
  getChokepointStatus,
  getChokepointHistory,
  getCriticalMinerals,
  getShippingStress,
  getCountryChokepointIndex,
  getBypassOptions,
  getCountryCostShock,
  getCountryProducts,
  getMultiSectorCostShock,
  getSectorDependency,
  getRouteExplorerLane,
  getRouteImpact,
  listPipelines,
  getPipelineDetail,
  listStorageFacilities,
  getStorageFacilityDetail,
  listFuelShortages,
  getFuelShortageDetail,
  listEnergyDisruptions
};

// api/supply-chain/v1/[rpc].ts
var rpc_default = createDomainGateway(
  createSupplyChainServiceRoutes(supplyChainHandler, serverOptions)
);

// server/alias-rewrite.ts
async function rewriteToSebuf(req, newPath, gateway, ctx) {
  const url = new URL(req.url);
  url.pathname = newPath;
  const body = req.method === "GET" || req.method === "HEAD" ? void 0 : await req.arrayBuffer();
  const rewritten = new Request(url.toString(), {
    method: req.method,
    headers: req.headers,
    body
  });
  return gateway(rewritten, ctx);
}

// api/supply-chain/v1/country-products.ts
var config = { runtime: "edge" };
var country_products_default = (req, ctx) => rewriteToSebuf(req, "/api/supply-chain/v1/get-country-products", rpc_default, ctx);
export {
  config,
  country_products_default as default
};
