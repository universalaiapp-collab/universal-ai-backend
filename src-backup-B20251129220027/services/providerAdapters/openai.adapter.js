// src/services/providerAdapters/openai.adapter.js
async function callOpenAI(prompt, opts = {}) {
  const promptTokens = Math.ceil((prompt.length || 0) / 4);
  const completionTokens = opts.maxTokens ? Math.min(opts.maxTokens, 200) : 100;
  const text = `OpenAI stub: ${prompt.slice(0, 200)}`;
  if (opts.forceFail === 'openai') throw new Error('openai_forced_failure');
  return { provider: 'openai', model: opts.model || 'openai/gpt-stub', text, promptTokens, completionTokens };
}

module.exports = { callOpenAI };
