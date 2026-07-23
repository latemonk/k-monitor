/**
 * KCG fork — 해역 선박 현황 패널 (선박 활동 전면 배치).
 *
 * 4개 탭:
 *   현황   — 구역별 총 척수·국적 구성·선종·정지/고속·주목 선박 (60초 갱신)
 *   검색   — 선명/MMSI/IMO로 선박 찾기 → 상세(목적지·ETA) → 관심 등록
 *   관심   — 관심 선박·항공기 목록 + 항적 지도 연동 + 이상상황 알림
 *   입출항 — 부산·인천·울산 최근 입출항 이벤트
 *
 * 검색·입출항·관심 선박 추적은 월 조회 한도가 있는 외부 조회를 서버 캐시를
 * 거쳐 쓰므로, 탭 UI 에 갱신 주기를 정직하게 표기한다.
 */
import { Panel } from './Panel';
import { safeHtml, joinSafeHtml, type SafeHtml } from '@/utils/sanitize';
import { fetchLiveTankers } from '@/services/live-tankers';
import { KOREA_ZONES } from '@/config/korea-zones';
import { flagFromMmsi, flagEmoji, shipTypeKo } from '@/utils/mmsi-flag';
import { showKcgModal, closeKcgModal } from '@/utils/kcg-modal';
import { showToast } from '@/utils/toast';
import { getRpcBaseUrl } from '@/services/rpc-client';
import { MaritimeServiceClient } from '@/services/generated-rpc-clients';
import { getKcgWatchlist, type WatchStatus } from '@/services/kcg-watchlist';
import type { ChokepointTankers } from '@/services/live-tankers';
import type { VesselRegistryEntry, PortEvent } from '@/generated/client/worldmonitor/maritime/v1/service_client';

interface ZoneRow {
  nameKo: string;
  total: number;
  flags: [string, number][];
  stopped: number;
  fast: number;
  notable: { name: string; flagKo: string; flagIso: string; mmsi: string; type: string; speed: number | null }[];
}

type TabId = 'status' | 'search' | 'watch' | 'ports';

const PORTS: Array<{ unlocode: string; nameKo: string; lat: number; lon: number }> = [
  { unlocode: 'KRPUS', nameKo: '부산', lat: 35.10, lon: 129.04 },
  { unlocode: 'KRINC', nameKo: '인천', lat: 37.45, lon: 126.60 },
  { unlocode: 'KRUSN', nameKo: '울산', lat: 35.50, lon: 129.38 },
];

function agoKo(ts: number | null): string {
  if (!ts) return '신호 없음';
  const diffMin = Math.max(0, Math.floor((Date.now() - ts) / 60_000));
  if (diffMin < 1) return '방금';
  if (diffMin < 60) return `${diffMin}분 전`;
  const h = Math.floor(diffMin / 60);
  if (h < 24) return `${h}시간 전`;
  return `${Math.floor(h / 24)}일 전`;
}

export class KcgVesselsPanel extends Panel {
  private rows: ZoneRow[] = [];
  private zonesRaw: ChokepointTankers[] = [];
  private total = 0;
  private loaded = false;
  private timer: ReturnType<typeof setInterval> | null = null;
  private activeTab: TabId = 'status';

  // 검색 탭 상태
  private searchDraft = '';
  private searchResults: VesselRegistryEntry[] = [];
  private searchState: 'idle' | 'loading' | 'done' | 'error' | 'quota' = 'idle';

  // 관심 탭 상태
  private aircraftDraft = '';
  private unsubWatch: (() => void) | null = null;

  // 입출항 탭 상태
  private activePort = 'KRPUS';
  private portEvents = new Map<string, { events: PortEvent[]; fetchedAt: number }>();
  private portState: 'idle' | 'loading' | 'error' = 'idle';

  constructor() {
    super({
      id: 'kcg-vessels',
      title: '해역 선박 현황',
      infoTooltip: '한국 근해 6개 감시구역의 선박 분포와 관심 선박·항공기 추적이에요. 현황은 60초마다 갱신돼요.',
    });
    void this.fetchData();
    this.timer = setInterval(() => void this.fetchData(), 60_000);
    // 확대(⛶) 시 전체 선박 상세 테이블로 전환
    this.element.addEventListener('wm:panel-maximize', () => this.render());
    // 워치리스트 엔진: 패널이 시작시키고, 알림은 대시보드가 떠 있는 동안 계속
    const watch = getKcgWatchlist();
    watch.start();
    this.unsubWatch = watch.subscribe(() => {
      if (this.activeTab === 'watch') this.render();
    });
  }

  public destroy(): void {
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
    if (this.unsubWatch) { this.unsubWatch(); this.unsubWatch = null; }
    super.destroy();
  }

