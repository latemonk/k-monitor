import type { MapLayers } from '@/types';
// boundary-ignore: isDesktopRuntime is a pure env probe with no service dependencies
import { isDesktopRuntime } from '@/services/runtime';

export type MapRenderer = 'flat' | 'globe';
export type MapVariant = 'full' | 'tech' | 'finance' | 'happy' | 'commodity' | 'energy';

const _desktop = isDesktopRuntime();

export interface LayerDefinition {
  key: keyof MapLayers;
  icon: string;
  i18nSuffix: string;
  fallbackLabel: string;
  renderers: MapRenderer[];
  premium?: 'locked' | 'enhanced';
  /**
   * When true, this layer only renders under DeckGL — neither the SVG/mobile
   * fallback in Map.ts nor the WebGL GlobeMap has a code path for its data.
   * `renderers: ['flat']` is not sufficient because `'flat'` covers both
   * DeckGL-flat and SVG-flat. Consumers (layer picker, CMD+K dispatcher)
   * must additionally gate on `isDeckGLActive()` for these layers.
   */
  deckGLOnly?: boolean;
}

export type LayerExplanationCoverage = 'curated' | 'fallback';

export interface LayerExplanation {
  key: keyof MapLayers;
  coverage: LayerExplanationCoverage;
  category: string;
  purpose: string;
  source: string;
  freshness: string;
  confidence: string;
  limitations: string[];
  related: string[];
  evidence: string[];
}

const def = (
  key: keyof MapLayers,
  icon: string,
  i18nSuffix: string,
  fallbackLabel: string,
  renderers: MapRenderer[] = ['flat', 'globe'],
  premium?: 'locked' | 'enhanced',
  deckGLOnly?: boolean,
): LayerDefinition => ({
  key, icon, i18nSuffix, fallbackLabel, renderers,
  ...(premium && { premium }),
  ...(deckGLOnly && { deckGLOnly: true }),
});

