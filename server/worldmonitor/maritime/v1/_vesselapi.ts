// Shared plumbing for the interactive vessel-registry lookups (search, track,
// port events). The upstream plan allows 1,500 successful calls per MONTH,
// shared with the relay's 6h zone sweeps through the UNPREFIXED redis counter
// `vesselapi:quota:<YYYY-MM>` (the relay writes the same key via its own REST
// client; on the pod getKeyPrefix() is '' so both sides agree).
//
// Budget stance: every helper fails toward NOT spending. Counters are
// incremented BEFORE the upstream call — a failed call may overcount, which
// is the safe direction for a hard monthly quota.

import { runRedisPipeline } from '../../../_shared/redis';

const UPSTREAM_BASE = 'https://api.vesselapi.com/v1';

const MONTHLY_CAP = Math.max(100, Number(process.env.VESSELAPI_MONTHLY_CAP) || 1450);

export type BudgetFamily = 'search' | 'track' | 'portevents';

// Daily ceilings per interactive family. These are ceilings, not budgets —
// realistic usage sits far below; the shared monthly cap is the backstop.
const DAILY_CAPS: Record<BudgetFamily, number> = {
  search: 10,
  track: 14,
  portevents: 6,
};

function monthlyKey(now = new Date()): string {
  return `vesselapi:quota:${now.toISOString().slice(0, 7)}`;
}

function dailyKey(family: BudgetFamily, now = new Date()): string {
  return `vesselapi:cap:${family}:${now.toISOString().slice(0, 10)}`;
}

export function hasVesselApiKey(): boolean {
  return Boolean(process.env.VESSELAPI_API_KEY);
}

/**
 * Reserve `calls` upstream calls from the shared budget. Returns true when
 * the caller may proceed. Redis unavailable ⇒ false (never spend blind).
 *
 * INCR-first: the atomic increment IS the reservation, and the returned
 * value decides pass/fail — there is no check-then-increment race window
 * for concurrent isolates to slip through. A rejected reservation leaves
 * the counter inflated, which is the safe direction for a hard quota
 * (over-counting can only under-spend).
 */
export async function reserveVesselApiBudget(family: BudgetFamily, calls = 1): Promise<boolean> {
  const mk = monthlyKey();
  const dk = dailyKey(family);
  const results = await runRedisPipeline([
    ['INCRBY', mk, calls],
    ['EXPIRE', mk, 40 * 86400],
    ['INCRBY', dk, calls],
    ['EXPIRE', dk, 2 * 86400],
  ], true);
  if (results.length !== 4) return false;
  const monthly = Number(results[0]?.result);
  const daily = Number(results[2]?.result);
  if (!Number.isFinite(monthly) || !Number.isFinite(daily)) return false;
  return monthly <= MONTHLY_CAP && daily <= DAILY_CAPS[family];
}

/**
 * Authenticated GET against the vessel-registry upstream. Returns parsed
 * JSON on 2xx, null otherwise. Never throws. The upstream's name must not
 * leak into user-facing responses — callers map to proto shapes and log only.
 */
export async function vesselApiFetch(pathAndQuery: string): Promise<unknown | null> {
  const key = process.env.VESSELAPI_API_KEY;
  if (!key) return null;
  try {
    const resp = await fetch(`${UPSTREAM_BASE}${pathAndQuery}`, {
      headers: { Authorization: `Bearer ${key}`, Accept: 'application/json' },
      signal: AbortSignal.timeout(15000),
    });
    if (!resp.ok) {
      console.warn(`[maritime] registry upstream HTTP ${resp.status} for ${pathAndQuery.split('?')[0]}`);
      return null;
    }
    return await resp.json();
  } catch (e) {
    console.warn('[maritime] registry upstream fetch failed:', e instanceof Error ? e.message : e);
    return null;
  }
}

export function parseUpstreamTimestampMs(v: unknown): number {
  if (typeof v !== 'string') return 0;
  const t = Date.parse(v);
  return Number.isFinite(t) ? t : 0;
}
