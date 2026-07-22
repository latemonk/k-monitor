/**
 * Regression tests for the create-checkout transport (WORLDMONITOR-Q4).
 *
 * 8 of 9 "Checkout error: service_unavailable" events were Cloudflare-
 * emitted 502s (origin transient) on POST /api/create-checkout. The edge
 * handler has full Idempotency-Key support (api/_idempotency.ts), but the
 * client sent no key and never retried — every transient 502 was a lost
 * checkout attempt unless the user manually re-clicked.
 *
 * Contract under test (pure module, no Clerk/Dodo imports so it runs
 * under the tsx --test harness):
 *   1. Every attempt carries the SAME Idempotency-Key (server dedupe).
 *   2. Retryable statuses (502/503/504) get exactly ONE retry after a
 *      delay; the second response is returned as-is.
 *   3. Non-retryable statuses (400/401/403/409) return immediately.
 *   4. Fast network failures (fetch rejects with TypeError) retry once.
 *   5. Timeout/abort failures do NOT retry — the user already waited a
 *      full attempt budget; rethrow so the caller classifies it.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  postCreateCheckout,
  RETRYABLE_CHECKOUT_STATUSES,
  CHECKOUT_RETRY_DELAY_MS,
  type CreateCheckoutTransportDeps,
} from '../src/services/checkout-transport';

type FetchOutcome = { response: Response } | { throws: Error };

function makeDeps(outcomes: FetchOutcome[]): {
  deps: CreateCheckoutTransportDeps;
  calls: { url: string; init: RequestInit }[];
  delays: number[];
} {
  const calls: { url: string; init: RequestInit }[] = [];
  const delays: number[] = [];
  let i = 0;
  const deps: CreateCheckoutTransportDeps = {
    fetch: async (url, init) => {
      calls.push({ url, init });
      const outcome = outcomes[Math.min(i, outcomes.length - 1)];
      i += 1;
      if ('throws' in outcome) throw outcome.throws;
      return outcome.response;
    },
    delay: async (ms) => {
      delays.push(ms);
    },
    generateIdempotencyKey: () => 'test-key-1234',
    createTimeoutSignal: () => new AbortController().signal,
  };
  return { deps, calls, delays };
}

const ARGS = {
  url: '/api/create-checkout',
  token: 'tok_abc',
  payload: { productId: 'pdt_x' },
};

function headerOf(init: RequestInit, name: string): string | undefined {
  return (init.headers as Record<string, string>)[name];
}

describe('postCreateCheckout transport', () => {
  it('sends Idempotency-Key, bearer token, and JSON body on a plain success', async () => {
    const ok = new Response('{"checkout_url":"https://x"}', { status: 200 });
    const { deps, calls, delays } = makeDeps([{ response: ok }]);

    const resp = await postCreateCheckout(deps, ARGS);

    assert.equal(resp.status, 200);
    assert.equal(calls.length, 1);
    assert.equal(delays.length, 0);
    assert.equal(calls[0].url, '/api/create-checkout');
    assert.equal(calls[0].init.method, 'POST');
    assert.equal(headerOf(calls[0].init, 'Idempotency-Key'), 'test-key-1234');
    assert.equal(headerOf(calls[0].init, 'Authorization'), 'Bearer tok_abc');
    assert.equal(headerOf(calls[0].init, 'Content-Type'), 'application/json');
    assert.deepEqual(JSON.parse(String(calls[0].init.body)), { productId: 'pdt_x' });
  });

  it('retries once on 502 with the SAME idempotency key, after a delay', async () => {
    const bad = new Response('<html>cloudflare 502</html>', { status: 502 });
    const good = new Response('{"checkout_url":"https://x"}', { status: 200 });
    const { deps, calls, delays } = makeDeps([{ response: bad }, { response: good }]);

    const resp = await postCreateCheckout(deps, ARGS);

    assert.equal(resp.status, 200);
    assert.equal(calls.length, 2);
    assert.deepEqual(delays, [CHECKOUT_RETRY_DELAY_MS]);
    assert.equal(headerOf(calls[0].init, 'Idempotency-Key'), 'test-key-1234');
    assert.equal(headerOf(calls[1].init, 'Idempotency-Key'), 'test-key-1234');
  });

  it('returns the second failure as-is when the retry also fails', async () => {
    const bad = new Response('bad gateway', { status: 502 });
    const { deps, calls } = makeDeps([{ response: bad }, { response: bad }]);

    const resp = await postCreateCheckout(deps, ARGS);

    assert.equal(resp.status, 502);
    assert.equal(calls.length, 2);
  });

  it('treats every status in RETRYABLE_CHECKOUT_STATUSES as retryable', async () => {
    for (const status of RETRYABLE_CHECKOUT_STATUSES) {
      const bad = new Response('transient', { status });
      const good = new Response('{}', { status: 200 });
      const { deps, calls } = makeDeps([{ response: bad }, { response: good }]);
      const resp = await postCreateCheckout(deps, ARGS);
      assert.equal(resp.status, 200, `status ${status} should retry`);
      assert.equal(calls.length, 2, `status ${status} should make 2 calls`);
    }
  });

  it('does NOT retry non-retryable statuses (400/401/403/409)', async () => {
    for (const status of [400, 401, 403, 409]) {
      const resp4xx = new Response('{}', { status });
      const { deps, calls, delays } = makeDeps([{ response: resp4xx }]);
      const resp = await postCreateCheckout(deps, ARGS);
      assert.equal(resp.status, status);
      assert.equal(calls.length, 1, `status ${status} must not retry`);
      assert.equal(delays.length, 0);
    }
  });

  it('retries once on a fast network failure (TypeError)', async () => {
    const good = new Response('{}', { status: 200 });
    const { deps, calls } = makeDeps([
      { throws: new TypeError('Failed to fetch') },
      { response: good },
    ]);

    const resp = await postCreateCheckout(deps, ARGS);

    assert.equal(resp.status, 200);
    assert.equal(calls.length, 2);
  });

  it('rethrows when the retry after a network failure also fails', async () => {
    const err = new TypeError('Failed to fetch');
    const { deps, calls } = makeDeps([{ throws: err }, { throws: err }]);

    await assert.rejects(() => postCreateCheckout(deps, ARGS), err);
    assert.equal(calls.length, 2);
  });

  it('does NOT retry timeout/abort failures — rethrows immediately', async () => {
    for (const name of ['TimeoutError', 'AbortError']) {
      const err = new DOMException('timed out', name);
      const { deps, calls, delays } = makeDeps([{ throws: err }]);

      await assert.rejects(() => postCreateCheckout(deps, ARGS), (caught: unknown) => {
        assert.equal((caught as DOMException).name, name);
        return true;
      });
      assert.equal(calls.length, 1, `${name} must not retry`);
      assert.equal(delays.length, 0);
    }
  });

  it('requests a fresh timeout signal per attempt', async () => {
    let signalsIssued = 0;
    const bad = new Response('x', { status: 503 });
    const good = new Response('{}', { status: 200 });
    const { deps, calls } = makeDeps([{ response: bad }, { response: good }]);
    deps.createTimeoutSignal = () => {
      signalsIssued += 1;
      return new AbortController().signal;
    };

    await postCreateCheckout(deps, ARGS);

    assert.equal(calls.length, 2);
    assert.equal(signalsIssued, 2, 'each attempt needs its own timeout budget');
  });
});
