"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.callOpenAI = callOpenAI;
// A simple stubbed adapter. Replace with real SDK later.
async function callOpenAI(prompt, opts = {}) {
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
// @ts-nocheck