  public async fetchData(): Promise<void> {
    try {
      const zones = await fetchLiveTankers();
      this.zonesRaw = zones;
      const rows: ZoneRow[] = [];
      // 감시구역 박스가 서로 겹치므로 전체 척수는 MMSI 기준 유니크로 센다
      // (존별 합산은 같은 배를 최대 3번 세는 부풀림 — 07-22 실측 189 vs 134).
      const uniqueMmsis = new Set<string>();
      for (const z of zones) {
        const meta = KOREA_ZONES.find((k) => k.id === z.chokepoint.id);
        const nameKo = meta?.nameKo ?? z.chokepoint.displayName;
        const byFlag = new Map<string, number>();
        let stopped = 0;
        let fast = 0;
        const notable: ZoneRow['notable'] = [];
        for (const v of z.tankers) {
          uniqueMmsis.add(v.mmsi);
          const flag = flagFromMmsi(v.mmsi);
          byFlag.set(flag.nameKo, (byFlag.get(flag.nameKo) ?? 0) + 1);
          const spd = Number(v.speed);
          if (Number.isFinite(spd) && spd < 0.5) stopped++;
          if (Number.isFinite(spd) && spd >= 18) fast++;
          if (flag.iso === 'XX' || flag.iso === 'KP' || (Number.isFinite(spd) && spd >= 18)) {
            notable.push({
              name: v.name || '선명 미상',
              flagKo: flag.nameKo,
              flagIso: flag.iso,
              mmsi: v.mmsi,
              type: shipTypeKo(v.shipType),
              speed: Number.isFinite(spd) ? spd : null,
            });
          }
        }
        rows.push({
          nameKo,
          total: z.tankers.length,
          flags: [...byFlag.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4),
          stopped,
          fast,
          notable: notable.slice(0, 4),
        });
      }
      this.rows = rows;
      this.total = uniqueMmsis.size;
      this.loaded = true;
      // 자동 갱신은 현황 탭(또는 확대 보기)만 다시 그린다 — 다른 탭의
      // 입력값·검색 결과를 지우지 않기 위해서다.
      if (this.activeTab === 'status' || this.element.classList.contains('panel-maximized')) {
        this.render();
      }
    } catch {
      if (!this.loaded) {
        this.showError('선박 데이터를 불러오지 못했어요', () => void this.fetchData());
      }
    }
  }

  // ── 렌더 ────────────────────────────────────────────────────────────────
  private render(): void {
    if (this.element.classList.contains('panel-maximized')) {
      this.renderFullTable();
      return;
    }
    const watch = getKcgWatchlist();
    const alertCount = watch.getStatuses().filter((s) => s.anomalies.length > 0).length;
    const tabs: Array<{ id: TabId; label: string; badge?: number }> = [
      { id: 'status', label: '현황' },
      { id: 'search', label: '검색' },
      { id: 'watch', label: '관심', badge: alertCount || undefined },
      { id: 'ports', label: '입출항' },
    ];
    const tabBar = joinSafeHtml(tabs.map((t) => safeHtml`
      <button class="kcgv-tab ${this.activeTab === t.id ? 'kcgv-tab-on' : ''}" data-tab="${t.id}">
        ${t.label}${t.badge ? safeHtml`<span class="kcgv-tab-badge">${String(t.badge)}</span>` : safeHtml``}
      </button>`));

    const body: SafeHtml =
      this.activeTab === 'search' ? this.renderSearchTab()
        : this.activeTab === 'watch' ? this.renderWatchTab()
          : this.activeTab === 'ports' ? this.renderPortsTab()
            : this.renderStatusTab();

    this.setSafeContent(safeHtml`
      <div class="kcgv-tabs">${tabBar}</div>
      <div class="kcgv-body">${body}</div>
      <style>
        .kcgv-tabs { display: flex; gap: 4px; margin-bottom: 7px; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 6px; }
        .kcgv-tab { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); color: var(--text-dim,#9ab); border-radius: 6px; padding: 3px 10px; font-size: 11px; cursor: pointer; display: inline-flex; align-items: center; gap: 5px; }
        .kcgv-tab:hover { background: rgba(0,209,255,0.08); }
        .kcgv-tab-on { background: rgba(0,209,255,0.12); border-color: rgba(0,209,255,0.45); color: #bfeaff; font-weight: 600; }
        .kcgv-tab-badge { background: #e73c3c; color: #fff; border-radius: 8px; font-size: 9px; font-weight: 700; padding: 0 5px; line-height: 14px; }
        .kcgv-wrap { display: flex; flex-direction: column; gap: 6px; font-size: 12px; }
        .kcgv-total { color: var(--text-dim,#999); font-size: 11px; padding-bottom: 2px; border-bottom: 1px solid rgba(255,255,255,0.08); }
        .kcgv-zone { padding: 6px 8px; background: rgba(255,255,255,0.03); border-radius: 6px; }
        .kcgv-zone-head { display: flex; justify-content: space-between; align-items: baseline; }
        .kcgv-zone-name { font-weight: 600; color: var(--text,#e5eef5); }
        .kcgv-zone-count { font-weight: 700; color: #00d1ff; }
        .kcgv-zone-meta { color: var(--text-dim,#999); font-size: 11px; margin-top: 2px; }
        .kcgv-notable { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 5px; }
        .kcgv-chip { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; padding: 1px 8px; font-size: 10px; }
        .kcgv-chip-hot { border-color: rgba(231,60,60,0.6); background: rgba(231,60,60,0.12); }
        .kcgv-zone-clickable { cursor: pointer; }
        .kcgv-zone-clickable:hover { background: rgba(0,209,255,0.07); }
        .kcgv-form { display: flex; gap: 5px; }
        .kcgv-input { flex: 1; min-width: 0; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.14); border-radius: 6px; color: var(--text,#e8f2fa); font-size: 12px; padding: 5px 8px; }
        .kcgv-input:focus { outline: none; border-color: rgba(0,209,255,0.5); }
        .kcgv-btn { background: rgba(0,209,255,0.12); border: 1px solid rgba(0,209,255,0.4); border-radius: 6px; color: #bfeaff; font-size: 11px; padding: 4px 10px; cursor: pointer; white-space: nowrap; }
        .kcgv-btn:hover { background: rgba(0,209,255,0.2); }
        .kcgv-btn-sm { font-size: 10px; padding: 2px 7px; border-radius: 5px; }
        .kcgv-btn-danger { border-color: rgba(231,60,60,0.4); background: rgba(231,60,60,0.08); color: #ffb9b9; }
        .kcgv-hint { color: var(--text-dim,#889); font-size: 10.5px; line-height: 1.5; }
        .kcgv-item { padding: 6px 8px; background: rgba(255,255,255,0.03); border-radius: 6px; }
        .kcgv-item-head { display: flex; justify-content: space-between; align-items: center; gap: 6px; }
        .kcgv-item-name { font-weight: 600; color: var(--text,#e8f2fa); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .kcgv-item-meta { color: var(--text-dim,#99a); font-size: 10.5px; margin-top: 2px; }
        .kcgv-item-actions { display: flex; gap: 4px; flex-shrink: 0; }
        .kcgv-badge { display: inline-block; border-radius: 8px; padding: 0 6px; font-size: 9.5px; font-weight: 700; line-height: 15px; margin-left: 4px; }
        .kcgv-badge-ok { background: rgba(46,204,113,0.15); color: #7ee2a8; }
        .kcgv-badge-watch { background: rgba(255,209,102,0.16); color: #ffd166; }
        .kcgv-badge-warning { background: rgba(255,140,66,0.18); color: #ffab73; }
        .kcgv-badge-critical { background: rgba(231,60,60,0.22); color: #ff8f8f; }
        .kcgv-alert { padding: 5px 8px; border-left: 2px solid #e73c3c; background: rgba(231,60,60,0.07); border-radius: 4px; font-size: 11px; }
        .kcgv-alert-time { color: var(--text-dim,#889); font-size: 10px; }
        .kcgv-sec-title { font-weight: 700; color: #7fd4ff; font-size: 11.5px; margin-top: 4px; }
        .kcgv-port-chips { display: flex; gap: 4px; }
        .kcgv-evt { display: flex; gap: 7px; align-items: baseline; padding: 4px 6px; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .kcgv-evt-focus { cursor: pointer; }
        .kcgv-evt-focus:hover { background: rgba(0,209,255,0.08); }
        .kcgv-evt-arr { color: #7ee2a8; font-weight: 700; font-size: 10.5px; }
        .kcgv-evt-dep { color: #ffab73; font-weight: 700; font-size: 10.5px; }
        .kcgv-evt-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .kcgv-evt-time { color: var(--text-dim,#889); font-size: 10.5px; white-space: nowrap; }
      </style>
    `, () => this.bind());
  }

