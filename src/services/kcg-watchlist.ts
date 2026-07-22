/**
 * KCG fork — 관심 대상(선박·항공기) 추적 + 이상상황 알림 엔진.
 *
 * 선박: 해역 스냅샷(60초, 릴레이 캐시)과 등록 선박 일괄 추적 API(30분,
 *   업스트림 쿼터 소모)를 합쳐 항적을 누적한다. 위치 데이터 자체가
 *   6시간 주기 스윕이므로 "실시간"은 신호 기준 최신값이라는 뜻.
 * 항공기: 커뮤니티 ADS-B(무쿼터)를 2분 주기로 조회 — 진짜 실시간.
 *
 * 이상 판정(로컬 룰, LLM 아님 — kcg-alerts 의 AI 판정과 별개 축):
 *   선박  ①신호 소실(9시간+) ②장기 정지·표류 의심(6시간+ 정지)
 *         ③급변침(연속 항적 90°+) ④민감 해역(NLL 인근) 진입
 *   항공기 ①비상 스쿼크 7500·7600·7700 ②신호 소실(15분+)
 *         ③급강하(-20m/s 이상 강하율)
 *
 * 알림 = 카드 배지 + 토스트 + (허용 시) 브라우저 알림. 60분 dedup.
 * 저장은 전부 localStorage — 이 관제 화면은 단일 운영자 콘솔이다.
 */
import { fetchLiveTankers } from '@/services/live-tankers';
import { fetchAircraftPositions } from '@/services/aviation';
import { getRpcBaseUrl } from '@/services/rpc-client';
import { MaritimeServiceClient } from '@/services/generated-rpc-clients';
import { showToast } from '@/utils/toast';

export type WatchKind = 'vessel' | 'aircraft';

export interface WatchItem {
  kind: WatchKind;
  /** vessel = MMSI(9자리), aircraft = icao24 hex 또는 콜사인. */
  id: string;
  /** 항공기에서 id 가 콜사인일 때 true. */
  byCallsign?: boolean;
  label: string;
  addedAt: number;
}

export interface TrailPoint {
  lat: number;
  lon: number;
  /** kn(선박) / kn(항공기 지상속도) */
  speed: number | null;
  /** 항공기 전용: 기압고도 ft */
  altitudeFt?: number;
  /** 항공기 전용: 수직률 m/s */
  verticalRateMps?: number;
  /** 항공기 전용: 스쿼크 */
  squawk?: string;
  observedAt: number;
}

export interface WatchStatus {
  item: WatchItem;
  trail: TrailPoint[];
  lastSeenAt: number | null;
  /** 활성 이상 상태 코드 목록 (비면 정상). */
  anomalies: WatchAnomaly[];
}

export interface WatchAnomaly {
  code: 'signal-lost' | 'stopped' | 'sharp-turn' | 'sensitive-zone' | 'squawk' | 'rapid-descent';
  severity: 'watch' | 'warning' | 'critical';
  headline: string;
  detail: string;
  ts: number;
}

export interface WatchAlert extends WatchAnomaly {
  alertId: string;
  itemKind: WatchKind;
  itemId: string;
  itemLabel: string;
}

const ITEMS_KEY = 'kcg-watchlist-v1';
const TRAILS_KEY = 'kcg-watch-trails-v1';
const ALERTS_KEY = 'kcg-watch-alerts-v1';
const DEDUP_KEY = 'kcg-watch-dedup-v1';
const MAX_ITEMS_PER_KIND = 10;
const MAX_TRAIL_POINTS = 240;
const MAX_ALERTS = 50;
const DEDUP_COOLDOWN_MS = 60 * 60 * 1000;

const VESSEL_MERGE_INTERVAL_MS = 90_000;      // 해역 스냅샷 병합(릴레이 캐시, 무쿼터)
const VESSEL_TRACK_INTERVAL_MS = 30 * 60_000; // 등록 선박 일괄 추적(쿼터 소모, 서버 2h 캐시)
const AIRCRAFT_INTERVAL_MS = 2 * 60_000;      // 커뮤니티 ADS-B(무쿼터)

