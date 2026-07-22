#!/bin/sh
# =============================================================================
# KCG fork — in-pod replacement for the upstream Railway seed crons that feed
# the country deep-dive cards. Every source is a free, keyless public API:
#   seed-national-debt.mjs      IMF WEO + US Treasury  → economic:national-debt:v1
#   seed-sanctions-pressure.mjs OFAC SDN/Consolidated  → sanctions:pressure:v1 (+country-counts)
#   seed-trade-flows.mjs        UN Comtrade preview    → comtrade:flows:*
# Product imports / cost shock / trade exposure / tariffs are served by
# on-demand lazy fetches in the RPC handlers (no cron needed).
#
# Redis is volatile (--save ''), so the cycle reruns on boot and then daily;
# runSeed's own redis lock + freshness gate dedupes concurrent/premature runs.
# =============================================================================
set -u
cd /app

# Give redis + redis-rest a moment to come up before the first cycle.
sleep 20

while :; do
  echo "[kcg-seeders] cycle start $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  node scripts/seed-national-debt.mjs || echo "[kcg-seeders] national-debt failed (will retry next cycle)"
  node scripts/seed-sanctions-pressure.mjs || echo "[kcg-seeders] sanctions-pressure failed (will retry next cycle)"
  node scripts/seed-trade-flows.mjs || echo "[kcg-seeders] trade-flows failed (will retry next cycle)"
  echo "[kcg-seeders] cycle done $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  sleep 86400
done
