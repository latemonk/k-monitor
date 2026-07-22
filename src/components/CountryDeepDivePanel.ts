import type { CountryBriefSignals } from '@/types';
import { getSourcePropagandaRisk, getSourceTier } from '@/config/feeds';
import { getCountryCentroid, ME_STRIKE_BOUNDS } from '@/services/country-geometry';
import type { CountryScore } from '@/services/country-instability';
import { t } from '@/services/i18n';
import { getCountryInfrastructure } from '@/services/related-assets';
import type { PredictionMarket } from '@/services/prediction';
import type { AssetType, NewsItem, RelatedAsset } from '@/types';
import { sanitizeUrl, escapeHtml } from '@/utils/sanitize';
import { computeAlternativeSuppliers, type ChokepointScoreMap, type EnrichedExporter } from '@/utils/supplier-route-risk';
import { formatIntelBrief } from '@/utils/format-intel-brief';
import { collectBriefSources, renderBriefSourcesFooter, type BriefSource } from '@/utils/brief-sources';
import { getCSSColor } from '@/utils';
import { toFlagEmoji } from '@/utils/country-flag';
import { PORTS } from '@/config/ports';
import { getChokepointRoutes } from '@/config/trade-routes';
import { STRATEGIC_WATERWAYS } from '@/config/geo';
import { fetchBypassOptions, fetchChokepointStatus } from '@/services/supply-chain';
import { koHs4Label, koHs2Label, koChokepointName, koWarRiskTier, koCountryName } from '@/utils/kcg-ko-labels';
import { haversineDistanceKm } from '@/services/related-assets';
import { enqueueSentryCall } from '@/bootstrap/sentry-defer';
import type {
  CountryBriefPanel,
  CountryIntelData,
  StockIndexData,
  CountryDeepDiveSignalDetails,
  CountryDeepDiveSignalItem,
  CountryDeepDiveMilitarySummary,
  CountryDeepDiveEconomicIndicator,
  ChinaCountrySummaryData,
  ChinaCountrySummaryGroup,
  ChinaCountrySummaryGroupId,
  CountryFactsData,
  CountryEnergyProfileData,
  CountryPortActivityData,
} from './CountryBriefPanel';
import type {
  GetCountryChokepointIndexResponse,
  SectorExposureSummary,
  CountryProductsResponse,
  CountryProduct,
  MultiSectorShockResponse,
  MultiSectorShock,
} from '@/services/supply-chain';
import { fetchMultiSectorCostShock, HS2_SHORT_LABELS } from '@/services/supply-chain';
import type { MapContainer } from './MapContainer';
import { dedupeHeadlines } from './CountryDeepDivePanel-news-utils';
import { renderFollowButton } from '@/utils/follow-button';
import { renderNotifyCountryLink } from '@/utils/notify-country-link';
import { exportCountryEvidenceMarkdown } from '@/utils/export';
import type { CountryEvidenceBundleInput } from '@/utils/export';
import { ciiBandForLevel } from './CountryDeepDivePanel-cii';

const DEPENDENCY_FLAG_LABELS: Record<string, { text: string; cls: string }> = {
  DEPENDENCY_FLAG_SINGLE_SOURCE_CRITICAL:   { text: '단일 공급원', cls: 'cdp-dep-critical' },
  DEPENDENCY_FLAG_SINGLE_CORRIDOR_CRITICAL: { text: '단일 항로',   cls: 'cdp-dep-critical' },
  DEPENDENCY_FLAG_COMPOUND_RISK:            { text: '복합 위험',   cls: 'cdp-dep-compound' },
  DEPENDENCY_FLAG_DIVERSIFIABLE:            { text: '분산 가능',   cls: 'cdp-dep-ok' },
};
import { toApiUrl } from '@/services/runtime';
import type { ComputeEnergyShockScenarioResponse, ProductImpact } from '@/generated/client/worldmonitor/intelligence/v1/service_client';
import { setTrustedHtml, trustedHtml } from '@/utils/dom-utils';


type ThreatLevel = 'critical' | 'high' | 'medium' | 'low' | 'info';
type TrendDirection = 'up' | 'down' | 'flat';

const INFRA_TYPES: AssetType[] = ['pipeline', 'cable', 'datacenter', 'base', 'nuclear'];

const INFRA_ICONS: Record<AssetType, string> = {
  pipeline: '🛢️',
  cable: '🌐',
  datacenter: '🖥️',
  base: '🛡️',
  nuclear: '☢️',
};

const SEVERITY_ORDER: Record<ThreatLevel, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
  info: 0,
};

// Clamp long disruption shortDescriptions when rendered in the compact
// CountryDeepDive Atlas row. Some registry entries (OFAC designations,
// multi-clause sanctions summaries) run 100–200 chars; without a clamp
// they overflow the row. 80 chars is a balance between scannability and
// information density; full detail stays accessible by clicking through
// to the asset drawer.
const DISRUPTION_LABEL_MAX_LEN = 80;
function truncateDisruptionLabel(eventType: string, shortDescription: string): string {
  const base = `${eventType} — ${shortDescription}`;
  if (base.length <= DISRUPTION_LABEL_MAX_LEN) return base;
  return base.slice(0, DISRUPTION_LABEL_MAX_LEN - 1) + '…';
}

export class CountryDeepDivePanel implements CountryBriefPanel {
  private panel: HTMLElement;
  private content: HTMLElement;
  private closeButton: HTMLButtonElement;
  private currentCode: string | null = null;
  private currentName: string | null = null;
  private currentScore: CountryScore | null = null;
  private currentSignals: CountryBriefSignals | null = null;
  private currentBrief: string | null = null;
  private currentBriefGeneratedAt: string | number | null = null;
  private currentBriefCached: boolean | null = null;
  private currentHeadlines: NewsItem[] = [];
  private isMaximizedState = false;
  private onCloseCallback?: () => void;
  private onStateChangeCallback?: (state: { visible: boolean; maximized: boolean }) => void;
  private onShareStory?: (code: string, name: string) => void;
  private onExportImage?: (code: string, name: string) => void;
  private map: MapContainer | null;
  private abortController: AbortController = new AbortController();
  private lastFocusedElement: HTMLElement | null = null;
  private economicIndicators: CountryDeepDiveEconomicIndicator[] = [];
  private infrastructureByType = new Map<AssetType, RelatedAsset[]>();
  private maximizeButton: HTMLButtonElement | null = null;
  private currentHeadlineCount = 0;
  private signalsBody: HTMLElement | null = null;
  private signalBreakdownBody: HTMLElement | null = null;
  private signalRecentBody: HTMLElement | null = null;
  private newsBody: HTMLElement | null = null;
  private militaryBody: HTMLElement | null = null;
  private infrastructureBody: HTMLElement | null = null;
  private economicBody: HTMLElement | null = null;
  private chinaSummaryBody: HTMLElement | null = null;
  private housingBody: HTMLElement | null = null;
  private marketsBody: HTMLElement | null = null;
  private briefBody: HTMLElement | null = null;
  private timelineBody: HTMLElement | null = null;
  private scoreCard: HTMLElement | null = null;
  private factsBody: HTMLElement | null = null;
  private resilienceWidget: import('@/components/ResilienceWidget').ResilienceWidget | null = null;
  private pendingResilienceEnergyMix: CountryEnergyProfileData | null = null;
  private resilienceWidgetRequestId = 0;
  private energyBody: HTMLElement | null = null;
  private maritimeBody: HTMLElement | null = null;
  private tradeExposureBody: HTMLElement | null = null;
  private selectedSectorHs2: string | null = null;
  private sectorBypassAbort: AbortController | null = null;
  private cachedTradeExposureData: GetCountryChokepointIndexResponse | null = null;
  private cachedSectors: SectorExposureSummary[] = [];
  private productImportsBody: HTMLElement | null = null;
  private debtBody: HTMLElement | null = null;
  private sanctionsBody: HTMLElement | null = null;
  private comtradeBody: HTMLElement | null = null;
  private tariffBody: HTMLElement | null = null;
  // ── Phase 5: Multi-sector Cost Shock Calculator ─────────────────────────
  private costShockCalcBody: HTMLElement | null = null;
  private costShockCalcTable: HTMLElement | null = null;
  private costShockCalcDurationLabel: HTMLElement | null = null;
  private costShockCalcTotalLabel: HTMLElement | null = null;
  private costShockCalcPrimaryChokepoint: string | null = null;
  private costShockCalcClosureDays = 30;
  private costShockCalcAbort: AbortController | null = null;
  private costShockCalcDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  // Holds the teardown returned by the FollowButton's `attach()` mounted
  // in the title row. The skeleton is rebuilt every `show()` call (via
  // `resetPanelContent` → `renderSkeleton`), and the panel itself is
  // long-lived (singleton on `document.body`), so this teardown must
  // fire BEFORE the skeleton is wiped and on `hide()`.
  private followButtonTeardown: (() => void) | null = null;
  // Sibling teardown for the U8 "Notify me about this country" sub-action
  // mounted alongside the FollowButton. Same lifecycle constraints.
  private notifyLinkTeardown: (() => void) | null = null;

  private readonly handleGlobalKeydown = (event: KeyboardEvent): void => {
    if (!this.panel.classList.contains('active')) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      if (this.isMaximizedState) {
        this.minimize();
      } else {
        this.hide();
      }
      return;
    }
    if (event.key !== 'Tab') return;

    const focusable = this.getFocusableElements();
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (!first || !last) return;

