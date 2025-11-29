"use strict";
// src/utils/costEstimator.ts
// Exports named 'estimateCost' and default to avoid importer mismatch.
Object.defineProperty(exports, "__esModule", { value: true });
exports.estimateCost = estimateCost;
function estimateCost(modelKey, tokens) {
    const globalAny = global;
    const costMap = globalAny.GLOBAL?.cost?.costPer1KTokens ?? {
        "openai-primary": 0.02,
        gemini: 0.015,
        "gpt-4o-mini": 0.03,
        "dev-stub": 0.01,
    };
    const per1k = costMap[modelKey] ?? 0.01;
    const cost = (tokens / 1000) * per1k;
    return Number(cost.toFixed(6));
}
exports.default = estimateCost;
