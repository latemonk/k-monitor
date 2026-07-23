import type { ResilienceScoreResponse } from '@/services/resilience';

// Client-side mirror of the server-side authoritative set
// (`RESILIENCE_RETIRED_DIMENSIONS` in
// server/worldmonitor/resilience/v1/_dimension-scorers.ts). Duplicated
// because the widget module cannot import server code; kept in lockstep
// by `tests/resilience-retired-dimensions-parity.test.mts`. Retired
// dimensions are filtered out of the displayed coverage percentage so
// a deliberate construct retirement does not silently drag the user-
// facing confidence reading down for every country.
//
// Retirement index:
//   - fuelStockDays    (PR 3 §3.5) — IEA days-of-stock incomparable across
//                                     net importers vs net exporters.
//   - reserveAdequacy  (PR 2 §3.4) — superseded by the
//                                     liquidReserveAdequacy +
//                                     sovereignFiscalBuffer split.
//
// The parity test parses this Set literally, so keep the array contents
// as string literals only — do not interleave comments between entries.
const RESILIENCE_RETIRED_DIMENSION_IDS: ReadonlySet<string> = new Set([
  'fuelStockDays',
  'reserveAdequacy',
]);

// Plan 2026-04-26-001 §U3 (+ review fixup): client-side mirror of
// `RESILIENCE_NOT_APPLICABLE_WHEN_ZERO_COVERAGE` in
// `server/worldmonitor/resilience/v1/_dimension-scorers.ts`. When a dim
// in this set emits coverage=0, the construct doesn't apply to this
// country (e.g. sovereignFiscalBuffer for non-SWF advanced economies)
// and must be excluded from the user-facing Coverage % so the widget
// matches the server's `overallCoverage` value. Sites carrying
// positive coverage for this dim (countries WITH SWFs) still count
// normally. Distinct from RETIRED (which excludes for ALL countries).
//
// The parity test parses this Set literally, so keep the array
// contents as string literals only — do not interleave comments
// between entries.
const RESILIENCE_NOT_APPLICABLE_WHEN_ZERO_COVERAGE_IDS: ReadonlySet<string> = new Set([
  'sovereignFiscalBuffer',
]);

// Mirrors server/worldmonitor/resilience/v1/_shared.ts. Keep this table
// in sync so the widget Coverage % matches API overallCoverage semantics;
// tests/resilience-staleness-factor-parity.test.mts guards drift.
const STALENESS_CONFIDENCE_COVERAGE_FACTOR: Readonly<Record<string, number>> = {
  '': 1.0,
  fresh: 1.0,
  aging: 0.7,
  stale: 0.4,
};

// Gated locked-preview fixture rendered when the resilience widget is
// visible to non-entitled users. The preview is blurred and
// non-interactive via the .resilience-widget__preview CSS class, so
// the exact values do not need to match any real country. They just
// need to populate the 6 domain bars AND the 22-cell serialized
// per-dimension confidence grid (20 active + 2 retired) with
// realistic-looking data so the gated card is not a blank gap. Raised
// in PR #2949 review. Lives in this
// dependency-free utils module so tests can import it without
// pulling in the full ResilienceWidget class (the class indirectly
// depends on `import.meta.env.DEV` via proxy.ts, which breaks plain
// node test runners).
// Snapshot-stable clock so the locked preview fixture does not drift
// in snapshot tests or re-render with a different lastObservedAtMs on
// every mount. Date picked arbitrarily within the "fresh" window of a
// typical dimension cadence. Epoch-millis string mirrors the proto
// wire shape (int64 strings).
const LOCKED_PREVIEW_FRESH_AT_MS = '1712000000000';
const LOCKED_PREVIEW_AGING_AT_MS = '1700000000000';
const LOCKED_PREVIEW_STALE_AT_MS = '1680000000000';

