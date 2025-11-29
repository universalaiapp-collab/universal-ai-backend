"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const providerA = {
    id: 'providerA',
    baseCostTokens: 10,
    call: async (input) => {
        const start = Date.now();
        const latency = parseInt(process.env.PROVIDER_A_LATENCY_MS || '120', 10);
        await new Promise((r) => setTimeout(r, latency));
        if (process.env.PROVIDER_A_FAIL === 'true') {
            const latencyMs = Date.now() - start;
            return { success: false, latencyMs, costTokens: 0, error: 'simulated failure' };
        }
        const latencyMs = Date.now() - start;
        return {
            success: true,
            data: { provider: 'A', echo: input, id: Math.random().toString(36).slice(2, 8) },
            latencyMs,
            costTokens: 10
        };
    }
};
exports.default = providerA;
