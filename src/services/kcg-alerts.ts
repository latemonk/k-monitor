/**
 * KCG fork — AI 이상 선박 활동 감시 엔진.
 *
 * geosis의 감시구역(Watch) 패턴을 선박 활동에 이식한 것:
 *   - 베이스라인 = 직전 집계 요약(과거 산출물) + 사용자가 입력한 "평소 기준" 텍스트
 *   - 판정 = LLM이 스키마 강제 출력({triggered, anomaly_score, severity, ...})으로
 *     현재 활동을 베이스라인과 비교 (서버 프록시 /api/kcg-anomaly)
 *   - 경보 = triggered && score >= 사용자 임계값, 60분 dedup 쿨다운
 *
 * 판정 주기·평소 기준·경보 기준·임계값은 전부 사용자가 패널에서 설정한다.
 * 엔진은 브라우저(상황실 화면)가 떠 있는 동안 동작한다.
 */

import { fetchLiveTankers } from '@/services/live-tankers';
import { fetchSeaConditions, summarizeSeaConditions } from '@/services/kcg-sea';
import { KOREA_ZONES } from '@/config/korea-zones';
import { flagFromMmsi, shipTypeKo } from '@/utils/mmsi-flag';
import { toApiUrl } from '@/services/runtime';
import { getRpcBaseUrl } from '@/services/rpc-client';
import { MaritimeServiceClient } from '@/services/generated-rpc-clients';

export interface KcgAlertSettings {
  enabled: boolean;
  /** 평소 기준 (자유 텍스트) */
  baseline: string;
  /** 경보 트리거 기준 (자유 텍스트) */
  trigger: string;
  /** anomaly_score 임계값 (0-100) */
  threshold: number;
  /** 판정 주기 (분) */
  intervalMin: number;
  /** 브라우저 알림 사용 */
  browserNotify: boolean;
}

export interface KcgVerdict {
  triggered: boolean;
  anomaly_score: number;
  severity: 'info' | 'watch' | 'warning' | 'critical';
  confidence: 'low' | 'medium' | 'high';
  headline: string;
  changes: string[];
  caveats: string;
  model?: string;
}

export interface KcgAlert extends KcgVerdict {
  id: string;
  ts: number;
}

export interface KcgEngineState {
  running: boolean;
  lastRunAt: number | null;
  lastVerdict: KcgVerdict | null;
  lastError: string | null;
  lastSummary: string | null;
  vesselCount: number;
  alerts: KcgAlert[];
  nextRunAt: number | null;
  /** true = 실시간 AIS 연결, false = 시뮬레이션(데모) 피드, null = 미확인 */
  liveAis: boolean | null;
}

const SETTINGS_KEY = 'kcg-alert-settings-v1';
const ALERTS_KEY = 'kcg-alerts-v1';
const PREV_SUMMARY_KEY = 'kcg-prev-summary-v1';
const DEDUP_COOLDOWN_MS = 60 * 60 * 1000;
const MAX_ALERTS = 50;

export const DEFAULT_SETTINGS: KcgAlertSettings = {
  enabled: true,
  baseline:
    '주간에는 어선·화물선·여객선이 각 구역에 고르게 분포하고, 대부분 정상 항로를 따라 이동해요. '
    + '서해 중부(NLL 인근)에는 평소 국적 미상 선박이 없어요.',
  trigger:
    'NLL 인근 국적 미상 선박 출현·체류, 특정 구역 다수 선박 AIS 동시 소실, '
    + '두 선박의 해상 밀착(환적 의심), 야간 20노트 이상 고속 접근. '
    + '해양 기상: 파고·돌풍의 급격한 상승, 관측 위험(경계 이상) 단계 진입, 직전 대비 수온 급변.',
  threshold: 55,
  intervalMin: 10,
  browserNotify: true,
};

type Listener = () => void;

class KcgAlertEngine {
  private settings: KcgAlertSettings;
  private state: KcgEngineState;
  private timer: ReturnType<typeof setInterval> | null = null;
  private listeners = new Set<Listener>();
  private inFlight = false;
  private dedup = new Map<string, number>();

  constructor() {
    this.settings = this.loadSettings();
    this.state = {
      running: false,
      lastRunAt: null,
      lastVerdict: null,
      lastError: null,
      lastSummary: null,
      vesselCount: 0,
      alerts: this.loadAlerts(),
      nextRunAt: null,
      liveAis: null,
    };
  }

