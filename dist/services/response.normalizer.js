"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeOpenAI = normalizeOpenAI;
exports.normalizeGemini = normalizeGemini;
function normalizeOpenAI(raw) {
    return {
        outputText: raw?.choices?.[0]?.text || raw?.choices?.[0]?.message?.content || '',
        raw,
        usage: raw?.usage || {}
    };
}
function normalizeGemini(raw) {
    return {
        outputText: raw?.candidates?.[0]?.content || raw?.response?.output || '',
        raw,
        usage: raw?.usage || {}
    };
}
exports.default = { normalizeOpenAI, normalizeGemini };
