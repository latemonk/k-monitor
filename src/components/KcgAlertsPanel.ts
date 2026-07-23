/**
 * KCG fork — AI 이상 선박 활동 감시 패널.
 *
 * 상황실 근무자가 "평소 기준"과 "경보 기준"을 직접 입력하고, 판정 주기와
 * 민감도(점수 임계값)를 고르면 엔진(src/services/kcg-alerts.ts)이 주기적으로
 * 한국 근해 선박 활동을 요약해 AI 판정을 받아 경보 피드를 채운다.
 */
import { Panel } from './Panel';
import { safeHtml, joinSafeHtml, type SafeHtml } from '@/utils/sanitize';
import { getKcgAlertEngine, type KcgAlertDomain, type KcgAlertSettings, type KcgVerdict } from '@/services/kcg-alerts';
import { getActiveKcgPreset, KCG_PRESET_CHANGED_EVENT } from '@/services/kcg-active-preset';
import { showKcgModal } from '@/utils/kcg-modal';
import { showToast } from '@/utils/toast';
import { fetchLiveTankers } from '@/services/live-tankers';
import { fetchAircraftPositions } from '@/services/aviation';

const SEV_LABEL: Record<string, string> = {
  info: '정보',
  watch: '주의',
  warning: '경계',
  critical: '심각',
};

const SEV_COLOR: Record<string, string> = {
  info: '#3498db',
  watch: '#f1c40f',
  warning: '#e67e22',
  critical: '#e74c3c',
};

