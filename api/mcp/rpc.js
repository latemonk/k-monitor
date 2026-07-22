// api/_json-response.js
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

// api/mcp/rpc.ts
function withMcpNoStore(extraHeaders = {}) {
  return { ...extraHeaders, "Cache-Control": "no-store" };
}
function rpcOk(id, result, extraHeaders = {}) {
  return jsonResponse({ jsonrpc: "2.0", id: id ?? null, result }, 200, withMcpNoStore(extraHeaders));
}
function rpcError(id, code, message, extraHeaders = {}) {
  return jsonResponse({ jsonrpc: "2.0", id: id ?? null, error: { code, message } }, 200, withMcpNoStore(extraHeaders));
}
export {
  rpcError,
  rpcOk,
  withMcpNoStore
};
