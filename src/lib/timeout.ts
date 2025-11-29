// src/lib/timeout.ts
export function withTimeout<T>(promise: Promise<T>, ms: number, onTimeoutError = new Error('provider_timeout')): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeout = new Promise<never>((_, rej) => {
    timer = setTimeout(() => rej(onTimeoutError), ms);
  });
  return Promise.race([
    promise.then((res) => { clearTimeout(timer); return res; }),
    timeout
  ]);
}
