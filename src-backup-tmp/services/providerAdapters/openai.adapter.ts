// src/services/providerAdapters/openai.adapter.ts
import { AdapterResponse } from './types';

// A simple stubbed adapter. Replace with real SDK later.
export async function callOpenAI(prompt: string, opts: any = {}): Promise<AdapterResponse> {
  // Simulate work and tokens
  const promptTokens = Math.ceil((prompt.length || 0) / 4);
  const completionTokens = opts.maxTokens ? Math.min(opts.maxTokens, 200) : 100;
  const text = `OpenAI stub response for: ${prompt.slice(0, 120)}`;
  // Simulate forced failure for testing
  if (opts.forceFail === 'openai') {
    throw new Error('openai_forced_failure');
  }
  return {
    provider: 'openai',
    model: opts.model || 'openai/gpt-stub',
    text,
    promptTokens,
    completionTokens
  };
}