export const LOCKED_PREVIEW: ResilienceScoreResponse = {
  countryCode: 'US',
  overallScore: 73,
  baselineScore: 82,
  stressScore: 58,
  stressFactor: 0.21,
  level: 'high',
  domains: [
    {
      id: 'economic',
      score: 82,
      weight: 0.22,
      dimensions: [
        { id: 'macroFiscal', score: 85, coverage: 0.95, observedWeight: 0.95, imputedWeight: 0.05, imputationClass: '', freshness: { lastObservedAtMs: LOCKED_PREVIEW_FRESH_AT_MS, staleness: 'fresh' } },
        { id: 'currencyExternal', score: 80, coverage: 0.88, observedWeight: 0.88, imputedWeight: 0.12, imputationClass: '', freshness: { lastObservedAtMs: LOCKED_PREVIEW_FRESH_AT_MS, staleness: 'fresh' } },
        { id: 'tradePolicy', score: 78, coverage: 0.9, observedWeight: 0.9, imputedWeight: 0.1, imputationClass: '', freshness: { lastObservedAtMs: LOCKED_PREVIEW_FRESH_AT_MS, staleness: 'fresh' } },
        { id: 'financialSystemExposure', score: 74, coverage: 0.72, observedWeight: 0.72, imputedWeight: 0.28, imputationClass: 'unmonitored', freshness: { lastObservedAtMs: LOCKED_PREVIEW_AGING_AT_MS, staleness: 'aging' } },
      ],
    },
    {
      id: 'infrastructure',
      score: 68,
      weight: 0.2,
      dimensions: [
        { id: 'cyberDigital', score: 72, coverage: 0.85, observedWeight: 0.85, imputedWeight: 0.15, imputationClass: '', freshness: { lastObservedAtMs: LOCKED_PREVIEW_FRESH_AT_MS, staleness: 'fresh' } },
        { id: 'logisticsSupply', score: 70, coverage: 0.8, observedWeight: 0.8, imputedWeight: 0.2, imputationClass: 'stable-absence', freshness: { lastObservedAtMs: LOCKED_PREVIEW_FRESH_AT_MS, staleness: 'fresh' } },
        { id: 'infrastructure', score: 65, coverage: 0.9, observedWeight: 0.9, imputedWeight: 0.1, imputationClass: '', freshness: { lastObservedAtMs: LOCKED_PREVIEW_FRESH_AT_MS, staleness: 'fresh' } },
      ],
    },
    {
      id: 'energy',
      score: 88,
      weight: 0.15,
      dimensions: [
        { id: 'energy', score: 88, coverage: 0.82, observedWeight: 0.82, imputedWeight: 0.18, imputationClass: '', freshness: { lastObservedAtMs: LOCKED_PREVIEW_FRESH_AT_MS, staleness: 'fresh' } },
      ],
    },
    {
      id: 'social-governance',
      score: 71,
      weight: 0.25,
      dimensions: [
        { id: 'governanceInstitutional', score: 78, coverage: 0.95, observedWeight: 0.95, imputedWeight: 0.05, imputationClass: '', freshness: { lastObservedAtMs: LOCKED_PREVIEW_FRESH_AT_MS, staleness: 'fresh' } },
        { id: 'socialCohesion', score: 72, coverage: 0.9, observedWeight: 0.9, imputedWeight: 0.1, imputationClass: 'stable-absence', freshness: { lastObservedAtMs: LOCKED_PREVIEW_FRESH_AT_MS, staleness: 'fresh' } },
        { id: 'borderSecurity', score: 68, coverage: 0.75, observedWeight: 0.75, imputedWeight: 0.25, imputationClass: 'unmonitored', freshness: { lastObservedAtMs: LOCKED_PREVIEW_AGING_AT_MS, staleness: 'aging' } },
        { id: 'informationCognitive', score: 66, coverage: 0.82, observedWeight: 0.82, imputedWeight: 0.18, imputationClass: '', freshness: { lastObservedAtMs: LOCKED_PREVIEW_FRESH_AT_MS, staleness: 'fresh' } },
      ],
    },
    {
      id: 'health-food',
      score: 54,
      weight: 0.18,
      dimensions: [
        { id: 'healthPublicService', score: 58, coverage: 0.88, observedWeight: 0.88, imputedWeight: 0.12, imputationClass: '', freshness: { lastObservedAtMs: LOCKED_PREVIEW_FRESH_AT_MS, staleness: 'fresh' } },
        { id: 'foodWater', score: 50, coverage: 0.85, observedWeight: 0.85, imputedWeight: 0.15, imputationClass: '', freshness: { lastObservedAtMs: LOCKED_PREVIEW_STALE_AT_MS, staleness: 'stale' } },
      ],
    },
    {
      id: 'recovery',
      score: 65,
      weight: 1.0,
      dimensions: [
        { id: 'fiscalSpace', score: 72, coverage: 0.9, observedWeight: 0.9, imputedWeight: 0.1, imputationClass: '', freshness: { lastObservedAtMs: LOCKED_PREVIEW_FRESH_AT_MS, staleness: 'fresh' } },
        { id: 'reserveAdequacy', score: 50, coverage: 0, observedWeight: 0, imputedWeight: 0, imputationClass: '', freshness: { lastObservedAtMs: '0', staleness: '' } },
        { id: 'externalDebtCoverage', score: 60, coverage: 0.8, observedWeight: 0.8, imputedWeight: 0.2, imputationClass: '', freshness: { lastObservedAtMs: LOCKED_PREVIEW_FRESH_AT_MS, staleness: 'fresh' } },
        { id: 'importConcentration', score: 70, coverage: 0.75, observedWeight: 0.75, imputedWeight: 0.25, imputationClass: 'unmonitored', freshness: { lastObservedAtMs: LOCKED_PREVIEW_AGING_AT_MS, staleness: 'aging' } },
        { id: 'stateContinuity', score: 80, coverage: 0.92, observedWeight: 0.92, imputedWeight: 0.08, imputationClass: '', freshness: { lastObservedAtMs: LOCKED_PREVIEW_FRESH_AT_MS, staleness: 'fresh' } },
        { id: 'fuelStockDays', score: 50, coverage: 0, observedWeight: 0, imputedWeight: 0, imputationClass: '', freshness: { lastObservedAtMs: '0', staleness: '' } },
        { id: 'liquidReserveAdequacy', score: 67, coverage: 0.82, observedWeight: 0.82, imputedWeight: 0.18, imputationClass: '', freshness: { lastObservedAtMs: LOCKED_PREVIEW_FRESH_AT_MS, staleness: 'fresh' } },
        { id: 'sovereignFiscalBuffer', score: 54, coverage: 0.65, observedWeight: 0.65, imputedWeight: 0.35, imputationClass: 'unmonitored', freshness: { lastObservedAtMs: LOCKED_PREVIEW_AGING_AT_MS, staleness: 'aging' } },
      ],
    },
  ],
  trend: 'rising',
  change30d: 2.4,
  lowConfidence: false,
  imputationShare: 0,
  dataVersion: '',
  // Phase 2 T2.1: locked preview ships the v1 shape (pillars empty,
  // schemaVersion="1.0") so the gated card matches what unentitled
  // users would see live, and so the type checker is satisfied without
  // dragging pillar logic into a fixture.
  pillars: [],
  schemaVersion: '1.0',
  // Plan 2026-04-26-002 §U3 (PR 2 + §U7 PR 6 + §U8 polish): the locked
  // preview ships headlineEligible=true to match the post-#3469 v17
  // contract. The widget renders a distinct "outside headline ranking"
  // badge when false — see formatResilienceConfidence below. Locked
  // preview is always eligible because the underlying fixture is a
  // marketing artifact, not a real low-data country.
  headlineEligible: true,
};

