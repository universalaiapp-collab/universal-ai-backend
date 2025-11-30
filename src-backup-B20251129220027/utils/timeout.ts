/**
 * withTimeout(promise, ms)
 * - wraps a promise and rejects if timeout
 * Uses AbortController pattern for axios-ready APIs though our simulated calls don't use it.
 */

export function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Operation timed out after ${ms}ms`));
    }, ms);

    p.then((v) => {
      clearTimeout(timer);
      resolve(v);
    }).catch((err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}
