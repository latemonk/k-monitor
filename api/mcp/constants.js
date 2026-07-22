// api/mcp/constants.ts
function supportedProtocolVersions() {
  return process.env.MCP_PROTOCOL_FLOOR_2025_06_18 === "off" ? ["2025-03-26"] : ["2025-03-26", "2025-06-18"];
}
function latestProtocolVersion() {
  return process.env.MCP_PROTOCOL_FLOOR_2025_06_18 === "off" ? "2025-03-26" : "2025-06-18";
}
function negotiateProtocolVersion(requested) {
  const supported = supportedProtocolVersions();
  return typeof requested === "string" && supported.includes(requested) ? requested : latestProtocolVersion();
}
var MCP_SUPPORTED_CLIENT_MATRIX = {
  // source: Claude Desktop release notes — first version shipping MCP support
  "Claude Desktop": "0.7.0",
  // source: Claude Code CLI ships current MCP support without a pinned floor
  "Claude Code": "any current",
  // source: MCP Inspector release notes
  "MCP Inspector": "0.6.0",
  // source: https://docs.cursor.com/ MCP integration — exact minimum not
  // confirmed against the live docs at write time; treat as approximate and
  // re-verify before flipping the env-var default on prod
  "Cursor": "0.40.0"
};
var SERVER_NAME = "worldmonitor";
var SERVER_VERSION = "1.15.0";
var MCP_LOG_LEVELS = /* @__PURE__ */ new Set([
  "debug",
  "info",
  "notice",
  "warning",
  "error",
  "critical",
  "alert",
  "emergency"
]);
var JMESPATH_MAX_EXPR_BYTES = 1024;
var JMESPATH_MAX_OUTPUT_BYTES = 256 * 1024;
var TOOL_DESCRIPTION_MAX_BYTES = 120;
var SERVER_INSTRUCTIONS = [
  "Every tool accepts an optional `jmespath` string. Server-side projection applied AFTER per-tool filter/summary; typical 80-95% token reduction. Grammar: https://jmespath.org/specification.html. Guide + 12 worked examples: https://www.worldmonitor.app/docs/mcp-jmespath.",
  "",
  `Limits: expr \u2264 ${JMESPATH_MAX_EXPR_BYTES}B, output \u2264 ${JMESPATH_MAX_OUTPUT_BYTES}B. Bad expressions soft-fail via {_jmespath_error, original_keys} envelope (consumes one Pro/OAuth daily quota unit on retry when that quota path applies \u2014 self-correct from original_keys). Full envelope reference: https://www.worldmonitor.app/docs/mcp-error-catalog.`,
  "",
  `tools/list ships compressed tool descriptions (\u2264${TOOL_DESCRIPTION_MAX_BYTES}B). Call describe_tool({tool_name}) for the full uncompressed definition \u2014 quota-exempt (still counts toward the 60/min rate limit), so use freely while exploring. describe_tool({tool_name: 'nonexistent'}) returns {error: 'unknown_tool', available: [...]} so you can self-correct. Full reference: https://www.worldmonitor.app/docs/mcp-tools-reference.`,
  "",
  "Issue prompts/list to discover pre-built workflow templates (country-briefing, energy-shock-watch, market-open-prep, conflict-pulse, route-risk-check, freshness-audit). Each prompt pre-bakes a JMESPath projection per step so the first execution lands on the right shape. prompts/list + prompts/get are quota-exempt (per-minute limit only).",
  "",
  "Issue resources/list for concrete read-only resources (v1: seed-meta freshness \u2014 anonymous + quota-free) and resources/templates/list for parameterised URI templates (country risk, chokepoint status, market quote). Substitute the template placeholder, then resources/read the concrete URI; a template read consumes the Pro daily quota IDENTICALLY to the equivalent tools/call \u2014 there is no free path around the cap via those resources."
].join("\n");
var SUPPORTED_CONSUMER_PRICES_COUNTRIES = /* @__PURE__ */ new Set(["ae"]);
var DEFAULT_LIST_LIMIT = 30;
export {
  DEFAULT_LIST_LIMIT,
  JMESPATH_MAX_EXPR_BYTES,
  JMESPATH_MAX_OUTPUT_BYTES,
  MCP_LOG_LEVELS,
  MCP_SUPPORTED_CLIENT_MATRIX,
  SERVER_INSTRUCTIONS,
  SERVER_NAME,
  SERVER_VERSION,
  SUPPORTED_CONSUMER_PRICES_COUNTRIES,
  TOOL_DESCRIPTION_MAX_BYTES,
  negotiateProtocolVersion
};