export type ResilienceVisualLevel = 'very_high' | 'high' | 'moderate' | 'low' | 'very_low' | 'unknown';

export const RESILIENCE_VISUAL_LEVEL_COLORS: Record<ResilienceVisualLevel, string> = {
  very_high: '#22c55e',
  high: '#84cc16',
  moderate: '#eab308',
  low: '#f97316',
  very_low: '#ef4444',
  unknown: 'var(--text-faint)',
};

export const RESILIENCE_PILLAR_IDS = [
  'structural-readiness',
  'live-shock-exposure',
  'recovery-capacity',
] as const;

const DOMAIN_LABELS: Record<string, string> = {
  economic: '경제',
  infrastructure: '인프라·공급망',
  energy: '에너지',
  'social-governance': '사회·거버넌스',
  'health-food': '보건·식량',
  recovery: '회복 여력',
};

const VISUAL_LEVEL_LABELS: Record<ResilienceVisualLevel, string> = {
  very_high: '매우 높음',
  high: '높음',
  moderate: '보통',
  low: '낮음',
  very_low: '매우 낮음',
  unknown: '데이터 부족',
};

// Server `level` enum values → Korean. Fallback keeps the raw (normalized)
// value visible so an unexpected server enum is still debuggable.
const SERVER_LEVEL_LABELS: Record<string, string> = {
  'very high': '매우 높음',
  high: '높음',
  medium: '보통',
  moderate: '보통',
  low: '낮음',
  'very low': '매우 낮음',
  unknown: '알 수 없음',
};

export function getResilienceVisualLevel(score: number): ResilienceVisualLevel {
  if (!Number.isFinite(score) || score < 0) return 'unknown';
  if (score >= 80) return 'very_high';
  if (score >= 60) return 'high';
  if (score >= 40) return 'moderate';
  if (score >= 20) return 'low';
  return 'very_low';
}

export function formatResilienceVisualLevel(level: ResilienceVisualLevel): string {
  return VISUAL_LEVEL_LABELS[level];
}

export function formatResilienceServerLevel(level: string | null | undefined): string {
  const normalized = String(level || '').trim().toLowerCase().replace(/_/g, ' ');
  if (normalized.length === 0) return SERVER_LEVEL_LABELS['unknown']!;
  return SERVER_LEVEL_LABELS[normalized] ?? normalized;
}

function hasAuthoritativeResilienceServerLevel(level: string | null | undefined): boolean {
  const normalized = String(level || '').trim().toLowerCase();
  return normalized.length > 0 && normalized !== 'unknown';
}

