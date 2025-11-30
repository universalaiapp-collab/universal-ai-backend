export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  { retries = 3, initialDelayMs = 200 } = {}
): Promise<T> {
  let attempt = 0;
  let delay = initialDelayMs;

  while (true) {
    try {
      return await fn();
    } catch (err) {
      attempt++;
      const shouldRetry = attempt <= retries && isRetryableError(err);
      if (!shouldRetry) throw err;
      // eslint-disable-next-line no-console
      console.warn(`Retry attempt ${attempt} failed. Retrying in ${delay}ms. Error:`, (err as any)?.message || err);
      await sleep(delay);
      delay *= 2; // exponential backoff
    }
  }
}

function sleep(ms: number) {
  return new Promise(res => setTimeout(res, ms));
}

function isRetryableError(err: any) {
  if (!err) return false;
  const code = err?.status || err?.statusCode || err?.code || "";
  // Retry for 5xx, network errors, timeouts
  if (typeof code === "number" && code >= 500) return true;
  if (typeof code === "string" && /ECONNRESET|ETIMEDOUT|ENOTFOUND|EAI_AGAIN/i.test(code)) return true;
  // fallback: retry for non-fatal network-like errors
  if (err?.name === "FetchError") return true;
  return false;
}