  private bind(): void {
    this.content.querySelectorAll('.kcgv-tab').forEach((el) => {
      (el as HTMLElement).onclick = () => {
        const tab = (el as HTMLElement).dataset.tab as TabId;
        if (tab === this.activeTab) return;
        this.activeTab = tab;
        if (tab === 'ports' && !this.portEvents.has(this.activePort)) void this.loadPortEvents(this.activePort);
        if (tab === 'watch') getKcgWatchlist().requestNotifyPermission();
        this.render();
      };
    });
    if (this.activeTab === 'status') this.bindStatusTab();
    else if (this.activeTab === 'search') this.bindSearchTab();
    else if (this.activeTab === 'watch') this.bindWatchTab();
    else this.bindPortsTab();
  }

  // ── 현황 탭 (기존 렌더 유지) ────────────────────────────────────────────
  private renderStatusTab(): SafeHtml {
    if (!this.loaded) {
      return safeHtml`<div class="kcgv-hint">선박 집계 중이에요…</div>`;
    }
    const zoneRows = joinSafeHtml(this.rows.map((r) => {
      const flagStr = r.flags.map(([k, n]) => `${k} ${n}`).join(' · ');
      const notable: SafeHtml = r.notable.length
        ? safeHtml`<div class="kcgv-notable">${joinSafeHtml(r.notable.map((n) => safeHtml`
            <span class="kcgv-chip ${n.flagIso === 'KP' || n.flagIso === 'XX' ? 'kcgv-chip-hot' : ''}"
              title="MMSI ${n.mmsi} · ${n.type}${n.speed != null ? ` · ${n.speed.toFixed(1)}kn` : ''}">
              ${flagEmoji(n.flagIso)} ${n.name}
            </span>`))}</div>`
        : safeHtml``;
      return safeHtml`
        <div class="kcgv-zone kcgv-zone-clickable" data-zone-name="${r.nameKo}">
          <div class="kcgv-zone-head">
            <span class="kcgv-zone-name">${r.nameKo}</span>
            <span class="kcgv-zone-count">${String(r.total)}척</span>
          </div>
          <div class="kcgv-zone-meta">${flagStr || '—'} · 정지 ${String(r.stopped)} · 고속 ${String(r.fast)}</div>
          ${notable}
        </div>`;
    }));
    return safeHtml`
      <div class="kcgv-wrap">
        <div class="kcgv-total">전체 포착 <strong>${String(this.total)}척</strong> (중복 제외) · 위치 수신 약 1시간 주기</div>
        ${zoneRows}
        <div class="kcgv-hint">수신망 사정에 따라 일부 해역(서해 남부·제주 먼바다)은 실제보다 선박이 적게 보일 수 있어요.</div>
      </div>`;
  }

