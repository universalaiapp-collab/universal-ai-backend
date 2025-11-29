export async function withRetry(fn: () => Promise<any>, attempts = 2) {
  let lastErr;
  for (let i=0;i<=attempts;i++){
    try { return await fn(); }
    catch(e){ lastErr = e; if (i < attempts) await new Promise(r=>setTimeout(r, 200 * (i+1))); }
  }
  throw lastErr;
}
export default { withRetry };
