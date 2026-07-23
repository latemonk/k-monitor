/**
 * KCG fork(07-24 사장님 지시) — 공항 기상(METAR) 패널.
 *
 * 공중 감시 프리셋용. 국내 주요 공항의 최신 METAR(비행 카테고리 배지)와
 * 발효 중인 공항 특보(공항경보·SIGMET·AIRMET)를 보여주고, 공항별 상세
 * 모달에서 METAR/TAF 원문·저고도(1k~10k ft) 바람·분단위 활주로 실황
 * (RVR·최저운고·순간풍)까지 — 항공업계 종사자가 바로 쓸 수 있는 깊이로.
 *
 * 데이터: 서버 프록시 /api/kcg-airwx (기상청 API허브 항공기상, 07-24 사장님
 * 활용신청 완료 — METAR·TAF·특보·AMOS·WINTEM. 기상청 장애 시 METAR 만
 * 무키 공개 데이터(NOAA)로 폴백).
 */
import { Panel } from './Panel';
import { safeHtml, joinSafeHtml, type SafeHtml } from '@/utils/sanitize';
import { toApiUrl } from '@/services/runtime';
import { showToast } from '@/utils/toast';
import { showKcgModalNode } from '@/utils/kcg-modal';

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

interface AirwxHazard {
  kind: 'warning' | 'sigmet' | 'airmet';
  airport: string;
  icao: string;
  type?: string;
  from: string;
  to: string;
  msg: string;
}

interface AirwxHazards {
  available?: boolean;
  warnings: AirwxHazard[];
  sigmet: AirwxHazard[];
  airmet: AirwxHazard[];
}

interface AirwxAmosRow {
  icao: string;
  obsTime: string | null;
  visM: number | null;
  rvrM: number | null;
  ceilingM: number | null;
  tempC: number | null;
  qnhHpa: number | null;
  wd2mDeg: number | null;
  ws2mKt: number | null;
  ws2mMaxKt: number | null;
  wd10mDeg: number | null;
  ws10mKt: number | null;
  ws10mMaxKt: number | null;
}

interface AirwxLowWindLevel { label: string; wdDeg: number; wsKt: number; tempC: number }

const REFRESH_MS = 5 * 60_000;

/** 비행 카테고리 → 색·한글 설명 (항공 표준 색상). */
const CAT_META: Record<string, { color: string; ko: string }> = {
  VFR: { color: '#2ecc71', ko: '시계비행 가능' },
  MVFR: { color: '#3498db', ko: '제한적 시계비행' },
  IFR: { color: '#e74c3c', ko: '계기비행' },
  LIFR: { color: '#c064e0', ko: '저시정 계기비행' },
};

const HAZARD_META: Record<string, { color: string; ko: string }> = {
  warning: { color: '#e74c3c', ko: '공항경보' },
  sigmet: { color: '#e67e22', ko: 'SIGMET' },
  airmet: { color: '#f1c40f', ko: 'AIRMET' },
};

