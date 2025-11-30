// src/services/providerAdapters/gemini.adapter.ts
import { AdapterResponse } from './types';

export async function callGemini(prompt: string, opts: any = {}): Promise<AdapterResponse> {
  const promptTokens = Math.ceil((prompt.length || 0) / 4);
  const completionTokens = opts.maxTokens ? Math.min(opts.maxTokens, 200) : 100;
  const text = `Gemini stub response for: ${prompt.slice(0, 120)}`;
  if (opts.forceFail === 'gemini') {
    throw new Error('gemini_forced_failure');
  }
  return {
    provider: 'gemini',
    model: opts.model || 'gemini/stub',
    text,
    promptTokens,
    completionTokens
  };
}
