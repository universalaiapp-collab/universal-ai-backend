"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.callGemini = callGemini;
async function callGemini(prompt, opts = {}) {
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
