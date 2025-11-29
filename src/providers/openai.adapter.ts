/**
 * Minimal typed OpenAI adapter stub.
 * Replace with real SDK calls later.
 */
export type OpenAIOpts = {
  maxTokens?: number;
  model?: string;
  forceFail?: string;
};

export type OpenAIResponse = {
  provider: string;
  model: string;
  text: string;
  promptTokens: number;
  completionTokens: number;
};

export async function callOpenAI(prompt: string, opts: OpenAIOpts = {}): Promise<OpenAIResponse> {
  const promptTokens = Math.max(0, Math.ceil((prompt?.length || 0) / 4));
  const completionTokens = opts.maxTokens ? Math.min(opts.maxTokens, 200) : 100;

  if (opts.forceFail === "openai") {
    throw new Error("openai_forced_failure");
  }

  const text = `OpenAI (stub) reply for: ${String(prompt).slice(0, 200)}`;
  return {
    provider: "openai",
    model: opts.model || "openai/gpt-stub",
    text,
    promptTokens,
    completionTokens
  };
}

export default callOpenAI;