export const LAYER_REGISTRY: Record<keyof MapLayers, LayerDefinition> = {
  iranAttacks:              def('iranAttacks',              '&#127919;', 'iranAttacks',              'Iran Attacks', ['flat', 'globe'], _desktop ? 'locked' : undefined),
  hotspots:                 def('hotspots',                 '&#127919;', 'intelHotspots',            'Intel Hotspots'),
  conflicts:                def('conflicts',                '&#9876;',   'conflictZones',            'Conflict Zones'),

  bases:                    def('bases',                    '&#127963;', 'militaryBases',            'Military Bases'),
  nuclear:                  def('nuclear',                  '&#9762;',   'nuclearSites',             'Nuclear Sites'),
  irradiators:              def('irradiators',              '&#9888;',   'gammaIrradiators',         'Gamma Irradiators'),
  radiationWatch:           def('radiationWatch',           '&#9762;',   'radiationWatch',           'Radiation Watch'),
  spaceports:               def('spaceports',               '&#128640;', 'spaceports',               'Spaceports'),
  satellites:               def('satellites',               '&#128752;', 'satellites',               'Orbital Surveillance', ['flat', 'globe']),

  cables:                   def('cables',                   '&#128268;', 'underseaCables',           'Undersea Cables'),
  pipelines:                def('pipelines',                '&#128738;', 'pipelines',                'Pipelines'),
  datacenters:              def('datacenters',              '&#128421;', 'aiDataCenters',            'AI Data Centers'),
  military:                 def('military',                 '&#9992;',   'militaryActivity',         'Military Activity'),
  ais:                      def('ais',                      '&#128674;', 'shipTraffic',              'Ship Traffic'),
  tradeRoutes:              def('tradeRoutes',              '&#9875;',   'tradeRoutes',              'Trade Routes'),
  flights:                  def('flights',                  '&#9992;',   'flightDelays',             'Aviation'),
  protests:                 def('protests',                 '&#128226;', 'protests',                 'Protests'),
  ucdpEvents:               def('ucdpEvents',               '&#9876;',   'ucdpEvents',               'Armed Conflict Events'),
  displacement:             def('displacement',             '&#128101;', 'displacementFlows',        'Displacement Flows'),
  climate:                  def('climate',                  '&#127787;', 'climateAnomalies',         'Climate Anomalies'),
  weather:                  def('weather',                  '&#9928;',   'weatherAlerts',            'Weather Alerts'),
  outages:                  def('outages',                  '&#128225;', 'internetOutages',          'Internet Disruptions'),
  cyberThreats:             def('cyberThreats',             '&#128737;', 'cyberThreats',             'Cyber Threats'),
  natural:                  def('natural',                  '&#127755;', 'naturalEvents',            'Natural Events'),
  fires:                    def('fires',                    '&#128293;', 'fires',                    'Fires'),
  waterways:                def('waterways',                '&#9875;',   'strategicWaterways',       'Chokepoints'),
  economic:                 def('economic',                 '&#128176;', 'economicCenters',          'Economic Centers'),
  minerals:                 def('minerals',                 '&#128142;', 'criticalMinerals',         'Critical Minerals'),
  gpsJamming:               def('gpsJamming',               '&#128225;', 'gpsJamming',               'GPS Jamming', ['flat', 'globe'], _desktop ? 'locked' : undefined),
  ciiChoropleth:            def('ciiChoropleth',            '&#127758;', 'ciiChoropleth',            'CII Instability', ['flat'], _desktop ? 'enhanced' : undefined),
  // DeckGLMap owns the resilience choropleth; Map.ts/MapContainer strip it
  // on SVG/mobile fallback.
  resilienceScore:          def('resilienceScore',          '&#128200;', 'resilienceScore',          'Resilience', ['flat'], 'locked', true),
  dayNight:                 def('dayNight',                 '&#127763;', 'dayNight',                 'Day/Night', ['flat']),
  sanctions:                def('sanctions',                '&#128683;', 'sanctions',                'Sanctions', ['flat']),
  startupHubs:              def('startupHubs',              '&#128640;', 'startupHubs',              'Startup Hubs'),
  techHQs:                  def('techHQs',                  '&#127970;', 'techHQs',                  'Tech HQs'),
  accelerators:             def('accelerators',             '&#9889;',   'accelerators',             'Accelerators'),
  cloudRegions:             def('cloudRegions',             '&#9729;',   'cloudRegions',             'Cloud Regions'),
  techEvents:               def('techEvents',               '&#128197;', 'techEvents',               'Tech Events'),
  stockExchanges:           def('stockExchanges',           '&#127963;', 'stockExchanges',           'Stock Exchanges'),
  financialCenters:         def('financialCenters',         '&#128176;', 'financialCenters',         'Financial Centers'),
  centralBanks:             def('centralBanks',             '&#127974;', 'centralBanks',             'Central Banks'),
  commodityHubs:            def('commodityHubs',            '&#128230;', 'commodityHubs',            'Commodity Hubs'),
  gulfInvestments:          def('gulfInvestments',          '&#127760;', 'gulfInvestments',          'GCC Investments'),
  positiveEvents:           def('positiveEvents',           '&#127775;', 'positiveEvents',           'Positive Events'),
  kindness:                 def('kindness',                 '&#128154;', 'kindness',                 'Acts of Kindness'),
  happiness:                def('happiness',                '&#128522;', 'happiness',                'World Happiness'),
  speciesRecovery:          def('speciesRecovery',          '&#128062;', 'speciesRecovery',          'Species Recovery'),
  renewableInstallations:   def('renewableInstallations',   '&#9889;',   'renewableInstallations',   'Clean Energy'),
  miningSites:              def('miningSites',              '&#128301;', 'miningSites',              'Mining Sites'),
  processingPlants:         def('processingPlants',         '&#127981;', 'processingPlants',         'Processing Plants'),
  commodityPorts:           def('commodityPorts',           '&#9973;',   'commodityPorts',           'Commodity Ports'),
  webcams:                  def('webcams',                  '&#128247;', 'webcams',                  'Live Webcams'),
  // weatherRadar removed — radar tiles now auto-start when Weather Alerts layer is toggled on
  diseaseOutbreaks:         def('diseaseOutbreaks',         '&#129440;', 'diseaseOutbreaks',         'Disease Outbreaks', ['flat'], undefined, true),
  // DeckGL-only layers. `renderers: ['flat']` hides them from the globe
  // picker (GlobeMap has no branch in ensureStaticDataForLayer / no entry
  // in the layer-channel map). `deckGLOnly: true` also hides them from
  // the SVG/mobile fallback's CMD+K dispatch (Map.ts has no SVG render
  // path for either marker/pin type). Restore to `['flat', 'globe']`
  // without `deckGLOnly` once both renderers gain real support.
  storageFacilities:        def('storageFacilities',        '&#127959;', 'storageFacilities',        'Storage Facilities', ['flat'], undefined, true),
  fuelShortages:            def('fuelShortages',            '&#9881;',   'fuelShortages',            'Fuel Shortages', ['flat'], undefined, true),
  liveTankers:              def('liveTankers',              '&#128674;', 'liveTankers',              'Live Tanker Positions', ['flat'], undefined, true),
};

