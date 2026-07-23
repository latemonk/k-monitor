#!/bin/sh
# =============================================================================
# KCG fork — in-pod replacement for the upstream Railway seed crons that feed
# the country deep-dive cards. Every source is a free, keyless public API:
#   seed-national-debt.mjs      IMF WEO + US Treasury  → economic:national-debt:v1
#   seed-sanctions-pressure.mjs OFAC SDN/Consolidated  → sanctions:pressure:v1 (+country-counts)
#   seed-trade-flows.mjs        UN Comtrade preview    → comtrade:flows:*
#   seed-resilience-static.mjs  WB/WHO/RSF/FAO/GPI 등  → resilience:static:*
#   seed-bundle-resilience-recovery.mjs IMF/WB/Comtrade → resilience:recovery:*
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
  # 회복탄력성(Resilience) 점수용 시드 — 없으면 min-pillar 페널티가
  # "데이터 없는 축 = 0점"을 만들어 KR 이 19점대로 나오는 사고(07-23).
  # 전부 무키 공개 API(World Bank·WHO·RSF·FAO·IMF 등)라 그대로 인팟 실행.
  #   - static: 연 1회 시드(성공 연도면 자체 skip · 실패 데이터셋 있으면 재시도)
  #   - recovery 번들: 섹션별 30일 freshness 게이트 내장 → 데일리 루프 안전
  node scripts/seed-resilience-static.mjs || echo "[kcg-seeders] resilience-static failed (will retry next cycle)"
  node scripts/seed-bundle-resilience-recovery.mjs || echo "[kcg-seeders] resilience-recovery failed (will retry next cycle)"
  echo "[kcg-seeders] cycle done $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  sleep 86400
done