export function hasScoredResilienceOverall(
  data: Pick<ResilienceScoreResponse, 'overallScore' | 'level'> | null | undefined,
): boolean {
  if (!data || typeof data.overallScore !== 'number' || !Number.isFinite(data.overallScore) || data.overallScore < 0) {
    return false;
  }
  // Zero is a valid explicit score only when the API also supplies a real level.
  return data.overallScore !== 0 || hasAuthoritativeResilienceServerLevel(data.level);
}

export function formatScoredResilienceOverallLabel(score: number): string {
  const clampedScore = Math.min(100, Math.max(0, score));
  const roundedScore = Math.round(clampedScore);
  if (clampedScore > 0 && roundedScore === 0) return '<1';
  return String(roundedScore);
}

export interface ResilienceOverallDisplay {
  hasScore: boolean;
  scoreForBar: number;
  scoreLabel: string;
  visualLevel: ResilienceVisualLevel;
  visualLevelLabel: string;
  serverLevelLabel: string;
}

// KCG fork: 대체값(imputation) 비중이 이 값 이상이면 종합 점수를 숫자로
// 보여주지 않는다. 셀프호스팅 첫 부팅처럼 시드가 비어 있으면 3축 공식의
// min-pillar 페널티가 "데이터 없음 = 0점 축"을 만들어 실제와 무관한
// 매우 낮은 점수(예: KR 19.68)를 뽑아내는데, 그 숫자를 등급 색까지 입혀
// 내보내는 건 오정보다. 임계값 0.6 = lowConfidence 판정(0.4 초과)보다
// 한참 위로, "점수의 과반이 추정치"인 경우만 가린다.
export const RESILIENCE_PROVISIONAL_IMPUTATION_THRESHOLD = 0.6;

export function isResilienceScoreProvisional(
  data: Partial<Pick<ResilienceScoreResponse, 'lowConfidence' | 'imputationShare'>> | null | undefined,
): boolean {
  if (!data?.lowConfidence) return false;
  const share = Number(data.imputationShare);
  return Number.isFinite(share) && share >= RESILIENCE_PROVISIONAL_IMPUTATION_THRESHOLD;
}

export function getResilienceOverallDisplay(
  data: Pick<ResilienceScoreResponse, 'overallScore' | 'level'> & Partial<Pick<ResilienceScoreResponse, 'lowConfidence' | 'imputationShare'>>,
): ResilienceOverallDisplay {
  const rawScore = Number(data.overallScore);
  const visualLevel = getResilienceVisualLevel(rawScore);
  if (isResilienceScoreProvisional(data)) {
    const sharePct = Math.round(Number(data.imputationShare) * 100);
    return {
      hasScore: false,
      scoreForBar: 0,
      scoreLabel: '—',
      visualLevel: 'unknown',
      visualLevelLabel: '데이터 수집 중',
      serverLevelLabel: `지표의 ${sharePct}%가 대체값이라 점수를 잠시 가려요. 데이터가 쌓이면 자동으로 표시돼요. (API 등급: ${formatResilienceServerLevel(data.level)})`,
    };
  }
  if (!hasScoredResilienceOverall(data)) {
    return {
      hasScore: false,
      scoreForBar: 0,
      scoreLabel: '—',
      visualLevel: 'unknown',
      visualLevelLabel: '데이터 부족',
      serverLevelLabel: `API 등급: ${formatResilienceServerLevel(data.level)}`,
    };
  }

  const clampedScore = Math.min(100, Math.max(0, rawScore));
  return {
    hasScore: true,
    scoreForBar: clampedScore,
    scoreLabel: formatScoredResilienceOverallLabel(clampedScore),
    visualLevel,
    visualLevelLabel: formatResilienceVisualLevel(visualLevel),
    serverLevelLabel: `API 등급: ${formatResilienceServerLevel(data.level)}`,
  };
}

export function shouldRenderResilienceBaselineStress(
  data: Pick<ResilienceScoreResponse, 'overallScore' | 'level' | 'baselineScore' | 'stressScore'>,
  overallDisplay: Pick<ResilienceOverallDisplay, 'hasScore'> = getResilienceOverallDisplay(data),
): boolean {
  return overallDisplay.hasScore && data.baselineScore != null && data.stressScore != null;
}

export interface ResilienceMethodologySummary {
  activeDimensionCount: number;
  // Kept for server/fixture parity tests; tooltip copy intentionally shows active dimensions only.
  serializedDimensionCount: number;
  domainCount: number;
  pillarCount: number;
}