/** METAR 일기 현상 축약 코드 → 한글 (자주 나오는 것만). */
const WX_KO: Array<[RegExp, string]> = [
  [/TS/, '뇌우'],
  [/\+RA/, '강한 비'],
  [/-RA/, '약한 비'],
  [/SHRA/, '소나기'],
  [/RA/, '비'],
  [/\+SN/, '강한 눈'],
  [/-SN/, '약한 눈'],
  [/SN/, '눈'],
  [/FG/, '안개'],
  [/BR/, '박무'],
  [/HZ/, '연무'],
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

function amosTime(t: string | null): string {
  if (!t || t.length < 12) return '—';
  return `${t.slice(8, 10)}:${t.slice(10, 12)}`;
}

async function fetchAirwx<T>(qs: string): Promise<T | null> {
  try {
    const resp = await fetch(toApiUrl(`/api/kcg-airwx?${qs}`), { signal: AbortSignal.timeout(20_000) });
    if (!resp.ok) return null;
    return (await resp.json()) as T;
  } catch {
    return null;
  }
}

export class KcgAirWeatherPanel extends Panel {
  private data: AirwxResponse | null = null;
  private hazards: AirwxHazards | null = null;
  private hazardsFailed = false;
  private loaded = false;
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    super({
      id: 'kcg-airwx',
      title: '공항 기상(METAR)',
      infoTooltip: '국내 주요 공항의 최신 항공 기상 관측(METAR)과 발효 중인 공항 특보예요. 색 배지는 비행 카테고리(초록 VFR=좋음 → 보라 LIFR=저시정), 공항명 클릭=지도 이동, 상세=METAR·TAF 원문과 저고도 바람·활주로 실황까지 보여드려요. 5분마다 갱신돼요.',
    });
    void this.fetchData();
    this.timer = setInterval(() => void this.fetchData(), REFRESH_MS);
  }

  public destroy(): void {
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
    super.destroy();
  }

  public async fetchData(): Promise<void> {
    const [metar, hazards] = await Promise.all([
      fetchAirwx<AirwxResponse>('type=metar'),
      fetchAirwx<AirwxHazards & { available?: boolean }>('type=hazards'),
    ]);
    if (metar) {
      this.data = metar;
      this.loaded = true;
    }
    this.hazardsFailed = !hazards;
    if (hazards && hazards.available !== false) this.hazards = hazards;
    if (this.loaded) this.render();
    else this.showError('공항 기상을 불러오지 못했어요', () => void this.fetchData());
  }

  private activeHazards(): AirwxHazard[] {
    if (!this.hazards) return [];
    return [...(this.hazards.warnings || []), ...(this.hazards.sigmet || []), ...(this.hazards.airmet || [])];
  }

  private render(): void {
    const airports = this.data?.airports ?? [];
    const withMetar = airports.filter((a) => a.metar);
    const worst = ['LIFR', 'IFR', 'MVFR'].find((cat) => withMetar.some((a) => a.metar!.fltCat === cat));
    const hazards = this.activeHazards();

    const hazardBlock: SafeHtml = hazards.length
      ? safeHtml`
        <div class="kaw-hazards">
          ${joinSafeHtml(hazards.slice(0, 6).map((h, i) => {
            const meta = HAZARD_META[h.kind] ?? HAZARD_META['warning']!;
            return safeHtml`<button class="kaw-hazard" data-hazard="${String(i)}" style="border-color:${meta.color};color:${meta.color}">${meta.ko}${h.airport ? ` · ${h.airport}` : ''}${h.type ? ` · ${h.type}` : ''}</button>`;
          }))}
        </div>`
      : this.hazardsFailed
        ? safeHtml`<div class="kaw-hazard-note">특보 정보를 잠시 확인할 수 없어요</div>`
        : safeHtml`<div class="kaw-hazard-note kaw-hazard-ok">발효 중인 공항 특보 없음</div>`;

    const rows = airports.map((a) => {
      const m = a.metar;
      if (!m) {
        return safeHtml`
          <tr data-icao="${a.icao}" data-lat="${String(a.lat)}" data-lon="${String(a.lon)}">
            <td class="kaw-td-name kaw-td-focus" title="지도에서 보기">${a.nameKo} <span class="kaw-icao">${a.icao}</span></td>
            <td colspan="5" class="kaw-none">관측 없음</td>
            <td><button class="kaw-btn" data-detail="${a.icao}">상세</button></td>
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
          <td><button class="kaw-btn" data-detail="${a.icao}">상세</button></td>
        </tr>`;
    });

    this.setSafeContent(safeHtml`
      <div class="kaw-head">
        ${worst
          ? safeHtml`<span class="kaw-worst" style="background:${CAT_META[worst]!.color}">일부 공항 ${worst} — ${CAT_META[worst]!.ko}</span>`
          : safeHtml`<span class="kaw-ok">전 공항 시계비행(VFR) 상태예요</span>`}
        <span class="kaw-src">${this.data?.source === 'kma' ? '기상청 항공기상' : '공개 METAR'} · 5분 갱신</span>
      </div>
      ${hazardBlock}
      ${airports.length === 0
        ? safeHtml`<div class="kaw-empty">${this.loaded ? '표시할 공항 기상이 없어요.' : '공항 기상을 불러오는 중…'}</div>`
        : safeHtml`
        <table class="kaw-table">
          <thead><tr><th>공항</th><th>상태</th><th>바람</th><th>시정·현상</th><th>운고</th><th>기온·QNH</th><th></th></tr></thead>
          <tbody>${joinSafeHtml(rows)}</tbody>
        </table>`}
      <style>
        .kaw-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 2px 0 6px; flex-wrap: wrap; }
        .kaw-worst { color: #fff; border-radius: 4px; padding: 1px 8px; font-size: 11px; font-weight: 700; }
        .kaw-ok { color: #2ecc71; font-size: 11px; font-weight: 600; }
        .kaw-src { color: var(--text-dim,#8aa); font-size: 10px; }
        .kaw-hazards { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 7px; }
        .kaw-hazard { background: rgba(231,76,60,0.08); border: 1px solid; border-radius: 5px; padding: 2px 8px; font-size: 11px; font-weight: 700; cursor: pointer; }
        .kaw-hazard-note { color: var(--text-dim,#8aa); font-size: 10px; margin-bottom: 6px; }
        .kaw-hazard-ok { color: #5fbf7f; }
        .kaw-table { width: 100%; border-collapse: collapse; font-size: 12px; }
        .kaw-table th { text-align: left; color: var(--text-dim,#8aa); font-size: 11px; padding: 4px 7px; border-bottom: 1px solid rgba(255,255,255,0.12); }
        .kaw-table td { padding: 4px 7px; border-bottom: 1px solid rgba(255,255,255,0.05); white-space: nowrap; font-variant-numeric: tabular-nums; }
        .kaw-td-name { font-weight: 600; color: var(--text,#e8f2fa); }
        .kaw-td-focus { cursor: pointer; }
        .kaw-td-focus:hover { color: #7fd4ff; text-decoration: underline; }
        .kaw-icao { color: var(--text-dim,#7a8fa0); font-size: 10px; font-weight: 400; }
        .kaw-cat { color: #fff; border-radius: 4px; padding: 0 6px; font-size: 10px; font-weight: 700; }
        .kaw-btn { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.14); color: var(--text,#dde); border-radius: 4px; padding: 1px 7px; font-size: 10px; cursor: pointer; }
        .kaw-btn:hover { background: rgba(0,209,255,0.12); }
        .kaw-none { color: var(--text-dim,#889); }
        .kaw-empty { color: var(--text-dim,#889); font-size: 12px; padding: 12px 4px; }
      </style>
    `, () => this.bindRows());
  }

  private bindRows(): void {
    // Panel.setContentHtml DOM 유지+bind 재실행 → 바인딩은 on* 할당만.
    this.content.querySelectorAll('tr[data-icao]').forEach((el) => {
      const cell = el.querySelector('.kaw-td-focus') as HTMLElement | null;
      if (cell) cell.onclick = () => {
        const lat = Number((el as HTMLElement).dataset.lat);
        const lon = Number((el as HTMLElement).dataset.lon);
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;
        try {
          window.dispatchEvent(new CustomEvent('kcg:map-focus', { detail: { lat, lon, zoom: 11 } }));
          showToast('지도를 해당 공항으로 옮겼어요');
        } catch { /* SSR/테스트 */ }
      };
    });
    this.content.querySelectorAll('button[data-detail]').forEach((el) => {
      (el as HTMLElement).onclick = () => this.openDetail((el as HTMLElement).dataset.detail || '');
    });
    this.content.querySelectorAll('button[data-hazard]').forEach((el) => {
      (el as HTMLElement).onclick = () => {
        const h = this.activeHazards()[Number((el as HTMLElement).dataset.hazard)];
        if (h) this.openHazard(h);
      };
    });
  }

  // ── 특보 전문 모달 ──────────────────────────────────────────────────────
  private openHazard(h: AirwxHazard): void {
    const meta = HAZARD_META[h.kind] ?? HAZARD_META['warning']!;
    const body = document.createElement('div');
    body.style.cssText = 'font-size:13px;line-height:1.7;';
    const head = document.createElement('div');
    head.style.cssText = 'color:#9ab;font-size:11px;margin-bottom:10px;';
    head.textContent = `${h.airport || h.icao || '전 공역'}${h.from ? ` · 발효 ${h.from}` : ''}${h.to ? ` ~ ${h.to}` : ''}`;
    const pre = document.createElement('pre');
    pre.style.cssText = 'white-space:pre-wrap;font-size:12px;color:#dce8f2;background:rgba(255,255,255,0.04);padding:12px;border-radius:8px;margin:0;';
    pre.textContent = h.msg || '(전문 없음)';
    body.append(head, pre);
    showKcgModalNode(`${meta.ko}${h.type ? ` — ${h.type}` : ''}`, body, 720);
  }

  // ── 공항 상세 모달: METAR/TAF 원문 + 저고도 바람 + 분단위 활주로 실황 ────
  private openDetail(icao: string): void {
    const airport = this.data?.airports.find((a) => a.icao === icao);
    if (!airport) return;
    const body = document.createElement('div');
    body.style.cssText = 'font-size:13px;line-height:1.7;';

    const section = (title: string): HTMLElement => {
      const t = document.createElement('div');
      t.style.cssText = 'color:#7fd4ff;font-weight:700;font-size:12px;margin:12px 0 4px;';
      t.textContent = title;
      return t;
    };
    const pre = (text: string): HTMLElement => {
      const p = document.createElement('pre');
      p.style.cssText = 'white-space:pre-wrap;font-size:12px;color:#dce8f2;background:rgba(255,255,255,0.04);padding:10px;border-radius:8px;margin:0;';
      p.textContent = text;
      return p;
    };
    const note = (text: string): HTMLElement => {
      const n = document.createElement('div');
      n.style.cssText = 'color:#8aa0b4;font-size:11px;';
      n.textContent = text;
      return n;
    };

    body.append(section('METAR (실황 전문)'));
    body.append(airport.metar?.raw ? pre(airport.metar.raw) : note(airport.metar ? '원문은 기상청 소스에서 제공되지 않아 해독값만 표에 표시돼요.' : '현재 관측이 없어요.'));

    const tafTitle = section('TAF (공항 예보 전문)');
    const tafBox = note('불러오는 중…');
    body.append(tafTitle, tafBox);

    const lwTitle = section('저고도 바람·기온 (공항 상공 · 기상청 WINTEM)');
    const lwBox = note('불러오는 중…');
    body.append(lwTitle, lwBox);

    const amosTitle = section('분단위 활주로 실황 (AMOS)');
    const amosBox = note('불러오는 중…');
    body.append(amosTitle, amosBox);

    showKcgModalNode(`${airport.nameKo}공항 ${icao} — 항공 기상 상세`, body, 760);

    void fetchAirwx<{ available?: boolean; msg?: string }>(`type=taf&icao=${icao}`).then((t) => {
      if (!tafBox.isConnected) return;
      if (!t || t.available === false) { tafBox.textContent = 'TAF를 불러오지 못했어요.'; return; }
      if (!t.msg) { tafBox.textContent = '발표된 TAF가 없어요.'; return; }
      tafBox.replaceWith(pre(t.msg));
    });

    void fetchAirwx<{ available?: boolean; issued?: string; airports?: Array<{ icao: string; levels: AirwxLowWindLevel[] }> }>('type=lowwind').then((lw) => {
      if (!lwBox.isConnected) return;
      const levels = lw?.airports?.find((a) => a.icao === icao)?.levels;
      if (!lw || lw.available === false || !levels?.length) { lwBox.textContent = '저고도 바람 자료를 불러오지 못했어요.'; return; }
      const table = document.createElement('table');
      table.style.cssText = 'border-collapse:collapse;font-size:12px;width:100%;';
      table.append(this.detailRow(['고도', '풍향', '풍속', '기온'], true));
      for (const lv of levels) {
        table.append(this.detailRow([lv.label, `${String(lv.wdDeg).padStart(3, '0')}°`, `${lv.wsKt}kt`, `${lv.tempC}°C`]));
      }
      const wrap = document.createElement('div');
      wrap.append(table, note(`발표 ${lw.issued ?? '—'} (UTC) · 6시간 주기 예측 모델 기반`));
      lwBox.replaceWith(wrap);
    });

    void fetchAirwx<{ available?: boolean; rows?: AirwxAmosRow[] }>('type=amos').then((am) => {
      if (!amosBox.isConnected) return;
      const row = am?.rows?.find((r) => r.icao === icao);
      if (!am || am.available === false) { amosBox.textContent = '분단위 실황을 불러오지 못했어요.'; return; }
      if (!row) { amosBox.textContent = '이 공항은 분단위 관측(AMOS) 대상이 아니에요 (인천·김포·제주·무안·울산·여수·양양만 제공).'; return; }
      const table = document.createElement('table');
      table.style.cssText = 'border-collapse:collapse;font-size:12px;width:100%;';
      table.append(this.detailRow(['관측', '시정', 'RVR', '최저운고', '2분 바람', '10분 바람'], true));
      const wind = (d: number | null, s: number | null, mx: number | null): string =>
        s == null ? '—' : `${d != null ? String(d).padStart(3, '0') + '°' : ''} ${s}kt${mx != null ? ` (최대 ${mx})` : ''}`;
      table.append(this.detailRow([
        `${amosTime(row.obsTime)} KST`,
        row.visM != null ? visText(row.visM) : '—',
        row.rvrM != null ? (row.rvrM >= 2000 ? '2,000m+' : `${row.rvrM}m`) : '—',
        row.ceilingM != null ? (row.ceilingM >= 20000 ? '제한 없음' : `${row.ceilingM}m`) : '—',
        wind(row.wd2mDeg, row.ws2mKt, row.ws2mMaxKt),
        wind(row.wd10mDeg, row.ws10mKt, row.ws10mMaxKt),
      ]));
      const wrap = document.createElement('div');
      wrap.append(table, note('1분 주기 활주로 관측 장비(AMOS) 실황 · RVR=활주로 가시거리'));
      amosBox.replaceWith(wrap);
    });
  }

  private detailRow(cells: string[], header = false): HTMLTableRowElement {
    const tr = document.createElement('tr');
    for (const c of cells) {
      const td = document.createElement(header ? 'th' : 'td');
      td.textContent = c;
      td.style.cssText = header
        ? 'text-align:left;color:#7f95a8;font-size:11px;padding:3px 8px;border-bottom:1px solid rgba(255,255,255,0.12);'
        : 'padding:3px 8px;border-bottom:1px solid rgba(255,255,255,0.05);color:#dce8f2;font-variant-numeric:tabular-nums;white-space:nowrap;';
      tr.append(td);
    }
    return tr;
  }
}
