/**
 * KCG fork(07-24 사장님 지시) — 지도 위치/줌 로컬 영속화.
 *
 * 지도를 움직일 때마다 중심·줌을 저장하고, 다음 방문(새로고침) 때
 * URL 에 위치 지정이 없으면 마지막 화면 그대로 복원한다.
 * 패널 배치·레이어·관심 목록·뉴스 설정은 이미 각자 localStorage 에
 * 저장되고 있어, 이 파일은 유일하게 빠져 있던 카메라 상태만 맡는다.
 */

const KEY = 'kcg-map-view-v1';

export interface SavedKcgMapView {
  lat: number;
  lon: number;
  zoom: number;
  savedAt: number;
}

export function saveKcgMapView(view: { lat: number; lon: number; zoom: number }): void {
  if (!Number.isFinite(view.lat) || !Number.isFinite(view.lon) || !Number.isFinite(view.zoom)) return;
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...view, savedAt: Date.now() } satisfies SavedKcgMapView));
  } catch { /* 저장 공간 부족 등 — 다음 이동에서 재시도 */ }
}

export function loadKcgMapView(): SavedKcgMapView | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as SavedKcgMapView;
    if (!Number.isFinite(v.lat) || !Number.isFinite(v.lon) || !Number.isFinite(v.zoom)) return null;
    if (Math.abs(v.lat) > 85 || Math.abs(v.lon) > 180 || v.zoom < 0 || v.zoom > 22) return null;
    return v;
  } catch {
    return null;
  }
}
