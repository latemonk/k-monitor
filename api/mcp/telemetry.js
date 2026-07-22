// server/_shared/usage-identity.ts
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

// api/mcp/telemetry.ts
function telemetryEnabled() {
  const v = process.env.MCP_TELEMETRY;
  return v !== "false" && v !== "0";
}
function emitTelemetry(event, payload) {
  if (!telemetryEnabled()) return;
  try {
    console.log({ tag: event, ts: (/* @__PURE__ */ new Date()).toISOString(), ...payload });
  } catch {
  }
}
var MCP_TOOLCALL_TELEMETRY_KEYS = Object.freeze([
  "tag",
  "ts",
  "tool",
  "auth_kind",
  "user_id",
  "latency_ms",
  "bytes_pre_jmespath",
  "bytes_post_jmespath",
  "jmespath_used",
  "jmespath_failed",
  "ok",
  "error_kind",
  "budget_exceeded"
]);
var MCP_TOOLS_LIST_TELEMETRY_KEYS = Object.freeze([
  "tag",
  "ts",
  "auth_kind",
  "user_id",
  "tools_array_bytes",
  "tool_count",
  "client_user_agent"
]);
var MCP_RATE_LIMIT_HIT_TELEMETRY_KEYS = Object.freeze([
  "tag",
  "ts",
  "auth_kind",
  "user_id",
  "principal_id",
  "dimension",
  "limit",
  "window_seconds"
]);
function principalIdForLog(context) {
  return context.kind === "env_key" ? hashKeySync(context.apiKey) : context.userId;
}
function emitMcpRateLimitHit(context, payload) {
  emitTelemetry("mcp.rate_limit_hit", {
    auth_kind: context.kind,
    user_id: context.kind === "pro" ? context.userId : null,
    principal_id: principalIdForLog(context),
    dimension: payload.dimension,
    limit: payload.limit,
    window_seconds: payload.windowSeconds
  });
}
export {
  MCP_RATE_LIMIT_HIT_TELEMETRY_KEYS,
  MCP_TOOLCALL_TELEMETRY_KEYS,
  MCP_TOOLS_LIST_TELEMETRY_KEYS,
  emitMcpRateLimitHit,
  emitTelemetry,
  principalIdForLog,
  telemetryEnabled
};
