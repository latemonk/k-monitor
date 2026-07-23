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
  # 국가 패널 카드용 시드 (07-23 전수조사 — 전부 무키 공개 API):
  #   energy-sources 번들 = 에너지 프로필 카드(OWID 믹스·JODI·가스저장 등,
  #     섹션별 freshness 게이트 내장 → 데일리 루프 안전)
  #   portwatch-port-activity = 항만 활동 카드(IMF PortWatch ArcGIS)
  node scripts/seed-bundle-energy-sources.mjs || echo "[kcg-seeders] energy-sources failed (will retry next cycle)"
  node scripts/seed-portwatch-port-activity.mjs || echo "[kcg-seeders] portwatch-port-activity failed (will retry next cycle)"
  #   imf-extended 번들 = 경제 지표 카드(IMF WEO 매크로·성장·고용·대외, 30일 게이트)
  node scripts/seed-bundle-imf-extended.mjs || echo "[kcg-seeders] imf-extended failed (will retry next cycle)"
  #   bis-extended = 주택 경기 카드(BIS DSR·주택/상업용 부동산 지수, 분기 데이터)
  node scripts/seed-bis-extended.mjs || echo "[kcg-seeders] bis-extended failed (will retry next cycle)"
  # bilateral-hs4 = 무역 노출도·비용 충격·주요 수입 품목의 실데이터 원천.
  # 키 TTL 72h·시더 자체 게이트는 24일이라, 캐너리 키(KR)가 사라졌을 때만
  # FORCE_RESEED 로 돌린다(198개국 × 3.5s ≈ 12분·Comtrade 공개 쿼터 보호).
  if ! node -e "
    const u=process.env.UPSTASH_REDIS_REST_URL,t=process.env.UPSTASH_REDIS_REST_TOKEN;
    fetch(u+'/get/'+encodeURIComponent('comtrade:bilateral-hs4:KR:v1'),{headers:{Authorization:'Bearer '+t}})
      .then(r=>r.json()).then(d=>process.exit(d.result?0:1)).catch(()=>process.exit(1));
  "; then
    echo "[kcg-seeders] bilateral-hs4 canary(KR) missing — reseeding"
    FORCE_RESEED=true node scripts/seed-comtrade-bilateral-hs4.mjs || echo "[kcg-seeders] bilateral-hs4 failed (will retry next cycle)"
  fi
  echo "[kcg-seeders] cycle done $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  sleep 86400
done
