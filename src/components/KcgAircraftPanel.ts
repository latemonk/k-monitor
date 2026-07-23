/**
 * KCG fork(07-23 사장님 지시) — 공역 항공기 현황 패널.
 *
 * 해역 선박 현황(KcgVesselsPanel)의 항공 버전: 한반도 권역 상공의 실시간
 * 항공기를 목록으로 채우고, 편명 클릭 → 지도 포커스 + 선택(궤적) 연동.
 * adsb.lol/airplanes.live 커뮤니티 ADS-B(무키)를 track-aircraft RPC 로 받는다.
 * 10초 주기 갱신(서버 Redis TTL 10s 동조).
 */
import { Panel } from './Panel';
import { safeHtml, joinSafeHtml, type SafeHtml } from '@/utils/sanitize';
import { fetchAircraftPositions, type PositionSample } from '@/services/aviation';
import { showToast } from '@/utils/toast';

// 한반도 권역 bbox (제주~휴전선, 서해~동해). track-aircraft 는 중심점+반경으로
// 변환해 커뮤니티 ADS-B point 조회를 돈다.
const KOREA_BBOX = { swLat: 33.0, swLon: 124.0, neLat: 39.2, neLon: 131.5 };
const REFRESH_MS = 10_000;

// 스쿼크 비상 코드(하이재킹/통신두절/일반비상).
const EMERGENCY_SQUAWKS = new Set(['7500', '7600', '7700']);

function altBand(ft: number, onGround: boolean): string {
  if (onGround) return '지상';
  if (ft <= 0) return '—';
  if (ft >= 30000) return '순항(고고도)';
  if (ft >= 18000) return '중고도';
  if (ft >= 5000) return '저고도';
  return '접근/이륙';
}

