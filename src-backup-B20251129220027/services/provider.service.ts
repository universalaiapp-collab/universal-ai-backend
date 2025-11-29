// src/services/provider.service.ts
import axios, { AxiosRequestConfig } from 'axios';
import { initProvider, recordFailure, recordSuccess, isProviderDown } from '../utils/circuitBreaker';
import { computeProviderScores } from './loadBalancer';

type ProviderConfig = {
  name: string;
  baseUrl: string;
  apiKey?: string;
  timeoutMs?: number;
  modelRouting?: string[]; // models supported maybe
};

export type ProviderResult<T = any> = {
  provider: string;
  retryCount: number;
  routingMeta: any;
  response?: T;
  error?: any;
  latencyMs?: number;
};

const DEFAULT_TIMEOUT_MS = 10_000;

/** Make a single provider request with timeout */
async function callSingleProvider<T = any>(provider: ProviderConfig, path: string, data: any, cfg?: AxiosRequestConfig): Promise<T> {
  const url = provider.baseUrl.replace(/\/$/, '') + path;
  const axiosCfg: AxiosRequestConfig = {
    url,
    method: cfg?.method || 'POST',
    timeout: provider.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    headers: {
      'Content-Type': 'application/json',
      Authorization: provider.apiKey ? `Bearer ${provider.apiKey}` : undefined,
      ...(cfg?.headers || {}),
    },
    data,
    validateStatus: () => true, // handle non-2xx manually
  };
  const start = Date.now();
  const r = await axios.request(axiosCfg);
  const latency = Date.now() - start;
  // throw on network error only. Non-2xx returned as normal response (so caller can inspect status)
  return { raw: r, latencyMs: latency } as any;
}

/**
 * callWithFailover
 * providers: ordered list of ProviderConfig (prefer first)
 * tries up to maxRetries (total attempts). On failure tries next provider.
 */
export async function callWithFailover<T = any>(
  providers: ProviderConfig[],
  path: string,
  payload: any,
  opts?: {
    maxRetries?: number; // per provider retries (network level)
    timeoutMs?: number;
    modelHint?: string;
  }
): Promise<ProviderResult<T>> {
  // init providers in circuit breaker
  providers.forEach((p) => initProvider(p.name));

  const providerNames = providers.map((p) => p.name);
  // compute scores to prefer highest scoring provider unless the explicit order forced
  const scores = computeProviderScores(providerNames);
  // Try each provider in order of scores (but keep original order if needed)
  // We'll still accept `providers` ordering as primary preference but re-order by score to prefer healthy providers.
  // build scoreMap
  const scoreMap = new Map(scores.map((s) => [s.name, s.score]));
  const sortedProviders = providers.slice().sort((a, b) => (scoreMap.get(b.name) ?? 0) - (scoreMap.get(a.name) ?? 0));

  let retryCountTotal = 0;
  const routingMeta: any = { triedProviders: [] };

  for (const prov of sortedProviders) {
    // skip provider if circuit breaker says down
    if (isProviderDown(prov.name)) {
      routingMeta.triedProviders.push({ name: prov.name, skipped: true, reason: 'circuit_down' });
      continue;
    }

    const perProviderAttempts = Math.max(1, opts?.maxRetries ?? 1);
    for (let attempt = 1; attempt <= perProviderAttempts; attempt++) {
      retryCountTotal++;
      const attemptMeta: any = { provider: prov.name, attempt };
      try {
        const callStart = Date.now();
        const { raw, latencyMs } = await callSingleProvider(prov, path, payload, { timeout: opts?.timeoutMs ?? prov.timeoutMs });
        const status = raw.status ?? (raw?.statusCode || 500);

        // consider 2xx success
        if (status >= 200 && status < 300) {
          recordSuccess(prov.name, latencyMs);
          routingMeta.triedProviders.push({ ...attemptMeta, status, latencyMs, success: true });
          const result: ProviderResult = {
            provider: prov.name,
            retryCount: retryCountTotal - 1,
            routingMeta,
            response: raw.data,
            latencyMs,
          };
          return result;
        } else {
          // treat as failure (but maybe provider returned 429/5xx) -> record failure and try again or fallback
          recordFailure(prov.name);
          routingMeta.triedProviders.push({ ...attemptMeta, status, latencyMs, success: false, error: raw.data });
          // break inner loop on 4xx except 429? Here we'll continue to next provider on 5xx or 429
          if (status >= 400 && status < 500 && status !== 429) {
            // client error — unlikely to succeed on retry
            break;
          }
          // otherwise allow next attempt on same provider
        }
      } catch (err: any) {
        // network / timeout / unexpected
        recordFailure(prov.name);
        routingMeta.triedProviders.push({ ...attemptMeta, status: 'network_error', error: err?.message || err });
        // continue to retry or next provider
      }
    } // attempts loop

    // if exhausted attempts on this provider — move to next
  } // providers loop

  // If we reach here, all failed
  return {
    provider: sortedProviders[0]?.name ?? providers[0]?.name ?? 'none',
    retryCount: retryCountTotal,
    routingMeta,
    error: { message: 'All providers failed' },
  };
}
