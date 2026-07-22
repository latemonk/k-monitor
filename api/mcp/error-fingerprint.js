// api/mcp/error-fingerprint.ts
function mcpErrorFingerprint(step, toolName, err) {
  const message = err instanceof Error ? err.message : String(err);
  const siblingHttp = message.match(/^([A-Za-z0-9_-]+) HTTP (\d{3})\b/);
  const signature = siblingHttp ? `${siblingHttp[1]}:${siblingHttp[2]}` : err instanceof Error ? err.name || err.constructor.name : "non-error";
  return [`mcp-${step}`, toolName, signature];
}
export {
  mcpErrorFingerprint
};