  /** 데이터 출처 확인: 릴레이가 실시간 AIS에 연결돼 있는지(연결 안 됨 = 시뮬레이션 피드). */
  private async probeDataSource(): Promise<void> {
    try {
      const client = new MaritimeServiceClient(getRpcBaseUrl(), {
        fetch: (...args: Parameters<typeof fetch>) => globalThis.fetch(...args),
      });
      const resp = await client.getVesselSnapshot({
        swLat: 0, swLon: 0, neLat: 0, neLon: 0,
        includeCandidates: false,
        includeTankers: false,
      });
      if (resp.snapshot?.status) {
        this.state.liveAis = Boolean(resp.snapshot.status.connected);
      }
    } catch { /* leave as-is */ }
  }

  // ── settings ──────────────────────────────────────────────────────────
  getSettings(): KcgAlertSettings {
    return { ...this.settings };
  }

  saveSettings(next: KcgAlertSettings): void {
    this.settings = {
      ...next,
      threshold: Math.max(0, Math.min(100, Math.round(next.threshold) || 55)),
      intervalMin: Math.max(3, Math.min(120, Math.round(next.intervalMin) || 10)),
    };
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings)); } catch { /* quota */ }
    this.restart();
    this.emit();
  }

  private loadSettings(): KcgAlertSettings {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    } catch { /* corrupted -> defaults */ }
    return { ...DEFAULT_SETTINGS };
  }

  private loadAlerts(): KcgAlert[] {
    try {
      const raw = localStorage.getItem(ALERTS_KEY);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) return arr.slice(0, MAX_ALERTS);
      }
    } catch { /* corrupted -> empty */ }
    return [];
  }

  private persistAlerts(): void {
    try { localStorage.setItem(ALERTS_KEY, JSON.stringify(this.state.alerts.slice(0, MAX_ALERTS))); } catch { /* quota */ }
  }

  // ── lifecycle ─────────────────────────────────────────────────────────
  start(): void {
    if (this.timer !== null || !this.settings.enabled) {
      this.emit();
      return;
    }
    this.state.running = true;
    const intervalMs = this.settings.intervalMin * 60_000;
    this.state.nextRunAt = Date.now() + intervalMs;
    // First run shortly after boot so the vessel cache has data
    setTimeout(() => void this.runOnce(), 15_000);
    this.timer = setInterval(() => {
      this.state.nextRunAt = Date.now() + intervalMs;
      void this.runOnce();
    }, intervalMs);
    this.emit();
  }

  stop(): void {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.state.running = false;
    this.state.nextRunAt = null;
    this.emit();
  }

  private restart(): void {
    this.stop();
    if (this.settings.enabled) this.start();
  }

  clearAlerts(): void {
    this.state.alerts = [];
    this.persistAlerts();
    this.emit();
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  getState(): KcgEngineState {
    return { ...this.state, alerts: [...this.state.alerts] };
  }

  private emit(): void {
    for (const fn of this.listeners) {
      try { fn(); } catch { /* listener errors must not break the engine */ }
    }
  }

  // ── core cycle ────────────────────────────────────────────────────────
  async runOnce(): Promise<void> {
    if (this.inFlight) return;
    this.inFlight = true;
    try {
      void this.probeDataSource();
      const summary = await this.buildSummary();
      if (!summary) {
        this.state.lastError = '선박 데이터를 가져오지 못했어요';
        this.state.lastRunAt = Date.now();
        return;
      }
      let previous: string | null = null;
      try { previous = localStorage.getItem(PREV_SUMMARY_KEY); } catch { /* ignore */ }

      const resp = await fetch(toApiUrl('/api/kcg-anomaly'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baseline: this.settings.baseline,
          trigger: this.settings.trigger,
          current: summary,
          previous: previous || '',
        }),
        signal: AbortSignal.timeout(45_000),
      });
      this.state.lastRunAt = Date.now();
      this.state.lastSummary = summary;
      try { localStorage.setItem(PREV_SUMMARY_KEY, summary); } catch { /* quota */ }

      if (!resp.ok) {
        this.state.lastError = resp.status === 503
          ? 'AI 판정 서비스가 아직 설정되지 않았어요'
          : resp.status === 502
            ? 'AI 판정이 일시적으로 실패했어요 — 다음 주기에 다시 시도해요'
            : `판정 실패 (HTTP ${resp.status})`;
        return;
      }
      const verdict = (await resp.json()) as KcgVerdict;
      this.state.lastVerdict = verdict;
      this.state.lastError = null;

      if (verdict.triggered && verdict.anomaly_score >= this.settings.threshold) {
        this.raiseAlert(verdict);
      }
    } catch (err) {
      this.state.lastRunAt = Date.now();
      this.state.lastError = err instanceof Error && err.name === 'TimeoutError'
        ? 'AI 판정 응답 시간 초과'
        : '판정 중 오류가 발생했어요';
    } finally {
      this.inFlight = false;
      this.emit();
    }
  }

  private raiseAlert(verdict: KcgVerdict): void {
    const key = `${verdict.severity}:${verdict.headline}`;
    const last = this.dedup.get(key);
    const now = Date.now();
    if (last && now - last < DEDUP_COOLDOWN_MS) return;
    this.dedup.set(key, now);

    const alert: KcgAlert = { ...verdict, id: `${now}-${Math.random().toString(36).slice(2, 8)}`, ts: now };
    this.state.alerts = [alert, ...this.state.alerts].slice(0, MAX_ALERTS);
    this.persistAlerts();

    if (this.settings.browserNotify && typeof Notification !== 'undefined') {
      if (Notification.permission === 'granted') {
        try {
          new Notification(`[해상 이상 활동 ${verdict.anomaly_score}점] ${verdict.headline}`, {
            body: verdict.changes.slice(0, 3).join('\n'),
            tag: alert.id,
          });
        } catch { /* platform without Notification constructor support */ }
      } else if (Notification.permission === 'default') {
        void Notification.requestPermission();
      }
    }
  }

  /**
   * 현재 해상 상황을 LLM이 소화할 수 있는 압축 텍스트로 요약.
   * 구역별 척수·국적·선종·정지/고속 선박과 주목 선박 목록을 담는다.
   */
  private async buildSummary(): Promise<string | null> {
    let zones;
    try {
      zones = await fetchLiveTankers();
    } catch {
      return null;
    }
    if (!zones || zones.length === 0) return null;

    const lines: string[] = [];
    const kst = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', hour12: false });
    let total = 0;

    for (const z of zones) {
      const zoneMeta = KOREA_ZONES.find((k) => k.id === z.chokepoint.id);
      const nameKo = zoneMeta?.nameKo ?? z.chokepoint.displayName;
      const vessels = z.tankers;
      total += vessels.length;
      if (vessels.length === 0) {
        lines.push(`■ ${nameKo}: 포착 선박 없음`);
        continue;
      }
      const byFlag = new Map<string, number>();
      const byType = new Map<string, number>();
      let stopped = 0;
      let fast = 0;
      const notable: string[] = [];
      for (const v of vessels) {
        const flag = flagFromMmsi(v.mmsi);
        byFlag.set(flag.nameKo, (byFlag.get(flag.nameKo) ?? 0) + 1);
        const ty = shipTypeKo(v.shipType);
        byType.set(ty, (byType.get(ty) ?? 0) + 1);
        const spd = Number(v.speed);
        if (Number.isFinite(spd) && spd < 0.5) stopped++;
        if (Number.isFinite(spd) && spd >= 18) fast++;
        if (flag.iso === 'XX' || flag.iso === 'KP' || (Number.isFinite(spd) && spd >= 18)) {
          notable.push(`${v.name || '선명미상'}(${flag.nameKo}/MMSI ${v.mmsi}/${ty}/${Number.isFinite(spd) ? spd.toFixed(1) : '?'}kn @${v.lat.toFixed(2)},${v.lon.toFixed(2)})`);
        }
      }
      const flagStr = [...byFlag.entries()].sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} ${n}`).join(', ');
      const typeStr = [...byType.entries()].sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} ${n}`).join(', ');
      lines.push(
        `■ ${nameKo}: 총 ${vessels.length}척 | 국적: ${flagStr} | 선종: ${typeStr} | 정지 ${stopped}척 · 18kn 이상 ${fast}척`
        + (notable.length ? ` | 주목: ${notable.slice(0, 6).join(' / ')}` : ''),
      );
    }

    this.state.vesselCount = total;

    // 해양 기상·수온 관측을 같은 요약에 붙여 AI가 해상기상 특이(파고·돌풍
    // 급상승, 위험 단계 진입, 직전 대비 급변)도 함께 판정하게 한다.
    let seaSection = '';
    try {
      const sea = await fetchSeaConditions();
      if (sea) seaSection = `\n${summarizeSeaConditions(sea)}`;
    } catch { /* 관측 실패 시 선박 요약만으로 진행 */ }

    return [`[집계 시각(KST)] ${kst}`, `[전체 포착 선박] ${total}척`, ...lines].join('\n') + seaSection;
  }
}

let engine: KcgAlertEngine | null = null;

export function getKcgAlertEngine(): KcgAlertEngine {
  if (!engine) engine = new KcgAlertEngine();
  return engine;
}
