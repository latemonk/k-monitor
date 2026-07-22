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

// server/_shared/pro-mcp-token.ts
function dailyCounterKey(userId, date) {
  if (!userId) return "";
  const d = date ?? /* @__PURE__ */ new Date();
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const base = `mcp:pro-usage:${userId}:${yyyy}-${mm}-${dd}`;
  return `${envPrefix()}${base}`;
}
function envPrefix() {
  const env = process.env.VERCEL_ENV;
  if (!env || env === "production") return "";
  const sha = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 8) || "dev";
  return `${env}:${sha}:`;
}
var PRO_DAILY_QUOTA_LIMIT = 50;
var PRO_DAILY_QUOTA_TTL_SECONDS = 172800;

// api/mcp/quota.ts
async function reserveQuota(userId, pipeline) {
  const key = dailyCounterKey(userId);
  if (!key) return { ok: false, reason: "redis-unavailable" };
  let pipeResult;
  try {
    pipeResult = await pipeline([
      ["INCR", key],
      ["EXPIRE", key, PRO_DAILY_QUOTA_TTL_SECONDS]
    ]);
  } catch {
    pipeResult = null;
  }
  if (!pipeResult || !Array.isArray(pipeResult) || pipeResult.length === 0) {
    return { ok: false, reason: "redis-unavailable" };
  }
  const incrRaw = pipeResult[0]?.result;
  const newCount = typeof incrRaw === "number" ? incrRaw : Number(incrRaw);
  if (!Number.isFinite(newCount) || newCount < 1) {
    return { ok: false, reason: "redis-unavailable" };
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
  if (newCount > PRO_DAILY_QUOTA_LIMIT) {
    await rollback();
    if (newCount > PRO_DAILY_QUOTA_LIMIT + 1) {
      try {
        const probe = await pipeline([["INCR", key], ["DECR", key]]);
        const probeIncrRaw = probe?.[0]?.result;
        const postRollbackCount = typeof probeIncrRaw === "number" ? probeIncrRaw - 1 : Number.NaN;
        if (Number.isFinite(postRollbackCount) && postRollbackCount > PRO_DAILY_QUOTA_LIMIT) {
          const overshoot = postRollbackCount - PRO_DAILY_QUOTA_LIMIT;
          const decrs = Math.min(overshoot, 100);
          const clamp = Array.from({ length: decrs }, () => ["DECR", key]);
          await pipeline(clamp).catch(() => {
          });
        }
      } catch {
      }
    }
    return { ok: false, reason: "cap-exceeded", floor: PRO_DAILY_QUOTA_LIMIT };
  }
  return { ok: true, newCount, rollback };
}
export {
  reserveQuota
};