    const current = document.activeElement as HTMLElement | null;
    if (event.shiftKey && current === first) {
      event.preventDefault();
      last.focus();
      return;
    }
    if (!event.shiftKey && current === last) {
      event.preventDefault();
      first.focus();
    }
  };

  constructor(map: MapContainer | null = null) {
    this.map = map;
    this.panel = this.getOrCreatePanel();

    const content = this.panel.querySelector<HTMLElement>('#deep-dive-content');
    const closeButton = this.panel.querySelector<HTMLButtonElement>('#deep-dive-close');
    if (!content || !closeButton) {
      throw new Error('Country deep-dive panel structure is invalid');
    }
    this.content = content;
    this.closeButton = closeButton;

    this.closeButton.addEventListener('click', () => this.hide());

    this.panel.addEventListener('click', (e) => {
      if (this.isMaximizedState && !(e.target as HTMLElement).closest('.panel-content')) {
        this.minimize();
      }
    });
  }

  public setMap(map: MapContainer | null): void {
    this.map = map;
  }

  public setShareStoryHandler(handler: (code: string, name: string) => void): void {
    this.onShareStory = handler;
  }

  public setExportImageHandler(handler: (code: string, name: string) => void): void {
    this.onExportImage = handler;
  }

  public get signal(): AbortSignal {
    return this.abortController.signal;
  }

  public showLoading(): void {
    this.currentCode = '__loading__';
    this.currentName = null;
    this.renderLoading();
    this.open();
  }

  public showGeoError(onRetry: () => void): void {
    this.currentCode = '__error__';
    this.currentName = null;
    this.resetPanelContent();

    const wrapper = this.el('div', 'cdp-geo-error');
    wrapper.append(
      this.el('div', 'cdp-geo-error-icon', '\u26A0\uFE0F'),
      this.el('div', 'cdp-geo-error-msg', t('countryBrief.geocodeFailed')),
    );

    const actions = this.el('div', 'cdp-geo-error-actions');

    const retryBtn = this.el('button', 'cdp-geo-error-retry', t('countryBrief.retryBtn')) as HTMLButtonElement;
    retryBtn.type = 'button';
    retryBtn.addEventListener('click', () => onRetry(), { once: true });

    const closeBtn = this.el('button', 'cdp-geo-error-close', t('countryBrief.closeBtn')) as HTMLButtonElement;
    closeBtn.type = 'button';
    closeBtn.addEventListener('click', () => this.hide(), { once: true });

    actions.append(retryBtn, closeBtn);
    wrapper.append(actions);
    this.content.append(wrapper);
  }

  public show(country: string, code: string, score: CountryScore | null, signals: CountryBriefSignals): void {
    this.abortController.abort();
    this.abortController = new AbortController();
    this.currentCode = code;
    this.currentName = country;
    this.currentScore = score;
    this.currentSignals = signals;
    this.currentBrief = null;
    this.currentBriefGeneratedAt = null;
    this.currentBriefCached = null;
    this.currentHeadlines = [];
    this.currentHeadlineCount = 0;
    this.economicIndicators = [];
    this.infrastructureByType.clear();
    this.renderSkeleton(country, code, score, signals);
    this.content.scrollTop = 0;
    this.open();
  }

  public hide(): void {
    this.destroyResilienceWidget();
    this.tearDownFollowButton();
    if (this.isMaximizedState) {
      this.isMaximizedState = false;
      this.panel.classList.remove('maximized');
      if (this.maximizeButton) this.maximizeButton.textContent = '\u26F6';
    }
    this.abortController.abort();
    this.close();
    this.currentCode = null;
    this.currentName = null;
    this.currentScore = null;
    this.currentSignals = null;
    this.currentBrief = null;
    this.currentBriefGeneratedAt = null;
    this.currentBriefCached = null;
    this.currentHeadlines = [];
    this.onCloseCallback?.();
    this.onStateChangeCallback?.({ visible: false, maximized: false });
  }

  public onClose(cb: () => void): void {
    this.onCloseCallback = cb;
  }

  public onStateChange(cb: (state: { visible: boolean; maximized: boolean }) => void): void {
    this.onStateChangeCallback = cb;
  }

  public maximize(): void {
    if (this.isMaximizedState) return;
    this.isMaximizedState = true;
    this.panel.classList.add('maximized');
    if (this.maximizeButton) this.maximizeButton.textContent = '\u229F';
    this.onStateChangeCallback?.({ visible: true, maximized: true });
  }

  public minimize(): void {
    if (!this.isMaximizedState) return;
    this.isMaximizedState = false;
    this.panel.classList.remove('maximized');
    if (this.maximizeButton) this.maximizeButton.textContent = '\u26F6';
    this.onStateChangeCallback?.({ visible: true, maximized: false });
  }

  public getIsMaximized(): boolean {
    return this.isMaximizedState;
  }

  public isVisible(): boolean {
    return this.panel.classList.contains('active');
  }

  public getCode(): string | null {
    return this.currentCode;
  }

  public getName(): string | null {
    return this.currentName;
  }

  public getTimelineMount(): HTMLElement | null {
    return this.timelineBody;
  }

  public updateSignalDetails(details: CountryDeepDiveSignalDetails): void {
    if (!this.signalBreakdownBody || !this.signalRecentBody) return;
    this.renderSignalBreakdown(details);
    this.renderRecentSignals(details.recentHigh);
  }

  public updateNews(headlines: NewsItem[]): void {
    if (!this.newsBody) return;
    this.newsBody.replaceChildren();
    this.currentHeadlines = [];

    const compare = (a: NewsItem, b: NewsItem) => {
      const sa = SEVERITY_ORDER[this.toThreatLevel(a.threat?.level)];
      const sb = SEVERITY_ORDER[this.toThreatLevel(b.threat?.level)];
      if (sb !== sa) return sb - sa;
      return this.toTimestamp(b.pubDate) - this.toTimestamp(a.pubDate);
    };

    const sorted = [...headlines].sort(compare);

    const deduped = dedupeHeadlines(sorted, (it) => it.tier ?? getSourceTier(it.source))
      .sort((a, b) => compare(a.item, b.item))
      .slice(0, 10);

    this.currentHeadlineCount = deduped.length;
    this.currentHeadlines = deduped.map(({ item }) => item);

    if (deduped.length === 0) {
      this.newsBody.append(this.makeEmpty(t('countryBrief.noNews')));
      return;
    }

    for (let i = 0; i < deduped.length; i++) {
      const { item, extraSources } = deduped[i]!;
      const row = this.el('a', 'cdp-news-item');
      row.id = `cdp-news-${i + 1}`;
      const href = sanitizeUrl(item.link);
      if (href) {
        row.setAttribute('href', href);
        row.setAttribute('target', '_blank');
        row.setAttribute('rel', 'noopener');
      } else {
        row.removeAttribute('href');
      }

      const top = this.el('div', 'cdp-news-top');
      const tier = item.tier ?? getSourceTier(item.source);
      const clampedTier = Math.max(1, Math.min(4, tier));
      const tierBadge = this.badge(`출처 T${clampedTier}`, `cdp-tier-badge tier-${clampedTier}`);
      tierBadge.setAttribute('title', `출처 등급 T${clampedTier}: 매체 신뢰도를 나타내요(1=최상위 통신사, 4=전문·소규모). 기사 심각도와는 별개예요.`);
      top.append(tierBadge);

      const severity = this.toThreatLevel(item.threat?.level);
      const levelKey = severity === 'info' ? 'low' : severity === 'medium' ? 'moderate' : severity;
      const severityLabel = t(`countryBrief.levels.${levelKey}`);
      const sevBadge = this.badge(severityLabel.toUpperCase(), `cdp-severity-badge sev-${severity}`);
      sevBadge.setAttribute('title', '기사 심각도: 사건이 얼마나 심각한지예요. 출처 등급과는 별개예요.');
      top.append(sevBadge);

      const risk = getSourcePropagandaRisk(item.source);
      if (risk.stateAffiliated) {
        top.append(this.badge(`국영 매체: ${risk.stateAffiliated}`, 'cdp-state-badge'));
      }

      const title = this.el('div', 'cdp-news-title', this.decodeEntities(item.title));
      const metaText = extraSources.length > 0
        ? `${item.source} 외 ${extraSources.length}곳 • ${this.formatRelativeTime(item.pubDate)}`
        : `${item.source} • ${this.formatRelativeTime(item.pubDate)}`;
      const meta = this.el('div', 'cdp-news-meta', metaText);
      if (extraSources.length > 0) {
        meta.setAttribute('title', `함께 보도한 매체: ${extraSources.join(', ')}`);
      }
      row.append(top, title, meta);

      if (i >= 5) {
        const wrapper = this.el('div', 'cdp-expanded-only');
        wrapper.append(row);
        this.newsBody.append(wrapper);
      } else {
        this.newsBody.append(row);
      }
    }
  }


  public updateMilitaryActivity(summary: CountryDeepDiveMilitarySummary): void {
    if (!this.militaryBody) return;
    this.militaryBody.replaceChildren();

    const stats = this.el('div', 'cdp-military-grid');
    stats.append(
      this.metric(t('countryBrief.ownFlights'), String(summary.ownFlights), 'cdp-chip-neutral'),
      this.metric(t('countryBrief.foreignFlights'), String(summary.foreignFlights), summary.foreignFlights > 0 ? 'cdp-chip-danger' : 'cdp-chip-neutral'),
      this.metric(t('countryBrief.navalVessels'), String(summary.nearbyVessels), 'cdp-chip-neutral'),
      this.metric(t('countryBrief.foreignPresence'), summary.foreignPresence ? t('countryBrief.detected') : t('countryBrief.notDetected'), summary.foreignPresence ? 'cdp-chip-danger' : 'cdp-chip-success'),
    );
    this.militaryBody.append(stats);

    const basesTitle = this.el('div', 'cdp-subtitle', t('countryBrief.nearestBases'));
    this.militaryBody.append(basesTitle);

    if (summary.nearestBases.length === 0) {
      this.militaryBody.append(this.makeEmpty(t('countryBrief.noBasesNearby')));
      return;
    }

    const list = this.el('ul', 'cdp-base-list');
    for (const base of summary.nearestBases.slice(0, 3)) {
      const item = this.el('li', 'cdp-base-item');
      const left = this.el('span', 'cdp-base-name', base.name);
      const right = this.el('span', 'cdp-base-distance', `${Math.round(base.distanceKm)} km`);
      item.append(left, right);
      list.append(item);
    }
    this.militaryBody.append(list);
  }

  public updateInfrastructure(countryCode: string): void {
    if (!this.infrastructureBody) return;
    this.infrastructureBody.replaceChildren();

    const centroid = getCountryCentroid(countryCode, ME_STRIKE_BOUNDS);
    if (!centroid) {
      this.infrastructureBody.append(this.makeEmpty(t('countryBrief.noGeometry')));
      return;
    }

    const assets = getCountryInfrastructure(centroid.lat, centroid.lon, countryCode, INFRA_TYPES);
    if (assets.length === 0) {
      this.infrastructureBody.append(this.makeEmpty(t('countryBrief.noInfrastructure')));
      return;
    }

    this.infrastructureByType.clear();
    for (const type of INFRA_TYPES) {
      const matches = assets.filter((asset) => asset.type === type);
      this.infrastructureByType.set(type, matches);
    }

    const grid = this.el('div', 'cdp-infra-grid');
    for (const type of INFRA_TYPES) {
      const list = this.infrastructureByType.get(type) ?? [];
      if (list.length === 0) continue;
      const card = this.el('button', 'cdp-infra-card');
      card.setAttribute('type', 'button');
      card.addEventListener('click', () => this.highlightInfrastructure(type));

      const icon = this.el('span', 'cdp-infra-icon', INFRA_ICONS[type]);
      const label = this.el('span', 'cdp-infra-label', t(`countryBrief.infra.${type}`));
      const count = this.el('span', 'cdp-infra-count', String(list.length));
      card.append(icon, label, count);
      grid.append(card);
    }
    this.infrastructureBody.append(grid);

    const expandedDetails = this.el('div', 'cdp-expanded-only');
    for (const type of INFRA_TYPES) {
      const list = this.infrastructureByType.get(type) ?? [];
      if (list.length === 0) continue;
      const typeLabel = this.el('div', 'cdp-subtitle', `${INFRA_ICONS[type]} ${t(`countryBrief.infra.${type}`)}`);
      expandedDetails.append(typeLabel);
      const ul = this.el('ul', 'cdp-base-list');
      for (const asset of list.slice(0, 5)) {
        const li = this.el('li', 'cdp-base-item');
        li.append(
          this.el('span', 'cdp-base-name', asset.name),
          this.el('span', 'cdp-base-distance', `${Math.round(asset.distanceKm)} km`),
        );
        ul.append(li);
      }
      expandedDetails.append(ul);
    }

    const nearbyPorts = PORTS
      .map((port) => ({
        ...port,
        distanceKm: haversineDistanceKm(centroid.lat, centroid.lon, port.lat, port.lon),
      }))
      .filter((port) => port.distanceKm <= 1500)
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, 5);

    if (nearbyPorts.length > 0) {
      const portsTitle = this.el('div', 'cdp-subtitle', `\u2693 ${t('countryBrief.nearbyPorts')}`);
      expandedDetails.append(portsTitle);
      const portList = this.el('ul', 'cdp-base-list');
      for (const port of nearbyPorts) {
        const li = this.el('li', 'cdp-base-item');
        li.append(
          this.el('span', 'cdp-base-name', `${port.name} (${port.type})`),
          this.el('span', 'cdp-base-distance', `${Math.round(port.distanceKm)} km`),
        );
        portList.append(li);
      }
      expandedDetails.append(portList);
    }

    this.infrastructureBody.append(expandedDetails);
  }

  public updateEconomicIndicators(indicators: CountryDeepDiveEconomicIndicator[]): void {
    this.economicIndicators = indicators;
    this.renderEconomicIndicators();
  }

  public updateChinaCountrySummary(data: ChinaCountrySummaryData): void {
    if (this.currentCode?.toUpperCase() !== 'CN' || !this.chinaSummaryBody) return;
    this.renderChinaCountrySummary(data.groups);
  }

  public updateCountryFacts(data: CountryFactsData): void {
    if (!this.factsBody) return;
    this.factsBody.replaceChildren();

    if (!data.headOfState && !data.wikipediaSummary && data.population === 0 && !data.capital) {
      this.factsBody.append(this.makeEmpty(t('countryBrief.noFacts')));
      return;
    }

    if (data.wikipediaThumbnailUrl) {
      const img = this.el('img', 'cdp-facts-thumbnail');
      img.loading = 'lazy';
      img.referrerPolicy = 'no-referrer';
      img.src = sanitizeUrl(data.wikipediaThumbnailUrl);
      this.factsBody.append(img);
    }

    if (data.wikipediaSummary) {
      const summaryText = data.wikipediaSummary.length > 300
        ? data.wikipediaSummary.slice(0, 300) + '...'
        : data.wikipediaSummary;
      this.factsBody.append(this.el('p', 'cdp-facts-summary', summaryText));
    }

    const grid = this.el('div', 'cdp-facts-grid');

    const popStr = data.population >= 1_000_000_000
      ? `${(data.population / 1_000_000_000).toFixed(1)}B`
      : data.population >= 1_000_000
        ? `${(data.population / 1_000_000).toFixed(1)}M`
        : data.population.toLocaleString();
    grid.append(this.factItem(t('countryBrief.facts.population'), popStr));
    grid.append(this.factItem(t('countryBrief.facts.capital'), data.capital));
    grid.append(this.factItem(t('countryBrief.facts.area'), `${data.areaSqKm.toLocaleString()} km\u00B2`));

    const rawTitle = data.headOfStateTitle || '';
    const hosLabel = rawTitle.length > 30 ? t('countryBrief.facts.headOfState') : (rawTitle || t('countryBrief.facts.headOfState'));
    grid.append(this.factItem(hosLabel, data.headOfState));
    grid.append(this.factItem(t('countryBrief.facts.languages'), data.languages.join(', ')));
    grid.append(this.factItem(t('countryBrief.facts.currencies'), data.currencies.join(', ')));

    this.factsBody.append(grid);
  }

  public updateHousingCycle(data: {
    residential?: { indexValue: number; qoqChange: number | null; yoyChange: number | null; period: string } | null;
    commercial?: { indexValue: number; qoqChange: number | null; yoyChange: number | null; period: string } | null;
    dsr?: { dsrPct: number; change: number | null; period: string } | null;
  } | null): void {
    if (!this.housingBody) return;
    this.housingBody.replaceChildren();
    if (!data || (!data.residential && !data.commercial && !data.dsr)) {
      this.housingBody.append(this.makeEmpty('이 국가의 주택 경기 데이터가 없어요'));
      return;
    }
    const grid = this.el('div', 'cdp-pro-metric-grid');
    if (data.residential) {
      grid.append(
        this.proMetricBox('주택(실질)', `${data.residential.indexValue.toFixed(1)}`),
        this.proMetricBox('주택 전년 대비', this.formatPctTrend(data.residential.yoyChange)),
      );
    }
    if (data.commercial) {
      grid.append(
        this.proMetricBox('상업용(실질)', `${data.commercial.indexValue.toFixed(1)}`),
        this.proMetricBox('상업용 전년 대비', this.formatPctTrend(data.commercial.yoyChange)),
      );
    }
    if (data.dsr) {
      grid.append(
        this.proMetricBox('가계 DSR', `${data.dsr.dsrPct.toFixed(1)}%`),
        this.proMetricBox('DSR 전분기 대비', this.formatPctTrend(data.dsr.change)),
      );
    }
    this.housingBody.append(grid);
    const src = data.residential?.period || data.commercial?.period || data.dsr?.period || '';
    if (src) {
      const note = this.el('div', 'cdp-economic-source', `출처: BIS SDMX · 최신 ${src}`);
      this.housingBody.append(note);
    }
  }

  public updateNationalDebt(entry: { debtToGdp: number; debtUsd: number; annualGrowth: number; source: string } | null): void {
    if (!this.debtBody) return;
    this.debtBody.replaceChildren();
    if (!entry) {
      this.debtBody.append(this.makeEmpty('국가 부채 데이터가 없어요'));
      return;
    }
    const grid = this.el('div', 'cdp-pro-metric-grid');
    grid.append(
      this.proMetricBox('GDP 대비 부채', `${entry.debtToGdp.toFixed(1)}%`),
      this.proMetricBox('총 부채', this.formatMoney(entry.debtUsd)),
      this.proMetricBox('전년 대비 증가', this.formatPctTrend(entry.annualGrowth)),
      this.proMetricBox('출처', entry.source),
    );
    this.debtBody.append(grid);
  }

  public updateSanctionsPressure(data: { entryCount: number; sanctionsActive?: boolean } | null): void {
    if (!this.sanctionsBody) return;
    this.sanctionsBody.replaceChildren();
    if (!data) {
      this.sanctionsBody.append(this.makeEmpty('제재 데이터가 없어요'));
      return;
    }
    const grid = this.el('div', 'cdp-pro-metric-grid');
    grid.append(
      this.proMetricBox('제재 대상 수', String(data.entryCount)),
      this.proMetricBox('상태', data.sanctionsActive ? '제재 있음' : '없음'),
    );
    this.sanctionsBody.append(grid);
  }

  public updateComtradeFlows(flows: Array<{ partnerName: string; cmdDesc: string; tradeValueUsd: number; yoyChange: number }> | null): void {
    if (!this.comtradeBody) return;
    this.comtradeBody.replaceChildren();
    if (!flows || flows.length === 0) {
      this.comtradeBody.append(this.makeEmpty('데이터가 없어요'));
      return;
    }
    const table = this.el('table', 'cdp-pro-flow-table');
    const thead = this.el('thead');
    const hr = this.el('tr');
    for (const col of ['상대국', '품목', '금액', '전년 대비']) {
      hr.append(this.el('th', '', col));
    }
    thead.append(hr);
    table.append(thead);
    const tbody = this.el('tbody');
    for (const f of flows.slice(0, 5)) {
      const tr = this.el('tr');
      tr.append(this.el('td', '', f.partnerName));
      const cmdTd = this.el('td', '');
      cmdTd.textContent = f.cmdDesc.length > 25 ? f.cmdDesc.slice(0, 22) + '...' : f.cmdDesc;
      cmdTd.title = f.cmdDesc;
      tr.append(cmdTd);
      tr.append(this.el('td', '', this.formatMoney(f.tradeValueUsd)));
      const yoyTd = this.el('td', f.yoyChange >= 0 ? 'cdp-pro-trend-up' : 'cdp-pro-trend-down');
      yoyTd.textContent = this.formatPctTrend(f.yoyChange);
      tr.append(yoyTd);
      tbody.append(tr);
    }
    table.append(tbody);
    this.comtradeBody.append(table);
  }

  public updateTariffTrends(data: { currentRate: number; trend: string; datapoints: Array<{ year: number; tariffRate: number }> } | null): void {
    if (!this.tariffBody) return;
    this.tariffBody.replaceChildren();
    if (!data) {
      this.tariffBody.append(this.makeEmpty('관세 데이터가 없어요'));
      return;
    }
    const grid = this.el('div', 'cdp-pro-metric-grid');
    grid.append(
      this.proMetricBox('실효 관세율', `${data.currentRate.toFixed(2)}%`),
      this.proMetricBox('추세', data.trend === 'rising' ? '↑ 상승' : '↓ 하락'),
    );
    this.tariffBody.append(grid);
  }

  /**
   * Mount the Cost Shock Calculator with its initial data and slider.
   * Called once per country load with the first (default 30-day) response.
   */
  public updateMultiSectorCostShock(data: MultiSectorShockResponse | null): void {
    if (!this.costShockCalcBody) return;
    this.costShockCalcBody.replaceChildren();

    if (!data || (!data.sectors.length && !data.unavailableReason)) {
      // Remove the card entirely to avoid showing an empty "Cost Shock" widget
      // alongside the Trade Exposure sector table (issue #2973 bug 1).
      // sectionCard() creates a .cdp-card (not .cdp-section-card); parentElement
      // is the card wrapper. Matches the updateTradeExposure cleanup pattern.
      this.costShockCalcBody.parentElement?.remove();
      this.costShockCalcBody = null;
      return;
    }

    this.costShockCalcPrimaryChokepoint = data.chokepointId;
    this.costShockCalcClosureDays = Number.isFinite(data.closureDays) && data.closureDays > 0 ? data.closureDays : 30;

    // ── Header line: chokepoint + war risk tier badge ────────────────────
    const header = this.el('div', 'cdp-cost-shock-calc-header');
    const cpName = koChokepointName(STRATEGIC_WATERWAYS.find(w => w.id === data.chokepointId)?.name
      ?? data.chokepointId.replace(/_/g, ' '));
    header.append(this.el('span', 'cdp-cost-shock-calc-cp', `주요 요충지: ${cpName}`));
    const tierShort = data.warRiskTier.replace('WAR_RISK_TIER_', '').replace(/_/g, ' ');
    header.append(this.el('span', 'cdp-cost-shock-calc-tier', `전쟁 위험: ${koWarRiskTier(tierShort || 'NORMAL')}`));
    this.costShockCalcBody.append(header);

    // ── Slider ──────────────────────────────────────────────────────────
    const sliderWrap = this.el('div', 'cdp-cost-shock-calc-slider-wrap');
    const sliderLabel = this.el('label', 'cdp-cost-shock-calc-slider-label');
    sliderLabel.append(document.createTextNode('봉쇄 기간: '));
    this.costShockCalcDurationLabel = this.el('strong', 'cdp-cost-shock-calc-duration-value', `${this.costShockCalcClosureDays}일`);
    sliderLabel.append(this.costShockCalcDurationLabel);
    sliderWrap.append(sliderLabel);

    const slider = this.el('input', 'cdp-cost-shock-calc-slider');
    slider.type = 'range';
    slider.min = '1';
    slider.max = '90';
    slider.step = '1';
    slider.value = String(this.costShockCalcClosureDays);
    slider.setAttribute('aria-label', '요충지 봉쇄 기간(일)');
    slider.addEventListener('input', this.handleCostShockSliderInput);
    sliderWrap.append(slider);

    const ticks = this.el('div', 'cdp-cost-shock-calc-ticks');
    for (const label of ['1일', '30일', '60일', '90일']) {
      ticks.append(this.el('span', 'cdp-cost-shock-calc-tick', label));
    }
    sliderWrap.append(ticks);
    this.costShockCalcBody.append(sliderWrap);

    // ── Table ───────────────────────────────────────────────────────────
    const table = this.el('table', 'cdp-cost-shock-calc-table');
    const thead = this.el('thead');
    const headerRow = this.el('tr');
    headerRow.append(this.el('th', '', '부문'));
    headerRow.append(this.el('th', 'cdp-cost-shock-calc-cost-col', '추가 비용'));
    thead.append(headerRow);
    table.append(thead);
    const tbody = this.el('tbody');
    table.append(tbody);
    this.costShockCalcTable = tbody;
    this.costShockCalcBody.append(table);

    // ── Total row ───────────────────────────────────────────────────────
    const totalRow = this.el('div', 'cdp-cost-shock-calc-total-row');
    totalRow.append(this.el('span', 'cdp-cost-shock-calc-total-label', '합계'));
    this.costShockCalcTotalLabel = this.el('span', 'cdp-cost-shock-calc-total-value', '$0');
    totalRow.append(this.costShockCalcTotalLabel);
    this.costShockCalcBody.append(totalRow);

    if (data.unavailableReason) {
      this.costShockCalcBody.append(this.el('div', 'cdp-card-footer', data.unavailableReason));
    } else {
      this.costShockCalcBody.append(
        this.el('div', 'cdp-card-footer', '추가 비용 = 연간 수입액 × (우회 운임 상승분 + 전쟁 위험 할증) × 봉쇄 일수 ÷ 365'),
      );
    }

    this.renderMultiSectorShockRows(data.sectors);
  }

  /** Render (or re-render) just the cost-shock table rows + total. */
  private renderMultiSectorShockRows(sectors: MultiSectorShock[]): void {
    if (!this.costShockCalcTable || !this.costShockCalcTotalLabel) return;
    const tbody = this.costShockCalcTable;
    tbody.replaceChildren();

    const sorted = [...sectors].sort((a, b) => b.totalCostShock - a.totalCostShock);
    let total = 0;
    for (const s of sorted) {
      const tr = this.el('tr', 'cdp-cost-shock-calc-row');
      const labelCell = this.el('td', 'cdp-cost-shock-calc-sector', koHs2Label(s.hs2, s.hs2Label || HS2_SHORT_LABELS[s.hs2] || `HS${s.hs2}`));
      const costCell = this.el('td', 'cdp-cost-shock-calc-cost', this.formatMoney(s.totalCostShock));
      if (s.totalCostShock === 0) costCell.classList.add('cdp-cost-shock-calc-cost--zero');
      tr.append(labelCell, costCell);
      tbody.append(tr);
      total += s.totalCostShock;
    }
    this.costShockCalcTotalLabel.textContent = this.formatMoney(total);
  }

  private readonly handleCostShockSliderInput = (ev: Event): void => {
    const target = ev.target as HTMLInputElement | null;
    if (!target) return;
    const days = Math.max(1, Math.min(90, Number(target.value) || 30));
    this.costShockCalcClosureDays = days;
    if (this.costShockCalcDurationLabel) {
      this.costShockCalcDurationLabel.textContent = `${days}일`;
    }
    this.scheduleCostShockRefetch(days);
  };

  /** Debounce re-fetch by 300ms so rapid slider drags don't spam the API. */
  private scheduleCostShockRefetch(days: number): void {
    if (this.costShockCalcDebounceTimer) clearTimeout(this.costShockCalcDebounceTimer);
    this.costShockCalcDebounceTimer = setTimeout(() => {
      this.costShockCalcDebounceTimer = null;
      void this.refetchMultiSectorShock(days);
    }, 300);
  }

  private async refetchMultiSectorShock(days: number): Promise<void> {
    const iso2 = this.currentCode;
    const cp = this.costShockCalcPrimaryChokepoint;
    if (!iso2 || !cp) return;

    // Abort any in-flight fetch before starting a new one.
    this.costShockCalcAbort?.abort();
    this.costShockCalcAbort = new AbortController();
    try {
      const resp = await fetchMultiSectorCostShock(iso2, cp, days, { signal: this.costShockCalcAbort.signal });
      if (this.currentCode !== iso2) return;
      if (this.costShockCalcClosureDays !== days) return; // a newer slider move superseded this
      this.renderMultiSectorShockRows(resp.sectors);
    } catch {
      // Ignore — either aborted or transient network; leave prior values visible.
    }
  }

  private proMetricBox(label: string, value: string): HTMLElement {
    const box = this.el('div', 'cdp-pro-metric-box');
    box.append(
      this.el('div', 'cdp-pro-metric-label', label),
      this.el('div', 'cdp-pro-metric-value', value),
    );
    return box;
  }

  private formatMoney(usd: number): string {
    if (usd >= 1e12) return `$${(usd / 1e12).toFixed(1)}T`;
    if (usd >= 1e9) return `$${(usd / 1e9).toFixed(1)}B`;
    if (usd >= 1e6) return `$${(usd / 1e6).toFixed(1)}M`;
    if (usd >= 1e3) return `$${(usd / 1e3).toFixed(1)}K`;
    return `$${Math.round(usd).toLocaleString()}`;
  }

  /**
   * Format a USD value using the same scale as a reference value so row totals
   * and supplier rows share a unit suffix (issue #2973 bug 5).
   */
  private formatMoneyAtScale(usd: number, referenceUsd: number): string {
    if (referenceUsd >= 1e12) return `$${(usd / 1e12).toFixed(2)}T`;
    if (referenceUsd >= 1e9) return `$${(usd / 1e9).toFixed(2)}B`;
    if (referenceUsd >= 1e6) return `$${(usd / 1e6).toFixed(2)}M`;
    if (referenceUsd >= 1e3) return `$${(usd / 1e3).toFixed(2)}K`;
    return `$${Math.round(usd).toLocaleString()}`;
  }

  /**
   * Shared exposure-score color scale used by vuln header and row scores
   * (issue #2973 bug 4).
   */
  private static exposureScoreColor(score: number): string {
    if (score >= 70) return 'var(--danger, #ef4444)';
    if (score > 30) return 'var(--warning, #f59e0b)';
    return 'var(--text-muted, #64748b)';
  }

  private formatPctTrend(pct: number | null | undefined): string {
    if (pct == null || !Number.isFinite(pct)) return '\u2014';
    const sign = pct >= 0 ? '+' : '';
    return `${sign}${pct.toFixed(1)}%`;
  }

  public updateEnergyProfile(data: CountryEnergyProfileData): void {
    if (!this.energyBody) return;
    this.renderEnergyProfile(data);
    this.pendingResilienceEnergyMix = data;
    this.resilienceWidget?.setEnergyMix(data);
  }

  private renderEnergyProfile(data: CountryEnergyProfileData): void {
    if (!this.energyBody) return;
    this.energyBody.replaceChildren();

    const hasAny = data.mixAvailable || data.jodiOilAvailable || data.ieaStocksAvailable
      || data.jodiGasAvailable || data.gasStorageAvailable || data.electricityAvailable
      || data.emberAvailable || data.sprAvailable;

    if (!hasAny) {
      this.energyBody.append(this.makeEmpty('이 국가의 에너지 데이터가 없어요.'));
      return;
    }

    if (data.mixAvailable) {
      const segments: Array<{ label: string; color: string; value: number }> = [
        { label: '석탄', color: '#6b6b6b', value: data.coalShare },
        { label: '석유', color: '#8B4513', value: data.oilShare },
        { label: '가스', color: '#D2691E', value: data.gasShare },
        { label: '원자력', color: '#6A0DAD', value: data.nuclearShare },
        { label: '수력', color: '#1E90FF', value: data.hydroShare },
        { label: '풍력', color: '#87CEEB', value: data.windShare },
        { label: '태양광', color: '#FFD700', value: data.solarShare },
        { label: '기타 재생', color: '#32CD32', value: Math.max(0, data.renewShare - data.windShare - data.solarShare - data.hydroShare) },
      ];

      const total = segments.reduce((s, seg) => s + seg.value, 0);
      const norm = total > 0 ? total : 1;

      const wrap = this.el('div', 'cdp-energy-donut-wrap');
      wrap.append(this.buildDonutSvg(segments, norm, '1차\n에너지'));
      const legend = this.el('div', 'cdp-energy-legend');
      for (const seg of segments) {
        const pct = (seg.value / norm) * 100;
        if (pct <= 0.5) continue;
        const row = this.el('div', 'cdp-energy-legend-row');
        const dot = this.el('span', 'cdp-energy-legend-dot');
        dot.style.background = seg.color;
        const label = this.el('span', '', `${seg.label}  ${Math.round(pct)}%`);
        row.append(dot, label);
        legend.append(row);
      }
      wrap.append(legend);
      this.energyBody.append(wrap);

      const src = this.el('div', 'cdp-economic-source', `데이터: ${data.mixYear}(OWID)`);
      this.energyBody.append(src);
    }

    if (data.mixAvailable) {
      const importPct = data.importShare;
      const color = importPct > 60 ? '#ef4444'
        : importPct >= 30 ? '#f59e0b'
        : importPct > 0 ? '#22c55e'
        : '#6b7280';
      const labelText = importPct <= 0 ? '순수출국' : `${Math.round(importPct)}%`;
      const row = this.el('div', '');
      row.style.cssText = 'display:flex;align-items:center;gap:6px;margin-top:6px';
      const label = this.el('span', 'cdp-economic-source', '수입 의존도:');
      const badge = this.el('span', '');
      badge.style.cssText = `background:${color};color:#fff;padding:1px 6px;border-radius:3px;font-size:11px`;
      badge.textContent = labelText;
      row.append(label, badge);
      this.energyBody.append(row);
    }

    if (data.jodiOilAvailable) {
      const section = this.el('div', '');
      section.style.cssText = 'margin-top:10px';
      section.append(this.el('div', 'cdp-subtitle', `석유제품 수급(${data.jodiOilDataMonth})`));

      const table = this.el('table', '');
      table.style.cssText = 'width:100%;font-size:11px;border-collapse:collapse';

      const thead = this.el('thead', '');
      const hr = this.el('tr', '');
      for (const h of ['품목', '수요', '수입']) {
        const th = this.el('th', '');
        th.textContent = h;
        th.style.cssText = 'text-align:left;color:#aaa;padding:2px 4px';
        hr.append(th);
      }
      thead.append(hr);
      table.append(thead);

      const tbody = this.el('tbody', '');
      const rows: Array<{ label: string; demand: number; imports: number }> = [
        { label: '휘발유', demand: data.gasolineDemandKbd, imports: data.gasolineImportsKbd },
        { label: '경유', demand: data.dieselDemandKbd, imports: data.dieselImportsKbd },
        { label: '항공유', demand: data.jetDemandKbd, imports: data.jetImportsKbd },
        { label: 'LPG', demand: data.lpgDemandKbd, imports: data.lpgImportsKbd },
      ];
      for (const r of rows) {
        const tr = this.el('tr', '');
        const fmtKbd = (v: number) => v > 0 ? `${v} kbd` : '\u2014';
        for (const val of [r.label, fmtKbd(r.demand), fmtKbd(r.imports)]) {
          const td = this.el('td', '');
          td.textContent = val;
          td.style.cssText = 'padding:2px 4px';
          tr.append(td);
        }
        tbody.append(tr);
      }
      if (data.crudeImportsKbd > 0) {
        const tr = this.el('tr', '');
        for (const val of ['원유', '\u2014', `${data.crudeImportsKbd} kbd`]) {
          const td = this.el('td', '');
          td.textContent = val;
          td.style.cssText = 'padding:2px 4px';
          tr.append(td);
        }
        tbody.append(tr);
      }
      table.append(tbody);
      section.append(table);
      section.append(this.el('div', 'cdp-economic-source', '출처: JODI'));
      this.energyBody.append(section);
    }

    if (data.jodiGasAvailable) {
      const totalBcm = Math.round(data.gasTotalDemandTj / 36000);
      const lngShare = data.gasLngShare;
      const pipeShare = Math.max(0, 100 - lngShare);
      const lngColor = lngShare > 80 ? '#ef4444' : lngShare >= 40 ? '#f59e0b' : '#22c55e';

      const section = this.el('div', '');
      section.style.cssText = 'margin-top:10px';
      const row = this.el('div', '');
      row.style.cssText = 'display:flex;align-items:center;gap:6px;flex-wrap:wrap;font-size:12px';

      const gasLabel = this.el('span', '', `가스 수요: 연 ${totalBcm} BCM`);
      const lngBadge = this.el('span', '');
      lngBadge.style.cssText = `background:${lngColor};color:#fff;padding:1px 5px;border-radius:3px;font-size:11px`;
      lngBadge.textContent = `LNG ${lngShare.toFixed(0)}%`;
      const pipeBadge = this.el('span', '');
      pipeBadge.style.cssText = 'background:#6b7280;color:#fff;padding:1px 5px;border-radius:3px;font-size:11px';
      pipeBadge.textContent = `파이프라인 ${pipeShare.toFixed(0)}%`;

      row.append(gasLabel, lngBadge, pipeBadge);
      section.append(row);
      this.energyBody.append(section);
    }

    if (data.ieaStocksAvailable) {
      const section = this.el('div', '');
      section.style.cssText = 'margin-top:10px';

      if (data.ieaNetExporter) {
        const msg = this.el('div', '');
        msg.style.cssText = 'color:#22c55e;font-size:12px';
        msg.textContent = 'IEA 석유 비축: 순수출국';
        section.append(msg);
      } else {
        const coverLabel = this.el('div', '');
        coverLabel.style.cssText = 'font-size:12px;margin-bottom:4px;display:flex;align-items:center;gap:6px';
        const txt = this.el('span', '', `IEA 석유 비축: ${data.ieaDaysOfCover}일치`);
        coverLabel.append(txt);

        if (data.ieaBelowObligation) {
          const warn = this.el('span', '');
          warn.style.cssText = 'background:#ef4444;color:#fff;padding:1px 5px;border-radius:3px;font-size:11px';
          warn.textContent = '90일 의무 기준 미달';
          coverLabel.append(warn);
        }
        section.append(coverLabel);

        const barOuter = this.el('div', '');
        barOuter.style.cssText = 'position:relative;width:100%;height:8px;border-radius:4px;background:#374151;overflow:visible';
        const fillPct = Math.min(data.ieaDaysOfCover / 180 * 100, 100);
        const fill = this.el('div', '');
        fill.style.cssText = `width:${fillPct}%;height:100%;background:#3b82f6;border-radius:4px`;
        const marker = this.el('div', '');
        marker.style.cssText = 'position:absolute;top:-2px;left:50%;width:2px;height:12px;background:#f59e0b;transform:translateX(-50%)';
        barOuter.append(fill, marker);
        section.append(barOuter);
      }
      this.energyBody.append(section);
    }

    if (data.sprAvailable && data.sprRegime === 'government_spr' && !data.sprIeaMember) {
      const section = this.el('div', '');
      section.style.cssText = 'margin-top:10px';
      const row = this.el('div', '');
      row.style.cssText = 'display:flex;align-items:center;gap:6px;flex-wrap:wrap;font-size:12px';
      const badge = this.el('span', '');
      badge.style.cssText = 'background:#3b82f6;color:#fff;padding:1px 6px;border-radius:3px;font-size:11px';
      const capText = data.sprCapacityMb > 0 ? ` (${data.sprCapacityMb}Mb)` : '';
      badge.textContent = `전략 비축: ${data.sprOperator || '정부 비축'}${capText}`;
      row.append(badge);
      section.append(row);
      this.energyBody.append(section);
    } else if (data.sprAvailable && data.sprRegime === 'spare_capacity') {
      const section = this.el('div', '');
      section.style.cssText = 'margin-top:10px';
      const muted = this.el('div', '');
      muted.style.cssText = 'color:#6b7280;font-size:11px';
      muted.textContent = '여유 생산능력 보유국(공식 비축 없음)';
      section.append(muted);
      this.energyBody.append(section);
    } else if (data.sprAvailable && data.sprRegime === 'none') {
      const note = this.el('div', 'cdp-economic-source');
      note.style.cssText += ';color:#ef4444;opacity:0.7';
      note.textContent = '알려진 전략 석유 비축 제도가 없어요';
      this.energyBody.append(note);
    }

    const hasLiveSignals = data.gasStorageAvailable || data.electricityAvailable;
    if (hasLiveSignals) {
      const section = this.el('div', '');
      section.style.cssText = 'margin-top:10px';
      section.append(this.el('div', 'cdp-subtitle', '실시간 신호'));

      if (data.gasStorageAvailable) {
        const row = this.el('div', '');
        row.style.cssText = 'font-size:12px;margin-bottom:4px';
        const deltaSign = data.gasStorageChange1d >= 0 ? '+' : '';
        row.textContent = `EU 가스 저장: ${data.gasStorageFillPct.toFixed(1)}%(오늘 ${deltaSign}${data.gasStorageChange1d.toFixed(1)}%, ${data.gasStorageTrend}) · ${data.gasStorageDate} 기준`;
        section.append(row);
      }

      if (data.electricityAvailable) {
        const row = this.el('div', '');
        row.style.cssText = 'font-size:12px';
        row.textContent = `전기 요금: \u20AC${data.electricityPriceMwh.toFixed(1)}/MWh · ${data.electricityDate} 기준`;
        section.append(row);
      }
      this.energyBody.append(section);
    }

    if (data.emberAvailable) {
      const section = this.el('div', '');
      section.style.cssText = 'margin-top:10px';
      const monthLabel = data.emberDataMonth || '최신';
      section.append(this.el('div', 'cdp-subtitle', `월간 발전 구성(${monthLabel})`));

      const segments: Array<{ label: string; color: string; value: number }> = [
        { label: '화석', color: '#8B4513', value: data.emberFossilShare },
        { label: '재생에너지', color: '#22c55e', value: data.emberRenewShare },
        { label: '원자력', color: '#6A0DAD', value: data.emberNuclearShare },
      ];
      const total = segments.reduce((acc, seg) => acc + seg.value, 0);
      const norm = total > 0 ? total : 1;

      const wrap = this.el('div', 'cdp-energy-donut-wrap');
      wrap.append(this.buildDonutSvg(segments, norm, '월간\n구성'));
      const legend = this.el('div', 'cdp-energy-legend');
      for (const seg of segments) {
        const pct = (seg.value / norm) * 100;
        if (pct <= 0.5) continue;
        const row = this.el('div', 'cdp-energy-legend-row');
        const dot = this.el('span', 'cdp-energy-legend-dot');
        dot.style.background = seg.color;
        const label = this.el('span', '', `${seg.label}  ${Math.round(pct)}%`);
        row.append(dot, label);
        legend.append(row);
      }
      wrap.append(legend);
      section.append(wrap);

      if (data.emberCoalShare > 0 || data.emberGasShare > 0) {
        const breakdown = this.el('div', '');
        breakdown.style.cssText = 'font-size:11px;color:#aaa;margin-top:4px';
        const parts: string[] = [];
        const fossilR = Math.round(data.emberFossilShare);
        let coalR = Math.round(data.emberCoalShare);
        let gasR = Math.round(data.emberGasShare);
        // Fossil may include oil-burn and other minor categories not surfaced as separate shares;
        // allocate the residual to "Other" so the breakdown sums to the Fossil legend value (see #2971).
        // If independent rounding pushes coal+gas above fossilR, trim the larger of the two so
        // the breakdown never sums above the Fossil legend.
        const overshoot = (coalR + gasR) - fossilR;
        if (overshoot > 0) {
          if (coalR >= gasR) coalR -= overshoot;
          else gasR -= overshoot;
        }
        const otherR = fossilR - coalR - gasR;
        if (coalR > 0) parts.push(`석탄 ${coalR}%`);
        if (gasR > 0) parts.push(`가스 ${gasR}%`);
        if (otherR > 0) parts.push(`기타 ${otherR}%`);
        breakdown.textContent = `화석 연료 구성: ${parts.join(', ')}`;
        section.append(breakdown);
      }

      if (data.emberDemandTwh > 0) {
        const demand = this.el('div', '');
        demand.style.cssText = 'font-size:11px;color:#aaa;margin-top:2px';
        demand.textContent = `총 수요: ${data.emberDemandTwh.toFixed(1)} TWh`;
        section.append(demand);
      }

      section.append(this.el('div', 'cdp-economic-source', '출처: Ember Climate(월간)'));
      this.energyBody!.append(section);
    }

    if (data.jodiOilAvailable || data.jodiGasAvailable) {
      this.energyBody.append(this.renderShockScenarioWidget());
    }

    // Atlas exposure: pipelines, storage, shortages, disruptions filtered
    // to this country. Reads from the same bootstrap-hydrated stores as
    // the Energy Atlas variant, so the count is free when data is warm
    // and silently absent when a user is on a variant that doesn't
    // pre-hydrate those keys.
    this.renderAtlasExposure();
  }

  private renderAtlasExposure(): void {
    if (!this.energyBody) return;
    const iso2 = this.currentCode;
    if (!iso2 || iso2.length !== 2) return;

    // Late-import so non-energy variants can tree-shake these modules at
    // build time if the Atlas panels aren't bundled. Static imports are
    // safe here because all four stores are pure client caches.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    import('@/shared/pipeline-registry-store').then(({ getCachedPipelineRegistries }) => {
      const { gas, oil } = getCachedPipelineRegistries() as {
        gas: { pipelines?: Record<string, { fromCountry?: string; toCountry?: string; transitCountries?: string[]; name?: string; id?: string }> } | undefined;
        oil: { pipelines?: Record<string, { fromCountry?: string; toCountry?: string; transitCountries?: string[]; name?: string; id?: string }> } | undefined;
      };
      const touches = (p: { fromCountry?: string; toCountry?: string; transitCountries?: string[] }): boolean =>
        p.fromCountry === iso2 || p.toCountry === iso2 ||
        (Array.isArray(p.transitCountries) && p.transitCountries.includes(iso2));
      const pipes = [
        ...Object.values(gas?.pipelines ?? {}).filter(touches),
        ...Object.values(oil?.pipelines ?? {}).filter(touches),
      ];
      if (pipes.length > 0) {
        this.appendAtlasRow(
          `${iso2} 경유 파이프라인`,
          `${pipes.length}개`,
          pipes.map(p => ({
            id: p.id || '',
            label: p.name || p.id || '',
            event: 'energy:open-pipeline-detail',
            detail: { pipelineId: p.id },
          })),
        );
      }
    }).catch(() => {});

    import('@/shared/storage-facility-registry-store').then(({ getCachedStorageFacilityRegistry }) => {
      const { registry } = getCachedStorageFacilityRegistry() as {
        registry: { facilities?: Record<string, { country?: string; name?: string; id?: string }> } | undefined;
      };
      const facilities = Object.values(registry?.facilities ?? {}).filter(f => f.country === iso2);
      if (facilities.length > 0) {
        this.appendAtlasRow(
          `${iso2} 저장시설`,
          `${facilities.length}곳`,
          facilities.map(f => ({
            id: f.id || '',
            label: f.name || f.id || '',
            event: 'energy:open-storage-facility-detail',
            detail: { facilityId: f.id },
          })),
        );
      }
    }).catch(() => {});

    import('@/shared/fuel-shortage-registry-store').then(({ getCachedFuelShortageRegistry }) => {
      const { registry } = getCachedFuelShortageRegistry() as {
        registry: { shortages?: Record<string, { country?: string; product?: string; severity?: string; id?: string; shortDescription?: string; resolvedAt?: string | null }> } | undefined;
      };
      // Exclude resolved shortages — the drill-down counts ACTIVE crises
      // per country, and rendering resolved rows as active inflates the
      // confirmed/watch severity line. Classifier writes resolvedAt on
      // resolution; raw seed uses null.
      const shortages = Object.values(registry?.shortages ?? {})
        .filter(s => s.country === iso2 && !s.resolvedAt);
      if (shortages.length > 0) {
        const confirmedCount = shortages.filter(s => s.severity === 'confirmed').length;
        const severityLine = confirmedCount > 0
          ? `확인 ${confirmedCount} · 관찰 ${shortages.length - confirmedCount}`
          : `관찰 ${shortages.length}`;
        this.appendAtlasRow(
          `${iso2} 연료 부족`,
          severityLine,
          shortages.map(s => ({
            id: s.id || '',
            label: `${s.product || ''} — ${s.shortDescription || ''}`.trim(),
            event: 'energy:open-fuel-shortage-detail',
            detail: { shortageId: s.id },
          })),
        );
      }
    }).catch(() => {});

    // Disruptions filter (plan §R/#5 decision B). The seeded registry carries
    // denormalised `countries[]` on every event, populated from the referenced
    // pipeline or storage facility. We fetch the full list once (no asset
    // filter) and narrow client-side; the bootstrap payload already contains
    // the registry so this is usually cache-hot. If the RPC round-trip returns
    // nothing, we silently skip — CountryDeepDive is not the primary
    // disruption surface (EnergyDisruptionsPanel is), so an empty row is
    // preferable to a spurious error.
    this.loadDisruptionsForCountry(iso2);
  }

  private async loadDisruptionsForCountry(iso2: string): Promise<void> {
    try {
      const { SupplyChainServiceClient } = await import(
        '@/generated/client/worldmonitor/supply_chain/v1/service_client'
      );
      const { getRpcBaseUrl } = await import('@/services/rpc-client');
      // Thread the panel's `signal` into the fetch shim so a country
      // switch or panel close cancels the in-flight request, not just
      // discards the result via the `this.currentCode !== iso2` guard
      // below. Codex P2 on PR #3377.
      const abortSignal = this.signal;
      const client = new SupplyChainServiceClient(getRpcBaseUrl(), {
        fetch: (input, init) => globalThis.fetch(input, { ...(init ?? {}), signal: abortSignal }),
      });
      const res = await client.listEnergyDisruptions({
        assetId: '',
        assetType: '',
        ongoingOnly: false,
      });
      if (!res || !Array.isArray(res.events) || this.currentCode !== iso2) return;
      const events = res.events.filter(e =>
        Array.isArray(e.countries) && e.countries.includes(iso2),
      );
      if (events.length === 0) return;
      const ongoing = events.filter(e => !e.endAt).length;
      const summary = ongoing > 0
        ? `진행 중 ${ongoing} · 종결 ${events.length - ongoing}`
        : `종결 ${events.length}`;
      this.appendAtlasRow(
        `${iso2} 에너지 차질`,
        summary,
        events.map(e => ({
          id: e.id,
          // Clamp long descriptions (some registry entries run 100-200
          // chars, e.g. OFAC designation paragraphs) so the row layout
          // stays compact. 80-char limit + ellipsis. Codex P2 on PR #3377.
          label: truncateDisruptionLabel(e.eventType, e.shortDescription),
          // Event type mirrors the existing asset-detail events (pipeline /
          // storage) because disruptions reference the underlying asset; the
          // panel-layout listener routes to the matching asset panel.
          event: e.assetType === 'storage'
            ? 'energy:open-storage-facility-detail'
            : 'energy:open-pipeline-detail',
          // Emit ONLY the {pipelineId, facilityId} the drawers consume today
          // (see PipelineStatusPanel + StorageFacilityMapPanel
          // openDetailHandler). Previously this detail included a
          // `highlightEventId` that no receiver read — Codex P2 flagged the
          // misleading API surface. Clicking a row jumps to the asset
          // drawer; the user sees the full per-asset timeline and locates
          // the event visually. Re-add `highlightEventId` here and in
          // EnergyDisruptionsPanel's dispatchOpenAsset only when the
          // drawer panels ship matching consumer code.
          detail: e.assetType === 'storage'
            ? { facilityId: e.assetId }
            : { pipelineId: e.assetId },
        })),
      );
    } catch {
      // Silent — disruptions row is supplementary; failures elsewhere
      // surface via the dedicated EnergyDisruptionsPanel. Abort errors
      // from signal cancellation are also swallowed here intentionally.
    }
  }

  private appendAtlasRow(
    title: string,
    summary: string,
    items: Array<{ id: string; label: string; event: string; detail: Record<string, string | undefined> }>,
  ): void {
    if (!this.energyBody || items.length === 0) return;
    const section = this.el('div', '');
    section.style.cssText = 'margin-top:10px;padding-top:8px;border-top:1px solid rgba(255,255,255,0.06)';
    const header = this.el('div', '');
    header.style.cssText = 'display:flex;justify-content:space-between;align-items:baseline;margin-bottom:4px';
    header.append(this.el('div', 'cdp-subtitle', title));
    header.append(this.el('div', 'cdp-economic-source', summary));
    section.append(header);
    for (const it of items.slice(0, 5)) {
      const row = this.el('div', '');
      row.style.cssText = 'font-size:11px;color:#ddd;padding:2px 0;cursor:pointer';
      row.textContent = it.label || it.id;
      row.addEventListener('click', () => {
        if (!it.id) return;
        try {
          window.dispatchEvent(new CustomEvent(it.event, { detail: it.detail }));
        } catch { /* Non-browser runtime no-op */ }
      });
      section.append(row);
    }
    if (items.length > 5) {
      const more = this.el('div', 'cdp-economic-source', `외 ${items.length - 5}건`);
      section.append(more);
    }
    this.energyBody.append(section);
  }

  private buildDonutSvg(
    segments: Array<{ label: string; color: string; value: number }>,
    norm: number,
    centerText: string,
  ): HTMLElement {
    const size = 120;
    const r = 46;
    const stroke = 18;
    const cx = size / 2;
    const cy = size / 2;
    const circ = 2 * Math.PI * r;

    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('width', String(size));
    svg.setAttribute('height', String(size));
    svg.setAttribute('viewBox', `0 0 ${size} ${size}`);

    let offset = 0;
    for (const seg of segments) {
      const pct = (seg.value / norm) * 100;
      if (pct <= 0.5) continue;
      const dash = (pct / 100) * circ;
      const gap = circ - dash;
      const circle = document.createElementNS(ns, 'circle');
      circle.setAttribute('cx', String(cx));
      circle.setAttribute('cy', String(cy));
      circle.setAttribute('r', String(r));
      circle.setAttribute('fill', 'none');
      circle.setAttribute('stroke', seg.color);
      circle.setAttribute('stroke-width', String(stroke));
      circle.setAttribute('stroke-dasharray', `${dash} ${gap}`);
      circle.setAttribute('stroke-dashoffset', String(-offset));
      svg.append(circle);
      offset += dash;
    }

    const wrap = this.el('div', 'cdp-energy-donut');
    wrap.append(svg);
    const label = this.el('div', 'cdp-energy-donut-label');
    label.textContent = centerText;
    wrap.append(label);
    return wrap;
  }

  private renderShockScenarioWidget(): HTMLElement {
    const wrapper = this.el('div', '');
    wrapper.style.cssText = 'margin-top:12px;border-top:1px solid #374151;padding-top:10px';

    const title = this.el('div', 'cdp-subtitle', '충격 시나리오');
    wrapper.append(title);

    const controls = this.el('div', '');
    controls.style.cssText = 'display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin-top:6px';

    const chokepointSelect = this.el('select', '') as HTMLSelectElement;
    chokepointSelect.style.cssText = 'background:#1f2937;color:#e5e7eb;border:1px solid #374151;border-radius:4px;padding:3px 6px;font-size:11px';
    const chopkpts: Array<[string, string]> = [['hormuz_strait', '호르무즈 해협'], ['malacca_strait', '믈라카 해협'], ['suez', '수에즈 운하'], ['bab_el_mandeb', '바브엘만데브 해협']];
    for (const [cpValue, cpLabel] of chopkpts) {
      const opt = this.el('option', '') as HTMLOptionElement;
      opt.value = cpValue;
      opt.textContent = cpLabel;
      chokepointSelect.append(opt);
    }

    const disruptionSelect = this.el('select', '') as HTMLSelectElement;
    disruptionSelect.style.cssText = 'background:#1f2937;color:#e5e7eb;border:1px solid #374151;border-radius:4px;padding:3px 6px;font-size:11px';
    for (const pct of [25, 50, 75, 100]) {
      const opt = this.el('option', '') as HTMLOptionElement;
      opt.value = String(pct);
      opt.textContent = `${pct}% 차질`;
      disruptionSelect.append(opt);
    }

    const fuelModeSelect = this.el('select', '') as HTMLSelectElement;
    fuelModeSelect.style.cssText = disruptionSelect.style.cssText;
    for (const [val, label] of [['oil', '석유'], ['gas', '가스(LNG)'], ['both', '둘 다']] as const) {
      const opt = this.el('option', '') as HTMLOptionElement;
      opt.value = val;
      opt.textContent = label;
      fuelModeSelect.append(opt);
    }

    const computeBtn = this.el('button', 'cdp-action-btn') as HTMLButtonElement;
    computeBtn.type = 'button';
    computeBtn.textContent = '계산';
    computeBtn.style.cssText += ';font-size:11px;padding:3px 8px';

    const coverageBadge = this.el('span', '');
    coverageBadge.style.cssText = 'display:none;font-size:10px;padding:2px 5px;border-radius:3px;font-weight:600';

    controls.append(chokepointSelect, disruptionSelect, fuelModeSelect, computeBtn, coverageBadge);
    wrapper.append(controls);

    const resultArea = this.el('div', '');
    resultArea.style.cssText = 'margin-top:8px';
    wrapper.append(resultArea);

    computeBtn.addEventListener('click', () => {
      const code = this.currentCode;
      if (!code) return;
      const chokepoint = chokepointSelect.value;
      const disruption = parseInt(disruptionSelect.value, 10);

      resultArea.replaceChildren();
      const loading = this.el('div', 'cdp-economic-source', '계산 중…');
      resultArea.append(loading);
      computeBtn.disabled = true;
      coverageBadge.style.display = 'none';
      coverageBadge.textContent = '';

      const url = toApiUrl(`/api/intelligence/v1/compute-energy-shock?country_code=${encodeURIComponent(code)}&chokepoint_id=${encodeURIComponent(chokepoint)}&disruption_pct=${disruption}&fuel_mode=${encodeURIComponent(fuelModeSelect.value)}`);
      globalThis.fetch(url)
        .then((r) => r.json() as Promise<ComputeEnergyShockScenarioResponse>)
        .then((result) => {
          resultArea.replaceChildren();
          resultArea.append(this.renderShockResult(result));
          const lvl = result.coverageLevel ?? '';
          if (lvl) {
            const colors: Record<string, string> = {
              full: 'background:#15803d;color:#dcfce7',
              partial: 'background:#b45309;color:#fef3c7',
              unsupported: 'background:#b91c1c;color:#fee2e2',
            };
            coverageBadge.style.cssText = `display:inline-block;font-size:10px;padding:2px 5px;border-radius:3px;font-weight:600;${colors[lvl] ?? ''}`;
            coverageBadge.textContent = ({ full: '전체', partial: '부분', unsupported: '미지원' } as Record<string, string>)[lvl] ?? lvl;
          } else {
            coverageBadge.style.display = 'none';
          }
        })
        .catch(() => {
          resultArea.replaceChildren();
          resultArea.append(this.el('div', 'cdp-economic-source', '시나리오 계산에 실패했어요.'));
        })
        .finally(() => {
          computeBtn.disabled = false;
        });
    });

    return wrapper;
  }

  private renderShockResult(result: ComputeEnergyShockScenarioResponse): HTMLElement {
    const container = this.el('div', '');

    if (!result.dataAvailable && !(result as any).gasImpact?.dataAvailable) {
      container.append(this.el('div', 'cdp-economic-source', result.assessment));
      return container;
    }

    if (result.degraded) {
      const warn = this.el('div', '');
      warn.style.cssText = 'font-size:10px;color:#f59e0b;margin-bottom:6px;padding:3px 6px;background:#1c1400;border-radius:3px';
      warn.textContent = '실시간 흐름 데이터가 없어 과거 기준으로 계산했어요';
      container.append(warn);
    }

    if (result.products.length > 0) {
      // Live flow ratio is a chokepoint-level figure, not a per-product one. Surface it once
      // as a note instead of repeating the same value across every row (see #2971).
      if (result.portwatchCoverage && result.liveFlowRatio != null) {
        const note = this.el('div', '');
        note.style.cssText = 'font-size:10px;color:#aaa;margin-bottom:4px';
        note.textContent = `현재 통과 흐름(평시 대비): ${Math.round(result.liveFlowRatio * 100)}%`;
        container.append(note);
      }

      const table = this.el('table', '');
      table.style.cssText = 'width:100%;font-size:11px;border-collapse:collapse;margin-bottom:6px';
      const thead = this.el('thead', '');
      const hr = this.el('tr', '');
      const headers = ['품목', '수요', '손실', '부족'];
      for (const h of headers) {
        const th = this.el('th', '');
        th.textContent = h;
        th.style.cssText = 'text-align:left;color:#aaa;padding:2px 4px';
        hr.append(th);
      }
      thead.append(hr);
      table.append(thead);

      const tbody = this.el('tbody', '');
      for (const p of result.products as ProductImpact[]) {
        const tr = this.el('tr', '');
        const defColor = p.deficitPct > 30 ? '#ef4444' : p.deficitPct > 10 ? '#f59e0b' : '#22c55e';
        const cells = [
          p.product,
          `${p.demandKbd} kbd`,
          `${p.outputLossKbd} kbd`,
          `${p.deficitPct.toFixed(1)}%`,
        ];
        cells.forEach((val, i) => {
          const td = this.el('td', '');
          td.textContent = val;
          td.style.cssText = `padding:2px 4px${i === 3 ? `;color:${defColor}` : ''}`;
          tr.append(td);
        });
        tbody.append(tr);
      }
      table.append(tbody);
      container.append(table);
    }

    if (result.ieaStocksCoverage) {
      const coverRow = this.el('div', 'cdp-economic-source');
      coverRow.style.cssText += ';margin-bottom:4px';
      let coverText: string;
      if (result.effectiveCoverDays < 0) {
        coverText = '석유 순수출국 — 전략 비축 일수는 해당 없어요';
      } else if (result.effectiveCoverDays > 0) {
        coverText = `IEA 비축: 이 시나리오에서 약 ${result.effectiveCoverDays}일치`;
      } else {
        coverText = 'IEA 비축: 0일(이 시나리오에서 비축 소진)';
      }
      coverRow.textContent = coverText;
      container.append(coverRow);
    }

    const assessmentEl = this.el('div', '');
    assessmentEl.style.cssText = 'font-size:11px;color:#d1d5db;line-height:1.4;margin-top:4px';
    assessmentEl.textContent = result.assessment;
    container.append(assessmentEl);

    if (result.limitations && result.limitations.length > 0) {
      const details = this.el('details', '') as HTMLDetailsElement;
      details.style.cssText = 'margin-top:6px;font-size:10px;color:#9ca3af';
      const summary = this.el('summary', '');
      summary.style.cssText = 'cursor:pointer;color:#6b7280';
      summary.textContent = '모델 가정';
      details.append(summary);
      const ul = this.el('ul', '');
      ul.style.cssText = 'margin:4px 0 0 12px;padding:0;list-style:disc';
      for (const lim of result.limitations) {
        const li = this.el('li', '');
        li.textContent = lim;
        ul.append(li);
      }
      details.append(ul);
      container.append(details);
    }

    if (result.gasImpact?.dataAvailable) {
      const gi = result.gasImpact;
      const gasSection = this.el('div', '');
      gasSection.style.cssText = 'margin-top:10px;border-top:1px solid #374151;padding-top:8px';

      const gasTitle = this.el('div', '');
      gasTitle.style.cssText = 'font-size:11px;font-weight:600;color:#e5e7eb;margin-bottom:4px';
      gasTitle.textContent = '가스/LNG 영향';
      gasSection.append(gasTitle);

      const metrics = this.el('div', 'cdp-economic-source');
      metrics.textContent = `LNG 비중: ${(gi.lngShareOfImports * 100).toFixed(0)}% | 차질: ${gi.lngDisruptionTj.toFixed(0)} TJ | 부족: ${gi.deficitPct.toFixed(1)}%`;
      gasSection.append(metrics);

      if (gi.storage) {
        const s = gi.storage;
        const storageDiv = this.el('div', 'cdp-economic-source');
        storageDiv.style.cssText += ';margin-top:4px';
        storageDiv.textContent = `가스 저장: ${s.fillPct.toFixed(1)}%(${s.gasTwh.toFixed(0)} TWh), 여유 약 ${s.bufferDays}일, ${s.trend}(${s.scope})`;
        gasSection.append(storageDiv);
      }

      const srcBadge = this.el('div', '');
      srcBadge.style.cssText = 'font-size:10px;color:#9ca3af;margin-top:2px';
      srcBadge.textContent = `출처: ${gi.dataSource === 'gie_daily' ? 'GIE(일간·유럽)' : 'JODI(월간·전세계)'}`;
      gasSection.append(srcBadge);

      const gasAssess = this.el('div', '');
      gasAssess.style.cssText = 'font-size:11px;color:#d1d5db;line-height:1.4;margin-top:4px';
      gasAssess.textContent = gi.assessment;
      gasSection.append(gasAssess);

      container.append(gasSection);
    }

    return container;
  }

  public updateMaritimeActivity(data: CountryPortActivityData): void {
    if (!this.maritimeBody) return;

    if (!data.available || data.ports.length === 0) {
      this.maritimeBody.parentElement?.remove();
      this.maritimeBody = null;
      return;
    }

    this.maritimeBody.replaceChildren();

    const table = this.el('table', 'cdp-maritime-table');
    const thead = this.el('thead');
    const headerRow = this.el('tr');
    for (const col of ['항만', '유조선 입항(30일)', '추세', '수입 DWT', '수출 DWT']) {
      const th = this.el('th', '', col);
      headerRow.append(th);
    }
    thead.append(headerRow);
    table.append(thead);

    const tbody = this.el('tbody');
    for (const port of data.ports) {
      const tr = this.el('tr');

      const nameCell = this.el('td', 'cdp-maritime-port');
      nameCell.textContent = port.portName;
      if (port.anomalySignal) {
        const badge = this.el('span', 'cdp-maritime-anomaly', '\u26A0');
        badge.title = '통행량 이상 감지';
        nameCell.append(badge);
      }
      tr.append(nameCell);

      const callsCell = this.el('td', '', String(port.tankerCalls30d));
      tr.append(callsCell);

      const trendCell = this.el('td', 'cdp-maritime-trend');
      const pct = port.trendDeltaPct;
      if (pct !== 0 || port.tankerCalls30d > 0) {
        const sign = pct > 0 ? '+' : '';
        trendCell.textContent = `${sign}${pct.toFixed(1)}%`;
        if (pct > 0) trendCell.classList.add('cdp-trend-up');
        else if (pct < 0) trendCell.classList.add('cdp-trend-down');
      } else {
        trendCell.textContent = '—';
      }
      tr.append(trendCell);

      const fmtDwt = (v: number): string =>
        v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v >= 1_000 ? `${(v / 1_000).toFixed(0)}K` : String(Math.round(v));

      tr.append(this.el('td', '', fmtDwt(port.importTankerDwt)));
      tr.append(this.el('td', '', fmtDwt(port.exportTankerDwt)));

      tbody.append(tr);
    }
    table.append(tbody);
    const scrollWrap = this.el('div', 'cdp-maritime-scroll');
    scrollWrap.append(table);
    this.maritimeBody.append(scrollWrap);

    if (data.fetchedAt) {
      const dateStr = data.fetchedAt.split('T')[0] ?? data.fetchedAt;
      const footer = this.el('div', 'cdp-section-source', `출처: IMF PortWatch · ${dateStr} 기준`);
      this.maritimeBody.append(footer);
    }
  }

  public updateTradeExposure(data: GetCountryChokepointIndexResponse | null, sectors?: SectorExposureSummary[]): void {
    if (!this.tradeExposureBody) return;

    if (data == null || data.exposures.length === 0) {
      this.tradeExposureBody.parentElement?.remove();
      this.tradeExposureBody = null;
      return;
    }

    this.cachedTradeExposureData = data;
    this.cachedSectors = sectors ?? [];

    this.renderTradeExposureContent();
  }

  private renderTradeExposureContent(): void {
    if (!this.tradeExposureBody || !this.cachedTradeExposureData) return;
    const data = this.cachedTradeExposureData;
    const sectors = this.cachedSectors;

    this.tradeExposureBody.replaceChildren();

    const vulnScore = Math.round(data.vulnerabilityIndex);
    const vulnDiv = this.el('div', 'cdp-vuln-index', `취약도: ${vulnScore}/100`);
    vulnDiv.style.color = CountryDeepDivePanel.exposureScoreColor(vulnScore);
    this.tradeExposureBody.append(vulnDiv);

    if (sectors && sectors.length > 0) {
      const sectorLabel = this.el('div', 'cdp-section-sublabel', '부문별 주요 요충지 노출');
      this.tradeExposureBody.append(sectorLabel);

      const table = this.el('table', 'cdp-trade-exposure-table');
      const thead = this.el('thead');
      const headerRow = this.el('tr');
      headerRow.append(this.el('th', '', '부문'));
      headerRow.append(this.el('th', '', '요충지'));
      headerRow.append(this.el('th', 'cdp-exposure-score-header', '위험'));
      thead.append(headerRow);
      table.append(thead);

      const tbody = this.el('tbody');
      for (const s of sectors.slice(0, 10)) {
        const isSelected = this.selectedSectorHs2 === s.hs2;
        const tr = this.el('tr');
        tr.className = `cdp-sector-row${isSelected ? ' cdp-sector-row--selected' : ''}`;
        tr.dataset.hs2 = s.hs2;
        const sectorCell = this.el('td', 'cdp-sector-label');
        sectorCell.textContent = koHs2Label(s.hs2, s.label);
        const flag = DEPENDENCY_FLAG_LABELS[s.dependencyFlag];
        if (flag) {
          const badge = this.el('span', `cdp-dep-badge ${flag.cls}`, flag.text);
          sectorCell.append(document.createTextNode(' '), badge);
        }
        const cpCell = this.el('td', 'cdp-chokepoint-name');
        cpCell.textContent = koChokepointName(s.primaryChokepointName);
        const scoreCell = this.el('td', 'cdp-exposure-score');
        scoreCell.textContent = `${s.exposureScore.toFixed(0)}`;
        scoreCell.style.color = CountryDeepDivePanel.exposureScoreColor(s.exposureScore);
        tr.append(sectorCell, cpCell, scoreCell);
        tbody.append(tr);

        if (isSelected) {
          const detailRow = this.el('tr');
          detailRow.className = 'cdp-sector-detail-row';
          const detailCell = this.el('td');
          detailCell.setAttribute('colspan', '3');
          detailCell.append(this.buildRouteDetail(s));
          detailRow.append(detailCell);
          tbody.append(detailRow);
        }
      }
      table.append(tbody);

      tbody.addEventListener('click', (e) => {
        const row = (e.target as HTMLElement).closest<HTMLElement>('tr.cdp-sector-row');
        if (!row?.dataset.hs2) return;
        this.handleSectorRowClick(row.dataset.hs2);
      });

      this.tradeExposureBody.append(table);
    } else {
      const sorted = [...data.exposures].sort((a, b) => b.exposureScore - a.exposureScore).slice(0, 3);
      const table = this.el('table', 'cdp-trade-exposure-table');
      const tbody = this.el('tbody');
      for (const entry of sorted) {
        const tr = this.el('tr');
        const nameCell = this.el('td', 'cdp-chokepoint-name');
        nameCell.textContent = koChokepointName(entry.chokepointName || entry.chokepointId.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()));
        const barWrap = this.el('td', 'cdp-exposure-bar-wrap');
        const bar = this.el('div', 'cdp-exposure-bar');
        bar.style.width = `${Math.min(entry.exposureScore, 100)}%`;
        barWrap.append(bar);
        const pctCell = this.el('td', 'cdp-exposure-pct', `${entry.exposureScore.toFixed(1)}`);
        pctCell.style.color = CountryDeepDivePanel.exposureScoreColor(entry.exposureScore);
        tr.append(nameCell, barWrap, pctCell);
        tbody.append(tr);
      }
      table.append(tbody);
      this.tradeExposureBody.append(table);
    }

    const footer = this.el('div', 'cdp-card-footer', '출처: UN Comtrade · HS2 부문 · 점수는 항로 겹침 정도예요(수입 비중 아님)');
    this.tradeExposureBody.append(footer);
  }

  private handleSectorRowClick(hs2: string): void {
    this.sectorBypassAbort?.abort();
    this.sectorBypassAbort = null;
    this.map?.clearHighlightedRoute();

    if (this.selectedSectorHs2 === hs2) {
      this.selectedSectorHs2 = null;
      this.renderTradeExposureContent();
      return;
    }

    if (this.isMaximizedState) this.minimize();

    this.selectedSectorHs2 = hs2;
    this.renderTradeExposureContent();

    this.costShockCalcBody?.closest('.cdp-section-card')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    const sector = this.cachedSectors.find(s => s.hs2 === hs2);
    if (!sector) return;

    const matchingRoutes = getChokepointRoutes(sector.primaryChokepointId);
    const matchingRouteIds = matchingRoutes.map(r => r.id);

    if (matchingRouteIds.length > 0) {
      this.map?.highlightRoute(matchingRouteIds);
      this.map?.zoomToRoutes(matchingRouteIds);
    }
  }

  private buildRouteDetail(sector: SectorExposureSummary): HTMLElement {
    const wrap = this.el('div', 'cdp-route-detail');

    const matchingRoutes = getChokepointRoutes(sector.primaryChokepointId);

    if (matchingRoutes.length === 0) {
      wrap.append(this.el('div', 'cdp-route-path', '해상 항로 데이터가 없어요'));
      return wrap;
    }

    const portMap = new Map(PORTS.map(p => [p.id, p.name]));
    const waterwayMap = new Map(STRATEGIC_WATERWAYS.map(w => [w.id, w.name]));

    const cpName = koChokepointName(waterwayMap.get(sector.primaryChokepointId) ?? sector.primaryChokepointName);
    const routesLabel = this.el('div', 'cdp-bypass-heading', `${cpName} 경유 항로:`);
    wrap.append(routesLabel);

    for (const route of matchingRoutes) {
      const pathParts: string[] = [];
      pathParts.push(portMap.get(route.from) ?? route.from);
      for (const wp of route.waypoints) {
        pathParts.push(koChokepointName(waterwayMap.get(wp) ?? wp));
      }
      pathParts.push(portMap.get(route.to) ?? route.to);
      const pathStr = pathParts.map(p => escapeHtml(p)).join(' \u2192 ');

      const pathEl = this.el('div', 'cdp-route-path');
      setTrustedHtml(pathEl, trustedHtml(`${escapeHtml(route.name)}: ${pathStr}`, "legacy direct innerHTML migration"));
      wrap.append(pathEl);
    }

    const statsEl = this.el('div', 'cdp-route-stats');
    const distEl = this.el('div');
    setTrustedHtml(distEl, trustedHtml(`거리: <span>\u2014</span>`, "legacy direct innerHTML migration"));
    const transitEl = this.el('div');
    setTrustedHtml(transitEl, trustedHtml(`운송 기간: <span>\u2014</span>`, "legacy direct innerHTML migration"));
    const riskEl = this.el('div');
    const riskScore = sector.exposureScore;
    const riskColor = riskScore >= 70 ? '#ef4444' : riskScore > 30 ? '#f59e0b' : '#94a3b8';
    setTrustedHtml(riskEl, trustedHtml(`요충지 위험: <span style="color:${riskColor}">${riskScore.toFixed(0)}/100</span>`, "legacy direct innerHTML migration"));
    const routeCountEl = this.el('div');
    setTrustedHtml(routeCountEl, trustedHtml(`요충지 경유 항로: <span>${matchingRoutes.length}</span>`, "legacy direct innerHTML migration"));
    statsEl.append(distEl, transitEl, riskEl, routeCountEl);
    wrap.append(statsEl);

    const bypassSection = this.el('div', 'cdp-bypass-section');
    const bypassHeading = this.el('div', 'cdp-bypass-heading', '우회 경로');
    bypassSection.append(bypassHeading);
    const bypassContent = this.el('div');

    bypassContent.append(this.makeLoading('우회 경로를 불러오는 중…'));
    this.sectorBypassAbort = new AbortController();
    const signal = this.sectorBypassAbort.signal;
    void fetchBypassOptions(sector.primaryChokepointId, 'container', 100).then(resp => {
      if (signal.aborted) return;
      bypassContent.replaceChildren();
      const top3 = resp.options.slice(0, 3);
      if (top3.length === 0) {
        bypassContent.append(this.el('div', 'cdp-route-path', '우회 경로가 없어요'));
        return;
      }
      const tbl = this.el('table', 'cdp-trade-exposure-table');
      const tHead = this.el('thead');
      const hRow = this.el('tr');
      hRow.append(this.el('th', '', '우회로'), this.el('th', '', '+일수'), this.el('th', '', '+비용'), this.el('th', '', '위험'));
      tHead.append(hRow);
      tbl.append(tHead);
      const tBody = this.el('tbody');
      const riskTierMap: Record<string, string> = {
        WAR_RISK_TIER_UNSPECIFIED: '보통',
        WAR_RISK_TIER_WAR_ZONE: '전쟁 지역',
        WAR_RISK_TIER_CRITICAL: '심각',
        WAR_RISK_TIER_HIGH: '높음',
        WAR_RISK_TIER_ELEVATED: '주의',
        WAR_RISK_TIER_NORMAL: '보통',
      };
      for (const opt of top3) {
        const r = this.el('tr');
        r.append(
          this.el('td', '', koChokepointName(opt.name)),
          this.el('td', '', opt.addedTransitDays > 0 ? `+${opt.addedTransitDays}일` : '\u2014'),
          this.el('td', '', opt.addedCostMultiplier > 1 ? `+${((opt.addedCostMultiplier - 1) * 100).toFixed(0)}%` : '\u2014'),
          this.el('td', '', riskTierMap[opt.bypassWarRiskTier] ?? opt.bypassWarRiskTier),
        );
        tBody.append(r);
      }
      tbl.append(tBody);
      bypassContent.append(tbl);
    }).catch(() => {
      if (signal.aborted) return;
      bypassContent.replaceChildren();
      bypassContent.append(this.el('div', 'cdp-route-path', '우회 경로 데이터를 불러오지 못했어요'));
    });

    bypassSection.append(bypassContent);
    wrap.append(bypassSection);
    return wrap;
  }

  public updateProductImports(data: CountryProductsResponse | null): void {
    if (!this.productImportsBody) return;
    this.productImportsBody.replaceChildren();
    if (!data || data.products.length === 0) {
      this.productImportsBody.append(this.makeEmpty('데이터가 없어요'));
      return;
    }
    this.renderProductSelector(data.products);
  }

  private renderProductSelector(products: CountryProduct[]): void {
    if (!this.productImportsBody) return;
    const wrap = this.el('div', 'cdp-product-selector');
    const input = this.el('input', 'cdp-product-search');
    input.type = 'text';
    input.placeholder = '품목 검색...';
    input.setAttribute('autocomplete', 'off');

    const list = this.el('div', 'cdp-product-list');
    const detailMount = this.el('div', 'cdp-product-detail');

    const renderList = (filter: string) => {
      list.replaceChildren();
      const lower = filter.toLowerCase();
      const filtered = lower
        ? products.filter(p => p.description.toLowerCase().includes(lower) || p.hs4.includes(lower))
        : products;
      for (const p of filtered.slice(0, 12)) {
        const item = this.el('button', 'cdp-product-item');
        item.type = 'button';
        item.textContent = `${koHs4Label(p.hs4, p.description)} (HS ${p.hs4})`;
        item.addEventListener('click', () => {
          input.value = koHs4Label(p.hs4, p.description);
          list.replaceChildren();
          this.renderProductDetail(detailMount, p);
        });
        list.append(item);
      }
    };

    input.addEventListener('input', () => renderList(input.value));
    input.addEventListener('focus', () => {
      if (list.children.length === 0) renderList(input.value);
    });

    this.productImportsBody.addEventListener('click', (e) => {
      if (!(e.target instanceof HTMLElement) || e.target.closest('.cdp-product-selector')) return;
      list.replaceChildren();
    });

    wrap.append(input, list);
    this.productImportsBody.append(wrap, detailMount);

    const first = products[0];
    if (first) {
      input.value = koHs4Label(first.hs4, first.description);
      this.renderProductDetail(detailMount, first);
    }
  }

  private renderProductDetail(mount: HTMLElement, product: CountryProduct): void {
    mount.replaceChildren();

    const header = this.el('div', 'cdp-product-header');
    header.append(
      this.el('span', 'cdp-product-name', `${koHs4Label(product.hs4, product.description)} (HS ${product.hs4})`),
      this.el('span', 'cdp-product-value', this.formatMoney(product.totalValue)),
    );
    mount.append(header);

    if (product.topExporters.length === 0) {
      mount.append(this.makeEmpty('공급국 데이터가 없어요'));
      return;
    }

    const table = this.el('table', 'cdp-product-suppliers-table');
    const thead = this.el('thead');
    const hr = this.el('tr');
    hr.append(this.el('th', '', '공급국'));
    hr.append(this.el('th', '', '비중'));
    hr.append(this.el('th', '', '금액'));
    hr.append(this.el('th', '', '항로 위험'));
    thead.append(hr);
    table.append(thead);

    const tbody = this.el('tbody');
    const recsMount = this.el('div', 'cdp-recommendations');

    type ExporterRow = { partnerIso2: string; share: number; value: number; risk: EnrichedExporter['risk'] | null };

    const renderRows = (enriched: EnrichedExporter[] | null) => {
      tbody.replaceChildren();
      recsMount.replaceChildren();

      const importerCode = this.currentCode;
      const rawRows: ExporterRow[] = enriched ?? product.topExporters.map(exp => ({
        partnerIso2: exp.partnerIso2,
        share: exp.share,
        value: exp.value,
        risk: null,
      }));
      // Drop self-imports (receiver = supplier) and rows with unresolved partner ISO2 codes;
      // the seeder emits partnerIso2='' when a UN code can't be mapped, which surfaced as "N/A" rows.
      const isVisible = (iso2: string) => Boolean(iso2) && iso2 !== importerCode;
      const rows = rawRows.filter(r => isVisible(r.partnerIso2));
      const visibleEnriched = enriched ? enriched.filter(e => isVisible(e.partnerIso2)) : null;

      if (rows.length === 0) {
        const empty = this.el('div', 'cdp-recommendation-item');
        empty.textContent = 'ℹ 무역 데이터에 외부 공급국이 없어요.';
        recsMount.append(empty);
        return;
      }

      for (const exp of rows) {
        const tr = this.el('tr');
        const supplierTd = this.el('td', 'cdp-product-supplier');
        const flag = exp.partnerIso2 ? CountryDeepDivePanel.toFlagEmoji(exp.partnerIso2) : '';
        supplierTd.textContent = `${flag} ${koCountryName(exp.partnerIso2)}`;
        tr.append(supplierTd);

        const shareTd = this.el('td', 'cdp-product-share');
        const pct = Math.round(exp.share * 100);
        shareTd.textContent = `${pct}%`;
        const barWrap = this.el('div', 'cdp-product-share-bar-wrap');
        const bar = this.el('div', 'cdp-product-share-bar');
        bar.style.width = `${Math.min(pct, 100)}%`;
        if (pct >= 50) bar.classList.add('cdp-product-share-high');
        barWrap.append(bar);
        shareTd.append(barWrap);
        tr.append(shareTd);

        tr.append(this.el('td', 'cdp-product-val', this.formatMoneyAtScale(exp.value, product.totalValue)));

        const riskTd = this.el('td', 'cdp-product-risk');
        if (exp.risk) {
          const badgeCls = `cdp-risk-badge cdp-risk-${exp.risk.riskLevel.replace('_', '-')}`;
          const badgeLabels: Record<string, string> = { safe: '안전', at_risk: '위험 요인', critical: '심각', unknown: '미확인' };
          const badge = this.el('span', badgeCls, badgeLabels[exp.risk.riskLevel] ?? exp.risk.riskLevel);
          riskTd.append(badge);

          if (exp.risk.transitChokepoints.length > 0) {
            const cpNames = exp.risk.transitChokepoints
              .map(cp => koChokepointName(cp.chokepointName))
              .join(', ');
            const cpInfo = this.el('div', 'cdp-risk-chokepoints');
            cpInfo.textContent = cpNames;
            riskTd.append(cpInfo);
          }
        } else {
          riskTd.textContent = '\u2014';
        }
        tr.append(riskTd);
        tbody.append(tr);
      }

      if (visibleEnriched) {
        const hasCritical = visibleEnriched.some(e => e.risk.riskLevel === 'critical');
        const hasAtRisk = visibleEnriched.some(e => e.risk.riskLevel === 'at_risk');
        const hasUnknown = visibleEnriched.some(e => e.risk.riskLevel === 'unknown');
        const hasSafe = visibleEnriched.some(e => e.risk.riskLevel === 'safe');
        if (hasCritical || hasAtRisk) {
          for (const exp of visibleEnriched) {
            if (exp.risk.riskLevel === 'safe' || exp.risk.riskLevel === 'unknown') continue;
            const recCls = exp.risk.riskLevel === 'critical' ? 'cdp-recommendation-critical' : 'cdp-recommendation-warn';
            const item = this.el('div', `cdp-recommendation-item ${recCls}`);
            const expPct = Math.round(exp.share * 100);
            let text = `⚠ ${koHs4Label(product.hs4, product.description)} 수입 중 ${koCountryName(exp.partnerIso2)}(${expPct}%) 물량이`;
            if (exp.risk.transitChokepoints.length === 0) continue;
            const worstCp = exp.risk.transitChokepoints.reduce((a, b) => a.disruptionScore > b.disruptionScore ? a : b);
            text += ` ${koChokepointName(worstCp.chokepointName)}을(를) 지나요(차질 ${worstCp.disruptionScore}/100).`;
            if (exp.safeAlternative && isVisible(exp.safeAlternative)) {
              const alt = visibleEnriched.find(e => e.partnerIso2 === exp.safeAlternative);
              const altPct = alt ? Math.round(alt.share * 100) : 0;
              const altFlag = CountryDeepDivePanel.toFlagEmoji(exp.safeAlternative);
              text += ` ${altFlag} ${koCountryName(exp.safeAlternative)}은(는) 이 요충지를 피해 ${altPct}%를 공급해요.`;
            }
            item.textContent = text;
            recsMount.append(item);
          }
        } else if (hasUnknown && !hasSafe) {
          const item = this.el('div', 'cdp-recommendation-item');
          item.textContent = 'ℹ 이 공급국들의 항로 모델 데이터가 없어 위험을 평가할 수 없어요.';
          recsMount.append(item);
        } else if (hasUnknown && hasSafe) {
          const safeCount = visibleEnriched.filter(e => e.risk.riskLevel === 'safe').length;
          const unknownCount = visibleEnriched.filter(e => e.risk.riskLevel === 'unknown').length;
          const item = this.el('div', 'cdp-recommendation-item');
          item.textContent = `ℹ 공급국 ${safeCount}곳은 안전 확인, ${unknownCount}곳은 항로 데이터가 없어요.`;
          recsMount.append(item);
        } else {
          const safeItem = this.el('div', 'cdp-recommendation-item cdp-recommendation-safe');
          safeItem.textContent = '✓ 현재 모든 공급국이 차질 요충지를 피하는 항로를 이용해요.';
          recsMount.append(safeItem);
        }
      }
    };

    renderRows(null);
    table.append(tbody);
    mount.append(table, recsMount);

    const importerIso2 = this.currentCode;
    const capturedCode = this.getCode();
    if (importerIso2) {
      fetchChokepointStatus().then(resp => {
        if (this.getCode() !== capturedCode) return;
        if (!resp.chokepoints.length) return;
        const scores: ChokepointScoreMap = new Map();
        for (const cp of resp.chokepoints) {
          scores.set(cp.id, cp.disruptionScore);
        }
        const enriched = computeAlternativeSuppliers(product.topExporters, importerIso2, scores);
        renderRows(enriched);
      }).catch(() => {
        console.warn('[deep-dive] Chokepoint status unavailable for route risk enrichment');
      });
    }

    const source = this.el('div', 'cdp-card-footer', `출처: UN Comtrade HS4 · ${product.year}년`);
    mount.append(source);
  }

  private factItem(label: string, value: string): HTMLElement {
    const wrapper = this.el('div', 'cdp-fact-item');
    wrapper.append(this.el('div', 'cdp-fact-label', label));
    wrapper.append(this.el('div', '', value));
    return wrapper;
  }

  public updateScore(score: CountryScore | null, _signals: CountryBriefSignals): void {
    if (!this.scoreCard) return;
    // Partial DOM update: score number, level color, trend, component bars only
    const top = this.scoreCard.firstElementChild as HTMLElement | null;
    while (this.scoreCard.childElementCount > 1) {
      this.scoreCard.lastElementChild?.remove();
    }
    if (top) {
      const updatedEl = top.querySelector('.cdp-updated');
      if (updatedEl) updatedEl.textContent = `업데이트 ${score?.lastUpdated ? this.shortDate(score.lastUpdated) : '—'}`;
    }
    if (score) {
      const band = ciiBandForLevel(score.level);
      const scoreRow = this.el('div', 'cdp-score-row');
      const value = this.el('div', `cdp-score-value cii-${band}`, `${score.score}/100`);
      const trend = this.el('div', 'cdp-trend', `${this.trendArrow(score.trend)} ${score.trend === 'rising' ? '상승' : score.trend === 'falling' ? '하락' : '유지'}`);
      scoreRow.append(value, trend);
      this.scoreCard.append(scoreRow);
      this.scoreCard.append(this.renderComponentBars(score.components));
    } else {
      this.scoreCard.append(this.makeEmpty(t('countryBrief.ciiUnavailable')));
    }
  }

  public updateStock(data: StockIndexData): void {
    if (!data.available) {
      this.renderEconomicIndicators();
      return;
    }

    const delta = Number.parseFloat(data.weekChangePercent);
    const trend: TrendDirection = Number.isFinite(delta)
      ? delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat'
      : 'flat';

    const base = this.economicIndicators.filter((item) => item.label !== '주가지수');
    base.unshift({
      label: '주가지수',
      value: `${data.indexName}: ${data.price} ${data.currency}`,
      trend,
      source: '시장 데이터',
    });
    this.economicIndicators = base.slice(0, 6);
    this.renderEconomicIndicators();
  }

  public updateMarkets(markets: PredictionMarket[]): void {
    if (!this.marketsBody) return;
    this.marketsBody.replaceChildren();

    if (markets.length === 0) {
      this.marketsBody.append(this.makeEmpty(t('countryBrief.noMarkets')));
      return;
    }

    for (const market of markets.slice(0, 5)) {
      const item = this.el('div', 'cdp-market-item');
      const top = this.el('div', 'cdp-market-top');
      const title = this.el('div', 'cdp-market-title', market.title);
      top.append(title);

      const link = sanitizeUrl(market.url || '');
      if (link) {
        const anchor = this.el('a', 'cdp-market-link', '열기');
        anchor.setAttribute('href', link);
        anchor.setAttribute('target', '_blank');
        anchor.setAttribute('rel', 'noopener');
        top.append(anchor);
      }

      const prob = this.el('div', 'cdp-market-prob', `확률: ${Math.round(market.yesPrice)}%`);
      const meta = this.el('div', 'cdp-market-meta', market.endDate ? `종료 ${this.shortDate(market.endDate)}` : '진행 중');
      item.append(top, prob, meta);

      const expanded = this.el('div', 'cdp-expanded-only');
      if (market.volume != null) {
        expanded.append(this.el('div', 'cdp-market-volume', `거래량: $${market.volume.toLocaleString()}`));
      }
      const yesPercent = Math.round(market.yesPrice);
      const noPercent = 100 - yesPercent;
      const bar = this.el('div', 'cdp-market-bar');
      const barYes = this.el('div', 'cdp-market-bar-yes');
      barYes.style.width = `${yesPercent}%`;
      const barNo = this.el('div', 'cdp-market-bar-no');
      barNo.style.width = `${noPercent}%`;
      bar.append(barYes, barNo);
      expanded.append(bar);
      item.append(expanded);

      this.marketsBody.append(item);
    }
  }

  public updateBrief(data: CountryIntelData): void {
    if (!this.briefBody || data.code !== this.currentCode) return;
    this.briefBody.replaceChildren();

    if (data.error || data.skipped || !data.brief) {
      this.currentBrief = null;
      this.currentBriefGeneratedAt = null;
      this.currentBriefCached = null;
      this.briefBody.append(this.makeEmpty(data.error || data.reason || t('countryBrief.assessmentUnavailable')));
      return;
    }

    this.currentBrief = data.brief;
    this.currentBriefGeneratedAt = data.generatedAt ?? null;
    this.currentBriefCached = data.cached === true;

    const briefSources = collectBriefSources(data.sources ?? [], 6);
    const summaryHtml = this.formatBrief(this.summarizeBrief(data.brief), briefSources, 0);
    const text = this.el('div', 'cdp-assessment-text cdp-summary-only');
    setTrustedHtml(text, trustedHtml(summaryHtml, "legacy direct innerHTML migration"));

    const metaTokens: string[] = [];
    if (data.cached) metaTokens.push('캐시됨');
    if (data.fallback) metaTokens.push('대체 생성');
    if (data.generatedAt) metaTokens.push(`업데이트 ${new Date(data.generatedAt).toLocaleTimeString()}`);
    const meta = this.el('div', 'cdp-assessment-meta', metaTokens.join(' • '));
    this.briefBody.append(text, meta);
    const sourcesFooter = renderBriefSourcesFooter(briefSources, { className: 'cdp-brief-sources' });
    if (sourcesFooter) {
      const summarySources = this.el('div', 'cdp-summary-only');
      setTrustedHtml(summarySources, trustedHtml(sourcesFooter, "legacy direct innerHTML migration"));
      this.briefBody.append(summarySources);
    }

    const expandedBrief = this.el('div', 'cdp-expanded-only');
    const fullText = this.el('div', 'cdp-assessment-text');
    setTrustedHtml(fullText, trustedHtml(this.formatBrief(data.brief, briefSources, this.currentHeadlineCount), "legacy direct innerHTML migration"));
    expandedBrief.append(fullText);
    if (sourcesFooter) {
      const sources = this.el('div', 'cdp-expanded-only');
      setTrustedHtml(sources, trustedHtml(sourcesFooter, "legacy direct innerHTML migration"));
      expandedBrief.append(sources);
    }
    this.briefBody.append(expandedBrief);
  }

  private renderLoading(): void {
    this.resetPanelContent();
    const loading = this.el('div', 'cdp-loading');
    loading.append(
      this.el('div', 'cdp-loading-title', t('countryBrief.identifying')),
      this.el('div', 'cdp-loading-line'),
      this.el('div', 'cdp-loading-line cdp-loading-line-short'),
    );
    this.content.append(loading);
  }

  private renderSkeleton(country: string, code: string, score: CountryScore | null, signals: CountryBriefSignals): void {
    this.resetPanelContent();

    const shell = this.el('div', 'cdp-shell');
    const header = this.el('header', 'cdp-header');
    const left = this.el('div', 'cdp-header-left');
    const flag = this.el('span', 'cdp-flag', CountryDeepDivePanel.toFlagEmoji(code));
    const titleWrap = this.el('div', 'cdp-title-wrap');
    const name = this.el('h2', 'cdp-country-name', country);
    const subtitle = this.el('div', 'cdp-country-subtitle', `${code.toUpperCase()} • 국가 정보`);
    titleWrap.append(name, subtitle);

    // `resetPanelContent` (called at the top of renderSkeleton) already
    // tore down the prior FollowButton's subscriptions; here we just
    // mount a fresh one for the new country.
    const followHost = this.el('span', 'cdp-follow-btn-host');
    followHost.dataset.country = code;
    const handle = renderFollowButton({
      countryCode: code,
      countryName: country,
      size: 'md',
    });
    setTrustedHtml(followHost, trustedHtml(handle.html, "legacy direct innerHTML migration"));
    this.followButtonTeardown = handle.attach(followHost);

    // U8 (degraded path) — "Notify me about this country" sub-action.
    // Visible only when the user is currently following this country.
    // The schema PR for `alertRules.countries` has NOT merged, so the
    // click just opens the existing notifications settings tab — no
    // pre-fill. See plan U8 R9 + the TODO inside notify-country-link.ts
    // for the future pre-fill injection point.
    const notifyHost = this.el('span', 'cdp-notify-link-host');
    notifyHost.dataset.country = code;
    const notifyHandle = renderNotifyCountryLink({
      countryCode: code,
      countryName: country,
    });
    setTrustedHtml(notifyHost, trustedHtml(notifyHandle.html, "legacy direct innerHTML migration"));
    this.notifyLinkTeardown = notifyHandle.attach(notifyHost);

    left.append(flag, titleWrap, followHost, notifyHost);

    const right = this.el('div', 'cdp-header-right');

    const maxBtn = this.el('button', 'cdp-maximize-btn', '\u26F6') as HTMLButtonElement;
    maxBtn.setAttribute('type', 'button');
    maxBtn.setAttribute('aria-label', '최대화 전환');
    maxBtn.addEventListener('click', () => {
      if (this.isMaximizedState) this.minimize();
      else this.maximize();
    });
    this.maximizeButton = maxBtn;

    const shareBtn = this.el('button', 'cdp-action-btn cdp-share-btn') as HTMLButtonElement;
    shareBtn.setAttribute('type', 'button');
    shareBtn.setAttribute('aria-label', t('components.countryBrief.shareLink'));
    setTrustedHtml(shareBtn, trustedHtml('<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v7a2 2 0 002 2h12a2 2 0 002-2v-7"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>', "legacy direct innerHTML migration"));
    shareBtn.addEventListener('click', () => {
      if (!this.currentCode || !this.currentName) return;
      const url = `${window.location.origin}/?c=${encodeURIComponent(this.currentCode)}`;
      navigator.clipboard.writeText(url).then(() => {
        const orig = shareBtn.innerHTML;
        setTrustedHtml(shareBtn, trustedHtml('<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>', "legacy direct innerHTML migration"));
        setTimeout(() => { setTrustedHtml(shareBtn, trustedHtml(orig, "legacy direct innerHTML migration")); }, 1500);
      }).catch(() => {});
    });

    const storyButton = this.el('button', 'cdp-action-btn', '스토리') as HTMLButtonElement;
    storyButton.setAttribute('type', 'button');
    storyButton.addEventListener('click', () => {
      if (this.onShareStory && this.currentCode && this.currentName) {
        this.onShareStory(this.currentCode, this.currentName);
      }
    });

    const exportButton = this.el('button', 'cdp-action-btn', '이미지') as HTMLButtonElement;
    exportButton.setAttribute('type', 'button');
    exportButton.addEventListener('click', () => {
      if (this.onExportImage && this.currentCode && this.currentName) {
        this.onExportImage(this.currentCode, this.currentName);
      }
    });
    const evidenceButton = this.el('button', 'cdp-action-btn cdp-evidence-export-btn', '근거 저장') as HTMLButtonElement;
    evidenceButton.setAttribute('type', 'button');
    evidenceButton.setAttribute('title', '근거 자료를 마크다운 파일로 저장해요');
    evidenceButton.addEventListener('click', () => {
      this.exportEvidenceBundle();
    });
    right.append(shareBtn, maxBtn, storyButton, exportButton, evidenceButton);
    header.append(left, right);

    const scoreCard = this.el('section', 'cdp-card cdp-score-card');
    this.scoreCard = scoreCard;
    const top = this.el('div', 'cdp-score-top');
    const label = this.el('span', 'cdp-score-label', t('countryBrief.instabilityIndex'));
    const updated = this.el('span', 'cdp-updated', `업데이트 ${score?.lastUpdated ? this.shortDate(score.lastUpdated) : '—'}`);
    top.append(label, updated);
    scoreCard.append(top);

    if (score) {
      const band = ciiBandForLevel(score.level);
      const scoreRow = this.el('div', 'cdp-score-row');
      const value = this.el('div', `cdp-score-value cii-${band}`, `${score.score}/100`);
      const trend = this.el('div', 'cdp-trend', `${this.trendArrow(score.trend)} ${score.trend === 'rising' ? '상승' : score.trend === 'falling' ? '하락' : '유지'}`);
      scoreRow.append(value, trend);
      scoreCard.append(scoreRow);
      scoreCard.append(this.renderComponentBars(score.components));
    } else {
      scoreCard.append(this.makeEmpty(t('countryBrief.ciiUnavailable')));
    }

    const summaryGrid = this.el('div', 'cdp-summary-grid');
    summaryGrid.append(scoreCard, this.renderResilienceWidgetSlot(code));

    const bodyGrid = this.el('div', 'cdp-grid');
    const [signalsCard, signalBody] = this.sectionCard(t('countryBrief.activeSignals'));
    const [timelineCard, timelineBody] = this.sectionCard(t('countryBrief.timeline'));
    const [newsCard, newsBody] = this.sectionCard(t('countryBrief.topNews'));
    const [militaryCard, militaryBody] = this.sectionCard(t('countryBrief.militaryActivity'));
    const [infraCard, infraBody] = this.sectionCard(t('countryBrief.infrastructure'));
    const [economicCard, economicBody] = this.sectionCard(t('countryBrief.economicIndicators'));
    const [housingCard, housingBody] = this.sectionCard(
      '주택 경기',
      'BIS 분기 실질 주택·상업용 부동산 가격지수와 가계 부채상환비율(DSR)이에요. 신용·부동산 경기 전환을 미리 보여주는 지표예요.',
    );
    const [marketsCard, marketsBody] = this.sectionCard(t('countryBrief.predictionMarkets'));
    const [briefCard, briefBody] = this.sectionCard(t('countryBrief.intelBrief'));

    const [factsCard, factsBody] = this.sectionCard(t('countryBrief.countryFacts'));
    this.factsBody = factsBody;
    factsBody.append(this.makeLoading(t('countryBrief.loadingFacts')));
    const factsExpanded = this.el('div', 'cdp-expanded-only');
    factsExpanded.append(factsCard);

    const [energyCard, energyBody] = this.sectionCard('에너지 프로필', '석유 수입 의존도, 해상 요충지 노출, 에너지 충격 데이터예요. 출처: JODI·IEA·PortWatch');
    this.energyBody = energyBody;
    energyBody.append(this.makeLoading('에너지 데이터를 불러오는 중…'));

    const [maritimeCard, maritimeBody] = this.sectionCard('항만 활동', '최근 30일 항만별 유조선 입항 횟수와 수출입 화물량이에요. ⚠ 표시는 30일 평균의 50% 아래로 떨어진 항만이에요. 출처: IMF PortWatch');
    this.maritimeBody = maritimeBody;
    maritimeBody.append(this.makeLoading('항만 활동을 불러오는 중…'));

    const [tradeCard, tradeBody] = this.sectionCard('무역 노출도', '이 국가의 수입이 어느 해상 요충지에 얼마나 의존하는지 보여줘요');
    this.tradeExposureBody = tradeBody;
    tradeBody.append(this.makeLoading('무역 노출도를 불러오는 중…'));

    const [costShockCalcCard, costShockCalcBody] = this.sectionCard(
      '비용 충격 계산기',
      '해상 요충지가 오래 막혔을 때 부문별 추가 비용을 계산해요. 슬라이더로 봉쇄 기간(1~90일)을 바꿔 보세요. 전쟁 위험 할증과 우회 운임 상승분을 연간 수입액에 곱해 계산해요.',
    );
    this.costShockCalcBody = costShockCalcBody;
    costShockCalcBody.append(this.makeLoading('비용 충격 계산기를 불러오는 중…'));

    const [productImportsCard, productImportsCardBody] = this.sectionCard('주요 수입 품목', '품목(HS4)별 주요 수입품과 공급국 구성, 편중 위험을 보여줘요.');
    this.productImportsBody = productImportsCardBody;
    productImportsCardBody.append(this.makeLoading('수입 품목 데이터를 불러오는 중…'));

    const [debtCard, debtBody] = this.sectionCard('국가 부채', '정부 부채의 GDP 대비 비율, 총액, 전년 대비 증가율이에요.');
    this.debtBody = debtBody;
    debtBody.append(this.makeLoading('국가 부채 데이터를 불러오는 중…'));

    const [sanctionsCard, sanctionsBody] = this.sectionCard('제재 압력', '이 국가와 연결된 제재 대상(단체·선박·항공기) 수예요.');
    this.sanctionsBody = sanctionsBody;
    sanctionsBody.append(this.makeLoading('제재 데이터를 불러오는 중…'));

    const [comtradeCard, comtradeBody] = this.sectionCard('무역 흐름', '교역 상대국·품목별 주요 무역 흐름을 금액순으로 보여줘요.');
    this.comtradeBody = comtradeBody;
    comtradeBody.append(this.makeLoading('무역 흐름을 불러오는 중…'));

    const [tariffCard, tariffBody] = this.sectionCard('관세 추이', '실효 관세율과 연도별 추이예요.');
    this.tariffBody = tariffBody;
    tariffBody.append(this.makeLoading('관세 데이터를 불러오는 중…'));


    this.signalsBody = signalBody;
    this.timelineBody = timelineBody;
    this.timelineBody.classList.add('cdp-timeline-mount');
    this.newsBody = newsBody;
    this.militaryBody = militaryBody;
    this.infrastructureBody = infraBody;
    this.economicBody = economicBody;
    let chinaSummaryCard: HTMLElement | null = null;
    // Drop any body left over from a previous China render so a non-China
    // country never keeps a detached summary body reachable.
    this.chinaSummaryBody = null;
    if (code.toUpperCase() === 'CN') {
      const [card, body] = this.sectionCard(t('countryBrief.china.title'), t('countryBrief.china.description'));
      card.classList.add('cdp-china-summary');
      card.setAttribute('aria-label', t('countryBrief.china.title'));
      this.chinaSummaryBody = body;
      this.renderChinaCountrySummary([
        'macro-policy',
        'market-credit',
        'trade-supply',
        'energy',
        'availability',
      ].map((id) => ({ id: id as ChinaCountrySummaryGroupId, state: 'loading', signals: [] })));
      chinaSummaryCard = card;
    }
    this.housingBody = housingBody;
    this.marketsBody = marketsBody;
    this.briefBody = briefBody;

    this.renderInitialSignals(signals);
    newsBody.append(this.makeLoading('국가 주요 뉴스를 불러오는 중…'));
    militaryBody.append(this.makeLoading('항공기·선박·주변 기지 정보를 불러오는 중…'));
    infraBody.append(this.makeLoading('주변 핵심 인프라를 계산하는 중…'));
    economicBody.append(this.makeLoading('경제 지표를 불러오는 중…'));
    housingBody.append(this.makeLoading('주택 경기 데이터를 불러오는 중…'));
    marketsBody.append(this.makeLoading(t('countryBrief.loadingMarkets')));
    briefBody.append(this.makeLoading(t('countryBrief.generatingBrief')));

    bodyGrid.append(briefCard, ...(chinaSummaryCard ? [chinaSummaryCard] : []), factsExpanded, energyCard, maritimeCard, tradeCard, costShockCalcCard, productImportsCard, debtCard, sanctionsCard, comtradeCard, tariffCard, signalsCard, timelineCard, newsCard, militaryCard, infraCard, economicCard, housingCard, marketsCard);
    shell.append(header, summaryGrid, bodyGrid);
    this.content.append(shell);
  }

  private destroyResilienceWidget(): void {
    this.resilienceWidgetRequestId += 1;
    this.resilienceWidget?.destroy();
    this.resilienceWidget = null;
    this.pendingResilienceEnergyMix = null;
  }

  private renderResilienceWidgetSlot(code: string): HTMLElement {
    const slot = this.el('div', 'cdp-card resilience-widget');
    slot.append(this.makeLoading(t('countryBrief.loadingResilienceScore')));
    const requestId = ++this.resilienceWidgetRequestId;

    const renderFallback = (error: unknown) => {
      if (requestId !== this.resilienceWidgetRequestId) return;
      this.resilienceWidget?.destroy();
      this.resilienceWidget = null;
      console.warn('[CountryDeepDivePanel] Failed to load resilience widget', error);
      this.captureResilienceWidgetLoadFailure(error, code);
      slot.replaceChildren(this.makeEmpty(t('countryBrief.resilienceScoreUnavailable')));
    };

    import('@/components/ResilienceWidget')
      .then(({ ResilienceWidget }) => {
        if (requestId !== this.resilienceWidgetRequestId) return;
        if (typeof ResilienceWidget !== 'function') throw new Error('ResilienceWidget export is unavailable.');
        const widget = new ResilienceWidget(code);
        try {
          if (this.pendingResilienceEnergyMix) {
            widget.setEnergyMix(this.pendingResilienceEnergyMix);
          }
          this.replaceResilienceSlot(slot, widget.getElement());
          this.resilienceWidget = widget;
        } catch (error) {
          widget.destroy();
          throw error;
        }
      })
      .catch(renderFallback);

    return slot;
  }

  private captureResilienceWidgetLoadFailure(error: unknown, countryCode: string): void {
    enqueueSentryCall((Sentry) => {
      Sentry.addBreadcrumb?.({
        category: 'country-deep-dive',
        level: 'warning',
        message: 'Resilience widget lazy load failed',
        data: { countryCode },
      });
      Sentry.captureException?.(error instanceof Error ? error : new Error(String(error)), {
        tags: { surface: 'country-deep-dive', widget: 'resilience' },
        extra: { countryCode },
      });
    });
  }

  private replaceResilienceSlot(slot: HTMLElement, next: HTMLElement): void {
    if (typeof slot.replaceWith === 'function') {
      slot.replaceWith(next);
      return;
    }
    if (typeof slot.parentNode?.replaceChild === 'function') {
      slot.parentNode.replaceChild(next, slot);
      return;
    }
    if (typeof slot.parentNode?.insertBefore === 'function' && typeof slot.parentNode?.removeChild === 'function') {
      slot.parentNode.insertBefore(next, slot);
      slot.parentNode.removeChild(slot);
    }
  }

  private tearDownFollowButton(): void {
    if (this.followButtonTeardown) {
      try {
        this.followButtonTeardown();
      } catch {
        /* swallow */
      }
      this.followButtonTeardown = null;
    }
    if (this.notifyLinkTeardown) {
      try {
        this.notifyLinkTeardown();
      } catch {
        /* swallow */
      }
      this.notifyLinkTeardown = null;
    }
  }

  private resetPanelContent(): void {
    this.destroyResilienceWidget();
    this.tearDownFollowButton();
    this.selectedSectorHs2 = null;
    this.sectorBypassAbort?.abort();
    this.sectorBypassAbort = null;
    this.cachedTradeExposureData = null;
    this.cachedSectors = [];
    this.map?.clearHighlightedRoute();
    this.scoreCard = null;
    this.energyBody = null;
    this.maritimeBody = null;
    this.tradeExposureBody = null;
    this.chinaSummaryBody = null;
    this.productImportsBody = null;
    this.debtBody = null;
    this.housingBody = null;
    this.sanctionsBody = null;
    this.comtradeBody = null;
    this.tariffBody = null;
    this.costShockCalcAbort?.abort();
    this.costShockCalcAbort = null;
    if (this.costShockCalcDebounceTimer) {
      clearTimeout(this.costShockCalcDebounceTimer);
      this.costShockCalcDebounceTimer = null;
    }
    this.costShockCalcBody = null;
    this.costShockCalcTable = null;
    this.costShockCalcDurationLabel = null;
    this.costShockCalcTotalLabel = null;
    this.costShockCalcPrimaryChokepoint = null;
    this.costShockCalcClosureDays = 30;
    this.content.replaceChildren();
  }

  private renderInitialSignals(signals: CountryBriefSignals): void {
    if (!this.signalsBody) return;
    this.signalsBody.replaceChildren();

    const chips = this.el('div', 'cdp-signal-chips');
    this.addSignalChip(chips, signals.criticalNews, t('countryBrief.chips.criticalNews'), '🚨', 'conflict');
    this.addSignalChip(chips, signals.protests, t('countryBrief.chips.protests'), '📢', 'protest');
    this.addSignalChip(chips, signals.militaryFlights, t('countryBrief.chips.militaryAir'), '✈️', 'military', `주변 ${signals.militaryFlights} · 영내 ${signals.militaryFlightsInCountry}`);
    this.addSignalChip(chips, signals.militaryVessels, t('countryBrief.chips.navalVessels'), '⚓', 'military', `주변 ${signals.militaryVessels} · 영내 ${signals.militaryVesselsInCountry}`);
    this.addSignalChip(chips, signals.outages, t('countryBrief.chips.outages'), '🌐', 'outage');
    this.addSignalChip(chips, signals.aisDisruptions, t('countryBrief.chips.aisDisruptions'), '🚢', 'outage');
    this.addSignalChip(chips, signals.satelliteFires, t('countryBrief.chips.satelliteFires'), '🔥', 'climate');
    this.addSignalChip(chips, signals.radiationAnomalies, '방사선 이상', '☢️', 'outage');
    this.addSignalChip(chips, signals.temporalAnomalies, t('countryBrief.chips.temporalAnomalies'), '⏱️', 'outage');
    this.addSignalChip(chips, signals.cyberThreats, t('countryBrief.chips.cyberThreats'), '🛡️', 'conflict');
    this.addSignalChip(chips, signals.earthquakes, t('countryBrief.chips.earthquakes'), '🌍', 'quake');
    if (signals.displacementOutflow > 0) {
      const fmt = signals.displacementOutflow >= 1_000_000
        ? `${(signals.displacementOutflow / 1_000_000).toFixed(1)}M`
        : `${(signals.displacementOutflow / 1000).toFixed(0)}K`;
      chips.append(this.makeSignalChip(`🌊 ${fmt} ${t('countryBrief.chips.displaced')}`, 'displacement'));
    }
    this.addSignalChip(chips, signals.climateStress, t('countryBrief.chips.climateStress'), '🌡️', 'climate');
    this.addSignalChip(chips, signals.conflictEvents, t('countryBrief.chips.conflictEvents'), '⚔️', 'conflict');
    this.addSignalChip(chips, signals.activeStrikes, t('countryBrief.chips.activeStrikes'), '💥', 'conflict');
    if (signals.travelAdvisories > 0 && signals.travelAdvisoryMaxLevel) {
      const advLabel = signals.travelAdvisoryMaxLevel === 'do-not-travel' ? t('countryBrief.chips.doNotTravel')
        : signals.travelAdvisoryMaxLevel === 'reconsider' ? t('countryBrief.chips.reconsiderTravel')
        : t('countryBrief.chips.exerciseCaution');
      chips.append(this.makeSignalChip(`⚠️ ${signals.travelAdvisories} ${t('countryBrief.chips.advisory')}: ${advLabel}`, 'advisory'));
    }
    this.addSignalChip(chips, signals.orefSirens, t('countryBrief.chips.activeSirens'), '🚨', 'conflict');
    this.addSignalChip(chips, signals.orefHistory24h, t('countryBrief.chips.sirens24h'), '🕓', 'conflict');
    this.addSignalChip(chips, signals.aviationDisruptions, t('countryBrief.chips.aviationDisruptions'), '🚫', 'outage');
    this.addSignalChip(chips, signals.gpsJammingHexes, t('countryBrief.chips.gpsJammingZones'), '📡', 'outage');
    this.signalsBody.append(chips);

    this.signalBreakdownBody = this.el('div', 'cdp-signal-breakdown');
    this.signalRecentBody = this.el('div', 'cdp-signal-recent');
    this.signalsBody.append(this.signalBreakdownBody, this.signalRecentBody);

    const seeded: CountryDeepDiveSignalDetails = {
      critical: signals.criticalNews + Math.max(0, signals.activeStrikes),
      high: signals.militaryFlights + signals.militaryVessels + signals.protests,
      medium: signals.outages + signals.cyberThreats + signals.aisDisruptions + signals.radiationAnomalies,
      low: signals.earthquakes + signals.temporalAnomalies + signals.satelliteFires,
      recentHigh: [],
    };
    this.renderSignalBreakdown(seeded);
    this.signalRecentBody.append(this.makeLoading('높은 심각도 신호를 불러오는 중…'));
  }

  private addSignalChip(container: HTMLElement, count: number, label: string, icon: string, cls: string, tooltip?: string): void {
    if (count <= 0) return;
    container.append(this.makeSignalChip(`${icon} ${count} ${label}`, cls, tooltip));
  }

  private makeSignalChip(text: string, cls: string, tooltip?: string): HTMLElement {
    const chip = this.el('span', `cdp-signal-chip chip-${cls}`, text);
    if (tooltip) chip.title = tooltip;
    return chip;
  }

  private renderComponentBars(components: CountryScore['components']): HTMLElement {
    const wrap = this.el('div', 'cdp-components');
    const items = [
      { label: t('countryBrief.components.unrest'), value: components.unrest, icon: '📢' },
      { label: t('countryBrief.components.conflict'), value: components.conflict, icon: '⚔' },
      { label: t('countryBrief.components.security'), value: components.security, icon: '🛡️' },
      { label: t('countryBrief.components.information'), value: components.information, icon: '📡' },
    ];
    for (const item of items) {
      const row = this.el('div', 'cdp-score-row');
      const icon = this.el('span', 'cdp-comp-icon', item.icon);
      const label = this.el('span', 'cdp-comp-label', item.label);
      const barOuter = this.el('div', 'cdp-comp-bar');
      const pct = Math.min(100, Math.max(0, item.value));
      const color = pct >= 70 ? getCSSColor('--semantic-critical')
        : pct >= 50 ? getCSSColor('--semantic-high')
        : pct >= 30 ? getCSSColor('--semantic-elevated')
        : getCSSColor('--semantic-normal');
      const barFill = this.el('div', 'cdp-comp-fill');
      barFill.style.width = `${pct}%`;
      barFill.style.background = color;
      barOuter.append(barFill);
      const val = this.el('span', 'cdp-comp-val', String(Math.round(item.value)));
      row.append(icon, label, barOuter, val);
      wrap.append(row);
    }
    return wrap;
  }

  private renderSignalBreakdown(details: CountryDeepDiveSignalDetails): void {
    if (!this.signalBreakdownBody) return;
    this.signalBreakdownBody.replaceChildren();

    this.signalBreakdownBody.append(
      this.metric(t('countryBrief.levels.critical'), String(details.critical), 'cdp-chip-danger'),
      this.metric(t('countryBrief.levels.high'), String(details.high), 'cdp-chip-warn'),
      this.metric(t('countryBrief.levels.moderate'), String(details.medium), 'cdp-chip-neutral'),
      this.metric(t('countryBrief.levels.low'), String(details.low), 'cdp-chip-success'),
    );
  }

  private renderRecentSignals(items: CountryDeepDiveSignalItem[]): void {
    if (!this.signalRecentBody) return;
    this.signalRecentBody.replaceChildren();

    if (items.length === 0) {
      this.signalRecentBody.append(this.makeEmpty(t('countryBrief.noSignals')));
      return;
    }

    for (const item of items.slice(0, 3)) {
      const row = this.el('div', 'cdp-signal-item');
      const line = this.el('div', 'cdp-signal-line');
      line.append(
        this.badge(item.type, 'cdp-type-badge'),
        this.badge(item.severity.toUpperCase(), `cdp-severity-badge sev-${item.severity}`),
      );
      const desc = this.el('div', 'cdp-signal-desc', item.description);
      const ts = this.el('div', 'cdp-signal-time', this.formatRelativeTime(item.timestamp));
      row.append(line, desc, ts);
      this.signalRecentBody.append(row);
    }
  }

  private renderEconomicIndicators(): void {
    if (!this.economicBody) return;
    this.economicBody.replaceChildren();

    if (this.economicIndicators.length === 0) {
      this.economicBody.append(this.makeEmpty(t('countryBrief.noIndicators')));
      return;
    }

    for (const indicator of this.economicIndicators.slice(0, 6)) {
      const row = this.el('div', 'cdp-economic-item');
      const top = this.el('div', 'cdp-economic-top');
      const isMarketRow = indicator.label === '주가지수' || indicator.label === '주간 모멘텀';
      const trendClass = isMarketRow ? `trend-market-${indicator.trend}` : `trend-${indicator.trend}`;
      top.append(
        this.el('span', 'cdp-economic-label', indicator.label),
        this.el('span', `cdp-trend-token ${trendClass}`, this.trendArrowFromDirection(indicator.trend)),
      );
      const value = this.el('div', 'cdp-economic-value', indicator.value);
      row.append(top, value);
      if (indicator.source) {
        row.append(this.el('div', 'cdp-economic-source', indicator.source));
      }
      this.economicBody.append(row);
    }
  }

  private renderChinaCountrySummary(groups: ChinaCountrySummaryGroup[]): void {
    if (!this.chinaSummaryBody) return;

    // The group <section>s are aria-live regions. They must stay in the DOM
    // across updates — screen readers only announce mutations *inside* an
    // existing live region, so tearing the sections down and rebuilding them
    // (the old replaceChildren-the-card approach) meant state transitions
    // like loading→stale were never announced.
    let grid = this.chinaSummaryBody.querySelector<HTMLElement>('.cdp-china-summary-grid');
    if (!grid) {
      this.chinaSummaryBody.replaceChildren();
      grid = this.el('div', 'cdp-china-summary-grid');
      this.chinaSummaryBody.append(grid);
    }

    for (const group of groups) {
      let section = grid.querySelector<HTMLElement>(`[data-group-id="${group.id}"]`);
      if (!section) {
        section = this.el('section', 'cdp-china-summary-group');
        section.setAttribute('data-group-id', group.id);
        section.setAttribute('role', 'status');
        section.setAttribute('aria-live', 'polite');
        grid.append(section);
      }

      // Manager updates push the full five-group snapshot each time any one
      // group resolves; skip untouched groups so unchanged content is not
      // re-announced on every sibling resolution.
      const revision = JSON.stringify(group);
      if (section.dataset.revision === revision) continue;
      section.dataset.revision = revision;

      const groupLabel = this.chinaSummaryGroupLabel(group.id);
      const stateLabel = t(`countryBrief.china.status.${group.state}`);
      section.className = `cdp-china-summary-group cdp-china-summary-group--${group.state}`;
      section.setAttribute('aria-label', `${groupLabel}: ${stateLabel}`);

      const heading = this.el('div', 'cdp-china-summary-heading');
      heading.append(
        this.el('h4', 'cdp-china-summary-title', groupLabel),
        this.el('span', 'cdp-china-summary-state', stateLabel),
      );
      const children: HTMLElement[] = [heading];

      if (group.signals.length === 0) {
        children.push(this.el(
          'div',
          'cdp-china-summary-empty',
          group.unavailableReason || t(`countryBrief.china.status.${group.state}`),
        ));
      } else {
        for (const signal of group.signals) {
          const item = this.el('div', 'cdp-china-summary-signal');
          if (signal.stale) item.dataset.stale = 'true';
          item.append(
            this.el('div', 'cdp-china-summary-signal-label', signal.label),
            this.el('div', 'cdp-china-summary-signal-value', signal.value),
          );
          if (signal.observedAt) {
            item.append(this.el('div', 'cdp-china-summary-attribution', `${t('countryBrief.china.observed')} ${signal.observedAt}`));
          }
          item.append(this.el('div', 'cdp-china-summary-attribution', `${t('countryBrief.china.source')} ${signal.source}`));
          children.push(item);
        }
        if (group.unavailableReason) {
          children.push(this.el('div', 'cdp-china-summary-note', group.unavailableReason));
        }
      }
      section.replaceChildren(...children);
    }
  }

  private chinaSummaryGroupLabel(id: ChinaCountrySummaryGroupId): string {
    const keys: Record<ChinaCountrySummaryGroupId, string> = {
      'macro-policy': 'macroPolicy',
      'market-credit': 'marketCredit',
      'trade-supply': 'tradeSupply',
      energy: 'energy',
      availability: 'availability',
    };
    return t(`countryBrief.china.${keys[id]}`);
  }

  private highlightInfrastructure(type: AssetType): void {
    if (!this.map) return;
    const assets = this.infrastructureByType.get(type) ?? [];
    if (assets.length === 0) return;
    this.map.flashAssets(type, assets.map((asset) => asset.id));
  }

  private open(): void {
    if (this.panel.classList.contains('active')) return;
    this.lastFocusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    this.panel.classList.add('active');
    this.panel.setAttribute('aria-hidden', 'false');
    document.addEventListener('keydown', this.handleGlobalKeydown);
    requestAnimationFrame(() => this.closeButton.focus());
    this.onStateChangeCallback?.({ visible: true, maximized: this.isMaximizedState });
  }

  private close(): void {
    if (!this.panel.classList.contains('active')) return;
    this.panel.classList.remove('active');
    this.panel.setAttribute('aria-hidden', 'true');
    document.removeEventListener('keydown', this.handleGlobalKeydown);
    if (this.lastFocusedElement) this.lastFocusedElement.focus();
  }

  private getFocusableElements(): HTMLElement[] {
    const selectors = 'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])';
    return Array.from(this.panel.querySelectorAll<HTMLElement>(selectors))
      .filter((el) => !el.hasAttribute('disabled') && el.getAttribute('aria-hidden') !== 'true' && el.offsetParent !== null);
  }

  private getOrCreatePanel(): HTMLElement {
    const existing = document.getElementById('country-deep-dive-panel');
    if (existing) return existing;

    const panel = this.el('aside', 'country-deep-dive');
    panel.id = 'country-deep-dive-panel';
    panel.setAttribute('aria-label', '국가 정보');
    panel.setAttribute('aria-hidden', 'true');

    const shell = this.el('div', 'country-deep-dive-shell');
    const close = this.el('button', 'panel-close', '×') as HTMLButtonElement;
    close.id = 'deep-dive-close';
    close.setAttribute('aria-label', t('common.close'));

    const content = this.el('div', 'panel-content');
    content.id = 'deep-dive-content';
    shell.append(close, content);
    panel.append(shell);
    document.body.append(panel);
    return panel;
  }

  private sectionCard(title: string, helpText?: string): [HTMLElement, HTMLElement] {
    const card = this.el('section', 'cdp-card');
    const heading = this.el('h3', 'cdp-card-title', title);
    if (helpText) {
      const tip = this.el('button', 'cdp-card-help', '?');
      tip.setAttribute('title', helpText);
      tip.setAttribute('type', 'button');
      heading.append(tip);
    }
    const body = this.el('div', 'cdp-card-body');
    card.append(heading, body);
    return [card, body];
  }

  private metric(label: string, value: string, chipClass: string): HTMLElement {
    const box = this.el('div', 'cdp-metric');
    box.append(
      this.el('span', 'cdp-metric-label', label),
      this.badge(value, `cdp-metric-value ${chipClass}`),
    );
    return box;
  }

  private makeLoading(text: string): HTMLElement {
    const wrap = this.el('div', 'cdp-loading-inline');
    wrap.append(
      this.el('div', 'cdp-loading-line'),
      this.el('div', 'cdp-loading-line cdp-loading-line-short'),
      this.el('span', 'cdp-loading-text', text),
    );
    return wrap;
  }

  private makeEmpty(text: string): HTMLElement {
    return this.el('div', 'cdp-empty', text);
  }

  private badge(text: string, className: string): HTMLElement {
    return this.el('span', className, text);
  }

  private formatBrief(text: string, sources: BriefSource[] = [], headlineCount = 0): string {
    return formatIntelBrief(
      text,
      sources.length > 0
        ? { sources }
        : headlineCount > 0
          ? { count: headlineCount, hrefPrefix: '#cdp-news-' }
          : undefined,
    );
  }

  private exportEvidenceBundle(): void {
    if (!this.currentCode || !this.currentName) return;
    const exportedAt = new Date().toISOString();
    const data: CountryEvidenceBundleInput = {
      country: this.currentName,
      code: this.currentCode,
      context: '국가 개요 자료',
      generatedAt: exportedAt,
      exportedAt,
    };

    if (this.currentScore) {
      data.score = this.currentScore.score;
      data.level = this.currentScore.level;
      data.trend = this.currentScore.trend;
      data.components = this.currentScore.components;
    }
    if (this.currentSignals) {
      data.signals = {
        criticalNews: this.currentSignals.criticalNews,
        protests: this.currentSignals.protests,
        militaryFlights: this.currentSignals.militaryFlights,
        militaryVessels: this.currentSignals.militaryVessels,
        militaryFlightsInCountry: this.currentSignals.militaryFlightsInCountry,
        militaryVesselsInCountry: this.currentSignals.militaryVesselsInCountry,
        outages: this.currentSignals.outages,
        aisDisruptions: this.currentSignals.aisDisruptions,
        satelliteFires: this.currentSignals.satelliteFires,
        radiationAnomalies: this.currentSignals.radiationAnomalies,
        temporalAnomalies: this.currentSignals.temporalAnomalies,
        cyberThreats: this.currentSignals.cyberThreats,
        earthquakes: this.currentSignals.earthquakes,
        displacementOutflow: this.currentSignals.displacementOutflow,
        climateStress: this.currentSignals.climateStress,
        conflictEvents: this.currentSignals.conflictEvents,
        activeStrikes: this.currentSignals.activeStrikes,
        orefSirens: this.currentSignals.orefSirens,
        orefHistory24h: this.currentSignals.orefHistory24h,
        aviationDisruptions: this.currentSignals.aviationDisruptions,
        travelAdvisories: this.currentSignals.travelAdvisories,
        travelAdvisoryMaxLevel: this.currentSignals.travelAdvisoryMaxLevel,
        gpsJammingHexes: this.currentSignals.gpsJammingHexes,
        thermalEscalations: this.currentSignals.thermalEscalations,
        sanctionsDesignations: this.currentSignals.sanctionsDesignations,
        sanctionsNewDesignations: this.currentSignals.sanctionsNewDesignations,
      };
    }
    if (this.currentBrief) data.brief = this.currentBrief;
    if (this.currentBriefGeneratedAt) data.briefGeneratedAt = new Date(this.currentBriefGeneratedAt).toISOString();
    if (this.currentBriefCached != null) data.briefCached = this.currentBriefCached;
    if (this.currentHeadlines.length > 0) {
      data.headlines = this.currentHeadlines.map((headline) => ({
        title: headline.title,
        source: headline.source,
        link: headline.link,
        pubDate: headline.pubDate ? new Date(headline.pubDate).toISOString() : undefined,
      }));
    }
    exportCountryEvidenceMarkdown(data);
  }

  private summarizeBrief(brief: string): string {
    const stripped = brief.replace(/\*\*(.*?)\*\*/g, '$1');
    const lines = stripped.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
    if (lines.length >= 3) {
      return lines.slice(0, 3).join('\n');
    }
    const normalized = stripped.replace(/\s+/g, ' ').trim();
    const sentences = normalized.split(/(?<=[.!?])\s+/).filter((part) => part.length > 0);
    return sentences.slice(0, 3).join(' ') || normalized;
  }

  private trendArrow(trend: CountryScore['trend']): string {
    if (trend === 'rising') return '↑';
    if (trend === 'falling') return '↓';
    return '→';
  }

  private trendArrowFromDirection(trend: TrendDirection): string {
    if (trend === 'up') return '↑';
    if (trend === 'down') return '↓';
    return '→';
  }

  private decodeEntities(text: string): string {
    return text
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&#x27;/g, "'")
      .replace(/&#x2F;/g, '/');
  }

  private toThreatLevel(level: string | undefined): ThreatLevel {
    if (level === 'critical' || level === 'high' || level === 'medium' || level === 'low' || level === 'info') {
      return level;
    }
    return 'low';
  }

  private toTimestamp(date: Date | string): number {
    const d = date instanceof Date ? date : new Date(date);
    return Number.isFinite(d.getTime()) ? d.getTime() : 0;
  }

  private shortDate(value: Date | string): string {
    const date = value instanceof Date ? value : new Date(value);
    if (!Number.isFinite(date.getTime())) return '알 수 없음';
    return date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  private formatRelativeTime(value: Date | string): string {
    const ms = Date.now() - this.toTimestamp(value);
    const mins = Math.floor(ms / 60000);
    if (mins < 1) return t('countryBrief.timeAgo.m', { count: 1 });
    if (mins < 60) return t('countryBrief.timeAgo.m', { count: mins });
    const hours = Math.floor(mins / 60);
    if (hours < 24) return t('countryBrief.timeAgo.h', { count: hours });
    const days = Math.floor(hours / 24);
    return t('countryBrief.timeAgo.d', { count: days });
  }

  private el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string): HTMLElementTagNameMap[K] {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  public static toFlagEmoji(code: string): string {
    return toFlagEmoji(code, '🌍');
  }
}
