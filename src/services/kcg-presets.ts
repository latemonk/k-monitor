/**
 * KCG fork — 감시 프리셋 3종(해양/공중/지상).
 * 새 탭 `+` 버튼의 프리셋 선택 모달에서 사용한다. 각 프리셋은 탭 하나로
 * 만들어지며 패널 구성 + 지도 레이어를 함께 결정한다(탭별 레이어 스냅샷).
 */
import type { MapLayers } from '@/types';

export type KcgPresetId = 'maritime' | 'air' | 'ground';

/** api/kcg-breaking 의 topic 파라미터와 1:1. */
export type KcgBreakingTopicId = 'domestic' | 'maritime' | 'aviation' | 'security' | 'disaster';

export const KCG_BREAKING_TOPICS: ReadonlyArray<{ id: KcgBreakingTopicId; label: string }> = [
  { id: 'domestic', label: '종합' },
  { id: 'maritime', label: '해양' },
  { id: 'aviation', label: '항공' },
  { id: 'security', label: '안보' },
  { id: 'disaster', label: '재난' },
];

/** AI 인사이트에 뜨는 주제 브리프 카드 1장의 스펙. */
export interface KcgBriefSpec {
  /** 요약 캐시 키이자 api/kcg-breaking topic (기본 탭 전용 politics/intel 은 digest 카테고리). */
  key: string;
  title: string;
  /** true 면 헤드라인을 digest 카테고리 대신 api/kcg-breaking 에서 가져온다. */
  fromBreaking?: boolean;
}

/** 기본(프리셋 없는) 탭의 브리프 카드 — digest 카테고리 기반(기존 동작). */
export const KCG_DEFAULT_BRIEFS: readonly KcgBriefSpec[] = [
  { key: 'politics', title: '🇰🇷 국내 브리프' },
  { key: 'intel', title: '⚓ 해양·안보 브리프' },
];

export interface KcgWatchPreset {
  id: KcgPresetId;
  name: string;
  icon: string;
  description: string;
  panels: string[];
  layers: Array<keyof MapLayers>;
  /** 이 프리셋 탭에서 AI 인사이트가 보여줄 주제 브리프 카드들. */
  briefs: readonly KcgBriefSpec[];
  /** 실시간 속보 위젯이 이 탭에서 기본으로 트는 주제. */
  breakingTopic: KcgBreakingTopicId;
}

export const KCG_WATCH_PRESETS: readonly KcgWatchPreset[] = [
  {
    id: 'maritime',
    name: '해양 감시',
    icon: '🌊',
    description: '해역 선박 활동과 해양 기상·수온, AI 이상 활동 판정을 한 화면에서 봐요.',
    // 실시간성 큰 위젯(속보 스트림·선박 현황·AI 감시)이 앞에 오도록 정렬.
    panels: [
      'map',
      'kcg-breaking',
      'kcg-vessels',
      'kcg-alerts',
      'kcg-sea',
      'intel',
      'insights',
      'live-news',
      'politics',
      'monitors',
    ],
    briefs: [
      { key: 'maritime', title: '⚓ 해양 브리프', fromBreaking: true },
      { key: 'disaster', title: '🚨 재난·기상 브리프', fromBreaking: true },
      { key: 'security', title: '🪖 안보 브리프', fromBreaking: true },
    ],
    breakingTopic: 'maritime',
    // 해양 주제에 집중 — 분쟁/기지/제재 등 노이즈 레이어 제외(사장님 07-21).
    layers: [
      'ais',
      'liveTankers',
      'waterways',
      'weather',
      'natural',
    ],
  },
  {
    // 해양과 확실히 구분: 선박·해양 패널 전부 제외, 항공 운항 정보(라이브
    // 항공기 위치 연동)와 위성·발사장·항공 레이어 중심(사장님 피드백 07-21).
    // GPS 교란 레이어는 서해를 뒤덮는 대형 폴리곤이라 기본에서 제외(수동 켜기).
    id: 'air',
    name: '공중 감시',
    icon: '🛰️',
    description: '항공기 운항과 위성·발사장 활동을 감시해요.',
    panels: [
      'map',
      'kcg-breaking',
      'kcg-aircraft',
      'kcg-airwx',
      'kcg-alerts',
      'airline-intel',
      'insights',
      'live-news',
      'politics',
      'monitors',
    ],
    briefs: [
      { key: 'aviation', title: '✈️ 항공 브리프', fromBreaking: true },
      { key: 'security', title: '🪖 안보 브리프', fromBreaking: true },
    ],
    breakingTopic: 'aviation',
    layers: [
      'flights',
      'satellites',
      'spaceports',
      'weather',
      'natural',
    ],
  },
  {
    id: 'ground',
    name: '지상 감시',
    icon: '⛰️',
    description: '기지·분쟁·재난·화재 등 지상 상황을 감시해요.',
    // satellite-fires 는 NASA_FIRMS 키 없이는 빈 패널이라 제외(07-21).
    panels: [
      'map',
      'kcg-breaking',
      'intel',
      'insights',
      'live-news',
      'politics',
      'monitors',
    ],
    briefs: [
      { key: 'disaster', title: '🚨 재난 브리프', fromBreaking: true },
      { key: 'security', title: '🪖 안보 브리프', fromBreaking: true },
      { key: 'domestic', title: '🇰🇷 국내 브리프', fromBreaking: true },
    ],
    breakingTopic: 'disaster',
    layers: [
      'bases',
      'military',
      'conflicts',
      'hotspots',
      'protests',
      'natural',
      'fires',
      'outages',
      'nuclear',
    ],
  },
];

export function getKcgWatchPreset(id: string | null | undefined): KcgWatchPreset | null {
  if (!id) return null;
  return KCG_WATCH_PRESETS.find((preset) => preset.id === id) ?? null;
}