const VESSEL_SIGNAL_LOST_MS = 9 * 3600_000;   // 스윕 6시간 + 여유
const VESSEL_STOPPED_MS = 6 * 3600_000;
const AIRCRAFT_SIGNAL_LOST_MS = 15 * 60_000;
const EMERGENCY_SQUAWKS = new Set(['7500', '7600', '7700']);
const SQUAWK_LABEL: Record<string, string> = {
  '7500': '하이재킹(7500)',
  '7600': '통신 두절(7600)',
  '7700': '일반 비상(7700)',
};

/** 민감 해역 — NLL 인근 박스. 관심 선박이 들어오면 critical 알림. */
const SENSITIVE_ZONES: Array<{ name: string; latMin: number; latMax: number; lonMin: number; lonMax: number }> = [
  { name: '서해 NLL 인근', latMin: 37.5, latMax: 38.5, lonMin: 124.0, lonMax: 126.3 },
  { name: '동해 NLL 인근', latMin: 38.2, latMax: 39.2, lonMin: 128.0, lonMax: 130.5 },
];

function distanceNm(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const dLat = (bLat - aLat) * 60;
  const dLon = (bLon - aLon) * 60 * Math.cos(((aLat + bLat) / 2) * Math.PI / 180);
  return Math.sqrt(dLat * dLat + dLon * dLon);
}

function bearingDeg(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const φ1 = aLat * Math.PI / 180;
  const φ2 = bLat * Math.PI / 180;
  const Δλ = (bLon - aLon) * Math.PI / 180;
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}

