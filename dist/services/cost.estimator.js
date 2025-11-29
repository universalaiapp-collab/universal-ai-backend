"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.estimateCost = estimateCost;
function estimateCost(provider, tokens) {
    const rate = provider === 'openai' ? (process.env.OPENAI_COST_PER_TOKEN || 0.00002) : (process.env.GEMINI_COST_PER_TOKEN || 0.00002);
    return Number(tokens) * Number(rate);
}
exports.default = { estimateCost };