  private bindStatusTab(): void {
    this.content.querySelectorAll('.kcgv-zone-clickable').forEach((el) => {
      (el as HTMLElement).onclick = () => {
        const name = (el as HTMLElement).dataset.zoneName || '';
        this.showZoneDetail(name);
      };
    });
  }

  // ── 검색 탭 ─────────────────────────────────────────────────────────────
  private renderSearchTab(): SafeHtml {
    const watch = getKcgWatchlist();
    let resultBlock: SafeHtml;
    if (this.searchState === 'loading') {
      resultBlock = safeHtml`<div class="kcgv-hint">선박을 찾고 있어요…</div>`;
    } else if (this.searchState === 'quota') {
      resultBlock = safeHtml`<div class="kcgv-hint">오늘 검색 한도를 모두 썼어요. 내일 다시 시도해 주세요.</div>`;
    } else if (this.searchState === 'error') {
      resultBlock = safeHtml`<div class="kcgv-hint">검색에 실패했어요. 잠시 후 다시 시도해 주세요.</div>`;
    } else if (this.searchState === 'done' && this.searchResults.length === 0) {
      resultBlock = safeHtml`<div class="kcgv-hint">일치하는 선박이 없어요.</div>`;
    } else {
      resultBlock = joinSafeHtml(this.searchResults.map((v, i) => {
        const watched = v.mmsi ? watch.isWatched('vessel', v.mmsi) : false;
        return safeHtml`
        <div class="kcgv-item">
          <div class="kcgv-item-head">
            <span class="kcgv-item-name">${flagEmoji(v.flag || 'XX')} ${v.name || '(선명 미상)'}</span>
            <span class="kcgv-item-actions">
              <button class="kcgv-btn kcgv-btn-sm" data-detail-idx="${String(i)}">상세</button>
              ${v.mmsi ? (watched
                ? safeHtml`<button class="kcgv-btn kcgv-btn-sm kcgv-btn-danger" data-unwatch-mmsi="${v.mmsi}">추적 해제</button>`
                : safeHtml`<button class="kcgv-btn kcgv-btn-sm" data-watch-idx="${String(i)}">추적</button>`)
                : safeHtml``}
            </span>
          </div>
          <div class="kcgv-item-meta">${v.vesselType || '종류 미상'}${v.lengthM ? ` · ${String(Math.round(v.lengthM))}m` : ''}${v.yearBuilt ? ` · ${String(v.yearBuilt)}년` : ''}${v.homePort ? ` · 모항 ${v.homePort}` : ''} · MMSI ${v.mmsi || '—'}</div>
        </div>`;
      }));
    }
    return safeHtml`
      <div class="kcgv-wrap">
        <div class="kcgv-form">
          <input class="kcgv-input" id="kcgv-search-input" type="text" placeholder="선명 · MMSI(9자리) · IMO(7자리)" value="${this.searchDraft}" />
          <button class="kcgv-btn" id="kcgv-search-btn">검색</button>
        </div>
        <div class="kcgv-hint">전 세계 선박 등록 정보에서 찾아요. 검색 결과에서 바로 추적을 시작할 수 있어요.</div>
        ${resultBlock}
      </div>`;
  }

  private bindSearchTab(): void {
    const input = this.content.querySelector('#kcgv-search-input') as HTMLInputElement | null;
    const run = (): void => {
      if (!input) return;
      this.searchDraft = input.value;
      void this.runSearch(input.value.trim());
    };
    if (input) {
      input.oninput = () => { this.searchDraft = input.value; };
      input.onkeydown = (e) => { if (e.key === 'Enter') run(); };
    }
    const searchBtn = this.content.querySelector('#kcgv-search-btn') as HTMLElement | null;
    if (searchBtn) searchBtn.onclick = run;
    this.content.querySelectorAll('[data-watch-idx]').forEach((el) => {
      (el as HTMLElement).onclick = () => {
        const v = this.searchResults[Number((el as HTMLElement).dataset.watchIdx)];
        if (v?.mmsi) this.addVesselWatch(v.mmsi, v.name);
      };
    });
    this.content.querySelectorAll('[data-unwatch-mmsi]').forEach((el) => {
      (el as HTMLElement).onclick = () => {
        getKcgWatchlist().remove('vessel', (el as HTMLElement).dataset.unwatchMmsi || '');
        this.render();
      };
    });
    this.content.querySelectorAll('[data-detail-idx]').forEach((el) => {
      (el as HTMLElement).onclick = () => {
        const v = this.searchResults[Number((el as HTMLElement).dataset.detailIdx)];
        if (v) void this.showVesselDetail(v);
      };
    });
  }

  private async runSearch(query: string): Promise<void> {
    if (query.length < 2) return;
    this.searchState = 'loading';
    this.render();
    try {
      const client = new MaritimeServiceClient(getRpcBaseUrl(), {
        fetch: (...args: Parameters<typeof fetch>) => globalThis.fetch(...args),
      });
      const resp = await client.searchVessels({ query });
      if (resp.quotaExhausted) {
        this.searchState = 'quota';
      } else if (!resp.dataAvailable) {
        this.searchState = 'error';
      } else {
        this.searchResults = resp.vessels;
        this.searchState = 'done';
      }
    } catch {
      this.searchState = 'error';
    }
    this.render();
  }

