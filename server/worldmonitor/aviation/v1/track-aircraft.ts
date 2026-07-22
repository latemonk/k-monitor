import type {
    ServerContext,
    TrackAircraftRequest,
    TrackAircraftResponse,
    PositionSample,
} from '../../../../src/generated/server/worldmonitor/aviation/v1/service_server';
import { getRelayBaseUrl, getRelayHeaders } from './_shared';
import { cachedFetchJson } from '../../../_shared/redis';
import { CHROME_UA } from '../../../_shared/constants';

// 120s for anonymous OpenSky tier (~10 req/min limit); TODO: reduce to 10s on commercial tier
const CACHE_TTL = 120;
// Callsign searches hit the relay's in-memory index (5min TTL); cache positive hits 60s,
// negative hits 10s so a retry after panning into view returns fresh data quickly.
const CALLSIGN_CACHE_TTL = 60;
const CALLSIGN_NEGATIVE_TTL = 10;

interface OpenSkyResponse {
    states?: unknown[][];
}

interface WingbitsRelayResponse {
    positions?: PositionSample[];
    source?: string;
}

function parseOpenSkyStates(states: unknown[][]): PositionSample[] {
    const now = Date.now();
    return states
        .filter(s => Array.isArray(s) && s[5] != null && s[6] != null)
        .map((s): PositionSample => ({
            icao24: String(s[0] ?? ''),
            callsign: String(s[1] ?? '').trim(),
            lat: Number(s[6]),
            lon: Number(s[5]),
            altitudeM: Number(s[7] ?? 0),
            groundSpeedKts: Number(s[9] ?? 0) * 1.944,
            trackDeg: Number(s[10] ?? 0),
            verticalRate: Number(s[11] ?? 0),
            onGround: Boolean(s[8]),
            source: 'POSITION_SOURCE_OPENSKY',
            observedAt: Number(s[4] ?? (now / 1000)) * 1000,
            squawk: typeof s[14] === 'string' ? s[14] : '',
        }));
}


// ── KCG fork: 무키 커뮤니티 ADS-B 프로바이더 ──────────────────────────────
// OpenSky 공개 API 는 데이터센터 IP 를 차단(ECONNRESET/타임아웃 — 07-21 팟
// 실측)하고 업스트림 릴레이는 이 배포에 없다. adsb.lol → airplanes.live 순으로
// 폴백(둘 다 팟에서 200 실측, 한국 상공 실기체 수신 확인).
interface AdsbAircraft {
    hex?: string; flight?: string; lat?: number; lon?: number;
    alt_baro?: number | string; alt_geom?: number; gs?: number; track?: number;
    baro_rate?: number; seen?: number; squawk?: string;
}

function parseAdsbAircraft(list: AdsbAircraft[]): PositionSample[] {
    const now = Date.now();
    return (list ?? [])
        .filter(a => typeof a.lat === 'number' && typeof a.lon === 'number')
        .map((a): PositionSample => {
            const altFt = typeof a.alt_baro === 'number' ? a.alt_baro
                : typeof a.alt_geom === 'number' ? a.alt_geom : 0;
            return {
                icao24: String(a.hex ?? '').toLowerCase(),
                callsign: String(a.flight ?? '').trim(),
                lat: a.lat!,
                lon: a.lon!,
                altitudeM: altFt * 0.3048,
                groundSpeedKts: typeof a.gs === 'number' ? a.gs : 0,
                trackDeg: typeof a.track === 'number' ? a.track : 0,
                verticalRate: typeof a.baro_rate === 'number' ? a.baro_rate * 0.00508 : 0,
                onGround: a.alt_baro === 'ground',
                source: 'POSITION_SOURCE_OPENSKY',
                observedAt: now - (typeof a.seen === 'number' ? a.seen * 1000 : 0),
                squawk: typeof a.squawk === 'string' ? a.squawk : '',
            };
        });
}