export function getResilienceMethodologySummary(data: ResilienceScoreResponse = LOCKED_PREVIEW): ResilienceMethodologySummary {
  const dimensions = data.domains.flatMap((domain) => domain.dimensions);
  return {
    activeDimensionCount: dimensions.filter((dimension) => !RESILIENCE_RETIRED_DIMENSION_IDS.has(dimension.id)).length,
    serializedDimensionCount: dimensions.length,
    domainCount: data.domains.length,
    pillarCount: data.pillars.length > 0 ? data.pillars.length : RESILIENCE_PILLAR_IDS.length,
  };
}

export function formatResilienceMethodologyHelpTitle(summary = getResilienceMethodologySummary()): string {
  // Keep the human-readable domain/pillar labels in sync if the methodology count parity tests change.
  return `${summary.domainCount}개 영역(경제·인프라·에너지·사회/거버넌스·보건/식량·회복)의 활성 지표 ${summary.activeDimensionCount}개를 종합해 산출한 회복탄력성 점수예요. 현재 방법론은 점수를 ${summary.pillarCount}개 축(구조적 대비·실시간 충격 노출·회복 역량)으로 묶고, API 응답에 포함되면 축별 상세도 표시해요. 가중치 합은 1.00이고, 회복 영역이 단일 영역 중 가장 큰 가중치(0.25)를 가져요.`;
}

export function getResilienceTrendArrow(trend: string): string {
  if (trend === 'rising') return '↑';
  if (trend === 'falling') return '↓';
  return '→';
}

export function getResilienceDomainLabel(domainId: string): string {
  return DOMAIN_LABELS[domainId] ?? domainId;
}

export function formatResilienceConfidence(data: ResilienceScoreResponse): string {
  // Plan 2026-04-26-002 §U7 (+§U8 widget polish) — distinguish the
  // "outside headline ranking" reason from the generic sparse-data
  // reason. headlineEligible=false means the country failed the
  // (coverage>=0.65 AND (population>=200k OR coverage>=0.85) AND
  // !lowConfidence) gate; surface it as a distinct cause so analysts
  // can tell a microstate / data-thin country apart from a
  // genuinely-volatile-data country. Order matters: we check
  // lowConfidence FIRST because a country can be both ineligible AND
  // low-confidence; the lowConfidence label is more specific
  // (sparse-data) and more actionable (will fix when more data
  // arrives) so it wins the badge.
  if (data.lowConfidence) return '신뢰도 낮음 — 데이터 부족';
  if (data.headlineEligible === false) return '순위 집계 대상 아님';
  // Exclude RETIRED dimensions (fuelStockDays, post-PR-3) AND
  // not-applicable-when-zero-coverage dimensions (sovereignFiscalBuffer
  // for non-SWF countries, plan 2026-04-26-001 §U3) from the displayed
  // coverage percentage. The same filter pair is applied server-side
  // by `_shared.ts:computeOverallCoverage` — keeping them in lockstep
  // ensures the widget Coverage % matches the server's
  // `overallCoverage` field. Stale observed data uses the same
  // derated confidence coverage as the server. Genuine data sparsity
  // (non-retired, non-NA coverage=0) stays in the average because it
  // reflects a real confidence signal; the server already sets
  // `lowConfidence` when the overall picture is too sparse, which
  // short-circuits above.
  const coverages = data.domains.flatMap((d) =>
    d.dimensions
      .filter((dim) => {
        if (RESILIENCE_RETIRED_DIMENSION_IDS.has(dim.id)) return false;
        // Plan 2026-04-26-001 §U3 (+ review fixup): use the triple-zero
        // Path-3 fingerprint (coverage===0 && observedWeight===0 &&
        // imputedWeight===0), NOT just coverage===0. A real SWF country
        // can produce coverage=0 if completeness collapses to 0 (Path 2
        // with full data outage); that case must drag confidence down
        // so an operator notices, not be silently filtered.
        if (
          RESILIENCE_NOT_APPLICABLE_WHEN_ZERO_COVERAGE_IDS.has(dim.id) &&
          dim.coverage === 0 &&
          (dim.observedWeight ?? 0) === 0 &&
          (dim.imputedWeight ?? 0) === 0
        ) return false;
        return true;
      })
      .map((dim) => confidenceCoverage(dim)),
  );
  const avgCoverage = coverages.length > 0
    ? Math.round((coverages.reduce((s, c) => s + c, 0) / coverages.length) * 100)
    : 0;
  return `커버리지 ${avgCoverage}% ✓`;
}

function confidenceCoverage(dimension: ResilienceScoreResponse['domains'][number]['dimensions'][number]): number {
  const lastObservedAtMs = Number(dimension.freshness?.lastObservedAtMs ?? 0);
  if (!Number.isFinite(lastObservedAtMs) || lastObservedAtMs <= 0) {
    return dimension.coverage;
  }
  const staleness = dimension.freshness?.staleness ?? '';
  return dimension.coverage * (STALENESS_CONFIDENCE_COVERAGE_FACTOR[staleness] ?? 1.0);
}