function fmtTime(ts: number | null): string {
  if (!ts) return '—';
  return new Date(ts).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', hour12: false, month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export class KcgAlertsPanel extends Panel {
  private unsubscribe: (() => void) | null = null;
  private settingsOpen = false;
  // KCG fork(07-24 사장님 지시): 공중 감시 프리셋에서는 항공기 감시로 전환.
  private domain: KcgAlertDomain = getActiveKcgPreset() === 'air' ? 'aviation' : 'maritime';

  constructor() {
    super({
      id: 'kcg-alerts',
      title: 'AI 이상 활동 감시',
      infoTooltip: '입력한 평소 기준과 경보 기준을 바탕으로 AI가 주기적으로 판정해요. 해양 감시 탭에서는 한국 근해 선박 활동을, 공중 감시 탭에서는 한반도 권역 항공기 활동을 감시하고, 기준에 걸리는 이상 활동이 보이면 경보를 올려요.',
    });
    this.attachEngine();
    window.addEventListener(KCG_PRESET_CHANGED_EVENT, this.presetListener);
    this.render();
  }

  private engine() {
    return getKcgAlertEngine(this.domain);
  }

  private attachEngine(): void {
    this.unsubscribe?.();
    const engine = this.engine();
    this.unsubscribe = engine.subscribe(() => this.render());
    engine.start();
  }

  /** 프리셋 전환 → 도메인 스왑(이전 도메인 엔진은 멈춰 LLM 판정 낭비 방지). */
  private presetListener = (): void => {
    const next: KcgAlertDomain = getActiveKcgPreset() === 'air' ? 'aviation' : 'maritime';
    if (next === this.domain) return;
    const prev = this.engine();
    this.domain = next;
    prev.stop();
    this.settingsOpen = false;
    this.attachEngine();
    this.render();
  };

  public async fetchData(): Promise<void> {
    this.render();
  }

  public destroy(): void {
    this.unsubscribe?.();
    this.unsubscribe = null;
    window.removeEventListener(KCG_PRESET_CHANGED_EVENT, this.presetListener);
    super.destroy();
  }

  private render(): void {
    const engine = this.engine();
    const st = engine.getState();
    const cfg = engine.getSettings();
    const av = this.domain === 'aviation';

    const statusLine = st.running
      ? safeHtml`<span class="kcg-dot kcg-dot-on"></span> 감시 중 · ${String(cfg.intervalMin)}분 주기 · 마지막 판정 ${fmtTime(st.lastRunAt)}`
      : safeHtml`<span class="kcg-dot"></span> 감시 꺼짐`;

    const verdict = st.lastVerdict;
    const verdictHtml: SafeHtml = verdict
      ? safeHtml`
        <div class="kcg-verdict" style="border-left-color:${SEV_COLOR[verdict.severity] || '#3498db'}">
          <div class="kcg-verdict-head">
            <strong>${verdict.headline}</strong>
            <span class="kcg-score">${String(verdict.anomaly_score)}점 · ${SEV_LABEL[verdict.severity] || verdict.severity}</span>
          </div>
          ${verdict.changes.length ? safeHtml`<ul class="kcg-changes">${joinSafeHtml(verdict.changes.slice(0, 5).map((c) => safeHtml`<li>${c}</li>`))}</ul>` : safeHtml``}
        </div>`
      : st.lastError
        ? safeHtml`<div class="kcg-verdict kcg-verdict-err">${st.lastError}</div>`
        : safeHtml`<div class="kcg-verdict kcg-verdict-wait">첫 판정을 기다리는 중이에요 (${av ? '항공기' : '선박'} 집계 후 자동 실행)</div>`;

    const alertsHtml = st.alerts.length
      ? joinSafeHtml(st.alerts.slice(0, 12).map((a) => safeHtml`
          <div class="kcg-alert kcg-alert-clickable" data-alert-id="${a.id}" style="border-left-color:${SEV_COLOR[a.severity] || '#3498db'}">
            <div class="kcg-alert-head">
              <span class="kcg-alert-sev" style="background:${SEV_COLOR[a.severity] || '#3498db'}">${SEV_LABEL[a.severity] || a.severity} ${String(a.anomaly_score)}</span>
              <span class="kcg-alert-time">${fmtTime(a.ts)}</span>
            </div>
            <div class="kcg-alert-title">${a.headline}</div>
            ${a.changes.length ? safeHtml`<div class="kcg-alert-detail">${a.changes.slice(0, 3).join(' · ')}</div>` : safeHtml``}
          </div>`))
      : safeHtml`<div class="kcg-empty">아직 경보가 없어요. 기준을 벗어나는 활동이 보이면 여기에 올라와요.</div>`;

    const settingsHtml: SafeHtml = this.settingsOpen
      ? safeHtml`
        <div class="kcg-settings">
          <label class="kcg-field">
            <span>평소 기준 (어떤 상태가 정상인지)</span>
            <textarea id="kcgBaseline" rows="3">${cfg.baseline}</textarea>
          </label>
          <label class="kcg-field">
            <span>경보 기준 (어떤 활동이 보이면 알릴지)</span>
            <textarea id="kcgTrigger" rows="3">${cfg.trigger}</textarea>
          </label>
          <div class="kcg-row">
            <label class="kcg-field-sm">
              <span>민감도 임계값</span>
              <select id="kcgThreshold">
                <option value="30" ${cfg.threshold === 30 ? 'selected' : ''}>민감 (30점)</option>
                <option value="55" ${cfg.threshold === 55 ? 'selected' : ''}>표준 (55점)</option>
                <option value="80" ${cfg.threshold === 80 ? 'selected' : ''}>둔감 (80점)</option>
              </select>
            </label>
            <label class="kcg-field-sm">
              <span>판정 주기</span>
              <select id="kcgInterval">
                <option value="5" ${cfg.intervalMin === 5 ? 'selected' : ''}>5분</option>
                <option value="10" ${cfg.intervalMin === 10 ? 'selected' : ''}>10분</option>
                <option value="30" ${cfg.intervalMin === 30 ? 'selected' : ''}>30분</option>
                <option value="60" ${cfg.intervalMin === 60 ? 'selected' : ''}>60분</option>
              </select>
            </label>
            <label class="kcg-check">
              <input type="checkbox" id="kcgEnabled" ${cfg.enabled ? 'checked' : ''}/> 감시 켜기
            </label>
            <label class="kcg-check">
              <input type="checkbox" id="kcgNotify" ${cfg.browserNotify ? 'checked' : ''}/> 브라우저 알림
            </label>
          </div>
          <div class="kcg-row">
            <button id="kcgSave" class="kcg-btn kcg-btn-primary">저장</button>
            <button id="kcgRunNow" class="kcg-btn">지금 판정</button>
            <button id="kcgClear" class="kcg-btn">경보 비우기</button>
          </div>
        </div>`
      : safeHtml``;

    this.setSafeContent(safeHtml`
      <div class="kcg-wrap">
        <div class="kcg-status">
          <div class="kcg-status-line">${statusLine}</div>
          <div class="kcg-status-meta">${av ? '감시 대상: 한반도 공역' : '감시 대상: 한국 근해'} · 포착 ${av ? `항공기 ${String(st.vesselCount)}대` : `선박 ${String(st.vesselCount)}척`} · 임계값 ${String(cfg.threshold)}점</div>
          ${st.liveAis === false ? safeHtml`<span class="kcg-badge-demo">시뮬레이션 데이터</span>` : st.liveAis === true ? safeHtml`<span class="kcg-badge-live">${av ? '실시간 ADS-B' : '실시간 AIS'}</span>` : safeHtml``}
          <button id="kcgToggleSettings" class="kcg-btn kcg-btn-sm">${this.settingsOpen ? '설정 닫기' : '기준 설정'}</button>
        </div>
        ${settingsHtml}
        <div class="kcg-section-title">최근 판정</div>
        ${verdictHtml}
        <div class="kcg-section-title">경보 피드</div>
        <div class="kcg-alerts">${alertsHtml}</div>
      </div>
      <style>
        .kcg-wrap { display: flex; flex-direction: column; gap: 8px; font-size: 12px; }
        .kcg-status { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .kcg-status-line { display: flex; align-items: center; gap: 6px; font-weight: 600; }
        .kcg-status-meta { color: var(--text-dim, #888); font-size: 11px; }
        .kcg-dot { width: 8px; height: 8px; border-radius: 50%; background: #666; display: inline-block; }
        .kcg-dot-on { background: #2ecc71; box-shadow: 0 0 6px #2ecc71; }
        .kcg-btn { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); color: var(--text, #eee); border-radius: 6px; padding: 4px 10px; font-size: 11px; cursor: pointer; }
        .kcg-btn:hover { background: rgba(255,255,255,0.12); }
        .kcg-btn-primary { background: #1f6feb; border-color: #1f6feb; color: #fff; }
        .kcg-btn-sm { margin-left: auto; }
        .kcg-badge-demo { background: #8e5a00; color: #ffd28a; border-radius: 4px; padding: 1px 7px; font-size: 10px; font-weight: 700; }
        .kcg-badge-live { background: #0a5c36; color: #7dffb8; border-radius: 4px; padding: 1px 7px; font-size: 10px; font-weight: 700; }
        .kcg-settings { display: flex; flex-direction: column; gap: 8px; padding: 10px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; }
        .kcg-field { display: flex; flex-direction: column; gap: 4px; }
        .kcg-field span, .kcg-field-sm span { color: var(--text-dim, #999); font-size: 11px; }
        .kcg-field textarea { background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.12); border-radius: 6px; color: var(--text, #eee); font-size: 12px; padding: 6px 8px; resize: vertical; font-family: inherit; }
        .kcg-row { display: flex; gap: 10px; align-items: end; flex-wrap: wrap; }
        .kcg-field-sm { display: flex; flex-direction: column; gap: 4px; }
        .kcg-field-sm select { background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.12); border-radius: 6px; color: var(--text, #eee); font-size: 12px; padding: 4px 6px; }
        .kcg-check { display: flex; align-items: center; gap: 5px; color: var(--text, #ddd); font-size: 11px; }
        .kcg-section-title { color: var(--text-dim, #888); font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; margin-top: 2px; }
        .kcg-verdict { border-left: 3px solid #3498db; background: rgba(255,255,255,0.03); border-radius: 0 6px 6px 0; padding: 8px 10px; }
        .kcg-verdict-head { display: flex; justify-content: space-between; gap: 8px; align-items: baseline; }
        .kcg-score { color: var(--text-dim, #999); font-size: 11px; white-space: nowrap; }
        .kcg-changes { margin: 6px 0 0; padding-left: 16px; color: var(--text-dim, #aaa); }
        .kcg-changes li { margin: 2px 0; }
        .kcg-verdict-err { border-left-color: #e67e22; color: #e67e22; }
        .kcg-verdict-wait { border-left-color: #666; color: var(--text-dim, #999); }
        .kcg-alerts { display: flex; flex-direction: column; gap: 6px; max-height: 320px; overflow-y: auto; }
        .kcg-alert { border-left: 3px solid #3498db; background: rgba(255,255,255,0.03); border-radius: 0 6px 6px 0; padding: 6px 10px; }
        .kcg-alert-head { display: flex; justify-content: space-between; align-items: center; }
        .kcg-alert-sev { color: #fff; border-radius: 4px; padding: 1px 6px; font-size: 10px; font-weight: 700; }
        .kcg-alert-time { color: var(--text-dim, #888); font-size: 10px; }
        .kcg-alert-title { font-weight: 600; margin-top: 3px; }
        .kcg-alert-detail { color: var(--text-dim, #999); font-size: 11px; margin-top: 2px; }
        .kcg-empty { color: var(--text-dim, #888); padding: 8px 2px; }
        .kcg-alert-clickable { cursor: pointer; }
        .kcg-alert-clickable:hover { background: rgba(0,209,255,0.06); }
        .kcg-verdict { cursor: pointer; }
      </style>
    `, () => this.bindEvents());
  }

  private bindEvents(): void {
    const $ = <T extends HTMLElement>(id: string) => this.content.querySelector<T>(`#${id}`);

    $('kcgToggleSettings')?.addEventListener('click', () => {
      this.settingsOpen = !this.settingsOpen;
      this.render();
    });

    $('kcgSave')?.addEventListener('click', () => {
      const engine = this.engine();
      const next: KcgAlertSettings = {
        enabled: ($<HTMLInputElement>('kcgEnabled'))?.checked ?? true,
        browserNotify: ($<HTMLInputElement>('kcgNotify'))?.checked ?? true,
        baseline: ($<HTMLTextAreaElement>('kcgBaseline'))?.value?.trim() ?? '',
        trigger: ($<HTMLTextAreaElement>('kcgTrigger'))?.value?.trim() ?? '',
        threshold: Number(($<HTMLSelectElement>('kcgThreshold'))?.value ?? 55),
        intervalMin: Number(($<HTMLSelectElement>('kcgInterval'))?.value ?? 10),
      };
      engine.saveSettings(next);
      if (next.browserNotify && typeof Notification !== 'undefined' && Notification.permission === 'default') {
        void Notification.requestPermission();
      }
      this.settingsOpen = false;
      this.render();
    });

    $('kcgRunNow')?.addEventListener('click', () => {
      void this.engine().runOnce();
    });

    $('kcgClear')?.addEventListener('click', () => {
      this.engine().clearAlerts();
    });

    // 경보 항목/최근 판정 클릭 → 전체 판정 내용 모달
    this.content.querySelectorAll('.kcg-alert-clickable').forEach((el) => {
      el.addEventListener('click', () => {
        const id = (el as HTMLElement).dataset.alertId || '';
        const alert = this.engine().getState().alerts.find((a) => a.id === id);
        if (alert) this.showVerdictDetail(alert, new Date(alert.ts));
      });
    });
    this.content.querySelector('.kcg-verdict:not(.kcg-verdict-err):not(.kcg-verdict-wait)')?.addEventListener('click', () => {
      const st = this.engine().getState();
      if (st.lastVerdict) this.showVerdictDetail(st.lastVerdict, st.lastRunAt ? new Date(st.lastRunAt) : null);
    });
  }

  /** 판정 상세 모달 — changes 전체·caveats·요약 근거까지. */
  private showVerdictDetail(v: KcgVerdict, at: Date | null): void {
    const st = this.engine().getState();
    showKcgModal(`AI 판정 상세 — ${v.anomaly_score}점 · ${SEV_LABEL[v.severity] ?? v.severity}`, safeHtml`
      <div style="font-weight:700;font-size:14px;margin-bottom:8px">${v.headline}</div>
      <div style="color:#9ab;font-size:11px;margin-bottom:12px">판정 시각 ${at ? at.toLocaleString('ko-KR', { hour12: false }) : '—'} · 신뢰도 ${v.confidence} · 모델 ${v.model ?? '—'}</div>
      ${v.changes.length ? safeHtml`<div style="margin-bottom:12px"><div style="color:#7fd4ff;font-weight:600;margin-bottom:4px">변화·근거</div><ul class="kcg-verdict-changes" style="padding-left:18px;line-height:1.7">${joinSafeHtml(v.changes.map((c) => safeHtml`<li>${c}</li>`))}</ul></div>` : safeHtml``}
      ${v.caveats ? safeHtml`<div style="margin-bottom:12px"><div style="color:#7fd4ff;font-weight:600;margin-bottom:4px">유의점</div><div style="color:#bcd">${v.caveats}</div></div>` : safeHtml``}
      ${st.lastSummary ? safeHtml`<details><summary style="cursor:pointer;color:#9ab">판정에 사용된 집계 요약 보기</summary><pre style="white-space:pre-wrap;font-size:11px;color:#9db4c4;background:rgba(255,255,255,0.03);padding:10px;border-radius:6px;margin-top:6px">${st.lastSummary}</pre></details>` : safeHtml``}
    `);
    // KCG fork(07-23 사장님 지시): 변화·근거 텍스트에 등장하는 선박명·항공기
    // 편명을 클릭하면 지도가 해당 위치로 이동. 현재 스냅샷에서 이름→좌표
    // 인덱스를 만들고, 텍스트 노드만 감싸 XSS 없이 링크화한다.
    void this.linkifyVerdictEntities();
  }

  /** 현재 선박·항공기 스냅샷에서 이름→좌표 인덱스를 만들어 모달 텍스트를 링크화. */
  private async linkifyVerdictEntities(): Promise<void> {
    const overlay = document.querySelector('.kcg-modal-overlay');
    const ul = overlay?.querySelector('.kcg-verdict-changes');
    if (!ul) return;
    interface Ent { name: string; lat: number; lon: number; kind: 'vessel' | 'aircraft'; icao?: string }
    const ents: Ent[] = [];
    try {
      const zones = await fetchLiveTankers();
      const seen = new Set<string>();
      for (const z of zones) {
        for (const t of z.tankers) {
          const nm = (t.name || '').trim().toUpperCase();
          if (nm.length >= 4 && !seen.has(nm)) { seen.add(nm); ents.push({ name: nm, lat: t.lat, lon: t.lon, kind: 'vessel' }); }
        }
      }
    } catch { /* 선박 없으면 항공만 */ }
    try {
      const acs = await fetchAircraftPositions({ swLat: 33, swLon: 124, neLat: 39.2, neLon: 131.5 });
      const seen = new Set<string>();
      for (const a of acs) {
        const cs = (a.callsign || '').trim().toUpperCase();
        if (cs.length >= 3 && !seen.has(cs)) { seen.add(cs); ents.push({ name: cs, lat: a.lat, lon: a.lon, kind: 'aircraft', icao: a.icao24 }); }
      }
    } catch { /* ignore */ }
    if (ents.length === 0) return;
    // 긴 이름 우선(부분 매칭 방지).
    ents.sort((a, b) => b.name.length - a.name.length);
    if (!overlay || !overlay.contains(ul)) return;

    const linkify = (node: Text): void => {
      const text = node.textContent ?? '';
      const upper = text.toUpperCase();
      let matchAt = -1; let matched: Ent | null = null;
      for (const e of ents) {
        const idx = upper.indexOf(e.name);
        if (idx !== -1 && (matchAt === -1 || idx < matchAt)) { matchAt = idx; matched = e; }
      }
      if (matchAt === -1 || !matched) return;
      const before = text.slice(0, matchAt);
      const hit = text.slice(matchAt, matchAt + matched.name.length);
      const after = text.slice(matchAt + matched.name.length);
      const frag = document.createDocumentFragment();
      if (before) frag.append(document.createTextNode(before));
      const span = document.createElement('span');
      span.textContent = hit;
      span.style.cssText = 'color:#7fd4ff;cursor:pointer;text-decoration:underline;text-underline-offset:2px;';
      span.title = '지도에서 보기';
      const ent = matched;
      span.addEventListener('click', () => {
        try {
          window.dispatchEvent(new CustomEvent('kcg:map-focus', { detail: { lat: ent.lat, lon: ent.lon, zoom: 9 } }));
          if (ent.kind === 'aircraft' && ent.icao) {
            window.dispatchEvent(new CustomEvent('kcg:highlight-aircraft', { detail: { icao24: ent.icao, lat: ent.lat, lon: ent.lon } }));
            window.dispatchEvent(new CustomEvent('kcg:select-aircraft', { detail: { icao24: ent.icao, lat: ent.lat, lon: ent.lon } }));
          }
          showToast(ent.kind === 'aircraft' ? '지도를 해당 항공기로 옮겼어요' : '지도를 해당 선박으로 옮겼어요');
        } catch { /* SSR/테스트 */ }
      });
      frag.append(span);
      const tail = document.createTextNode(after);
      frag.append(tail);
      node.replaceWith(frag);
      // 나머지 텍스트(after)에도 다른 이름이 있을 수 있어 이어서 처리.
      linkify(tail);
    };

    for (const li of Array.from(ul.querySelectorAll('li'))) {
      for (const child of Array.from(li.childNodes)) {
        if (child.nodeType === Node.TEXT_NODE) linkify(child as Text);
      }
    }
  }
}
