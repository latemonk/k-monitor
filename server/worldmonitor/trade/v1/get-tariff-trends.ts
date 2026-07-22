/**
 * RPC: getTariffTrends -- reads seeded WTO MFN tariff trends from Railway seed cache.
 * The seed payload may also include an optional US effective tariff snapshot.
 *
 * KCG fork: no Railway seed cron (and no WTO API key). When the seed key is
 * empty, fall back to the World Bank open data API (keyless) — weighted mean
 * applied tariff, all products (TM.TAX.MRCH.WM.AR.ZS) — cached in Redis for
 * 30 days per reporter.
 */
import type {
  ServerContext,
  GetTariffTrendsRequest,
  GetTariffTrendsResponse,
  TariffDataPoint,
} from '../../../../src/generated/server/worldmonitor/trade/v1/service_server';
import UN_TO_ISO2 from '../../../../scripts/shared/un-to-iso2.json';
import { getCachedJson, setCachedJson } from '../../../_shared/redis';
import { isCallerPremium } from '../../../_shared/premium-check';

const SEED_KEY_PREFIX = 'trade:tariffs:v1';
const WB_CACHE_PREFIX = 'trade:tariffs:wb:v1';
const WB_INDICATOR = 'TM.TAX.MRCH.WM.AR.ZS';
const WB_CACHE_TTL = 2592000; // 30 days
const WB_FETCH_TIMEOUT_MS = 8000;

function isValidCode(c: string): boolean {
  return /^[a-zA-Z0-9]{1,10}$/.test(c);
}

function emptyResponse(): GetTariffTrendsResponse {
  return { datapoints: [], fetchedAt: new Date().toISOString(), upstreamUnavailable: true };
}

async function fetchWorldBankTariffs(reporter: string, years: number): Promise<GetTariffTrendsResponse | null> {
  // Reporter arrives as a UN M49 numeric code (mirrors the WTO seed contract);
  // the World Bank API wants ISO2.
  const iso2 = (UN_TO_ISO2 as Record<string, string>)[reporter.padStart(3, '0')]
    ?? (/^[A-Za-z]{2}$/.test(reporter) ? reporter.toUpperCase() : null);
  if (!iso2) return null;

  const cacheKey = `${WB_CACHE_PREFIX}:${iso2}`;
  const cached = await getCachedJson(cacheKey, true).catch(() => null) as GetTariffTrendsResponse | null;
  if (cached?.datapoints?.length) return trimToYears(cached, years);

  const url = `https://api.worldbank.org/v2/country/${iso2}/indicator/${WB_INDICATOR}?format=json&per_page=40`;
  const resp = await fetch(url, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(WB_FETCH_TIMEOUT_MS),
  });
  if (!resp.ok) return null;

  const body = await resp.json() as unknown;
  const rows = Array.isArray(body) && Array.isArray(body[1]) ? body[1] as Array<{ date?: string; value?: number | null }> : [];
  const datapoints: TariffDataPoint[] = rows
    .filter((r) => r && typeof r.value === 'number' && Number.isFinite(r.value))
    .map((r) => ({
      reportingCountry: reporter,
      partnerCountry: '',
      productSector: 'all',
      year: Number(r.date ?? 0),
      tariffRate: r.value as number,
      boundRate: 0,
      indicatorCode: WB_INDICATOR,
    }))
    .filter((p) => p.year > 0)
    .sort((a, b) => a.year - b.year);
  if (datapoints.length === 0) return null;

  const latest = datapoints[datapoints.length - 1]!;
  const result: GetTariffTrendsResponse = {
    datapoints,
    fetchedAt: new Date().toISOString(),
    upstreamUnavailable: false,
    effectiveTariffRate: {
      sourceName: 'World Bank (WITS)',
      sourceUrl: `https://data.worldbank.org/indicator/${WB_INDICATOR}?locations=${iso2}`,
      observationPeriod: String(latest.year),
      updatedAt: new Date().toISOString(),
      tariffRate: latest.tariffRate,
    },
  };
  await setCachedJson(cacheKey, result, WB_CACHE_TTL, true).catch(() => {});
  return trimToYears(result, years);
}

function trimToYears(result: GetTariffTrendsResponse, years: number): GetTariffTrendsResponse {
  if (result.datapoints.length <= years) return result;
  return { ...result, datapoints: result.datapoints.slice(-years) };
}

export async function getTariffTrends(
  ctx: ServerContext,
  req: GetTariffTrendsRequest,
): Promise<GetTariffTrendsResponse> {
  const isPro = await isCallerPremium(ctx.request);
  if (!isPro) return { datapoints: [], fetchedAt: '', upstreamUnavailable: true };

  try {
    const reporter = isValidCode(req.reportingCountry) ? req.reportingCountry : '840';
    const productSector = isValidCode(req.productSector) ? req.productSector : '';
    const years = Math.max(1, Math.min(req.years > 0 ? req.years : 10, 30));

    const seedKey = `${SEED_KEY_PREFIX}:${reporter}:${productSector || 'all'}:${years}`;
    const result = await getCachedJson(seedKey, true) as GetTariffTrendsResponse | null;
    if (result?.datapoints?.length) return result;

    const wb = await fetchWorldBankTariffs(reporter, years).catch(() => null);
    if (wb) return wb;

    return emptyResponse();
  } catch {
    return emptyResponse();
  }
}
