// src/providers/ollama.provider.ts
import { ProviderResponse } from '../types';

/**
 * Optional local-model / Ollama stub provider. Keep as low-cost local fallback.
 */
const ollama = {
  id: 'ollama',
  supports: ['chat'],
  call: async (input: any): Promise<ProviderResponse> => {
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

export default ollama;
