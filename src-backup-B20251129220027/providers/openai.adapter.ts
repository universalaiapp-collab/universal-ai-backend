/**
 * Minimal OpenAI adapter (TypeScript)
 * Replace or expand with real SDK calls later.
 */

export type OpenAIOpts = {
  maxTokens?: number;
  forceFail?: string;
  model?: string;
};

export type OpenAIResponse = {
  provider: string;
  model: string;
  text: string;
  promptTokens: number;
  completionTokens: number;
};

export async function callOpenAI(prompt: string, opts: OpenAIOpts = {}): Promise<OpenAIResponse> {
  // compute rough token counts
  const promptTokens = Math.max(0, Math.ceil((prompt?.length || 0) / 4));
  const completionTokens = opts.maxTokens ? Math.min(opts.maxTokens, 200) : 100;

  // test hook for forced failure (useful for local test)
  if (opts.forceFail === 'openai') {
    throw new Error('openai_forced_failure');
  }

  const text = `OpenAI stub response for: ${String(prompt).slice(0, 120)}`;

  return {
    provider: 'openai',
    model: opts.model || 'openai/gpt-stub',
    text,
    promptTokens,
    completionTokens,
  };
}

export default callOpenAI;