export class KcgAircraftPanel extends Panel {
  private positions: PositionSample[] = [];
  private loaded = false;
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    super({
      id: 'kcg-aircraft',
      title: '공역 항공기 현황',
      infoTooltip: '한반도 권역 상공의 실시간 항공기예요. 편명을 누르면 지도가 해당 기체로 이동하고 궤적이 그려져요. 10초마다 갱신되고, 커뮤니티 ADS-B(adsb.lol) 무료 데이터를 써요.',
    });
    void this.fetchData();
    this.timer = setInterval(() => void this.fetchData(), REFRESH_MS);
    this.element.addEventListener('wm:panel-maximize', () => this.render());
  }

  public destroy(): void {
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
    super.destroy();
  }

  public async fetchData(): Promise<void> {
    try {
      const positions = await fetchAircraftPositions(KOREA_BBOX);
      this.positions = positions;
      this.loaded = true;
      this.render();
    } catch {
      if (!this.loaded) this.showError('항공기 데이터를 불러오지 못했어요', () => void this.fetchData());
    }
  }

  private render(): void {
    const airborne = this.positions.filter((p) => !p.onGround);
    const ground = this.positions.filter((p) => p.onGround);
    const emergencies = this.positions.filter((p) => EMERGENCY_SQUAWKS.has(p.squawk));
    // 고도 높은 순 정렬(순항기 먼저) — 관제 습관에 맞춤.
    const sorted = [...this.positions].sort((a, b) => {
      if (a.onGround !== b.onGround) return a.onGround ? 1 : -1;
      return (b.altitudeFt ?? 0) - (a.altitudeFt ?? 0);
    });

    const rows = sorted.slice(0, 200).map((p) => {
      const cs = (p.callsign || '').trim() || p.icao24.toUpperCase();
      const emerg = EMERGENCY_SQUAWKS.has(p.squawk);
      const vr = p.verticalRateMps ?? 0;
      const vrFpm = Math.round(vr * 196.85);
      const arrow = vrFpm > 100 ? ' ▲' : vrFpm < -100 ? ' ▼' : '';
      return safeHtml`
        <tr class="${emerg ? 'kca-row-emerg' : ''}" data-focus-lat="${String(p.lat)}" data-focus-lon="${String(p.lon)}" data-icao="${p.icao24}">
          <td class="kca-td-name kca-td-focus" title="지도에서 보기 · 궤적">${cs}</td>
          <td>${p.onGround ? '지상' : `${(p.altitudeFt ?? 0).toLocaleString()} ft${arrow}`}</td>
          <td>${Math.round(p.groundSpeedKts ?? 0)} kt</td>
          <td>${Math.round(p.trackDeg ?? 0)}°</td>
          <td class="${emerg ? 'kca-sq-emerg' : ''}">${p.squawk || '—'}</td>
          <td class="kca-td-alt">${altBand(p.altitudeFt ?? 0, p.onGround)}</td>
        </tr>`;
    });

    const stat = (label: string, value: number, cls = ''): SafeHtml => safeHtml`
      <div class="kca-stat ${cls}"><div class="kca-stat-v">${String(value)}</div><div class="kca-stat-l">${label}</div></div>`;

    this.setSafeContent(safeHtml`
      <div class="kca-total">권역 <strong>${String(this.positions.length)}대</strong> 포착 · 10초 갱신 · 편명 클릭=지도 포커스</div>
      <div class="kca-stats">
        ${stat('공중', airborne.length)}
        ${stat('지상', ground.length)}
        ${stat('비상 스쿼크', emergencies.length, emergencies.length ? 'kca-stat-emerg' : '')}
      </div>
      ${this.positions.length === 0
        ? safeHtml`<div class="kca-empty">${this.loaded ? '현재 권역에 포착된 항공기가 없어요.' : '항공기 위치를 불러오는 중…'}</div>`
        : safeHtml`
        <table class="kca-table">
          <thead><tr><th>편명</th><th>고도</th><th>속도</th><th>침로</th><th>스쿼크</th><th>단계</th></tr></thead>
          <tbody>${joinSafeHtml(rows)}</tbody>
        </table>`}
      <style>
        .kca-total { color: var(--text-dim,#9ab); font-size: 11px; padding: 2px 0 7px; }
        .kca-stats { display: flex; gap: 8px; margin-bottom: 8px; }
        .kca-stat { flex: 1; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 6px; padding: 5px 8px; text-align: center; }
        .kca-stat-v { font-size: 16px; font-weight: 700; color: #bfeaff; }
        .kca-stat-l { font-size: 10px; color: var(--text-dim,#8aa); margin-top: 1px; }
        .kca-stat-emerg .kca-stat-v { color: #ff5050; }
        .kca-table { width: 100%; border-collapse: collapse; font-size: 12px; }
        .kca-table th { text-align: left; color: var(--text-dim,#8aa); font-size: 11px; padding: 4px 7px; border-bottom: 1px solid rgba(255,255,255,0.12); position: sticky; top: 0; background: var(--panel-bg,#0d1420); }
        .kca-table td { padding: 4px 7px; border-bottom: 1px solid rgba(255,255,255,0.05); white-space: nowrap; font-variant-numeric: tabular-nums; }
        .kca-td-name { font-weight: 600; color: var(--text,#e8f2fa); }
        .kca-td-focus { cursor: pointer; }
        .kca-td-focus:hover { color: #7fd4ff; text-decoration: underline; }
        .kca-td-alt { color: var(--text-dim,#9ab); }
        .kca-row-emerg td { background: rgba(255,80,80,0.12); }
        .kca-sq-emerg { color: #ff5050; font-weight: 700; }
        .kca-empty { color: var(--text-dim,#889); font-size: 12px; padding: 12px 4px; }
      </style>
    `, () => this.bindRows());
  }

  private bindRows(): void {
    this.content.querySelectorAll('tr[data-icao]').forEach((el) => {
      const focusCell = el.querySelector('.kca-td-focus') as HTMLElement | null;
      if (!focusCell) return;
      focusCell.onclick = () => {
        const lat = Number((el as HTMLElement).dataset.focusLat);
        const lon = Number((el as HTMLElement).dataset.focusLon);
        const icao = (el as HTMLElement).dataset.icao || '';
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;
        try {
          // 지도 이동 + 항공기 선택(궤적·상세 카드) — DeckGLMap 의 highlight
          // 리스너가 icao24 로 하이라이트하고 focus 리스너가 화면을 옮긴다.
          window.dispatchEvent(new CustomEvent('kcg:highlight-aircraft', { detail: { icao24: icao, lat, lon } }));
          window.dispatchEvent(new CustomEvent('kcg:map-focus', { detail: { lat, lon, zoom: 9 } }));
          window.dispatchEvent(new CustomEvent('kcg:select-aircraft', { detail: { icao24: icao, lat, lon } }));
          showToast('지도를 해당 항공기로 옮겼어요');
        } catch { /* SSR/테스트 */ }
      };
    });
  }
}
