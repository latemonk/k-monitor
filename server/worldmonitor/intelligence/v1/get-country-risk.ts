import type {
  ServerContext,
  GetCountryRiskRequest,
  GetCountryRiskResponse,
  CiiScore,
} from '../../../../src/generated/server/worldmonitor/intelligence/v1/service_server';

import { getCachedJson } from '../../../_shared/redis';
import { CII_RISK_SCORE_CACHE_KEYS } from '../../../_shared/cache-keys';
import { TIER1_COUNTRIES } from './_shared';

const RISK_SCORES_KEY = CII_RISK_SCORE_CACHE_KEYS.stale;
const ADVISORIES_KEY = 'intelligence:advisories:v1';
// Full ISO2 → entryCount map across all OFAC entries (not the top-12 summary slice).
const SANCTIONS_COUNTS_KEY = 'sanctions:country-counts:v1';
const UNKNOWN_CII_COMPUTED_AT = 0;

function resolveCountryName(
  code: string,
  byCountryName: Record<string, string> | undefined,
): string {
  return TIER1_COUNTRIES[code] ?? byCountryName?.[code] ?? code;
}

export async function getCountryRisk(
  _ctx: ServerContext,
  req: GetCountryRiskRequest,
): Promise<GetCountryRiskResponse> {
  const code = req.countryCode?.toUpperCase() ?? '';

  if (!code) {
    return {
      countryCode: code,
      countryName: '',
      cii: undefined,
      advisoryLevel: '',
      sanctionsActive: false,
      sanctionsCount: 0,
      fetchedAt: UNKNOWN_CII_COMPUTED_AT,
      upstreamUnavailable: false,
    };
  }

  const [riskRaw, advisoriesRaw, sanctionsRaw] = await Promise.all([
    getCachedJson(RISK_SCORES_KEY, true),
    getCachedJson(ADVISORIES_KEY, true),
    getCachedJson(SANCTIONS_COUNTS_KEY, true),
  ]);

  // KCG fork: the self-hosted pod only runs the sanctions seed (OFAC) —
  // the CII risk cache and travel advisories crons don't exist here. Fail
  // closed ONLY when every source is missing; otherwise serve what we have
  // (upstream failed closed on any missing key to avoid CDN-caching partial
  // data, which starved the sanctions card even with 20k seeded entries).
  if (sanctionsRaw === null && riskRaw === null && advisoriesRaw === null) {
    return {
      countryCode: code,
      countryName: resolveCountryName(code, (advisoriesRaw as any)?.byCountryName),
      cii: undefined,
      advisoryLevel: '',
      sanctionsActive: false,
      sanctionsCount: 0,
      fetchedAt: UNKNOWN_CII_COMPUTED_AT,
      upstreamUnavailable: true,
    };
  }

  const ciiScores: CiiScore[] = (riskRaw as any)?.ciiScores ?? [];
  const cii = ciiScores.find((s) => s.region === code);

  const byCountry: Record<string, string> = (advisoriesRaw as any)?.byCountry ?? {};
  const advisoryLevel = byCountry[code] ?? '';

  const byCountryName: Record<string, string> | undefined = (advisoriesRaw as any)?.byCountryName;

  const sanctionsCount = (sanctionsRaw as Record<string, number> | null)?.[code] ?? 0;

  return {
    countryCode: code,
    countryName: resolveCountryName(code, byCountryName),
    cii,
    advisoryLevel,
    sanctionsActive: sanctionsCount > 0,
    sanctionsCount,
    fetchedAt: cii?.computedAt ?? UNKNOWN_CII_COMPUTED_AT,
    upstreamUnavailable: false,
  };
}