export const V1_LAYER_EXPLANATION_KEYS = [
  'conflicts',
  'ucdpEvents',
  'ciiChoropleth',
  'natural',
  'flights',
  'ais',
  'waterways',
  'tradeRoutes',
  'cyberThreats',
  'hotspots',
] as const satisfies readonly (keyof MapLayers)[];

// KCG fork: i 설명 카드 전면 한글화 + 이 포크의 실제 구성(adsb.lol 커뮤니티
// ADS-B, 선박 데모 등)에 맞게 현행화(사장님 지시 07-21). evidence 는 렌더하지
// 않으므로 비움(내부 경로 사용자 노출 금지).
export const LAYER_EXPLANATIONS: Partial<Record<keyof MapLayers, LayerExplanation>> = {
  conflicts: {
    key: 'conflicts',
    coverage: 'curated',
    category: '분쟁',
    purpose: '알려진 분쟁 구역과 DMZ 같은 지정학 경계를 지도에 표시해 실시간 신호를 맥락 위에서 볼 수 있게 해요.',
    source: '자체 정리한 분쟁 구역 목록과 UCDP·ACLED 분쟁 데이터, DMZ 등 공개 경계 정보.',
    freshness: '기본 구역은 고정 표시예요. 개별 분쟁 사건은 UCDP·ACLED 피드로 따로 갱신돼요.',
    confidence: '지리적 방향 잡기에 좋아요. 이 표시만으로 실시간 교전 확인으로 보면 안 돼요.',
    limitations: [
      '고정 구역이라 빠른 전황 변화를 늦게 반영할 수 있어요.',
      '일부 분쟁 근거는 구역 폴리곤이 아니라 뉴스·관련 패널에 먼저 나타나요.',
    ],
    related: ['해양·안보 뉴스', 'AI 인사이트'],
    evidence: [],
  },
  ucdpEvents: {
    key: 'ucdpEvents',
    coverage: 'curated',
    category: '분쟁',
    purpose: '무력 분쟁 사건을 국가·당사자·날짜·사망자 추정 범위와 함께 사건 단위로 표시해요.',
    source: '웁살라대학 분쟁 데이터 프로그램(UCDP) 공개 API.',
    freshness: '약 6시간 주기로 갱신돼요.',
    confidence: '속보보다 검증 일관성이 높지만, 의도적으로 지연 반영되는 연구용 데이터예요.',
    limitations: [
      '연구 등급 발표 주기라 아주 최근 사건은 빠질 수 있어요.',
      '사망자 수는 추정 범위로 봐야 해요 — 정확한 집계가 아니에요.',
    ],
    related: ['해양·안보 뉴스', 'AI 인사이트'],
    evidence: [],
  },
  ciiChoropleth: {
    key: 'ciiChoropleth',
    coverage: 'curated',
    category: '국가 리스크',
    purpose: '분쟁·시위·사이버·재난·뉴스 신호를 종합한 국가 불안정 지수로 나라별 색을 칠해 큰 그림 파악을 도와요.',
    source: '분쟁·소요·권고·사이버·선박·항공·자연재해·뉴스 신호를 종합한 자체 점수 모델.',
    freshness: '점수 캐시는 약 8분 주기로 갱신돼요.',
    confidence: '모델이 계산한 종합 신호예요. 공식 국가 등급이나 확률 예측이 아니에요.',
    limitations: [
      '원천 데이터가 부족한 나라는 점수가 있어도 신뢰도가 낮을 수 있어요.',
      '국가 단위 색이라 지역별 편차는 가려져요 — 인용 전에 패널로 확인하세요.',
    ],
    related: ['AI 인사이트', '국내 주요 뉴스'],
    evidence: [],
  },
  natural: {
    key: 'natural',
    coverage: 'curated',
    category: '자연재해',
    purpose: '지진, 대형 재난 경보, 위성 관측 이벤트를 지도에 표시해 재난 상황 인식을 도와요.',
    source: '미국 지질조사국(USGS) 지진, GDACS 국제 재난 경보, NASA EONET 관측 이벤트.',
    freshness: '재난 이벤트는 약 3시간 주기로 모아요. 지진 원천은 대략 5분 간격으로 발표돼요.',
    confidence: '공개 재난 신호 탐지에는 강해요. 재해 유형과 원천 보고 속도에 따라 편차가 있어요.',
    limitations: [
      '지도 가독성을 위해 경미한 경보는 걸러서 보여줘요.',
      '오래된 산불 이벤트는 신선도 필터에 걸려 안 보일 수 있어요.',
    ],
    related: ['기상 경보 레이어', '해양 기상·수온'],
    evidence: [],
  },
  flights: {
    key: 'flights',
    coverage: 'curated',
    category: '항공',
    purpose: '보고 있는 지도 영역의 실시간 항공기 위치를 표시해요. 항공기를 클릭하면 편명·항공사·노선 상세가 떠요.',
    source: '커뮤니티 ADS-B 수신망(adsb.lol·airplanes.live — 무료 공개 데이터). 노선·항공사 정보는 adsbdb 커뮤니티 DB.',
    freshness: '화면에 보이는 영역만 약 2분 주기로 조회하고, 지도를 움직이면 다시 불러와요.',
    confidence: '실제 항공기 신호 기반이라 위치 신뢰도가 높아요. 다만 수신기 커버리지가 약한 해상·오지는 빠질 수 있어요.',
    limitations: [
      'ADS-B 수신 커버리지가 약한 곳은 항공기가 지연되거나 안 보일 수 있어요.',
      '군용기 등 신호를 끈 항공기는 표시되지 않아요.',
    ],
    related: ['항공 운항 정보 패널(공항 현황·실시간 추적)'],
    evidence: [],
  },
  ais: {
    key: 'ais',
    coverage: 'curated',
    category: '해양',
    purpose: '주요 해역과 요충 수로 주변의 선박 밀집도·신호 이상 징후를 표시해요.',
    source: '선박자동식별장치(AIS) 수신 데이터. 현재 실계약 수신원이 연결되기 전이라 시뮬레이션 데이터가 함께 표시될 수 있어요.',
    freshness: '수신이 정상일 때 수 초 단위로 재구성돼요.',
    confidence: 'AIS는 선박이 스스로 송신하는 신호라 끄거나 위조할 수 있어요 — 이상 징후 선별용으로 보세요.',
    limitations: [
      '연안 수신망 커버리지가 고르지 않아 먼바다는 잘 안 보여요.',
      '「어둠 항해」는 신호 공백에서 추정한 것으로, 의도를 증명하지 않아요.',
    ],
    related: ['해역 선박 현황', 'AI 이상 활동 감시'],
    evidence: [],
  },
  waterways: {
    key: 'waterways',
    coverage: 'curated',
    category: '해양',
    purpose: '전략 수로와 요충 해협을 표시해 해상 교란 신호를 고정된 지리 위에서 해석할 수 있게 해요.',
    source: '자체 정리한 전략 수로 목록과 공개 해상 경보·항만 동향 데이터.',
    freshness: '수로 위치는 고정이에요. 요충 해협 상태는 10~30분 주기로 갱신돼요.',
    confidence: '지리 정보는 정확해요. 실시간 교란 판단은 함께 쓰는 선박·경보 데이터 상태에 달려 있어요.',
    limitations: [
      '요충 해협 마커가 보인다고 지금 교란이 있다는 뜻은 아니에요.',
      '표시된 경계·항로는 실제 교통 흐름을 단순화한 모델이에요.',
    ],
    related: ['해역 선박 현황', '교역 항로 레이어'],
    evidence: [],
  },
  tradeRoutes: {
    key: 'tradeRoutes',
    coverage: 'curated',
    category: '해양',
    purpose: '컨테이너·에너지·벌크 주요 항로를 요충 해협과 함께 그려 교란이 번지는 경로를 추론할 수 있게 해요.',
    source: '자체 정리한 교역 항로 목록과 요충 해협 상태 데이터.',
    freshness: '항로 모양은 고정이에요. 해협 상태는 10~30분 주기로 갱신돼요.',
    confidence: '항로 수준의 노출 파악에 좋아요. 개별 선박의 실제 항로 데이터가 아니에요.',
    limitations: [
      '항로는 모델링된 회랑이라 특정 선박의 항해 계획과 다를 수 있어요.',
      '교란 표시는 현재 해협·선박 데이터 상태에 의존해요.',
    ],
    related: ['전략 수로 레이어', '해역 선박 현황'],
    evidence: [],
  },
  cyberThreats: {
    key: 'cyberThreats',
    coverage: 'curated',
    category: '사이버',
    purpose: '공격 지휘 서버, 악성코드 유포지, 피싱, 랜섬웨어 인프라 같은 위협 지표를 위치와 함께 표시해요.',
    source: 'abuse.ch(Feodo Tracker·URLhaus), AlienVault OTX, AbuseIPDB, ransomware.live 등 공개 위협 인텔 피드.',
    freshness: '약 2시간 주기로 수집하고, 최근 14일 지표만 표시해요.',
    confidence: '인프라 가시화에는 좋지만, 공격 주체 판단과 IP 위치는 오차가 있을 수 있어요.',
    limitations: [
      'IP 위치는 운영자·피해자가 아니라 호스팅 서버 위치를 가리킬 수 있어요.',
      '피드 가용성에 따라 커버리지가 치우칠 수 있어요.',
    ],
    related: ['지도 팝업 상세'],
    evidence: [],
  },
  hotspots: {
    key: 'hotspots',
    coverage: 'curated',
    category: '정보 핫스팟',
    purpose: '감시 중인 지정학 요충지를 표시하고, 관련 뉴스와 긴장 신호가 몰리면 단계를 올려서 알려줘요.',
    source: '자체 정리한 요충지 목록과 뉴스 수집·긴장도 점수, 군사 활동 신호.',
    freshness: '요충지 위치는 고정이에요. 뉴스 신호는 수 분 단위로 따로 갱신돼요.',
    confidence: '살펴볼 곳을 고르는 단서로 쓰세요. 밑에 깔린 뉴스를 열어보기 전엔 인용 근거가 아니에요.',
    limitations: [
      '보도량이 많은 지역이 실제보다 과대 대표될 수 있어요.',
      '보도가 적은 사건은 놓칠 수 있어요.',
    ],
    related: ['국내 주요 뉴스', 'AI 인사이트'],
    evidence: [],
  },
  liveTankers: {
    key: 'liveTankers',
    coverage: 'curated',
    category: '해양',
    purpose: '한국 근해 6개 감시구역의 선박을 방향 화살표와 선종 색으로 표시해요. 선박을 클릭하면 선명·국적·속력 상세가 떠요.',
    source: '선박자동식별장치(AIS) 실데이터예요. 유료 수신 계약의 월 조회 한도 안에서 받아와요.',
    freshness: '위치는 약 1시간 주기로 일괄 수신해요 — 초 단위 실시간 스트리밍이 아니에요. 관심 선박으로 등록하면 더 자주 추적해요.',
    confidence: '실데이터예요. 다만 위치의 최신성은 수신 주기(약 1시간)만큼 늦을 수 있어요.',
    limitations: [
      '지상 수신망 공백으로 일부 해역(서해 남부·제주 먼바다)은 실제보다 적게 보여요.',
      '밀집 해역은 조회 한도 때문에 일부 선박이 잘릴 수 있어요.',
      'AIS 특성상 신호를 끈 선박은 안 보여요.',
    ],
    related: ['해역 선박 현황', 'AI 이상 활동 감시'],
    evidence: [],
  },
};