export function formatResilienceChange30d(change30d: number): string {
  const rounded = Number.isFinite(change30d) ? change30d.toFixed(1) : '0.0';
  const sign = change30d > 0 ? '+' : '';
  return `30일 ${sign}${rounded}`;
}

export function formatBaselineStress(baseline: number, stress: number): string {
  const b = Number.isFinite(baseline) ? Math.round(baseline) : 0;
  const s = Number.isFinite(stress) ? Math.round(stress) : 0;
  return `기본 ${b} | 스트레스 ${s}`;
}

type ScoreIntervalDisplayInput = ResilienceScoreResponse['scoreInterval'] | null | undefined;
export interface ResilienceScoreIntervalDisplay {
  label: string;
  title: string;
}

function normalizeScoreInterval(interval: ScoreIntervalDisplayInput): { p05: number; p95: number } | null {
  if (!interval) return null;
  const p05 = Number(interval.p05);
  const p95 = Number(interval.p95);
  if (!Number.isFinite(p05) || !Number.isFinite(p95)) return null;
  if (p05 < 0 || p05 > 100 || p95 < 0 || p95 > 100 || p05 > p95) return null;
  return { p05, p95 };
}

export function formatResilienceScoreInterval(interval: ScoreIntervalDisplayInput): ResilienceScoreIntervalDisplay | null {
  const normalized = normalizeScoreInterval(interval);
  if (!normalized) return null;
  return {
    label: `[${Math.round(normalized.p05)}\u2013${Math.round(normalized.p95)}]`,
    title: `95% \uc810\uc218 \ubbfc\uac10\ub3c4 \uad6c\uac04: ${normalized.p05} ~ ${normalized.p95}`,
  };
}

// Formats the dataVersion field (ISO date YYYY-MM-DD, sourced from the
// seed-meta:resilience:static.fetchedAt key) for display in the widget
// footer. Returns an empty string when dataVersion is missing, malformed,
// or not a real calendar date so the caller can skip rendering. The
// "Seed date" label is narrower than "Data" — the value reflects the
// static-seed refresh only, not the freshness of every live input that
// contributes to the score (individual dimension freshness is surfaced
// separately via the per-dimension freshness badge). Format is stable
// and regex + calendar tested by resilience-widget.test.mts.
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
export function formatResilienceDataVersion(dataVersion: string | null | undefined): string {
  if (typeof dataVersion !== 'string' || !ISO_DATE_PATTERN.test(dataVersion)) return '';
  // Regex-shape is not enough: `/^\d{4}-\d{2}-\d{2}$/` accepts values like
  // `9999-99-99` or `2024-13-45`. A stale or corrupted Redis key could emit
  // one, and the widget would render it without complaint. Defensively
  // verify the string parses to a real calendar date AND round-trips back
  // to the same YYYY-MM-DD slice (so e.g. `2024-02-30` does not silently
  // become `2024-03-01`). Raised in review of PR #2943.
  const parsed = new Date(dataVersion);
  if (Number.isNaN(parsed.getTime())) return '';
  if (parsed.toISOString().slice(0, 10) !== dataVersion) return '';
  return `시드 ${dataVersion}`;
}

// T1.6 Phase 1 of the country-resilience reference-grade upgrade plan.
// Per-dimension confidence helpers. The widget uses these to render a
// compact confidence grid below the 6-domain rows so analysts can see
// per-dimension data coverage without opening the deep-dive panel.
//
// This slice uses ONLY the existing ResilienceDimension fields (`id`,
// `coverage`, `observedWeight`, `imputedWeight`, `imputationClass`,
// `freshness`) already on every response, so no proto or schema
// changes are needed to render the full grid.

// Short labels for each serialized dimension so the compact grid does
// not wrap. Keys match `ResilienceDimensionId` from
// server/worldmonitor/resilience/v1/_dimension-scorers.ts. The doc
// linter test (resilience-methodology-lint.test.mts) already pins the
// scorer side, so any new dimension must land in both places together.
const DIMENSION_LABELS: Record<string, string> = {
  macroFiscal: '거시',
  currencyExternal: '통화',
  tradePolicy: '무역',
  financialSystemExposure: '금융',
  cyberDigital: '사이버',
  logisticsSupply: '물류',
  infrastructure: '인프라',
  energy: '에너지',
  governanceInstitutional: '거버넌스',
  socialCohesion: '사회',
  // #3737 — internal id is `borderSecurity` for proto/cache stability,
  // but the dimension measures UCDP armed conflict events + UNHCR
  // displacement, not border infrastructure. Surface the truthful label.
  borderSecurity: '분쟁',
  informationCognitive: '정보',
  healthPublicService: '보건',
  foodWater: '식량',
  fiscalSpace: '재정',
  reserveAdequacy: '외환보유',
  externalDebtCoverage: '대외부채',
  importConcentration: '수입집중',
  stateContinuity: '연속성',
  fuelStockDays: '연료',
  // PR 2 §3.4 — new active dimensions. Labels chosen to stay short
  // enough for the 20-active/22-serialized-cell confidence grid
  // without leaking the internal ID.
  liquidReserveAdequacy: '유동성',
  sovereignFiscalBuffer: '국부펀드',
};