  private addVesselWatch(mmsi: string, name: string): boolean {
    const ok = getKcgWatchlist().add({ kind: 'vessel', id: mmsi, label: name || mmsi });
    showToast(ok ? `${name || mmsi} 추적을 시작했어요` : '이미 추적 중이거나 한도(10척)를 넘었어요');
    getKcgWatchlist().requestNotifyPermission();
    this.render();
    return ok;
  }

  /** 검색 결과 상세 — 최근 위치·목적지·ETA (조회 한도 절약을 위해 클릭 시에만). */
  private async showVesselDetail(v: VesselRegistryEntry): Promise<void> {
    if (!v.mmsi) {
      showKcgModal(v.name || '선박 상세', safeHtml`<div class="kcgv-hint">이 선박은 MMSI가 없어 실시간 추적이 어려워요.</div>`);
      return;
    }
    showKcgModal(`${v.name || v.mmsi} — 상세`, safeHtml`<div class="kcgv-hint">최근 항적을 불러오고 있어요…</div>`);
    try {
      const client = new MaritimeServiceClient(getRpcBaseUrl(), {
        fetch: (...args: Parameters<typeof fetch>) => globalThis.fetch(...args),
      });
      const resp = await client.getVesselTrack({ mmsis: v.mmsi, includeEta: true });
      const track = resp.tracks[0];
      const last = track?.points[track.points.length - 1];
      const watched = getKcgWatchlist().isWatched('vessel', v.mmsi);
      const body = safeHtml`
        <div class="kcgv-wrap" style="font-size:12.5px;">
          <div><strong>${flagEmoji(v.flag || 'XX')} ${v.name || '(선명 미상)'}</strong> · ${v.vesselType || '종류 미상'} · MMSI ${v.mmsi}${v.imo ? ` · IMO ${v.imo}` : ''}</div>
          ${last
            ? safeHtml`<div>최근 위치: ${last.latitude.toFixed(3)}, ${last.longitude.toFixed(3)} (${agoKo(last.observedAt)})${last.sogKnots >= 0 ? ` · ${last.sogKnots.toFixed(1)}kn` : ''}</div>`
            : safeHtml`<div class="kcgv-hint">${resp.quotaExhausted ? '오늘 추적 조회 한도를 모두 썼어요.' : '최근 위치 신호가 없어요.'}</div>`}
          ${track?.destination
            ? safeHtml`<div>신고 목적지: <strong>${track.destination}</strong>${track.etaAt ? ` · 도착 예정 ${new Date(track.etaAt).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', hour12: false })}` : ''}</div>`
            : safeHtml``}
          <div style="margin-top:6px;">
            ${watched
              ? safeHtml`<span class="kcgv-badge kcgv-badge-ok">추적 중이에요</span>`
              : safeHtml`<button class="kcgv-btn" id="kcgv-detail-watch">이 선박 추적하기</button>`}
          </div>
        </div>`;
      showKcgModal(`${v.name || v.mmsi} — 상세`, body);
      const detailBtn = document.getElementById('kcgv-detail-watch');
      if (detailBtn) detailBtn.onclick = () => {
        this.addVesselWatch(v.mmsi, v.name);
        showKcgModal(`${v.name || v.mmsi} — 상세`, safeHtml`<div class="kcgv-hint">추적을 시작했어요. 관심 탭에서 확인할 수 있어요.</div>`);
      };
    } catch {
      showKcgModal(`${v.name || v.mmsi} — 상세`, safeHtml`<div class="kcgv-hint">상세 정보를 불러오지 못했어요.</div>`);
    }
  }

