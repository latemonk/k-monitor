import { DEFAULT_MAP_MODE, STORAGE_KEYS, type MapModePreference } from '@/config/variants/base';

export function normalizeMapModePreference(value: string | null | undefined): MapModePreference {
  if (value === 'flat' || value === 'globe') return value;
  return DEFAULT_MAP_MODE;
}

function loadMapModeFromStorage<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) as T : fallback;
  } catch (error) {
    console.warn(`Failed to load ${key} from storage:`, error);
    return fallback;
  }
}

export function getStoredMapModePreference(
  load: <T>(key: string, fallback: T) => T = loadMapModeFromStorage,
): MapModePreference {
  return normalizeMapModePreference(load<string>(STORAGE_KEYS.mapMode, DEFAULT_MAP_MODE));
}

// ── KCG fork: 3D = globe.gl 렌더러 대신 maplibre globe projection ─────────
// DeckGL 렌더러를 유지한 채 투영만 바꾸므로 deck 레이어(선박 화살표 등)가
// 3D에서도 그대로 동작한다. 선호는 별도 키에 저장(STORAGE_KEYS.mapMode 를
// 'globe' 로 쓰면 부트에서 globe.gl 렌더러가 뜨는 옛 경로를 타버린다).
const KCG_GLOBE_PROJECTION_KEY = 'kcg-globe-projection';

export function loadKcgGlobeProjectionPref(): boolean {
  try {
    return localStorage.getItem(KCG_GLOBE_PROJECTION_KEY) === '1';
  } catch {
    return false;
  }
}

export function saveKcgGlobeProjectionPref(enabled: boolean): void {
  try {
    localStorage.setItem(KCG_GLOBE_PROJECTION_KEY, enabled ? '1' : '0');
  } catch {
    // storage unavailable — session-only
  }
}
