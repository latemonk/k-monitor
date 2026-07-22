import type {
  ServerContext,
  GetVesselTrackRequest,
  GetVesselTrackResponse,
  VesselTrack,
  VesselTrackPoint,
} from '../../../../src/generated/server/worldmonitor/maritime/v1/service_server';

import { cachedFetchJson } from '../../../_shared/redis';
import { hasVesselApiKey, parseUpstreamTimestampMs, reserveVesselApiBudget, vesselApiFetch } from './_vesselapi';

// One watchlist polled by the client every 30min costs 12 upstream calls/day
// at this TTL — inside the 'track' daily ceiling with room for one ETA call.
const CACHE_TTL_S = 2 * 3600;
const MAX_MMSIS = 10;

interface UpstreamPosition {
  mmsi?: number | string;
  vessel_name?: string;
  latitude?: number;
  longitude?: number;
  timestamp?: string;
  sog?: number;
  nav_status?: number;
  suspected_glitch?: boolean;
}

function normalizeMmsis(raw: string): string[] {
  const seen = new Set<string>();
  for (const part of String(raw || '').split(',')) {
    const m = part.trim();
    if (/^\d{9}$/.test(m)) seen.add(m);
    if (seen.size >= MAX_MMSIS) break;
  }
  return [...seen].sort();
}

function groupTracks(positions: UpstreamPosition[]): VesselTrack[] {
  const byMmsi = new Map<string, { name: string; points: VesselTrackPoint[] }>();
  for (const p of positions) {
    const mmsi = p.mmsi != null ? String(p.mmsi) : '';
    const lat = Number(p.latitude);
    const lon = Number(p.longitude);
    if (!mmsi || !Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    if (p.suspected_glitch === true) continue;
    let slot = byMmsi.get(mmsi);
    if (!slot) {
      slot = { name: '', points: [] };
      byMmsi.set(mmsi, slot);
    }
    if (!slot.name && p.vessel_name) slot.name = String(p.vessel_name).trim();
    slot.points.push({
      latitude: lat,
      longitude: lon,
      sogKnots: Number.isFinite(Number(p.sog)) ? Number(p.sog) : -1,
      navStatus: Number.isFinite(Number(p.nav_status)) ? Number(p.nav_status) : -1,
      observedAt: parseUpstreamTimestampMs(p.timestamp),
    });
  }
  const tracks: VesselTrack[] = [];
  for (const [mmsi, slot] of byMmsi) {
    slot.points.sort((a, b) => a.observedAt - b.observedAt);
    tracks.push({
      mmsi,
      name: slot.name,
      points: slot.points,
      destination: '',
      etaAt: 0,
      draughtM: 0,
    });
  }
  return tracks;
}

interface UpstreamEta {
  destination?: string;
  eta?: string;
  estimated_time_of_arrival?: string;
  draught?: number;
  current_draught?: number;
}

async function fetchEta(mmsi: string): Promise<{ destination: string; etaAt: number; draughtM: number } | null> {
  const data = await vesselApiFetch(`/vessel/${mmsi}/eta?filter.idType=mmsi`) as
    | { vesselEta?: UpstreamEta; eta?: UpstreamEta }
    | UpstreamEta
    | null;
  if (!data || typeof data !== 'object') return null;
  const eta: UpstreamEta = (data as { vesselEta?: UpstreamEta }).vesselEta
    ?? ((data as { eta?: unknown }).eta && typeof (data as { eta?: unknown }).eta === 'object'
      ? (data as { eta: UpstreamEta }).eta
      : (data as UpstreamEta));
  const destination = String(eta.destination || '').trim();
  const etaAt = parseUpstreamTimestampMs(typeof eta.eta === 'string' ? eta.eta : eta.estimated_time_of_arrival);
  const draughtM = Number(eta.draught ?? eta.current_draught) || 0;
  if (!destination && !etaAt) return null;
  return { destination, etaAt, draughtM };
}

export async function getVesselTrack(
  _ctx: ServerContext,
  req: GetVesselTrackRequest,
): Promise<GetVesselTrackResponse> {
  const mmsis = normalizeMmsis(req.mmsis);
  if (!mmsis.length || !hasVesselApiKey()) {
    return { tracks: [], fetchedAt: 0, dataAvailable: mmsis.length === 0, quotaExhausted: false };
  }
  const wantEta = Boolean(req.includeEta) && mmsis.length === 1;
  let quotaExhausted = false;

  const cacheKey = `maritime:vtrack:v2:${wantEta ? 'eta:' : ''}${mmsis.join(',')}`;
  const result = await cachedFetchJson<{ tracks: VesselTrack[]; fetchedAt: number }>(
    cacheKey,
    CACHE_TTL_S,
    async () => {
      const calls = wantEta ? 2 : 1;
      if (!(await reserveVesselApiBudget('track', calls))) {
        quotaExhausted = true;
        return null;
      }
      const data = await vesselApiFetch(
        `/vessels/positions?filter.ids=${mmsis.join(',')}&filter.idType=mmsi&pagination.limit=50`,
      ) as { vesselPositions?: UpstreamPosition[] } | null;
      if (!data) return null;
      const tracks = groupTracks(Array.isArray(data.vesselPositions) ? data.vesselPositions : []);
      if (wantEta && tracks.length === 1) {
        const eta = await fetchEta(mmsis[0]!);
        if (eta) {
          tracks[0]!.destination = eta.destination;
          tracks[0]!.etaAt = eta.etaAt;
          tracks[0]!.draughtM = eta.draughtM;
        }
      }
      return { tracks, fetchedAt: Date.now() };
    },
  ).catch(() => null);

  if (!result) {
    return { tracks: [], fetchedAt: 0, dataAvailable: false, quotaExhausted };
  }
  return { tracks: result.tracks, fetchedAt: result.fetchedAt, dataAvailable: true, quotaExhausted: false };
}