export function getResilienceDimensionLabel(dimensionId: string): string {
  return DIMENSION_LABELS[dimensionId] ?? dimensionId;
}

// Minimal shape the confidence helpers need from a ResilienceDimension.
// Defined locally so this module does not take a hard dependency on the
// generated service types; the real ResilienceDimension from the proto
// already has these fields (plus more).
export interface DimensionConfidenceInput {
  id: string;
  coverage: number;
  observedWeight: number;
  imputedWeight: number;
  // PR 1 (#2959) T1.7 schema pass: four-class imputation taxonomy.
  // Empty string when the dimension has any observed data (i.e. the
  // taxonomy only applies to fully-imputed dimensions). Downstream
  // `formatDimensionConfidence` normalizes empty string and any
  // unknown value to `null`.
  imputationClass?: string;
  // PR 2 (#2961) T1.5 propagation pass: aggregated dimension freshness
  // surfaced from the per-signal staleness classifier. Optional on the
  // input so existing fixtures and mock data keep compiling. The
  // `lastObservedAtMs` field is a proto int64 so the wire shape is a
  // string; `formatDimensionConfidence` coerces it to a number.
  freshness?: {
    lastObservedAtMs?: string | number;
    staleness?: string;
  };
}

export type DimensionCoverageStatus = 'observed' | 'partial' | 'imputed' | 'absent' | 'not-applicable';

export type DimensionImputationClass =
  | 'stable-absence'
  | 'unmonitored'
  | 'source-failure'
  | 'not-applicable'
  | null;

export type DimensionStaleness = 'fresh' | 'aging' | 'stale' | null;

export interface DimensionConfidence {
  id: string;
  label: string;
  coveragePct: number;
  status: DimensionCoverageStatus;
  /** True when total weight (observed + imputed) is zero, meaning no data at all. */
  absent: boolean;
  /** PR 1 (#2959) taxonomy class, or null when the dimension has observed data or the class is unset/unknown. */
  imputationClass: DimensionImputationClass;
  /** PR 2 (#2961) staleness level, or null when freshness is unset/unknown. */
  staleness: DimensionStaleness;
  /** Epoch millis of the most recent observation in this dimension, or null when unknown. */
  lastObservedAtMs: number | null;
}

const IMPUTATION_CLASS_VALUES: ReadonlySet<string> = new Set([
  'stable-absence',
  'unmonitored',
  'source-failure',
  'not-applicable',
]);

const STALENESS_VALUES: ReadonlySet<string> = new Set(['fresh', 'aging', 'stale']);

function normalizeImputationClass(value: string | undefined): DimensionImputationClass {
  if (!value) return null;
  return IMPUTATION_CLASS_VALUES.has(value) ? (value as Exclude<DimensionImputationClass, null>) : null;
}

function normalizeStaleness(value: string | undefined): DimensionStaleness {
  if (!value) return null;
  return STALENESS_VALUES.has(value) ? (value as Exclude<DimensionStaleness, null>) : null;
}

