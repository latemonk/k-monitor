import type {
  ServerContext,
  SearchVesselsRequest,
  SearchVesselsResponse,
  VesselRegistryEntry,
} from '../../../../src/generated/server/worldmonitor/maritime/v1/service_server';

import { cachedFetchJson } from '../../../_shared/redis';
import { hasVesselApiKey, reserveVesselApiBudget, vesselApiFetch } from './_vesselapi';

// Registry data is near-static — cache generously so repeated searches for
// the same vessel are free against the monthly quota.
const CACHE_TTL_S = 24 * 3600;
const MAX_RESULTS = 20;

interface UpstreamVessel {
  mmsi?: number | string;
  imo?: number | string;
  name?: string;
  name_ais?: string;
  call_sign?: string;
  country_code?: string;
  vessel_type?: string;
  length?: number;
  gross_tonnage?: number;
  year_built?: number;
  home_port?: string;
}

function toEntry(v: UpstreamVessel): VesselRegistryEntry {
  return {
    mmsi: v.mmsi != null ? String(v.mmsi) : '',
    imo: v.imo != null ? String(v.imo) : '',
    name: String(v.name || v.name_ais || '').trim(),
    callsign: String(v.call_sign || '').trim(),
    flag: String(v.country_code || '').trim(),
    vesselType: String(v.vessel_type || '').trim(),
    lengthM: Number(v.length) || 0,
    grossTonnage: Number(v.gross_tonnage) || 0,
    yearBuilt: Number(v.year_built) || 0,
    homePort: String(v.home_port || '').trim(),
  };
}

async function fetchByName(name: string): Promise<VesselRegistryEntry[] | null> {
  const data = await vesselApiFetch(
    `/search/vessels?filter.name=${encodeURIComponent(name)}&pagination.limit=${MAX_RESULTS}`,
  ) as { vessels?: UpstreamVessel[] } | null;
  if (!data) return null;
  return (Array.isArray(data.vessels) ? data.vessels : []).map(toEntry).filter((e) => e.mmsi || e.imo);
}

async function fetchById(id: string, idType: 'mmsi' | 'imo'): Promise<VesselRegistryEntry[] | null> {
  const data = await vesselApiFetch(
    `/vessel/${encodeURIComponent(id)}?filter.idType=${idType}`,
  ) as { vessel?: UpstreamVessel } | null;
  if (!data) return null;
  return data.vessel ? [toEntry(data.vessel)] : [];
}

export async function searchVessels(
  _ctx: ServerContext,
  req: SearchVesselsRequest,
): Promise<SearchVesselsResponse> {
  const query = String(req.query || '').trim();
  if (query.length < 2 || query.length > 60 || !hasVesselApiKey()) {
    return { vessels: [], dataAvailable: true, quotaExhausted: false };
  }

  const normalized = query.toLowerCase();
  const cacheKey = `maritime:vsearch:v2:${encodeURIComponent(normalized)}`;
  let quotaExhausted = false;

  const result = await cachedFetchJson<{ vessels: VesselRegistryEntry[] }>(
    cacheKey,
    CACHE_TTL_S,
    async () => {
      if (!(await reserveVesselApiBudget('search'))) {
        quotaExhausted = true;
        return null;
      }
      const isMmsi = /^\d{9}$/.test(normalized);
      const isImo = /^\d{7}$/.test(normalized);
      const entries = isMmsi
        ? await fetchById(normalized, 'mmsi')
        : isImo
          ? await fetchById(normalized, 'imo')
          : await fetchByName(normalized);
      if (entries == null) return null;
      return { vessels: entries };
    },
  ).catch(() => null);

  if (!result) {
    return { vessels: [], dataAvailable: false, quotaExhausted };
  }
  return { vessels: result.vessels, dataAvailable: true, quotaExhausted: false };
}
