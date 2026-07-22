import type {
  ServerContext,
  ListComtradeFlowsRequest,
  ListComtradeFlowsResponse,
  ComtradeFlowRecord,
} from '../../../../src/generated/server/worldmonitor/trade/v1/service_server';
import filterParamContracts from '../../../../shared/openapi-filter-param-contracts.json';
import strategicProductMetadata from '../../../../scripts/shared/comtrade-strategic-products.json';
import UN_TO_ISO2 from '../../../../scripts/shared/un-to-iso2.json';
import COMTRADE_REPORTER_OVERRIDES from '../../../../scripts/shared/comtrade-reporter-overrides.json';
import { getCachedJsonBatch } from '../../../_shared/redis';
import { isCallerPremium } from '../../../_shared/premium-check';
import { lazyFetchBilateralHs4 } from '../../supply-chain/v1/_bilateral-hs4-lazy';

const KEY_PREFIX = 'comtrade:flows';

// Strategic reporters are stable API defaults; commodities come from the same
// reviewed HS2022 metadata consumed by both seeders.
const REPORTERS = ['842', '156', '643', '364', '699', '490'];
const CMD_CODES = strategicProductMetadata.products
  .map((product) => product.tradeFlowCode)
  .filter((code): code is string => typeof code === 'string' && code.length > 0);
const CMD_CODE_RE = new RegExp(filterParamContracts.tradeComtradeCmdCodePattern);

function isValidCode(c: string): boolean {
  return /^\d{1,10}$/.test(c);
}

/**
 * KCG fork: no Railway seed cron writes `comtrade:flows:*`. When the seeded
 * keys are empty, derive top flows for the requested reporter from the
 * on-demand bilateral HS4 store (UN Comtrade public preview, 30-day Redis
 * cache — shared with country-products / chokepoint-index).
 */
// Comtrade uses non-M49 reporter codes for some countries (e.g. 842 = USA);
// resolve those through the shared override list first.
const OVERRIDE_CODE_TO_ISO2: Record<string, string> = Object.fromEntries(
  Object.entries(COMTRADE_REPORTER_OVERRIDES as Record<string, string>).map(([iso2, un]) => [un, iso2]),
);

async function buildFlowsFromBilateral(reporterCode: string): Promise<ListComtradeFlowsResponse | null> {
  const iso2 = OVERRIDE_CODE_TO_ISO2[reporterCode]
    ?? (UN_TO_ISO2 as Record<string, string>)[reporterCode.padStart(3, '0')];
  if (!iso2) return null;

  const lazy = await lazyFetchBilateralHs4(iso2).catch(() => null);
  if (!lazy?.products?.length) return null;

  const flows: ComtradeFlowRecord[] = [];
  for (const p of lazy.products) {
    for (const exp of p.topExporters.slice(0, 2)) {
      if (!exp.partnerIso2 || exp.partnerIso2 === iso2) continue;
      flows.push({
        reporterCode,
        reporterName: iso2,
        partnerCode: String(exp.partnerCode),
        partnerName: exp.partnerIso2,
        cmdCode: p.hs4,
        cmdDesc: p.description,
        year: p.year,
        tradeValueUsd: exp.value,
        netWeightKg: 0,
        yoyChange: 0,
        isAnomaly: false,
      });
    }
  }
  if (flows.length === 0) return null;
  flows.sort((a, b) => b.tradeValueUsd - a.tradeValueUsd);
  return { flows: flows.slice(0, 30), fetchedAt: new Date().toISOString(), upstreamUnavailable: false };
}

export async function listComtradeFlows(
  ctx: ServerContext,
  req: ListComtradeFlowsRequest,
): Promise<ListComtradeFlowsResponse> {
  const isPro = await isCallerPremium(ctx.request);
  if (!isPro) return { flows: [], fetchedAt: '', upstreamUnavailable: true };

  try {
    const reporters = req.reporterCode && isValidCode(req.reporterCode) ? [req.reporterCode] : REPORTERS;
    const cmdCodes = req.cmdCode && CMD_CODE_RE.test(req.cmdCode) ? [req.cmdCode] : CMD_CODES;

    const keys = reporters.flatMap((r) => cmdCodes.map((c) => `${KEY_PREFIX}:${r}:${c}`));
    const batch = await getCachedJsonBatch(keys);

    const flows: ComtradeFlowRecord[] = [];
    let fetchedAt = '';
    let dataFound = false;

    for (const result of batch.values()) {
      if (!result) continue;
      dataFound = true;
      const records = Array.isArray(result) ? result : (result as { flows?: ComtradeFlowRecord[]; fetchedAt?: string }).flows ?? [];
      if (!fetchedAt && (result as { fetchedAt?: string }).fetchedAt) {
        fetchedAt = (result as { fetchedAt: string }).fetchedAt;
      }
      for (const r of records) {
        if (req.anomaliesOnly && !r.isAnomaly) continue;
        flows.push(r as ComtradeFlowRecord);
      }
    }

    if (!dataFound) {
      if (req.reporterCode && isValidCode(req.reporterCode) && !req.anomaliesOnly) {
        const fallback = await buildFlowsFromBilateral(req.reporterCode);
        if (fallback) return fallback;
      }
      return { flows: [], fetchedAt, upstreamUnavailable: true };
    }

    flows.sort((a, b) => b.year - a.year || Math.abs(b.yoyChange) - Math.abs(a.yoyChange));

    return { flows, fetchedAt, upstreamUnavailable: false };
  } catch {
    return { flows: [], fetchedAt: '', upstreamUnavailable: true };
  }
}