function normalizeLastObservedAtMs(value: string | number | undefined): number | null {
  if (value === undefined || value === null || value === '') return null;
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

const IMPUTATION_CLASS_LABELS: Record<Exclude<DimensionImputationClass, null>, string> = {
  'stable-absence': '안정적 부재: 해당 현상이 없어 원천 데이터에 안 나타나요',
  unmonitored: '미관측: 원천이 선별 수집이라 부재의 의미가 불명확해요',
  'source-failure': '원천 장애: 업스트림 수집이 실패했어요',
  'not-applicable': '해당 없음: 이 국가에는 구조적으로 적용되지 않아요',
};

const IMPUTATION_CLASS_ICONS: Record<Exclude<DimensionImputationClass, null>, string> = {
  'stable-absence': '\u2713',
  unmonitored: '?',
  'source-failure': '!',
  'not-applicable': '\u2014',
};

const STALENESS_LABELS: Record<Exclude<DimensionStaleness, null>, string> = {
  fresh: '최신(갱신 주기 1.5배 이내)',
  aging: '오래됨(갱신 주기 1.5~3배)',
  stale: '한참 지남(갱신 주기 3배 초과)',
};

const STALENESS_ICONS: Record<Exclude<DimensionStaleness, null>, string> = {
  fresh: '\u25CF',
  aging: '\u25D0',
  stale: '\u25CB',
};

export function getImputationClassLabel(c: DimensionImputationClass): string {
  if (!c) return '대체값 분류 미상';
  return IMPUTATION_CLASS_LABELS[c];
}

export function getImputationClassIcon(c: DimensionImputationClass): string {
  if (!c) return '';
  return IMPUTATION_CLASS_ICONS[c];
}

export function getStalenessLabel(s: DimensionStaleness): string {
  if (!s) return '신선도 미상';
  return STALENESS_LABELS[s];
}

// User-facing labels for the per-dimension coverage status buckets
// (see formatDimensionConfidence below).
const DIMENSION_STATUS_LABELS: Record<DimensionCoverageStatus, string> = {
  observed: '실측',
  partial: '부분 실측',
  imputed: '대체값',
  absent: '데이터 없음',
  'not-applicable': '해당 없음',
};

export function getDimensionStatusLabel(status: DimensionCoverageStatus): string {
  return DIMENSION_STATUS_LABELS[status];
}

export function getStalenessIcon(s: DimensionStaleness): string {
  if (!s) return '';
  return STALENESS_ICONS[s];
}

/**
 * Classify a dimension's coverage into one of four semantic buckets so
 * the widget can render a status icon without re-deriving the logic.
 *
 * - `absent`: no observed or imputed weight at all (dimension scorer
 *   returned an empty result). Rare, indicates a data-collection bug.
 * - `imputed`: all weight came from imputation, zero real data.
 * - `partial`: mix of observed and imputed weight; less than 80%
 *   observed share.
 * - `observed`: at least 80% of weight came from real data.
 *
 * The 80% threshold mirrors the existing `lowConfidence` rule in
 * `_shared.ts` where imputation share above 40% (i.e. below 60% observed)
 * flips the widget-wide low-confidence flag. The per-dimension threshold
 * is stricter because a single well-covered dimension should not be
 * obscured by the domain's worst case.
 */
export function formatDimensionConfidence(input: DimensionConfidenceInput): DimensionConfidence {
  const coverage = Number.isFinite(input.coverage) ? input.coverage : 0;
  const coveragePct = Math.round(Math.max(0, Math.min(1, coverage)) * 100);
  const observed = Number.isFinite(input.observedWeight) ? input.observedWeight : 0;
  const imputed = Number.isFinite(input.imputedWeight) ? input.imputedWeight : 0;
  const total = observed + imputed;
  const label = getResilienceDimensionLabel(input.id);
  const imputationClass = normalizeImputationClass(input.imputationClass);
  const staleness = normalizeStaleness(input.freshness?.staleness);
  const lastObservedAtMs = normalizeLastObservedAtMs(input.freshness?.lastObservedAtMs);

  if (total <= 0) {
    // Plan 2026-04-26-001 §U3 (+ review fixup): differentiate
    // "structurally not applicable to this country" (e.g. non-SWF
    // economies on sovereignFiscalBuffer) from the original
    // "data-collection bug" interpretation. The server emits
    // imputationClass='not-applicable' for the deliberate case; the
    // widget renders status='not-applicable' which has its own tooltip
    // ("Not applicable: structurally N/A for this country") and symbol
    // ("—"). `absent: true` stays so existing consumers reading the
    // boolean still get the no-data signal.
    return {
      id: input.id,
      label,
      coveragePct: 0,
      status: imputationClass === 'not-applicable' ? 'not-applicable' : 'absent',
      absent: true,
      imputationClass,
      staleness,
      lastObservedAtMs,
    };
  }

  const observedShare = observed / total;
  let status: DimensionCoverageStatus;
  if (observed === 0) {
    status = 'imputed';
  } else if (observedShare >= 0.8) {
    status = 'observed';
  } else {
    status = 'partial';
  }

  return {
    id: input.id,
    label,
    coveragePct,
    status,
    absent: false,
    imputationClass,
    staleness,
    lastObservedAtMs,
  };
}

/**
 * Collect every dimension across every domain in the response into a
 * flat, stable-ordered list of DimensionConfidence entries. Preserves
 * the order the scorer emits (domain order, then dimension order inside
 * each domain) so the widget can render a predictable grid.
 */
export function collectDimensionConfidences(
  domains: ReadonlyArray<{ dimensions: ReadonlyArray<DimensionConfidenceInput> }>,
): DimensionConfidence[] {
  const out: DimensionConfidence[] = [];
  for (const domain of domains) {
    for (const dim of domain.dimensions) {
      out.push(formatDimensionConfidence(dim));
    }
  }
  return out;
}