const VARIANT_LAYER_ORDER: Record<MapVariant, Array<keyof MapLayers>> = {
  full: [
    // KCG fork: 목록 순서 = 레이어 패널 노출 순서(사장님 지시 07-21 —
    // 중요한 것부터). liveTankers 가 목록에 없으면 sanitizeLayersForVariant
    // 가 스트립하니 절대 빼지 말 것(과거 "no vessels" 사고 원인).
    // ── 1순위: 교통·기상·재난 (관제 핵심)
    'liveTankers', 'flights', 'ais', 'weather', 'natural', 'fires',
    // ── 2순위: 안보·군사
    'hotspots', 'conflicts', 'bases', 'military', 'protests', 'nuclear',
    // ── 3순위: 공중·우주·전파
    'satellites', 'spaceports', 'gpsJamming',
    // ── 4순위: 인프라·기타
    'outages', 'cyberThreats', 'waterways', 'tradeRoutes', 'cables', 'pipelines',
    'datacenters', 'ucdpEvents', 'displacement', 'climate',
    'storageFacilities', 'fuelShortages', 'irradiators', 'radiationWatch',
    'economic', 'minerals', 'ciiChoropleth', 'resilienceScore', 'sanctions',
    'dayNight', 'webcams', 'diseaseOutbreaks', 'iranAttacks',
  ],
  tech: [
    'startupHubs', 'techHQs', 'accelerators', 'cloudRegions',
    'datacenters', 'cables', 'outages', 'cyberThreats',
    'techEvents', 'resilienceScore', 'natural', 'fires', 'dayNight',
  ],
  finance: [
    'stockExchanges', 'financialCenters', 'centralBanks', 'commodityHubs',
    'gulfInvestments', 'tradeRoutes', 'cables', 'pipelines',
    'outages', 'weather', 'economic', 'waterways',
    'resilienceScore', 'natural', 'cyberThreats', 'sanctions', 'dayNight',
  ],
  happy: [
    'positiveEvents', 'kindness', 'happiness', 'resilienceScore',
    'speciesRecovery', 'renewableInstallations',
  ],
  commodity: [
    'miningSites', 'processingPlants', 'commodityPorts', 'commodityHubs',
    'minerals', 'pipelines', 'waterways', 'tradeRoutes',
    'ais', 'economic', 'fires', 'climate',
    'resilienceScore', 'natural', 'weather', 'outages', 'sanctions', 'dayNight',
  ],
  energy: [
    // Core energy infrastructure — mirror of ENERGY_MAP_LAYERS in panels.ts
    'pipelines', 'storageFacilities', 'fuelShortages', 'waterways', 'commodityPorts', 'commodityHubs',
    'ais', 'liveTankers', 'tradeRoutes', 'minerals',
    // Energy-adjacent context
    'sanctions', 'fires', 'climate', 'weather', 'outages', 'natural',
    'resilienceScore', 'dayNight',
  ],
};

