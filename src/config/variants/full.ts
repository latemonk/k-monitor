// Full geopolitical variant - worldmonitor.app
import type { PanelConfig, MapLayers } from '@/types';
import type { VariantConfig } from './base';

// Re-export base config
export * from './base';

// Geopolitical-specific exports
export * from '../feeds';
export * from '../geo';
export * from '../irradiators';
export * from '../pipelines';
export * from '../ports';
export * from '../military';
// airports intentionally not re-exported here — keeps the airports table off the
// eager variant/@/config barrel; AviationCommandBar imports it directly. (#4404)
export * from '../entities';

// KCG fork: decluttered Korea-Coast-Guard default set. International news
// regions, markets, commodities, crypto and premium surfaces are all off —
// the dashboard leads with vessel activity, marine conditions and Korean
// news/intel. Users can still enable extra panels from settings.
export const DEFAULT_PANELS: Record<string, PanelConfig> = {
  map: { name: '해양 상황도', enabled: true, priority: 1 },
  'kcg-breaking': { name: '실시간 속보', enabled: true, priority: 1 },
  'kcg-vessels': { name: '해역 선박 현황', enabled: true, priority: 1 },
  'kcg-alerts': { name: 'AI 이상 활동 감시', enabled: true, priority: 1 },
  'kcg-sea': { name: '해양 기상·수온', enabled: true, priority: 1 },
  'live-news': { name: '국내 뉴스 라이브', enabled: true, priority: 1 },
  intel: { name: '해양·안보 뉴스', enabled: true, priority: 1 },
  politics: { name: '국내 주요 뉴스', enabled: true, priority: 1 },
  insights: { name: 'AI 인사이트', enabled: true, priority: 1 },
  monitors: { name: '내 모니터', enabled: true, priority: 2 },
};

// Map layers for geopolitical view
export const DEFAULT_MAP_LAYERS: MapLayers = {
  gpsJamming: false,
  satellites: false,


  conflicts: false,
  bases: false,
  cables: false,
  pipelines: false,
  hotspots: false,
  ais: true,
  liveTankers: true,
  nuclear: false,
  irradiators: false,
  sanctions: false,
  weather: true,
  economic: false,
  waterways: false,
  outages: false,
  cyberThreats: false,
  datacenters: false,
  protests: false,
  flights: true,
  military: false,
  natural: true,
  spaceports: false,
  minerals: false,
  fires: false,
  ucdpEvents: false,
  displacement: false,
  climate: false,
  // Tech layers (disabled in full variant)
  startupHubs: false,
  cloudRegions: false,
  accelerators: false,
  techHQs: false,
  techEvents: false,
  // Finance layers (disabled in full variant)
  stockExchanges: false,
  financialCenters: false,
  centralBanks: false,
  commodityHubs: false,
  gulfInvestments: false,
  // Happy variant layers
  positiveEvents: false,
  kindness: false,
  happiness: false,
  speciesRecovery: false,
  renewableInstallations: false,
  tradeRoutes: false,
  iranAttacks: false,
  ciiChoropleth: false,
  resilienceScore: false,
  dayNight: false,
  // Commodity variant layers (disabled in full variant)
  miningSites: false,
  processingPlants: false,
  commodityPorts: false,
  webcams: false,
  diseaseOutbreaks: false,
};

// Mobile-specific defaults for geopolitical
export const MOBILE_DEFAULT_MAP_LAYERS: MapLayers = {
  gpsJamming: false,
  satellites: false,


  conflicts: false,
  bases: false,
  cables: false,
  pipelines: false,
  hotspots: false,
  ais: true,
  liveTankers: true,
  nuclear: false,
  irradiators: false,
  sanctions: false,
  weather: true,
  economic: false,
  waterways: false,
  outages: false,
  cyberThreats: false,
  datacenters: false,
  protests: false,
  flights: true,
  military: false,
  natural: true,
  spaceports: false,
  minerals: false,
  fires: false,
  ucdpEvents: false,
  displacement: false,
  climate: false,
  // Tech layers (disabled in full variant)
  startupHubs: false,
  cloudRegions: false,
  accelerators: false,
  techHQs: false,
  techEvents: false,
  // Finance layers (disabled in full variant)
  stockExchanges: false,
  financialCenters: false,
  centralBanks: false,
  commodityHubs: false,
  gulfInvestments: false,
  // Happy variant layers
  positiveEvents: false,
  kindness: false,
  happiness: false,
  speciesRecovery: false,
  renewableInstallations: false,
  tradeRoutes: false,
  iranAttacks: false,
  ciiChoropleth: false,
  resilienceScore: false,
  dayNight: false,
  // Commodity variant layers (disabled in full variant)
  miningSites: false,
  processingPlants: false,
  commodityPorts: false,
  webcams: false,
  diseaseOutbreaks: false,
};

export const VARIANT_CONFIG: VariantConfig = {
  name: 'full',
  description: 'Full geopolitical intelligence dashboard',
  panels: DEFAULT_PANELS,
  mapLayers: DEFAULT_MAP_LAYERS,
  mobileMapLayers: MOBILE_DEFAULT_MAP_LAYERS,
};
