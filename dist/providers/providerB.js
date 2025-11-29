"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const providerB = {
    id: 'providerB',
    baseCostTokens: 6,
    call: async (input) => {
        const start = Date.now();
        const latency = parseInt(process.env.PROVIDER_B_LATENCY_MS || '250', 10);
        await new Promise((r) => setTimeout(r, latency));
        if (process.env.PROVIDER_B_FAIL === 'true') {
            const latencyMs = Date.now() - start;
            return { success: false, latencyMs, costTokens: 0, error: 'simulated failure' };
        }
        const latencyMs = Date.now() - start;
        return {
            success: true,
            data: { provider: 'B', echo: input, id: Math.random().toString(36).slice(2, 8) },
            latencyMs,
            costTokens: 6
        };
    }
};
exports.default = providerB;
