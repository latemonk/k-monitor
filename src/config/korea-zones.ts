/**
 * 한국 근해 감시 구역 (KCG fork).
 *
 * Each zone is a chokepoint-registry-shaped entry so the live-vessel
 * service (src/services/live-tankers.ts) can query the relay's bbox
 * snapshot path unchanged: one getVesselSnapshot call per zone with a
 * ±2° box around the centroid. Together the six boxes cover the West
 * Sea (incl. NLL area / 서해 5도), Jeju, the Korea Strait and the East
 * Sea including Dokdo.
 */
import type { ChokepointRegistryEntry } from './chokepoint-registry';

export interface KoreaZoneEntry extends ChokepointRegistryEntry {
  /** Korean display name shown in tooltips / alert reports. */
  nameKo: string;
}

function zone(id: string, nameKo: string, displayName: string, lat: number, lon: number): KoreaZoneEntry {
  return {
    id,
    displayName,
    nameKo,
    geoId: id,
    relayName: displayName,
    portwatchName: displayName,
    corridorRiskName: null,
    baselineId: null,
    shockModelSupported: false,
    routeIds: [],
    lat,
    lon,
  };
}

export const KOREA_ZONES: readonly KoreaZoneEntry[] = [
  zone('kr_west_incheon', '서해 중부(인천·서해5도)', 'West Sea — Incheon/NLL', 37.3, 125.6),
  zone('kr_west_south', '서해 남부(군산·목포)', 'West Sea — Gunsan/Mokpo', 35.3, 125.7),
  zone('kr_jeju', '제주 해역', 'Jeju Waters', 33.2, 126.5),
  zone('kr_korea_strait', '남해·대한해협(부산)', 'Korea Strait — Busan', 34.8, 128.9),
  zone('kr_east_south', '동해 남부(울산·포항)', 'East Sea — Ulsan/Pohang', 36.3, 130.2),
  zone('kr_east_dokdo', '동해 중부(독도)', 'East Sea — Dokdo', 37.6, 131.2),
];

export function getKoreaZone(id: string): KoreaZoneEntry | undefined {
  return KOREA_ZONES.find((z) => z.id === id);
}
