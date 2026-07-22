// api/mcp/freshness.ts
function parseFiniteRecordCount(raw) {
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : null;
  if (typeof raw === "string" && raw.trim() !== "") {
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}
function evaluateFreshness(checks, metas, now = Date.now()) {
  let stale = false;
  let oldestFetchedAt = Number.POSITIVE_INFINITY;
  let hasAnyValidMeta = false;
  let hasAllValidMeta = true;
  for (const [i, check] of checks.entries()) {
    const meta = metas[i];
    const fetchedAt = meta && typeof meta === "object" && "fetchedAt" in meta ? Number(meta.fetchedAt) : Number.NaN;
    if (!Number.isFinite(fetchedAt) || fetchedAt <= 0) {
      hasAllValidMeta = false;
      stale = true;
      continue;
    }
    hasAnyValidMeta = true;
    oldestFetchedAt = Math.min(oldestFetchedAt, fetchedAt);
    stale ||= (now - fetchedAt) / 6e4 > check.maxStaleMin;
    if (check.minRecordCount != null) {
      const recordCount = meta && typeof meta === "object" && "recordCount" in meta ? parseFiniteRecordCount(meta.recordCount) : null;
      stale ||= recordCount == null || recordCount < check.minRecordCount;
    }
  }
  return {
    cached_at: hasAnyValidMeta && hasAllValidMeta ? new Date(oldestFetchedAt).toISOString() : null,
    stale
  };
}
export {
  evaluateFreshness
};
