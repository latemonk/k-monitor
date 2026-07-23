/**
 * KCG fork — 해양 기상·수온 패널.
 * BluePin 해양관측(국립해양조사원·기상청 해양부이·수과원) 기반 구역별
 * 수온·파고·돌풍 현황. 10분 주기 갱신.
 */
import { Panel } from './Panel';
import { safeHtml, joinSafeHtml } from '@/utils/sanitize';
import { fetchSeaConditions, SEA_LEVEL_KO, SEA_LEVEL_COLOR, type SeaConditions, type SeaMeasure, type SeaZone } from '@/services/kcg-sea';
import { showKcgModal } from '@/utils/kcg-modal';

function cell(m: SeaMeasure | null): ReturnType<typeof safeHtml> {
  if (!m) return safeHtml`<td class="kcgsea-na">—</td>`;
  const color = SEA_LEVEL_COLOR[m.level] ?? '#888';
  const label = SEA_LEVEL_KO[m.level] ?? m.level;
  return safeHtml`<td title="${m.station} · ${m.obsAt}"><span class="kcgsea-dot" style="background:${color}"></span>${String(m.value)}<span class="kcgsea-unit">${m.unit}</span>${m.level !== 'none' ? safeHtml`<span class="kcgsea-lv" style="color:${color}">${label}</span>` : safeHtml``}</td>`;
}

export class KcgSeaPanel extends Panel {
  private data: SeaConditions | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    super({
      id: 'kcg-sea',
      title: '해양 기상·수온',
      infoTooltip: '국립해양조사원·기상청 해양부이·수산과학원 실시간 관측 기반 구역별 수온·파고·돌풍이에요. 10분마다 갱신돼요.',
    });
    void this.fetchData();
    this.timer = setInterval(() => void this.fetchData(), 10 * 60 * 1000);
  }

  public destroy(): void {
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
    super.destroy();
  }

  public async fetchData(): Promise<void> {
    const data = await fetchSeaConditions();
    if (!this.element?.isConnected && this.data) return;
    this.data = data;
    this.render();
  }

  private render(): void {
    if (!this.data) {
      this.setSafeContent(safeHtml`<div class="kcgsea-empty">해양 관측 데이터를 불러오는 중이에요…</div>
        <style>.kcgsea-empty{color:var(--text-dim,#888);padding:10px 4px;font-size:12px;}</style>`);
      return;
    }
    const rows = joinSafeHtml(this.data.zones.map((z) => safeHtml`
      <tr class="kcgsea-row" data-zone-id="${z.id}">
        <td class="kcgsea-zone">${z.nameKo}</td>
        ${cell(z.temp)}
        ${cell(z.wave)}
        ${cell(z.gust)}
      </tr>`));

    const updated = new Date(this.data.fetchedAt).toLocaleTimeString('ko-KR', { timeZone: 'Asia/Seoul', hour: '2-digit', minute: '2-digit', hour12: false });

    this.setSafeContent(safeHtml`
      <div class="kcgsea-wrap">
        <table class="kcgsea-table">
          <thead><tr><th>구역</th><th>수온</th><th>파고</th><th>돌풍</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <div class="kcgsea-foot">출처: <a href="https://bluepin.ai" target="_blank" rel="noopener noreferrer">BluePin</a> 해양관측(국립해양조사원·기상청·수산과학원) · ${updated} 기준</div>
      </div>
      <style>
        .kcgsea-wrap { font-size: 12px; }
        .kcgsea-table { width: 100%; border-collapse: collapse; }
        .kcgsea-table th { text-align: left; color: var(--text-dim,#888); font-size: 10px; font-weight: 600; padding: 4px 6px; border-bottom: 1px solid rgba(255,255,255,0.08); }
        .kcgsea-table td { padding: 6px; border-bottom: 1px solid rgba(255,255,255,0.05); white-space: nowrap; }
        .kcgsea-zone { color: var(--text,#ddd); font-weight: 600; }
        .kcgsea-dot { display: inline-block; width: 7px; height: 7px; border-radius: 50%; margin-right: 6px; }
        .kcgsea-unit { color: var(--text-dim,#999); font-size: 10px; margin-left: 2px; }
        .kcgsea-lv { font-size: 10px; font-weight: 700; margin-left: 6px; }
        .kcgsea-na { color: var(--text-dim,#666); }
        .kcgsea-foot { color: var(--text-dim,#777); font-size: 10px; margin-top: 6px; }
        .kcgsea-row { cursor: pointer; }
        .kcgsea-row:hover td { background: rgba(0,209,255,0.06); }
      </style>
    `, () => {
      this.content.querySelectorAll('.kcgsea-row').forEach((el) => {
        el.addEventListener('click', () => {
          const id = (el as HTMLElement).dataset.zoneId || '';
          const zone = this.data?.zones.find((zz) => zz.id === id);
          if (zone) this.showZoneDetail(zone);
        });
      });
    });
  }

  /** 행 클릭 → 관측 상세(관측소·관측시각 포함) 모달. */
  private showZoneDetail(zone: SeaZone): void {
    const row = (label: string, m: SeaMeasure | null) => m
      ? safeHtml`<tr><td>${label}</td><td><strong>${String(m.value)}${m.unit}</strong></td><td style="color:${SEA_LEVEL_COLOR[m.level] ?? '#888'}">${SEA_LEVEL_KO[m.level] ?? m.level}</td><td>${m.station}</td><td>${m.obsAt}</td></tr>`
      : safeHtml`<tr><td>${label}</td><td colspan="4" style="color:#778">관측값 없음</td></tr>`;
    showKcgModal(`${zone.nameKo} — 해양 관측 상세`, safeHtml`
      <table style="width:100%;border-collapse:collapse">
        <thead><tr style="color:#8aa;font-size:11px;text-align:left"><th>지표</th><th>값</th><th>단계</th><th>관측소</th><th>관측시각</th></tr></thead>
        <tbody style="line-height:2">
          ${row('수온', zone.temp)}
          ${row('파고', zone.wave)}
          ${row('돌풍', zone.gust)}
        </tbody>
      </table>
      <div style="color:#789;font-size:11px;margin-top:10px">출처: <a href="https://bluepin.ai" target="_blank" rel="noopener noreferrer" style="color:#8ab">BluePin</a> 해양관측(국립해양조사원·기상청 해양부이·수산과학원) · 30분 주기 갱신</div>
    `);
  }
}