const I18N_PREFIX = 'components.deckgl.layers.';

// Iran-events domain sunset (war ended 2026-07). Default OFF: hide the layer
// from the picker (getLayersForVariant), strip it from any restored MapLayers
// (getAllowedLayerKeys → sanitizeLayersForVariant), and make CMD+K skip it
// (isLayerExecutable). Set VITE_ENABLE_IRAN_ATTACKS=true (+ backend
// IRAN_EVENTS_ENABLED=true) and rebuild to restore. Mirrors CYBER_LAYER_ENABLED.
// Guarded with isClientRuntime so `import.meta.env` (undefined under node:test,
// where this config module is imported directly) is never dereferenced there —
// see src/services/maritime/index.ts and tests/browser-bundle-secret-guard.
const IRAN_ATTACKS_ENABLED = typeof window !== 'undefined' && import.meta.env.VITE_ENABLE_IRAN_ATTACKS === 'true';

function isSunsetLayer(key: keyof MapLayers): boolean {
  return !IRAN_ATTACKS_ENABLED && key === 'iranAttacks';
}

export function getLayersForVariant(variant: MapVariant, renderer: MapRenderer): LayerDefinition[] {
  const keys = VARIANT_LAYER_ORDER[variant] ?? VARIANT_LAYER_ORDER.full;
  return keys
    .filter(k => !isSunsetLayer(k))
    .map(k => LAYER_REGISTRY[k])
    .filter(d => d.renderers.includes(renderer));
}

