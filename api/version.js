// api/version.js
var RELEASES_URL = "https://api.github.com/repos/koala73/worldmonitor/releases/latest";
async function fetchLatestRelease(userAgent) {
  const res = await fetch(RELEASES_URL, {
    headers: {
      "Accept": "application/vnd.github+json",
      "User-Agent": userAgent
    }
  });
  if (!res.ok) return null;
  return res.json();
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
var config = { runtime: "edge" };
async function handler() {
  try {
    const release = await fetchLatestRelease("WorldMonitor-Version-Check");
    if (!release) {
      return jsonResponse({ error: "upstream" }, 502);
    }
    const tag = release.tag_name ?? "";
    const version = tag.replace(/^v/, "");
    return jsonResponse({
      version,
      tag,
      url: release.html_url,
      prerelease: release.prerelease ?? false
    }, 200, {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60, stale-if-error=3600",
      "Access-Control-Allow-Origin": "*"
    });
  } catch {
    return jsonResponse({ error: "fetch_failed" }, 502);
  }
}
export {
  config,
  handler as default
};
