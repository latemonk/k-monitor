/**
 * KCG fork — 해양 기상·수온 클라이언트 서비스 (/api/kcg-sea 프록시 소비).
 * 10분 서버 캐시 + 5분 클라이언트 캐시.
 */
import { toApiUrl } from '@/services/runtime';

export interface SeaMeasure {
  value: number;
  unit: string;
  level: 'none' | 'watch' | 'warn' | 'danger' | string;
  station: string;
  obsAt: string;
}

export interface SeaZone {
  id: string;
  nameKo: string;
  temp: SeaMeasure | null;
  wave: SeaMeasure | null;
  gust: SeaMeasure | null;
}

export interface SeaConditions {
  fetchedAt: number;
  zones: SeaZone[];
}

const CACHE_TTL_MS = 5 * 60 * 1000;
let cached: { at: number; data: SeaConditions } | null = null;

export async function fetchSeaConditions(): Promise<SeaConditions | null> {
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.data;
  try {
    const resp = await fetch(toApiUrl('/api/kcg-sea'), { signal: AbortSignal.timeout(15000) });
    if (!resp.ok) return cached?.data ?? null;
    const data = (await resp.json()) as SeaConditions;
    if (!Array.isArray(data?.zones)) return cached?.data ?? null;
    cached = { at: Date.now(), data };
    return data;
  } catch {
    return cached?.data ?? null;
  }
}

export const SEA_LEVEL_KO: Record<string, string> = {
  none: '정상',
  watch: '주의',
  warn: '경계',
  danger: '위험',
};

export const SEA_LEVEL_COLOR: Record<string, string> = {
  none: '#2ecc71',
  watch: '#f1c40f',
  warn: '#e67e22',
  danger: '#e74c3c',
};

/** AI 판정용 압축 텍스트 요약 (kcg-alerts가 현재 요약에 첨부). */
export function summarizeSeaConditions(data: SeaConditions): string {
  const lines = data.zones.map((z) => {
    const parts: string[] = [];
    if (z.temp) parts.push(`수온 ${z.temp.value}${z.temp.unit}(${SEA_LEVEL_KO[z.temp.level] ?? z.temp.level})`);
    if (z.wave) parts.push(`파고 ${z.wave.value}${z.wave.unit}(${SEA_LEVEL_KO[z.wave.level] ?? z.wave.level})`);
    if (z.gust) parts.push(`돌풍 ${z.gust.value}${z.gust.unit}(${SEA_LEVEL_KO[z.gust.level] ?? z.gust.level})`);
    return `- ${z.nameKo}: ${parts.length ? parts.join(' · ') : '관측값 없음'}`;
  });
  return ['[해양 기상·수온 관측(최근 30분 내)]', ...lines].join('\n');
}
