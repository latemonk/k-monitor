/**
 * KCG fork(07-24 사장님 지시) — 공항 기상(METAR) 패널.
 *
 * 공중 감시 프리셋용: 국내 주요 공항의 최신 METAR를 비행 카테고리
 * (VFR/MVFR/IFR/LIFR)와 함께 보여준다. 공항명을 누르면 지도가 그 공항으로
 * 이동한다. 데이터는 서버 프록시 /api/kcg-airwx 가 5분 캐시로 공급하고,
 * 기상청 API허브 키(KMA_APIHUB_KEY)가 주입되면 기상청 항공기상으로 전환된다
 * (그 전까지는 무키 공개 METAR·NOAA).
 */
import { Panel } from './Panel';
import { safeHtml, joinSafeHtml } from '@/utils/sanitize';
import { toApiUrl } from '@/services/runtime';
import { showToast } from '@/utils/toast';

interface AirwxMetar {
  icao: string;
  obsTime: string | null;
  wdirDeg: number | null;
  wspdKt: number | null;
  gustKt: number | null;
  visM: number | null;
  ceilFt: number | null;
  clouds: string;
  wx: string;
  tempC: number | null;
  dewC: number | null;
  qnhHpa: number | null;
  fltCat: string;
  raw: string;
}

interface AirwxAirport {
  icao: string;
  nameKo: string;
  lat: number;
  lon: number;
  metar: AirwxMetar | null;
}

interface AirwxResponse {
  source: string;
  fetchedAt: number;
  airports: AirwxAirport[];
}

const REFRESH_MS = 5 * 60_000;

/** 비행 카테고리 → 색·한글 설명 (항공 표준 색상). */
const CAT_META: Record<string, { color: string; ko: string }> = {
  VFR: { color: '#2ecc71', ko: '시계비행 가능' },
  MVFR: { color: '#3498db', ko: '제한적 시계비행' },
  IFR: { color: '#e74c3c', ko: '계기비행' },
  LIFR: { color: '#c064e0', ko: '저시정 계기비행' },
};

/** METAR 일기 현상 축약 코드 → 한글 (자주 나오는 것만). */
const WX_KO: Array<[RegExp, string]> = [
  [/TS/, '뇌우'],
  [/\+RA/, '강한 비'],
  [/-RA/, '약한 비'],
  [/RA/, '비'],
  [/\+SN/, '강한 눈'],
  [/-SN/, '약한 눈'],
  [/SN/, '눈'],
  [/FG/, '안개'],
  [/BR/, '박무'],
  [/HZ/, '연무'],
  [/SHRA/, '소나기'],
  [/GR/, '우박'],
  [/DZ/, '이슬비'],
];

function wxKo(wx: string): string {
  if (!wx) return '';
  for (const [re, ko] of WX_KO) {
    if (re.test(wx)) return ko;
  }
  return wx;
}

function windText(m: AirwxMetar): string {
  if (m.wspdKt == null) return '—';
  if (m.wspdKt === 0) return '무풍';
  const dir = m.wdirDeg != null ? `${String(m.wdirDeg).padStart(3, '0')}°` : '풍향변동';
  return `${dir} ${Math.round(m.wspdKt)}kt${m.gustKt ? ` (돌풍 ${Math.round(m.gustKt)}kt)` : ''}`;
}

function visText(visM: number | null): string {
  if (visM == null) return '—';
  if (visM >= 9000) return '10km+';
  return visM >= 1000 ? `${(visM / 1000).toFixed(1)}km` : `${visM}m`;
}

