// src/services/providerAdapters/gemini.adapter.js
async function callGemini(prompt, opts = {}) {
  const promptTokens = Math.ceil((prompt.length || 0) / 4);
  const completionTokens = opts.maxTokens ? Math.min(opts.maxTokens, 200) : 100;
  const text = `Gemini stub: ${prompt.slice(0, 200)}`;
  if (opts.forceFail === 'gemini') throw new Error('gemini_forced_failure');
  return { provider: 'gemini', model: opts.model || 'gemini/stub', text, promptTokens, completionTokens };
}

module.exports = { callGemini };