export function getAllowedLayerKeys(variant: MapVariant): Set<keyof MapLayers> {
  return new Set((VARIANT_LAYER_ORDER[variant] ?? VARIANT_LAYER_ORDER.full).filter(k => !isSunsetLayer(k)));
}

export function sanitizeLayersForVariant(layers: MapLayers, variant: MapVariant): MapLayers {
  const allowed = getAllowedLayerKeys(variant);
  const sanitized = { ...layers };
  for (const key of Object.keys(sanitized) as Array<keyof MapLayers>) {
    if (!allowed.has(key)) sanitized[key] = false;
  }
  return sanitized;
}

/**
 * Checks whether a layer can actually render under the given renderer +
 * DeckGL state. Used by both the layer picker UI and the CMD+K dispatcher
 * to hide / silently-skip toggles that would be a no-op.
 *
 * Rules:
 *   - The layer's declared `renderers` must include `currentRenderer`
 *     (catches globe toggles for flat-only layers).
 *   - If `deckGLOnly: true`, the SVG/mobile fallback can't render either,
 *     so DeckGL must be active (catches flat-only layers whose data
 *     shape is DeckGL-specific — see storageFacilities, fuelShortages).
 */
export function isLayerExecutable(
  layerKey: keyof MapLayers,
  currentRenderer: MapRenderer,
  isDeckGLActive: boolean,
): boolean {
  if (isSunsetLayer(layerKey)) return false;
  const def = LAYER_REGISTRY[layerKey];
  if (!def) return false;
  if (!def.renderers.includes(currentRenderer)) return false;
  if (def.deckGLOnly && !isDeckGLActive) return false;
  return true;
}