async function fetchCommunityAdsb(req: TrackAircraftRequest): Promise<{ positions: PositionSample[]; source: string } | null> {
    // bbox → 중심점+반경(nm) (두 프로바이더 모두 point/radius API)
    // ⚠proto3 기본값: 파라미터 없는 호출은 bbox 가 null 이 아니라 전부 0으로
    // 들어온다(기니만 0,0 조회 → 항상 빈 결과 — 07-21 실측). 전부 0이면 부재로.
    const hasBbox = req.swLat != null && req.neLat != null
        && !(req.swLat === 0 && req.swLon === 0 && req.neLat === 0 && req.neLon === 0);
    let paths: string[];
    if (hasBbox) {
        const lat = (req.swLat + req.neLat) / 2;
        const lon = (req.swLon + req.neLon) / 2;
        const latSpanNm = Math.abs(req.neLat - req.swLat) * 60;
        const lonSpanNm = Math.abs(req.neLon - req.swLon) * 60 * Math.cos(lat * Math.PI / 180);
        const radiusNm = Math.min(250, Math.max(50, Math.ceil(Math.sqrt(latSpanNm ** 2 + lonSpanNm ** 2) / 2)));
        paths = [`point/${lat.toFixed(3)}/${lon.toFixed(3)}/${radiusNm}`];
    } else if (req.icao24) {
        paths = [`icao/${req.icao24.toLowerCase()}`];
    } else if (req.callsign) {
        paths = [`callsign/${encodeURIComponent(req.callsign.toUpperCase())}`];
    } else {
        // 파라미터 없는 기본 조회(Track 탭 초기 화면) — 한국 권역 기본.
        paths = ['point/36.500/127.500/250'];
    }

    const bases: Array<{ base: string; name: string; pointStyle: 'slash' | 'latlon' }> = [
        { base: 'https://api.adsb.lol/v2', name: 'adsb-lol', pointStyle: 'latlon' },
        { base: 'https://api.airplanes.live/v2', name: 'airplanes-live', pointStyle: 'slash' },
    ];
    for (const { base, name, pointStyle } of bases) {
        for (const path of paths) {
            // adsb.lol 의 point 경로는 /lat/{lat}/lon/{lon}/dist/{nm} 형식
            const finalPath = path.startsWith('point/') && pointStyle === 'latlon'
                ? path.replace(/^point\/([^/]+)\/([^/]+)\/([^/]+)$/, 'lat/$1/lon/$2/dist/$3')
                : path;
            try {
                const resp = await fetch(`${base}/${finalPath}`, {
                    signal: AbortSignal.timeout(8_000),
                    headers: { 'Accept': 'application/json', 'User-Agent': CHROME_UA },
                });
                if (!resp.ok) continue;
                const data = await resp.json() as { ac?: AdsbAircraft[] };
                const positions = parseAdsbAircraft(data.ac ?? []);
                if (positions.length > 0) return { positions, source: name };
            } catch {
                // try next provider
            }
        }
    }
    return null;
}

const OPENSKY_PUBLIC_BASE = 'https://opensky-network.org/api';

async function fetchOpenSkyAnonymous(req: TrackAircraftRequest): Promise<PositionSample[]> {
    let url: string;
    if (req.swLat != null && req.neLat != null) {
        url = `${OPENSKY_PUBLIC_BASE}/states/all?lamin=${req.swLat}&lomin=${req.swLon}&lamax=${req.neLat}&lomax=${req.neLon}`;
    } else if (req.icao24) {
        url = `${OPENSKY_PUBLIC_BASE}/states/all?icao24=${req.icao24}`;
    } else {
        url = `${OPENSKY_PUBLIC_BASE}/states/all`;
    }

    const resp = await fetch(url, {
        signal: AbortSignal.timeout(6_000),
        headers: { 'Accept': 'application/json', 'User-Agent': CHROME_UA },
    });
    if (!resp.ok) throw new Error(`OpenSky anonymous HTTP ${resp.status}`);
    const data = await resp.json() as OpenSkyResponse;
    return parseOpenSkyStates(data.states ?? []);
}

function buildCacheKey(req: TrackAircraftRequest): string {
    if (req.icao24) return `aviation:track:icao:${req.icao24}:v1`;
    if (req.swLat != null && req.neLat != null) {
        return `aviation:track:bbox:${Math.floor(req.swLat)}:${Math.floor(req.swLon)}:${Math.ceil(req.neLat)}:${Math.ceil(req.neLon)}:v1`;
    }
    if (req.callsign) return `aviation:track:callsign:${req.callsign.toUpperCase()}:v1`;
    return 'aviation:track:all:v1';
}

