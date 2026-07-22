/**
 * KCG fork — 활성 감시 프리셋 전역 신호.
 * 탭 시스템(panel-layout)이 탭 전환/생성/삭제 시 set 하고, 프리셋을 따라
 * 표면을 바꾸는 위젯(AI 인사이트 주제 브리프·실시간 속보)이 구독한다.
 */
import type { KcgPresetId } from '@/services/kcg-presets';

export const KCG_PRESET_CHANGED_EVENT = 'kcg:preset-changed';

let activePreset: KcgPresetId | null = null;

export function getActiveKcgPreset(): KcgPresetId | null {
  return activePreset;
}

export function setActiveKcgPreset(preset: KcgPresetId | null): void {
  if (preset === activePreset) return;
  activePreset = preset;
  window.dispatchEvent(new CustomEvent(KCG_PRESET_CHANGED_EVENT, { detail: { preset } }));
}