export const LAYER_SYNONYMS: Record<string, Array<keyof MapLayers>> = {
  aviation: ['flights'],
  flight: ['flights'],
  airplane: ['flights'],
  plane: ['flights'],
  notam: ['flights'],
  ship: ['ais', 'tradeRoutes'],
  vessel: ['ais'],
  maritime: ['ais', 'waterways', 'tradeRoutes'],
  sea: ['ais', 'waterways', 'cables'],
  ocean: ['cables', 'waterways'],
  war: ['conflicts', 'ucdpEvents', 'military'],
  battle: ['conflicts', 'ucdpEvents'],
  army: ['military', 'bases'],
  navy: ['military', 'ais'],
  missile: ['iranAttacks', 'military'],
  nuke: ['nuclear'],
  radiation: ['radiationWatch', 'nuclear', 'irradiators'],
  radnet: ['radiationWatch'],
  safecast: ['radiationWatch'],
  anomaly: ['radiationWatch', 'climate'],
  space: ['spaceports', 'satellites'],
  orbit: ['satellites'],
  internet: ['outages', 'cables', 'cyberThreats'],
  cyber: ['cyberThreats', 'outages'],
  hack: ['cyberThreats'],
  earthquake: ['natural'],
  volcano: ['natural'],
  tsunami: ['natural'],
  storm: ['weather', 'natural'],
  hurricane: ['weather', 'natural'],
  typhoon: ['weather', 'natural'],
  cyclone: ['weather', 'natural'],
  flood: ['weather', 'natural'],
  wildfire: ['fires'],
  forest: ['fires'],
  refugee: ['displacement'],
  migration: ['displacement'],
  riot: ['protests'],
  demonstration: ['protests'],
  oil: ['pipelines', 'commodityHubs'],
  gas: ['pipelines'],
  energy: ['pipelines', 'renewableInstallations'],
  solar: ['renewableInstallations'],
  wind: ['renewableInstallations'],
  green: ['renewableInstallations', 'speciesRecovery'],
  money: ['economic', 'financialCenters', 'stockExchanges'],
  bank: ['centralBanks', 'financialCenters'],
  stock: ['stockExchanges'],
  trade: ['tradeRoutes', 'waterways'],
  cloud: ['cloudRegions', 'datacenters'],
  ai: ['datacenters'],
  startup: ['startupHubs', 'accelerators'],
  tech: ['techHQs', 'techEvents', 'startupHubs', 'cloudRegions', 'datacenters'],
  gps: ['gpsJamming'],
  jamming: ['gpsJamming'],
  mineral: ['minerals', 'miningSites'],
  mining: ['miningSites'],
  port: ['commodityPorts'],
  happy: ['happiness', 'kindness', 'positiveEvents'],
  good: ['positiveEvents', 'kindness'],
  animal: ['speciesRecovery'],
  wildlife: ['speciesRecovery'],
  gulf: ['gulfInvestments'],
  gcc: ['gulfInvestments'],
  sanction: ['sanctions'],
  night: ['dayNight'],
  sun: ['dayNight'],
  webcam: ['webcams'],
  camera: ['webcams'],
  livecam: ['webcams'],
};