  // ── 관심 탭 ─────────────────────────────────────────────────────────────
  private renderWatchTab(): SafeHtml {
    const watch = getKcgWatchlist();
    const statuses = watch.getStatuses();
    const vessels = statuses.filter((s) => s.item.kind === 'vessel');
    const aircraft = statuses.filter((s) => s.item.kind === 'aircraft');
    const alerts = watch.getAlerts().slice(0, 5);

    const alertBlock: SafeHtml = alerts.length
      ? safeHtml`
        <div class="kcgv-sec-title">최근 알림 <button class="kcgv-btn kcgv-btn-sm" id="kcgv-clear-alerts" style="float:right;">모두 지우기</button></div>
        ${joinSafeHtml(alerts.map((a) => safeHtml`
          <div class="kcgv-alert">
            <strong>${a.itemLabel}</strong> — ${a.headline}
            <div class="kcgv-alert-time">${agoKo(a.ts)} · ${a.detail}</div>
          </div>`))}`
      : safeHtml``;

    const rowFor = (s: WatchStatus): SafeHtml => {
      const worst = s.anomalies.reduce<'ok' | 'watch' | 'warning' | 'critical'>((acc, a) =>
        (a.severity === 'critical' || acc === 'critical') ? 'critical'
          : (a.severity === 'warning' || acc === 'warning') ? 'warning' : 'watch', 'ok');
      const badge = s.anomalies.length
        ? safeHtml`<span class="kcgv-badge kcgv-badge-${worst}">${s.anomalies[0]!.headline}${s.anomalies.length > 1 ? ` 외 ${String(s.anomalies.length - 1)}건` : ''}</span>`
        : safeHtml`<span class="kcgv-badge kcgv-badge-ok">정상</span>`;
      const idLabel = s.item.kind === 'vessel' ? `MMSI ${s.item.id}` : (s.item.byCallsign ? `콜사인 ${s.item.id.toUpperCase()}` : `HEX ${s.item.id.toUpperCase()}`);
      return safeHtml`
        <div class="kcgv-item">
          <div class="kcgv-item-head">
            <span class="kcgv-item-name">${s.item.kind === 'vessel' ? '🚢' : '✈️'} ${s.item.label || s.item.id}${badge}</span>
            <span class="kcgv-item-actions">
              ${s.trail.length ? safeHtml`<button class="kcgv-btn kcgv-btn-sm" data-focus="${s.item.kind}:${s.item.id}">지도</button>` : safeHtml``}
              <button class="kcgv-btn kcgv-btn-sm kcgv-btn-danger" data-remove="${s.item.kind}:${s.item.id}">해제</button>
            </span>
          </div>
          <div class="kcgv-item-meta">${idLabel} · 마지막 신호 ${agoKo(s.lastSeenAt)} · 항적 ${String(s.trail.length)}점</div>
        </div>`;
    };

    return safeHtml`
      <div class="kcgv-wrap">
        ${alertBlock}
        <div class="kcgv-sec-title">관심 선박 (${String(vessels.length)}/10)</div>
        ${vessels.length ? joinSafeHtml(vessels.map(rowFor)) : safeHtml`<div class="kcgv-hint">검색 탭에서 선박을 찾아 「추적」을 누르면 여기에 나타나요.</div>`}
        <div class="kcgv-sec-title">관심 항공기 (${String(aircraft.length)}/10)</div>
        ${aircraft.length ? joinSafeHtml(aircraft.map(rowFor)) : safeHtml``}
        <div class="kcgv-form">
          <input class="kcgv-input" id="kcgv-aircraft-input" type="text" placeholder="콜사인(예: KAL123) 또는 HEX(예: 71c07c)" value="${this.aircraftDraft}" />
          <button class="kcgv-btn" id="kcgv-aircraft-btn">항공기 추가</button>
        </div>
        <div class="kcgv-hint">선박 위치는 몇 시간 간격으로, 항공기는 2분 간격으로 갱신돼요. 신호 소실·장기 정지·급변침·민감 해역 진입·비상 스쿼크를 감지하면 알려드려요.${watch.quotaExhausted ? ' (오늘 선박 추적 조회 한도에 도달해 갱신이 느려질 수 있어요)' : ''}</div>
      </div>`;
  }

  private bindWatchTab(): void {
    const watch = getKcgWatchlist();
    const clearBtn = this.content.querySelector('#kcgv-clear-alerts') as HTMLElement | null;
    if (clearBtn) clearBtn.onclick = () => {
      watch.clearAlerts();
      this.render();
    };
    this.content.querySelectorAll('[data-remove]').forEach((el) => {
      (el as HTMLElement).onclick = () => {
        const [kind, ...rest] = ((el as HTMLElement).dataset.remove || '').split(':');
        watch.remove(kind as 'vessel' | 'aircraft', rest.join(':'));
        this.render();
      };
    });
    this.content.querySelectorAll('[data-focus]').forEach((el) => {
      (el as HTMLElement).onclick = () => {
        const [kind, ...rest] = ((el as HTMLElement).dataset.focus || '').split(':');
        watch.focusOnMap(kind as 'vessel' | 'aircraft', rest.join(':'));
        showToast('지도를 해당 위치로 옮겼어요');
      };
    });
    const input = this.content.querySelector('#kcgv-aircraft-input') as HTMLInputElement | null;
    if (input) input.oninput = () => { this.aircraftDraft = input.value; };
    const addAircraft = (): void => {
      const raw = (input?.value || '').trim();
      if (!raw) return;
      // 6자 hex여도 「영문 2~3자 + 숫자」 꼴(예: ACA854)은 항공사 콜사인이다.
      const isHex = /^[0-9a-fA-F]{6}$/.test(raw) && !/^[A-Za-z]{2,3}\d+$/.test(raw);
      const id = isHex ? raw.toLowerCase() : raw.toUpperCase();
      const ok = watch.add({ kind: 'aircraft', id, byCallsign: !isHex, label: isHex ? '' : id });
      showToast(ok ? `${id} 추적을 시작했어요` : '이미 추적 중이거나 한도(10대)를 넘었어요');
      if (ok) {
        this.aircraftDraft = '';
        watch.requestNotifyPermission();
      }
      this.render();
    };
    if (input) input.onkeydown = (e) => { if (e.key === 'Enter') addAircraft(); };
    const addBtn = this.content.querySelector('#kcgv-aircraft-btn') as HTMLElement | null;
    if (addBtn) addBtn.onclick = addAircraft;
  }

