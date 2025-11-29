"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Optional local-model / Ollama stub provider. Keep as low-cost local fallback.
 */
const ollama = {
    id: 'ollama',
    supports: ['chat'],
    call: async (input) => {
        const start = Date.now();
        // simple local echo stub (replace with real Ollama client if present)
        const latencyMs = Date.now() - start;
        return {
            success: true,
            data: { text: `OLLAMA-MOCK: ${(input?.prompt ?? input?.text ?? '').slice(0, 200)}` },
            latencyMs,
            costTokens: 0.5
        };
    }
};
exports.default = ollama;