export function resolveLayerLabel(def: LayerDefinition, tFn?: (key: string) => string): string {
  if (tFn) {
    const translated = tFn(I18N_PREFIX + def.i18nSuffix);
    if (translated && translated !== I18N_PREFIX + def.i18nSuffix) return translated;
  }
  return def.fallbackLabel;
}

export function hasCuratedLayerExplanation(layerKey: keyof MapLayers): boolean {
  return LAYER_EXPLANATIONS[layerKey]?.coverage === 'curated';
}

export function getLayerExplanation(layerKey: keyof MapLayers): LayerExplanation {
  const curated = LAYER_EXPLANATIONS[layerKey];
  if (curated) return curated;

  return {
    key: layerKey,
    coverage: 'fallback',
    category: '레이어',
    purpose: '지도에서 켜고 끌 수 있는 레이어예요. 상세 출처·신뢰도 설명 카드는 아직 준비 중이에요.',
    source: '상세 출처 설명이 아직 등록되지 않았어요.',
    freshness: '레이어별 갱신 주기 설명이 아직 없어요. 관련 패널의 실시간 배지에서 갱신 상태를 확인할 수 있어요.',
    confidence: '출처 설명이 등록되면 함께 안내할게요.',
    limitations: [
      '설명 카드가 없다고 레이어가 동작하지 않는 건 아니에요.',
      '지도 팝업과 관련 패널에서 세부 정보를 확인할 수 있어요.',
    ],
    related: ['레이어 안내'],
    evidence: [],
  };
}

export function bindLayerSearch(container: HTMLElement): void {
  const searchInput = container.querySelector('.layer-search') as HTMLInputElement | null;
  if (!searchInput) return;
  searchInput.addEventListener('input', () => {
    const q = searchInput.value.trim().toLowerCase();
    const synonymHits = new Set<string>();
    if (q) {
      for (const [alias, keys] of Object.entries(LAYER_SYNONYMS)) {
        if (alias.includes(q)) keys.forEach(k => synonymHits.add(k));
      }
    }
    container.querySelectorAll('.layer-toggle').forEach(label => {
      const el = label as HTMLElement;
      if (el.hasAttribute('data-layer-hidden')) return;
      const row = el.closest('.layer-toggle-row') as HTMLElement | null;
      const displayTarget = row ?? el;
      if (!q) { displayTarget.style.display = ''; return; }
      const key = label.getAttribute('data-layer') || '';
      const text = label.textContent?.toLowerCase() || '';
      const match = text.includes(q) || key.toLowerCase().includes(q) || synonymHits.has(key);
      displayTarget.style.display = match ? '' : 'none';
    });
  });
}
