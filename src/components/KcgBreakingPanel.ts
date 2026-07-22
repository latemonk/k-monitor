/**
 * KCG fork — 실시간 속보 스트림 패널.
 * api/kcg-breaking(주제별 Google News 검색·서버 2분 캐시)을 60초 폴링해
 * 새 헤드라인이 위로 계속 흘러들어오는 속보 타임라인을 만든다.
 * 주제 칩(종합/해양/항공/안보/재난) + 활성 감시 프리셋 자동 추종.
 */
import { Panel } from './Panel';
import { toApiUrl } from '@/services/runtime';
import { safeHtml, joinSafeHtml, safeUrlAttr } from '@/utils/sanitize';
import { KCG_BREAKING_TOPICS, getKcgWatchPreset, type KcgBreakingTopicId } from '@/services/kcg-presets';
import { getActiveKcgPreset, KCG_PRESET_CHANGED_EVENT } from '@/services/kcg-active-preset';

interface BreakingItem {
  title: string;
  link: string;
  source: string;
  publishedAt: string;
}

const POLL_MS = 60_000;
const MAX_ROWS = 80;

export class KcgBreakingPanel extends Panel {
  private topicId: KcgBreakingTopicId = 'domestic';
  private items: BreakingItem[] = [];
  private seenLinks = new Set<string>();
  private timer: ReturnType<typeof setInterval> | null = null;
  private topicBar: HTMLElement | null = null;
  private fetchGeneration = 0;
  private loadedOnce = false;
  private readonly onPresetChanged = () => {
    const preset = getKcgWatchPreset(getActiveKcgPreset());
    this.switchTopic(preset?.breakingTopic ?? 'domestic');
  };

  constructor() {
    super({
      id: 'kcg-breaking',
      title: '실시간 속보',
      infoTooltip: '주제별 속보 헤드라인이 1분 주기로 자동 갱신되며 새 소식이 위로 흘러들어와요. 감시 탭(해양/공중/지상)을 바꾸면 주제도 따라 바뀌어요.',
    });

    const preset = getKcgWatchPreset(getActiveKcgPreset());
    if (preset) this.topicId = preset.breakingTopic;

    this.renderTopicBar();
    this.showLoading();
    void this.fetchData(true);
    this.timer = setInterval(() => void this.fetchData(false), POLL_MS);
    window.addEventListener(KCG_PRESET_CHANGED_EVENT, this.onPresetChanged);
  }

  public destroy(): void {
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
    window.removeEventListener(KCG_PRESET_CHANGED_EVENT, this.onPresetChanged);
    super.destroy();
  }

  private renderTopicBar(): void {
    if (!this.topicBar) {
      this.topicBar = document.createElement('div');
      this.topicBar.className = 'kcg-topic-bar';
      this.content.before(this.topicBar);
    }
    this.topicBar.replaceChildren();
    for (const topic of KCG_BREAKING_TOPICS) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `kcg-topic-chip${topic.id === this.topicId ? ' active' : ''}`;
      btn.textContent = topic.label;
      btn.setAttribute('aria-pressed', String(topic.id === this.topicId));
      btn.addEventListener('click', () => this.switchTopic(topic.id));
      this.topicBar.appendChild(btn);
    }
  }

  private switchTopic(topicId: KcgBreakingTopicId): void {
    if (this.topicId === topicId) return;
    this.topicId = topicId;
    this.items = [];
    this.seenLinks.clear();
    this.loadedOnce = false;
    this.renderTopicBar();
    // showLoading() 대신 setSafeContent 경로 — Panel 의 150ms debounce 에 걸려
    // 있던 이전 주제 렌더 예약을 placeholder 로 대체해 스피너 덮어쓰기를 막는다.
    this.setSafeContent(safeHtml`<div style="padding:14px 12px;color:#789;font-size:12px">속보를 불러오는 중…</div>`);
    void this.fetchData(true);
  }

  private async fetchData(initial: boolean): Promise<void> {
    const generation = ++this.fetchGeneration;
    const topicAtFetch = this.topicId;
    try {
      const resp = await fetch(
        toApiUrl(`/api/kcg-breaking?topic=${topicAtFetch}`),
        { signal: AbortSignal.timeout(15_000) },
      );
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json() as { items?: BreakingItem[] };
      // 주제를 갈아탔거나 더 새 요청이 나갔으면 이 응답은 버린다.
      if (generation !== this.fetchGeneration || topicAtFetch !== this.topicId) return;

      const incoming = (data.items ?? []).filter((item) => item?.title && item?.link);
      const fresh = incoming.filter((item) => !this.seenLinks.has(item.link));
      for (const item of fresh) this.seenLinks.add(item.link);

      if (fresh.length === 0 && this.loadedOnce) {
        this.refreshTimesInPlace(); // 새 소식 없음 — 스크롤 유지하고 상대시간만 갱신
        this.setDataBadge('live');
        return;
      }

      // 새 항목을 위에 얹고 시간순 유지(첫 로드는 통짜 정렬)
      this.items = [...fresh, ...this.items]
        .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))
        .slice(0, MAX_ROWS);
      this.render(initial || !this.loadedOnce ? this.items.length : fresh.length);
      this.loadedOnce = true;
      this.setDataBadge('live');
    } catch {
      if (generation !== this.fetchGeneration) return;
      if (!this.loadedOnce) this.showError('속보를 불러오지 못했어요 — 잠시 후 다시 시도해요');
      else this.setDataBadge('cached');
    }
  }

  /** newCount = 이번 갱신에서 새로 들어온 상위 행 수(좌라락 슬라이드-인 대상). */
  private render(newCount: number): void {
    const rows = this.items.map((item, i) => {
      const isNew = i < newCount;
      const time = this.formatTime(item.publishedAt);
      // 스태거 딜레이로 "좌라락" 순차 등장 — 애니메이션은 .kcg-brk-new 에만 붙는다
      const delayMs = isNew ? Math.min(i, 14) * 70 : 0;
      return safeHtml`
        <a class="kcg-brk-item${isNew ? ' kcg-brk-new' : ''}" href="${safeUrlAttr(item.link)}" target="_blank" rel="noopener" style="animation-delay:${delayMs}ms">
          <span class="kcg-brk-time">${time}</span>
          <span class="kcg-brk-title">${item.title}</span>
          <span class="kcg-brk-src">${item.source}</span>
        </a>`;
    });
    this.setSafeContent(safeHtml`<div class="kcg-brk-list">${joinSafeHtml(rows)}</div>`);
  }

  private refreshTimesInPlace(): void {
    const nodes = this.content.querySelectorAll('.kcg-brk-item');
    nodes.forEach((node, i) => {
      const item = this.items[i];
      const timeEl = node.querySelector('.kcg-brk-time');
      if (item && timeEl) timeEl.textContent = this.formatTime(item.publishedAt);
    });
  }

  private formatTime(iso: string): string {
    const ts = Date.parse(iso);
    if (!Number.isFinite(ts)) return '';
    const diffMin = Math.max(0, Math.round((Date.now() - ts) / 60_000));
    if (diffMin < 1) return '방금';
    if (diffMin < 60) return `${diffMin}분 전`;
    const d = new Date(ts);
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  }
}