// Response-level source values (TrackAircraftResponse.source):
//   'opensky'           — data from OpenSky via relay
//   'opensky-anonymous' — data from OpenSky public API (no auth, rate-limited)
//   'wingbits'          — data from Wingbits via relay
//   'none'              — all real sources returned empty or failed; positions = []
export async function trackAircraft(
    _ctx: ServerContext,
    req: TrackAircraftRequest,
): Promise<TrackAircraftResponse> {
    const cacheKey = buildCacheKey(req);

    let result: { positions: PositionSample[]; source: string } | null = null;
    try {
        const positiveTtl = req.callsign ? CALLSIGN_CACHE_TTL : CACHE_TTL;
        const negativeTtl = req.callsign ? CALLSIGN_NEGATIVE_TTL : CACHE_TTL;
        result = await cachedFetchJson<{ positions: PositionSample[]; source: string }>(
            cacheKey, positiveTtl, async () => {
                const relayBase = getRelayBaseUrl();
                const isCallsignOnly = !!req.callsign && req.swLat == null && req.icao24 == null;

                // For callsign-only searches, try Wingbits first — commercial flights like UAE20
                // are Wingbits-exclusive and not visible in OpenSky. Trying OpenSky first wastes
                // time and may return an early hit with no callsign match.
                if (isCallsignOnly && relayBase) {
                    try {
                        const wbUrl = `${relayBase}/wingbits/track?callsign=${encodeURIComponent(req.callsign)}`;
                        const wbResp = await fetch(wbUrl, {
                            headers: getRelayHeaders({}),
                            signal: AbortSignal.timeout(20_000),
                        });
                        if (wbResp.ok) {
                            const wbData = await wbResp.json() as WingbitsRelayResponse;
                            if (wbData.positions && wbData.positions.length > 0) {
                                return { positions: wbData.positions, source: 'wingbits' };
                            }
                        }
                    } catch (err) {
                        console.warn(`[Aviation] Wingbits callsign relay failed: ${err instanceof Error ? err.message : err}`);
                    }
                }

                // For bbox queries: run OpenSky relay and Wingbits relay in parallel.
                // Sequential was 10s + 6s + 15s = 31s worst-case, exceeding Vercel's 25s limit.
                // Parallel caps at 10s and gives merged coverage from both sources.
                if (!isCallsignOnly && relayBase && req.swLat != null && req.neLat != null) {
                    const osUrl = `${relayBase}/opensky/states/all?lamin=${req.swLat}&lomin=${req.swLon}&lamax=${req.neLat}&lomax=${req.neLon}`;
                    const wbUrl = `${relayBase}/wingbits/track?lamin=${req.swLat}&lomin=${req.swLon}&lamax=${req.neLat}&lomax=${req.neLon}`;

                    const [osResult, wbResult] = await Promise.allSettled([
                        fetch(osUrl, { headers: getRelayHeaders({}), signal: AbortSignal.timeout(10_000) })
                            .then(r => r.ok ? r.json() as Promise<OpenSkyResponse> : Promise.resolve(null))
                            .then(d => d ? parseOpenSkyStates(d.states ?? []) : [])
                            .catch(() => [] as PositionSample[]),
                        fetch(wbUrl, { headers: getRelayHeaders({}), signal: AbortSignal.timeout(10_000) })
                            .then(r => r.ok ? r.json() as Promise<WingbitsRelayResponse> : Promise.resolve(null))
                            .then(d => d?.positions ?? [])
                            .catch(() => [] as PositionSample[]),
                    ]);

                    const osPositions = osResult.status === 'fulfilled' ? osResult.value : [];
                    const wbPositions = wbResult.status === 'fulfilled' ? wbResult.value : [];

                    // Merge: Wingbits preferred for duplicates (more accurate for commercial flights).
                    const seenIcao = new Set(wbPositions.map(p => p.icao24));
                    const merged = [...wbPositions, ...osPositions.filter(p => !seenIcao.has(p.icao24))];
                    if (merged.length > 0) {
                        const source = wbPositions.length > 0 && osPositions.length > 0 ? 'wingbits'
                            : wbPositions.length > 0 ? 'wingbits' : 'opensky';
                        return { positions: merged, source };
                    }

                    // Both relay sources empty — try OpenSky anonymous as last resort
                    try {
                        const directPositions = await fetchOpenSkyAnonymous(req);
                        if (directPositions.length > 0) {
                            return { positions: directPositions, source: 'opensky-anonymous' };
                        }
                    } catch (err) {
                        console.warn(`[Aviation] OpenSky anonymous failed: ${err instanceof Error ? err.message : err}`);
                    }
                }

                // For icao24-only queries, try OpenSky relay then Wingbits
                if (!isCallsignOnly && relayBase && req.icao24) {
                    try {
                        const osUrl = `${relayBase}/opensky/states/all?icao24=${req.icao24}`;
                        const resp = await fetch(osUrl, { headers: getRelayHeaders({}), signal: AbortSignal.timeout(8_000) });
                        if (resp.ok) {
                            const data = await resp.json() as OpenSkyResponse;
                            const positions = parseOpenSkyStates(data.states ?? []);
                            if (positions.length > 0) return { positions, source: 'opensky' };
                        }
                    } catch (err) {
                        console.warn(`[Aviation] Relay icao24 failed: ${err instanceof Error ? err.message : err}`);
                    }
                }

                // KCG fork: 릴레이 미구성/실패 시 커뮤니티 ADS-B(adsb.lol →
                // airplanes.live). bbox·icao24·callsign 전부 커버.
                const community = await fetchCommunityAdsb(req);
                if (community) return community;

                return null; // negative-cached briefly
            }, negativeTtl,
        );
    } catch {
        /* Redis unavailable — fall through to simulated */
    }

    if (result) {
        let positions = result.positions;
        if (req.icao24) positions = positions.filter(p => p.icao24 === req.icao24);
        if (req.callsign) positions = positions.filter(p => p.callsign.includes(req.callsign.toUpperCase()));
        return { positions, source: result.source, updatedAt: Date.now() };
    }

    return { positions: [], source: 'none', updatedAt: Date.now() };
}