function angleDiff(a: number, b: number): number {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

function itemKey(kind: WatchKind, id: string): string {
  return `${kind}:${id.toLowerCase()}`;
}

type Listener = () => void;

class KcgWatchlistEngine {
  private items: WatchItem[] = [];
  private trails = new Map<string, TrailPoint[]>();
  private alerts: WatchAlert[] = [];
  private listeners = new Set<Listener>();
  private dedup = new Map<string, number>();
  private timers: ReturnType<typeof setInterval>[] = [];
  private vesselPollDebounce: ReturnType<typeof setTimeout> | null = null;
  private started = false;
  /** 선박 추적 API가 쿼터 소진을 보고했는지 (UI 안내용). */
  quotaExhausted = false;

  constructor() {
    this.items = this.loadJson<WatchItem[]>(ITEMS_KEY, []);
    this.alerts = this.loadJson<WatchAlert[]>(ALERTS_KEY, []);
    const rawTrails = this.loadJson<Record<string, TrailPoint[]>>(TRAILS_KEY, {});
    for (const [k, v] of Object.entries(rawTrails)) {
      if (Array.isArray(v)) this.trails.set(k, v.slice(-MAX_TRAIL_POINTS));
    }
    // dedup 쿨다운을 영속화하지 않으면 새로고침마다 활성 이상 전부가
    // 토스트+브라우저 알림으로 재발화한다.
    const rawDedup = this.loadJson<Record<string, number>>(DEDUP_KEY, {});
    const cutoff = Date.now() - DEDUP_COOLDOWN_MS;
    for (const [k, ts] of Object.entries(rawDedup)) {
      if (typeof ts === 'number' && ts > cutoff) this.dedup.set(k, ts);
    }
  }

  // ── 저장/로드 ──────────────────────────────────────────────────────────
  private loadJson<T>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw) as T;
    } catch { /* corrupted -> fallback */ }
    return fallback;
  }

  private persist(): void {
    try {
      localStorage.setItem(ITEMS_KEY, JSON.stringify(this.items));
      localStorage.setItem(ALERTS_KEY, JSON.stringify(this.alerts.slice(0, MAX_ALERTS)));
      const obj: Record<string, TrailPoint[]> = {};
      for (const [k, v] of this.trails) obj[k] = v.slice(-MAX_TRAIL_POINTS);
      localStorage.setItem(TRAILS_KEY, JSON.stringify(obj));
      localStorage.setItem(DEDUP_KEY, JSON.stringify(Object.fromEntries(this.dedup)));
    } catch { /* quota */ }
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private emit(): void {
    for (const fn of this.listeners) {
      try { fn(); } catch { /* listener errors must not break the engine */ }
    }
    this.publishMapOverlay();
  }

  // ── 목록 관리 ──────────────────────────────────────────────────────────
  getItems(): WatchItem[] {
    return [...this.items];
  }

  getStatuses(): WatchStatus[] {
    const now = Date.now();
    return this.items.map((item) => {
      const trail = this.trails.get(itemKey(item.kind, item.id)) ?? [];
      const lastSeenAt = trail.length ? trail[trail.length - 1]!.observedAt : null;
      return { item, trail, lastSeenAt, anomalies: this.detectAnomalies(item, trail, now) };
    });
  }

  getAlerts(): WatchAlert[] {
    return [...this.alerts];
  }

  clearAlerts(): void {
    this.alerts = [];
    this.persist();
    this.emit();
  }

  /** true = 추가됨, false = 중복/한도 초과. */
  add(item: Omit<WatchItem, 'addedAt'>): boolean {
    const key = itemKey(item.kind, item.id);
    if (this.items.some((i) => itemKey(i.kind, i.id) === key)) return false;
    if (this.items.filter((i) => i.kind === item.kind).length >= MAX_ITEMS_PER_KIND) return false;
    this.items.push({ ...item, addedAt: Date.now() });
    this.persist();
    this.emit();
    // 새 항목은 다음 주기를 기다리지 말고 곧 조회하되, 연달아 여러 척을
    // 등록할 때 조합이 바뀔 때마다 조회가 나가지 않게 8초 디바운스한다
    // (선박 추적 조회는 일일 한도가 있는 자원이다).
    if (item.kind === 'aircraft') {
      void this.pollAircraftOnce();
    } else {
      if (this.vesselPollDebounce) clearTimeout(this.vesselPollDebounce);
      this.vesselPollDebounce = setTimeout(() => {
        this.vesselPollDebounce = null;
        void this.pollVesselTracksOnce();
      }, 8_000);
    }
    return true;
  }

  remove(kind: WatchKind, id: string): void {
    const key = itemKey(kind, id);
    this.items = this.items.filter((i) => itemKey(i.kind, i.id) !== key);
    this.trails.delete(key);
    this.persist();
    this.emit();
  }

  isWatched(kind: WatchKind, id: string): boolean {
    const key = itemKey(kind, id);
    return this.items.some((i) => itemKey(i.kind, i.id) === key);
  }

  // ── 수집 루프 ──────────────────────────────────────────────────────────
  start(): void {
    if (this.started) return;
    this.started = true;
    this.timers.push(setInterval(() => void this.mergeFromZoneSnapshot(), VESSEL_MERGE_INTERVAL_MS));
    this.timers.push(setInterval(() => void this.pollVesselTracksOnce(), VESSEL_TRACK_INTERVAL_MS));
    this.timers.push(setInterval(() => void this.pollAircraftOnce(), AIRCRAFT_INTERVAL_MS));
    // 신호 소실은 "데이터가 안 들어오는 것" 자체가 신호라, 수집 성공 여부와
    // 무관하게 주기적으로 판정해야 한다 (수집 콜백 안에서만 돌리면 두 피드가
    // 모두 침묵할 때 소실 알림이 영영 안 울린다).
    this.timers.push(setInterval(() => { this.runDetection(); this.emit(); }, 5 * 60_000));
    setTimeout(() => {
      void this.mergeFromZoneSnapshot();
      void this.pollVesselTracksOnce();
      void this.pollAircraftOnce();
    }, 5_000);
  }

  stop(): void {
    for (const t of this.timers) clearInterval(t);
    this.timers = [];
    if (this.vesselPollDebounce) { clearTimeout(this.vesselPollDebounce); this.vesselPollDebounce = null; }
    this.started = false;
  }

  private appendPoint(key: string, p: TrailPoint): boolean {
    const trail = this.trails.get(key) ?? [];
    const last = trail[trail.length - 1];
    // 같은 관측(타임스탬프)이거나 시간 역행이면 무시
    if (last && p.observedAt <= last.observedAt) return false;
    // 릴레이가 스윕 데이터를 주기 재주입하며 타임스탬프를 새로 찍으므로,
    // 좌표·속도가 그대로면 같은 관측의 재방송으로 보고 버린다 — 아니면
    // 항적에 가짜 중복점이 쌓여 정지·변침 판정이 왜곡된다.
    if (last && last.lat === p.lat && last.lon === p.lon && last.speed === p.speed) return false;
    trail.push(p);
    if (trail.length > MAX_TRAIL_POINTS) trail.splice(0, trail.length - MAX_TRAIL_POINTS);
    this.trails.set(key, trail);
    return true;
  }

  /** 해역 스냅샷(무쿼터)에서 관심 선박 위치 병합. */
  private async mergeFromZoneSnapshot(): Promise<void> {
    const watched = this.items.filter((i) => i.kind === 'vessel');
    if (!watched.length) return;
    let zones;
    try {
      zones = await fetchLiveTankers();
    } catch { return; }
    let changed = false;
    for (const z of zones) {
      for (const v of z.tankers) {
        const item = watched.find((w) => w.id === String(v.mmsi));
        if (!item) continue;
        const ts = Number(v.timestamp) || Date.now();
        changed = this.appendPoint(itemKey('vessel', item.id), {
          lat: v.lat, lon: v.lon,
          speed: Number.isFinite(Number(v.speed)) ? Number(v.speed) : null,
          observedAt: ts,
        }) || changed;
        if (!item.label && v.name) { item.label = v.name; changed = true; }
      }
    }
    if (changed) {
      this.persist();
      this.runDetection();
      this.emit();
    }
  }

  /** 등록 선박 일괄 추적(서버 캐시 2h — 실제 업스트림 소모는 하루 최대 12콜). */
  private async pollVesselTracksOnce(): Promise<void> {
    const mmsis = this.items.filter((i) => i.kind === 'vessel').map((i) => i.id);
    if (!mmsis.length) return;
    try {
      const client = new MaritimeServiceClient(getRpcBaseUrl(), {
        fetch: (...args: Parameters<typeof fetch>) => globalThis.fetch(...args),
      });
      const resp = await client.getVesselTrack({ mmsis: mmsis.join(','), includeEta: false });
      this.quotaExhausted = Boolean(resp.quotaExhausted);
      if (!resp.dataAvailable) return;
      let changed = false;
      for (const track of resp.tracks) {
        const key = itemKey('vessel', track.mmsi);
        const item = this.items.find((i) => itemKey(i.kind, i.id) === key);
        if (!item) continue;
        if (!item.label && track.name) { item.label = track.name; changed = true; }
        for (const p of track.points) {
          changed = this.appendPoint(key, {
            lat: p.latitude, lon: p.longitude,
            speed: p.sogKnots >= 0 ? p.sogKnots : null,
            observedAt: p.observedAt,
          }) || changed;
        }
      }
      if (changed) this.persist();
      this.runDetection();
      this.emit();
    } catch { /* 다음 주기에 재시도 */ }
  }

  /** 관심 항공기 조회 — 커뮤니티 ADS-B, 무쿼터. */
  private async pollAircraftOnce(): Promise<void> {
    const watched = this.items.filter((i) => i.kind === 'aircraft');
    if (!watched.length) return;
    let changed = false;
    for (const item of watched) {
      try {
        const positions = await fetchAircraftPositions(
          item.byCallsign ? { callsign: item.id } : { icao24: item.id },
        );
        const p = positions[0];
        if (!p) continue;
        if (!item.label && p.callsign) { item.label = p.callsign; changed = true; }
        changed = this.appendPoint(itemKey('aircraft', item.id), {
          lat: p.lat, lon: p.lon,
          speed: p.groundSpeedKts,
          altitudeFt: p.altitudeFt,
          verticalRateMps: p.verticalRateMps,
          squawk: p.squawk,
          observedAt: p.observedAt.getTime(),
        }) || changed;
      } catch { /* 개별 실패는 다음 주기에 */ }
    }
    if (changed) this.persist();
    this.runDetection();
    this.emit();
  }

  // ── 이상 판정 ──────────────────────────────────────────────────────────
  private detectAnomalies(item: WatchItem, trail: TrailPoint[], now: number): WatchAnomaly[] {
    const out: WatchAnomaly[] = [];
    const last = trail[trail.length - 1];
    if (!last) return out;
    const age = now - last.observedAt;
    const lostMs = item.kind === 'vessel' ? VESSEL_SIGNAL_LOST_MS : AIRCRAFT_SIGNAL_LOST_MS;

    if (age > lostMs) {
      const hours = Math.floor(age / 3600_000);
      const mins = Math.floor(age / 60_000);
      out.push({
        code: 'signal-lost', severity: 'warning',
        headline: '신호 소실',
        detail: item.kind === 'vessel'
          ? `마지막 위치 신호가 ${hours}시간 전이에요. AIS를 껐거나 수신 범위를 벗어났을 수 있어요.`
          : `마지막 위치 신호가 ${mins}분 전이에요. 착륙했거나 수신 범위를 벗어났을 수 있어요.`,
        ts: now,
      });
    }

    if (item.kind === 'vessel') {
      // 장기 정지: 최신 위치가 정지 상태 + 6시간 전 위치도 0.5nm 이내
      if (last.speed != null && last.speed < 0.5) {
        const anchor = [...trail].reverse().find((p) => last.observedAt - p.observedAt >= VESSEL_STOPPED_MS);
        if (anchor && distanceNm(anchor.lat, anchor.lon, last.lat, last.lon) < 0.5) {
          out.push({
            code: 'stopped', severity: 'watch',
            headline: '장기 정지·표류 의심',
            detail: `6시간 이상 거의 같은 위치(0.5해리 이내)에 머물러 있어요.`,
            ts: now,
          });
        }
      }
      // 급변침: 마지막 두 구간(각 1nm 이상)의 방위가 90° 이상 차이
      if (trail.length >= 3) {
        const [a, b, c] = trail.slice(-3) as [TrailPoint, TrailPoint, TrailPoint];
        if (distanceNm(a.lat, a.lon, b.lat, b.lon) >= 1 && distanceNm(b.lat, b.lon, c.lat, c.lon) >= 1) {
          const diff = angleDiff(bearingDeg(a.lat, a.lon, b.lat, b.lon), bearingDeg(b.lat, b.lon, c.lat, c.lon));
          if (diff >= 90) {
            out.push({
              code: 'sharp-turn', severity: 'watch',
              headline: '급변침',
              detail: `직전 항로에서 ${Math.round(diff)}° 방향을 틀었어요. 예정 항로를 벗어났을 수 있어요.`,
              ts: now,
            });
          }
        }
      }
      // 민감 해역 진입
      for (const zBox of SENSITIVE_ZONES) {
        if (last.lat >= zBox.latMin && last.lat <= zBox.latMax && last.lon >= zBox.lonMin && last.lon <= zBox.lonMax) {
          out.push({
            code: 'sensitive-zone', severity: 'critical',
            headline: `민감 해역 진입 — ${zBox.name}`,
            detail: `현재 위치가 ${zBox.name} 감시 구역 안이에요.`,
            ts: now,
          });
        }
      }
    } else {
      // 비상 스쿼크
      if (last.squawk && EMERGENCY_SQUAWKS.has(last.squawk)) {
        out.push({
          code: 'squawk', severity: 'critical',
          headline: `비상 스쿼크 — ${SQUAWK_LABEL[last.squawk] ?? last.squawk}`,
          detail: `트랜스폰더가 비상 코드 ${last.squawk}을(를) 송출하고 있어요.`,
          ts: now,
        });
      }
      // 급강하 (지상 제외)
      if (last.verticalRateMps != null && last.verticalRateMps <= -20 && (last.altitudeFt ?? 0) > 3000) {
        out.push({
          code: 'rapid-descent', severity: 'warning',
          headline: '급강하',
          detail: `분당 약 ${Math.round(Math.abs(last.verticalRateMps) * 197)}피트로 강하 중이에요.`,
          ts: now,
        });
      }
    }
    return out;
  }

  private runDetection(): void {
    const now = Date.now();
    for (const status of this.getStatuses()) {
      for (const anomaly of status.anomalies) {
        this.raiseAlert(status.item, anomaly, now);
      }
    }
  }

  private raiseAlert(item: WatchItem, anomaly: WatchAnomaly, now: number): void {
    const dedupKey = `${itemKey(item.kind, item.id)}:${anomaly.code}`;
    const lastRaised = this.dedup.get(dedupKey);
    if (lastRaised && now - lastRaised < DEDUP_COOLDOWN_MS) return;
    this.dedup.set(dedupKey, now);

    const alert: WatchAlert = {
      ...anomaly,
      alertId: `${now}-${Math.random().toString(36).slice(2, 8)}`,
      itemKind: item.kind,
      itemId: item.id,
      itemLabel: item.label || item.id,
    };
    this.alerts = [alert, ...this.alerts].slice(0, MAX_ALERTS);
    this.persist();

    const kindKo = item.kind === 'vessel' ? '관심 선박' : '관심 항공기';
    const title = `[${kindKo}] ${alert.itemLabel} — ${anomaly.headline}`;
    try { showToast(title); } catch { /* 토스트 실패는 치명적이지 않음 */ }
    if (typeof Notification !== 'undefined') {
      if (Notification.permission === 'granted') {
        try {
          new Notification(title, { body: anomaly.detail, tag: alert.alertId });
        } catch { /* platform without Notification constructor support */ }
      }
    }
  }

  // ── 지도 연동 ──────────────────────────────────────────────────────────
  /** 지도에 관심 대상 항적 오버레이 전달 (MapContainer 가 수신). */
  private publishMapOverlay(): void {
    const overlay = this.getStatuses()
      .filter((s) => s.trail.length > 0)
      .map((s) => ({
        id: s.item.id,
        kind: s.item.kind,
        label: s.item.label || s.item.id,
        alerted: s.anomalies.length > 0,
        trail: s.trail.map((p) => [p.lon, p.lat] as [number, number]),
      }));
    try {
      window.dispatchEvent(new CustomEvent('kcg:watch-overlay', { detail: overlay }));
    } catch { /* SSR/테스트 환경 */ }
  }

  /** 지도 화면을 해당 대상 최신 위치로 이동. */
  focusOnMap(kind: WatchKind, id: string): void {
    const trail = this.trails.get(itemKey(kind, id));
    const last = trail?.[trail.length - 1];
    if (!last) return;
    try {
      window.dispatchEvent(new CustomEvent('kcg:map-focus', {
        detail: { lat: last.lat, lon: last.lon, zoom: 8 },
      }));
    } catch { /* SSR/테스트 환경 */ }
  }

  /** 브라우저 알림 권한 요청 (관심 탭에서 안내와 함께 호출). */
  requestNotifyPermission(): void {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      void Notification.requestPermission();
    }
  }
}

let engine: KcgWatchlistEngine | null = null;

export function getKcgWatchlist(): KcgWatchlistEngine {
  if (!engine) engine = new KcgWatchlistEngine();
  return engine;
}
