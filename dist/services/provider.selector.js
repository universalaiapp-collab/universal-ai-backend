"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.selectProvider = selectProvider;
function selectProvider(preferences) {
    // simple scoring: prefer Gemini if allowed, else OpenAI, else mock
    if (preferences.allowGemini)
        return 'gemini';
    if (preferences.allowOpenAI)
        return 'openai';
    return 'mock';
}
exports.default = { selectProvider };