export class KcgAirWeatherPanel extends Panel {
  private data: AirwxResponse | null = null;
  private loaded = false;
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    super({
      id: 'kcg-airwx',
      title: '공항 기상(METAR)',
      infoTooltip: '국내 주요 공항의 최신 항공 기상 관측(METAR)이에요. 색 배지는 비행 카테고리(초록 VFR=좋음 → 보라 LIFR=저시정)를 뜻하고, 공항명을 누르면 지도가 그 공항으로 이동해요. 5분마다 갱신돼요.',
    });
    void this.fetchData();
    this.timer = setInterval(() => void this.fetchData(), REFRESH_MS);
  }

  public destroy(): void {
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
    super.destroy();
  }

  public async fetchData(): Promise<void> {
    try {
      const resp = await fetch(toApiUrl('/api/kcg-airwx?type=metar'), { signal: AbortSignal.timeout(15_000) });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      this.data = (await resp.json()) as AirwxResponse;
      this.loaded = true;
      this.render();
    } catch {
      if (!this.loaded) this.showError('공항 기상을 불러오지 못했어요', () => void this.fetchData());
    }
  }

  private render(): void {
    const airports = this.data?.airports ?? [];
    const withMetar = airports.filter((a) => a.metar);
    const worst = ['LIFR', 'IFR', 'MVFR'].find((cat) => withMetar.some((a) => a.metar!.fltCat === cat));

    const rows = airports.map((a) => {
      const m = a.metar;
      if (!m) {
        return safeHtml`
          <tr data-icao="${a.icao}" data-lat="${String(a.lat)}" data-lon="${String(a.lon)}">
            <td class="kaw-td-name kaw-td-focus" title="지도에서 보기">${a.nameKo} <span class="kaw-icao">${a.icao}</span></td>
            <td colspan="5" class="kaw-none">관측 없음</td>
          </tr>`;
      }
      const cat = CAT_META[m.fltCat] ?? CAT_META['VFR']!;
      return safeHtml`
        <tr data-icao="${a.icao}" data-lat="${String(a.lat)}" data-lon="${String(a.lon)}">
          <td class="kaw-td-name kaw-td-focus" title="지도에서 보기 · ${m.raw}">${a.nameKo} <span class="kaw-icao">${a.icao}</span></td>
          <td><span class="kaw-cat" style="background:${cat.color}" title="${cat.ko}">${m.fltCat}</span></td>
          <td>${windText(m)}</td>
          <td>${visText(m.visM)}${m.wx ? ` · ${wxKo(m.wx)}` : ''}</td>
          <td>${m.ceilFt != null ? `${m.ceilFt.toLocaleString()}ft` : '—'}</td>
          <td>${m.tempC != null ? `${Math.round(m.tempC)}°` : '—'}${m.qnhHpa != null ? ` · ${String(m.qnhHpa)}` : ''}</td>
        </tr>`;
    });

    this.setSafeContent(safeHtml`
      <div class="kaw-head">
        ${worst
          ? safeHtml`<span class="kaw-worst" style="background:${CAT_META[worst]!.color}">일부 공항 ${worst} — ${CAT_META[worst]!.ko}</span>`
          : safeHtml`<span class="kaw-ok">전 공항 시계비행(VFR) 상태예요</span>`}
        <span class="kaw-src">${this.data?.source === 'kma' ? '기상청 항공기상' : '공개 METAR'} · 5분 갱신</span>
      </div>
      ${airports.length === 0
        ? safeHtml`<div class="kaw-empty">${this.loaded ? '표시할 공항 기상이 없어요.' : '공항 기상을 불러오는 중…'}</div>`
        : safeHtml`
        <table class="kaw-table">
          <thead><tr><th>공항</th><th>상태</th><th>바람</th><th>시정·현상</th><th>운고</th><th>기온·QNH</th></tr></thead>
          <tbody>${joinSafeHtml(rows)}</tbody>
        </table>`}
      <style>
        .kaw-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 2px 0 8px; flex-wrap: wrap; }
        .kaw-worst { color: #fff; border-radius: 4px; padding: 1px 8px; font-size: 11px; font-weight: 700; }
        .kaw-ok { color: #2ecc71; font-size: 11px; font-weight: 600; }
        .kaw-src { color: var(--text-dim,#8aa); font-size: 10px; }
        .kaw-table { width: 100%; border-collapse: collapse; font-size: 12px; }
        .kaw-table th { text-align: left; color: var(--text-dim,#8aa); font-size: 11px; padding: 4px 7px; border-bottom: 1px solid rgba(255,255,255,0.12); }
        .kaw-table td { padding: 4px 7px; border-bottom: 1px solid rgba(255,255,255,0.05); white-space: nowrap; font-variant-numeric: tabular-nums; }
        .kaw-td-name { font-weight: 600; color: var(--text,#e8f2fa); }
        .kaw-td-focus { cursor: pointer; }
        .kaw-td-focus:hover { color: #7fd4ff; text-decoration: underline; }
        .kaw-icao { color: var(--text-dim,#7a8fa0); font-size: 10px; font-weight: 400; }
        .kaw-cat { color: #fff; border-radius: 4px; padding: 0 6px; font-size: 10px; font-weight: 700; }
        .kaw-none { color: var(--text-dim,#889); }
        .kaw-empty { color: var(--text-dim,#889); font-size: 12px; padding: 12px 4px; }
      </style>
    `, () => this.bindRows());
  }

  private bindRows(): void {
    // Panel.setContentHtml DOM 유지+bind 재실행 → 바인딩은 on* 할당만.
    this.content.querySelectorAll('tr[data-icao]').forEach((el) => {
      const cell = el.querySelector('.kaw-td-focus') as HTMLElement | null;
      if (!cell) return;
      cell.onclick = () => {
        const lat = Number((el as HTMLElement).dataset.lat);
        const lon = Number((el as HTMLElement).dataset.lon);
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;
        try {
          window.dispatchEvent(new CustomEvent('kcg:map-focus', { detail: { lat, lon, zoom: 11 } }));
          showToast('지도를 해당 공항으로 옮겼어요');
        } catch { /* SSR/테스트 */ }
      };
    });
  }
}