  // ── 입출항 탭 ───────────────────────────────────────────────────────────
  private renderPortsTab(): SafeHtml {
    const chips = joinSafeHtml(PORTS.map((p) => safeHtml`
      <button class="kcgv-tab ${this.activePort === p.unlocode ? 'kcgv-tab-on' : ''}" data-port="${p.unlocode}">${p.nameKo}</button>`));
    const slot = this.portEvents.get(this.activePort);
    let body: SafeHtml;
    if (this.portState === 'loading' && !slot) {
      body = safeHtml`<div class="kcgv-hint">입출항 기록을 불러오고 있어요…</div>`;
    } else if (this.portState === 'error' && !slot) {
      body = safeHtml`<div class="kcgv-hint">입출항 기록을 불러오지 못했어요. 잠시 후 다시 열어 주세요.</div>`;
    } else if (!slot || slot.events.length === 0) {
      body = safeHtml`<div class="kcgv-hint">최근 24시간 입출항 기록이 없어요.</div>`;
    } else {
      body = joinSafeHtml(slot.events.slice(0, 30).map((e) => safeHtml`
        <div class="kcgv-evt kcgv-evt-focus" data-evt-mmsi="${e.vesselMmsi || ''}" title="지도에서 보기 (MMSI ${e.vesselMmsi || '—'})">
          <span class="${e.eventType === 'arrival' ? 'kcgv-evt-arr' : 'kcgv-evt-dep'}">${e.eventType === 'arrival' ? '입항' : '출항'}</span>
          <span class="kcgv-evt-name">${e.vesselName ? e.vesselName.toUpperCase() : '(선명 미상)'}</span>
          <span class="kcgv-evt-time">${agoKo(e.occurredAt)}</span>
        </div>`));
    }
    return safeHtml`
      <div class="kcgv-wrap">
        <div class="kcgv-port-chips">${chips}</div>
        ${body}
        <div class="kcgv-hint">${slot ? `기준 시각 ${agoKo(slot.fetchedAt)} · ` : ''}입출항 기록은 8시간 주기로 갱신돼요.</div>
      </div>`;
  }

  private bindPortsTab(): void {
    this.content.querySelectorAll('[data-port]').forEach((el) => {
      (el as HTMLElement).onclick = () => {
        const code = (el as HTMLElement).dataset.port || 'KRPUS';
        this.activePort = code;
        if (!this.portEvents.has(code)) void this.loadPortEvents(code);
        this.render();
      };
    });
    // 입출항 기록 클릭 → 지도 포커스(사장님 지시 07-23). 입출항 이벤트는
    // 좌표가 없어 ①현재 선박 스냅샷에서 MMSI 로 실시간 위치를 찾고
    // ②없으면 해당 항구 좌표로 이동한다.
    this.content.querySelectorAll('.kcgv-evt-focus').forEach((el) => {
      (el as HTMLElement).onclick = () => {
        const mmsi = (el as HTMLElement).dataset.evtMmsi || '';
        let lat: number | null = null;
        let lon: number | null = null;
        if (mmsi) {
          for (const z of this.zonesRaw) {
            const hit = z.tankers.find((t) => t.mmsi === mmsi);
            if (hit) { lat = hit.lat; lon = hit.lon; break; }
          }
        }
        if (lat == null || lon == null) {
          const port = PORTS.find((p) => p.unlocode === this.activePort);
          if (port) { lat = port.lat; lon = port.lon; }
        }
        if (lat == null || lon == null) return;
        try {
          window.dispatchEvent(new CustomEvent('kcg:map-focus', { detail: { lat, lon, zoom: 10 } }));
          showToast(mmsi ? '지도를 해당 선박 위치로 옮겼어요' : '지도를 해당 항만으로 옮겼어요');
        } catch { /* SSR/테스트 */ }
      };
    });
  }

  private async loadPortEvents(unlocode: string): Promise<void> {
    this.portState = 'loading';
    this.render();
    try {
      const client = new MaritimeServiceClient(getRpcBaseUrl(), {
        fetch: (...args: Parameters<typeof fetch>) => globalThis.fetch(...args),
      });
      const resp = await client.listPortEvents({ unlocode });
      if (resp.dataAvailable) {
        this.portEvents.set(unlocode, { events: resp.events, fetchedAt: resp.fetchedAt || Date.now() });
        this.portState = 'idle';
      } else {
        this.portState = 'error';
      }
    } catch {
      this.portState = 'error';
    }
    if (this.activeTab === 'ports') this.render();
  }

  // ── 기존 상세 모달·확대 보기 ────────────────────────────────────────────
  /** 구역 클릭 → 해당 해역 전체 선박 상세 모달. */
  private showZoneDetail(zoneNameKo: string): void {
    const zone = this.zonesRaw.find((z) => (KOREA_ZONES.find((k) => k.id === z.chokepoint.id)?.nameKo ?? z.chokepoint.displayName) === zoneNameKo);
    if (!zone) return;
    showKcgModal(`${zoneNameKo} — 선박 ${zone.tankers.length}척`, this.vesselTableHtml([zone]));
    // 모달은 문자열 렌더라 버튼을 열린 뒤에 바인딩한다.
    const overlay = document.querySelector('.kcg-modal-overlay');
    if (overlay) this.bindTableWatchButtons(overlay);
  }

