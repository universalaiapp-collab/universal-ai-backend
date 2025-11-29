"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withRetry = withRetry;
async function withRetry(fn, attempts = 2) {
    let lastErr;
    for (let i = 0; i <= attempts; i++) {
        try {
            return await fn();
        }
        catch (e) {
            lastErr = e;
            if (i < attempts)
                await new Promise(r => setTimeout(r, 200 * (i + 1)));
        }
    }
    throw lastErr;
}
exports.default = { withRetry };
