import type {
  ServerContext,
  ListPortEventsRequest,
  ListPortEventsResponse,
  PortEvent,
} from '../../../../src/generated/server/worldmonitor/maritime/v1/service_server';

import { cachedFetchJson } from '../../../_shared/redis';
import { hasVesselApiKey, parseUpstreamTimestampMs, reserveVesselApiBudget, vesselApiFetch } from './_vesselapi';

// 3 allowlisted ports at an 8h TTL = at most 9 upstream calls/day, and the
// 'portevents' daily ceiling (6) trims that further — the tab is on-demand,
// so days nobody opens it cost zero.
const CACHE_TTL_S = 8 * 3600;
const PORT_ALLOWLIST = new Set(['KRPUS', 'KRINC', 'KRUSN']);

interface UpstreamPortEvent {
  event?: string;
  timestamp?: string;
  vessel?: { name?: string; mmsi?: number | string; imo?: number | string };
  port?: { unlo_code?: string };
}

export async function listPortEvents(
  _ctx: ServerContext,
  req: ListPortEventsRequest,
): Promise<ListPortEventsResponse> {
  const unlocode = String(req.unlocode || '').trim().toUpperCase();
  if (!PORT_ALLOWLIST.has(unlocode) || !hasVesselApiKey()) {
    return { events: [], fetchedAt: 0, dataAvailable: true };
  }

  const cacheKey = `maritime:portevents:v2:${unlocode}`;
  const result = await cachedFetchJson<{ events: PortEvent[]; fetchedAt: number }>(
    cacheKey,
    CACHE_TTL_S,
    async () => {
      if (!(await reserveVesselApiBudget('portevents'))) return null;
      const data = await vesselApiFetch(
        `/portevents/port/${unlocode}?pagination.limit=50`,
      ) as { portEvents?: UpstreamPortEvent[] } | null;
      if (!data) return null;
      const events: PortEvent[] = (Array.isArray(data.portEvents) ? data.portEvents : [])
        .map((e): PortEvent => ({
          eventType: String(e.event || '').toLowerCase() === 'arrival' ? 'arrival' : 'departure',
          occurredAt: parseUpstreamTimestampMs(e.timestamp),
          vesselName: String(e.vessel?.name || '').trim(),
          vesselMmsi: e.vessel?.mmsi != null ? String(e.vessel.mmsi) : '',
          vesselImo: e.vessel?.imo != null ? String(e.vessel.imo) : '',
          portUnlocode: String(e.port?.unlo_code || unlocode).toUpperCase(),
        }))
        .filter((e) => e.occurredAt > 0)
        .sort((a, b) => b.occurredAt - a.occurredAt);
      return { events, fetchedAt: Date.now() };
    },
  ).catch(() => null);

  if (!result) {
    return { events: [], fetchedAt: 0, dataAvailable: false };
  }
  return { events: result.events, fetchedAt: result.fetchedAt, dataAvailable: true };
}
