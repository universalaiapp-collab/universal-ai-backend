/**
 * retry.ts
 * Simple retry-with-exponential-backoff + jitter for async functions.
 * Usage: await retry(() => apiCall(...), { retries: 3, minDelayMs: 200, maxDelayMs: 2000 });
 */
export interface RetryOptions {
  retries?: number;
  minDelayMs?: number;
  maxDelayMs?: number;
  jitter?: boolean;
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function retry<T>(fn: () => Promise<T>, opts: RetryOptions = {}): Promise<T> {
  const retries = opts.retries ?? 3;
  const minDelayMs = opts.minDelayMs ?? 200;
  const maxDelayMs = opts.maxDelayMs ?? 2000;
  const jitter = opts.jitter ?? true;

  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (err) {
      attempt++;
      if (attempt > retries) throw err;
      let delay = Math.min(maxDelayMs, minDelayMs * Math.pow(2, attempt - 1));
      if (jitter) {
        const jitterVal = Math.floor(Math.random() * (delay - minDelayMs + 1));
        delay = Math.max(minDelayMs, Math.min(maxDelayMs, minDelayMs + jitterVal));
      }
      try { console.warn(`retry: attempt ${attempt}/${retries} failed — waiting ${delay}ms`); } catch {}
      await sleep(delay);
    }
  }
}
