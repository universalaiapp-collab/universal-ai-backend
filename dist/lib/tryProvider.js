"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tryProvider = tryProvider;
// src/lib/tryProvider.ts
const timeout_1 = require("./timeout");
async function tryProvider(providerId, fn, payload, opts = {}) {
    const timeoutMs = opts.timeoutMs ?? 8000;
    const retries = Math.max(0, opts.retries ?? 0);
    let attempt = 0;
    while (attempt <= retries) {
        attempt++;
        const start = Date.now();
        try {
            const res = await (0, timeout_1.withTimeout)(fn(payload), timeoutMs, new Error('provider_timeout'));
            const duration = Date.now() - start;
            return {
                ok: true,
                provider: providerId,
                duration,
                costTokens: res.costTokens ?? 0,
                response: res
            };
        }
        catch (err) {
            const code = String(err?.code ?? err?.message ?? err);
            const transient = /timeout|provider_timeout|429|rate_limit|ECONNRESET|ETIMEDOUT|503/i.test(code);
            if (!transient || attempt > retries) {
                return { ok: false, provider: providerId, error: err, attempt, transient };
            }
            // Backoff before retrying (small)
            const backoffMs = Math.min(500 * attempt, 2000);
            await new Promise((r) => setTimeout(r, backoffMs));
            // loop to retry
        }
    }
    return { ok: false, provider: providerId, error: 'max_retries_exhausted' };
}