  /** 해역별 그룹 선박 테이블 (모달·확대 공용). */
  private vesselTableHtml(zones: ChokepointTankers[]): SafeHtml {
    const watch = getKcgWatchlist();
    const sections: SafeHtml[] = [];
    for (const z of zones) {
      const meta = KOREA_ZONES.find((k) => k.id === z.chokepoint.id);
      const zoneName = meta?.nameKo ?? z.chokepoint.displayName;
      const sorted = [...z.tankers].sort((a, b) => (b.speed ?? 0) - (a.speed ?? 0));
      const rows = sorted.map((v) => {
        const flag = flagFromMmsi(v.mmsi);
        const spd = Number(v.speed);
        const cog = Number(v.course);
        const hot = flag.iso === 'KP' || flag.iso === 'XX';
        const watched = watch.isWatched('vessel', v.mmsi);
        return safeHtml`
          <tr class="${hot ? 'kcgv-row-hot' : ''}" data-row-mmsi="${v.mmsi}">
            <td class="kcgv-td-name kcgv-td-focus" data-focus-lat="${String(v.lat)}" data-focus-lon="${String(v.lon)}" title="지도에서 보기">${v.name || '(선명 미상)'}</td>
            <td>${flagEmoji(flag.iso)} ${flag.nameKo}</td>
            <td>${shipTypeKo(v.shipType)}</td>
            <td>${Number.isFinite(spd) ? `${spd.toFixed(1)} kn` : '—'}</td>
            <td>${Number.isFinite(cog) && cog < 360 ? `${Math.round(cog)}°` : '—'}</td>
            <td class="kcgv-td-mmsi">${v.mmsi}</td>
            <td class="kcgv-td-watch">${watched
              ? safeHtml`<span class="kcgv-badge kcgv-badge-ok">추적 중</span>`
              : safeHtml`<button class="kcgv-btn kcgv-btn-sm" data-table-watch="${v.mmsi}" data-table-name="${v.name || ''}">추적</button>`}</td>
          </tr>`;
      });
      sections.push(safeHtml`
        <div class="kcgv-sec">
          <div class="kcgv-sec-head">${zoneName} <span class="kcgv-sec-count">${String(z.tankers.length)}척</span></div>
          <table class="kcgv-table">
            <thead><tr><th>선명</th><th>국적</th><th>선종</th><th>속력</th><th>침로</th><th>MMSI</th><th></th></tr></thead>
            <tbody>${joinSafeHtml(rows)}</tbody>
          </table>
        </div>`);
    }
    return safeHtml`
      <div class="kcgv-full">${joinSafeHtml(sections)}</div>
      <style>
        .kcgv-full { font-size: 12.5px; }
        .kcgv-sec { margin-bottom: 16px; }
        .kcgv-sec-head { font-weight: 700; color: #7fd4ff; font-size: 13px; padding: 6px 0; border-bottom: 1px solid rgba(0,209,255,0.25); margin-bottom: 4px; }
        .kcgv-sec-count { color: var(--text-dim,#9ab); font-weight: 600; font-size: 11px; margin-left: 6px; }
        .kcgv-table { width: 100%; border-collapse: collapse; }
        .kcgv-table th { text-align: left; color: var(--text-dim,#8aa); font-size: 11px; padding: 5px 8px; border-bottom: 1px solid rgba(255,255,255,0.12); }
        .kcgv-table td { padding: 5px 8px; border-bottom: 1px solid rgba(255,255,255,0.05); white-space: nowrap; }
        .kcgv-td-name { font-weight: 600; color: var(--text,#e8f2fa); }
        .kcgv-td-focus { cursor: pointer; }
        .kcgv-td-focus:hover { color: #7fd4ff; text-decoration: underline; }
        .kcgv-td-mmsi { font-family: monospace; color: var(--text-dim,#9ab); }
        .kcgv-row-hot td { background: rgba(231,60,60,0.10); }
      </style>`;
  }

  /** 확대 보기: 해역별 섹션으로 전 선박 표시. */
  private renderFullTable(): void {
    this.setSafeContent(safeHtml`
      <div class="kcgv-total" style="color:var(--text-dim,#999);font-size:11px;padding:4px 0 8px;">전체 포착 <strong>${String(this.total)}척</strong> · 해역별 · 속력순 · 60초 갱신 (ESC로 닫기)</div>
      ${this.vesselTableHtml(this.zonesRaw)}
    `, () => this.bindTableWatchButtons(this.content));
  }

  /** 상세 테이블(모달·확대)의 「선명 클릭=포커스」 + 「추적」 버튼 바인딩. */
  private bindTableWatchButtons(root: ParentNode): void {
    // 선명 클릭 → 지도를 해당 선박 위치로 이동(사장님 지시 07-23).
    root.querySelectorAll('.kcgv-td-focus').forEach((el) => {
      (el as HTMLElement).onclick = () => {
        const lat = Number((el as HTMLElement).dataset.focusLat);
        const lon = Number((el as HTMLElement).dataset.focusLon);
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;
        const mmsi = (el as HTMLElement).closest('[data-row-mmsi]')?.getAttribute('data-row-mmsi') || '';
        try {
          // 사장님 지시 07-23: 선택 즉시 모달/확대뷰 닫고 해당 선박 하이라이트.
          closeKcgModal();
          if (this.element.classList.contains('panel-maximized')) this.toggleMaximize();
          window.dispatchEvent(new CustomEvent('kcg:map-focus', { detail: { lat, lon, zoom: 10 } }));
          if (mmsi) window.dispatchEvent(new CustomEvent('kcg:highlight-vessel', { detail: { mmsi, lat, lon } }));
          showToast('지도에서 해당 선박을 표시했어요');
        } catch { /* SSR/테스트 */ }
      };
    });
    root.querySelectorAll('[data-table-watch]').forEach((el) => {
      (el as HTMLElement).onclick = () => {
        const btn = el as HTMLElement;
        const mmsi = btn.dataset.tableWatch || '';
        const name = btn.dataset.tableName || '';
        if (!mmsi) return;
        const ok = this.addVesselWatch(mmsi, name);
        // 사장님 지시: 토스트뿐 아니라 버튼이 즉시 '추적 중'으로 바뀌게.
        if (ok) {
          const cell = btn.closest('.kcgv-td-watch') ?? btn.parentElement;
          if (cell) {
            cell.textContent = '';
            const badge = document.createElement('span');
            badge.className = 'kcgv-badge kcgv-badge-ok';
            badge.textContent = '추적 중';
            cell.appendChild(badge);
          }
        }
      };
    });
  }
}
