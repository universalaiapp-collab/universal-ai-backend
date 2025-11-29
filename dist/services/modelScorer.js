"use strict";
/**
 * modelScorer.score(provider, model, prompt, opts)
 *
 * Simple heuristic + healthiness based scoring.
 * In production this would combine: latency metrics, recent failure rate, cost budget, user preference, model capabilities (tokens, creativity), and policy flags.
 *
 * Returns numeric score (higher is better). Example range: 0..100
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const circuitBreaker_1 = __importDefault(require("./circuitBreaker"));
async function score(provider, model, prompt, opts) {
    // baseline scores by provider/model
    const baseMap = {
        "openai:gpt-4o-mini": 95,
        "gemini:gemini-pro": 90,
        "anthropic:claude-2": 88
    };
    const key = `${provider}:${model}`;
    let score = baseMap[key] ?? 70;
    // 1) Reduce score if circuit breaker is open / provider has high failure rate
    if (circuitBreaker_1.default.isOpen(provider)) {
        score -= 50;
    }
    else {
        // small penalty if provider had recent failures but not open
        const failureRate = circuitBreaker_1.default.getFailureRate(provider); // 0..1
        score = Math.round(score * (1 - Math.min(0.4, failureRate))); // up to 40% penalty
    }
    // 2) Prompt hints (cheap heuristic)
    const p = prompt.toLowerCase();
    if (p.includes("image:") || p.includes("generate image")) {
        if (model.toLowerCase().includes("image"))
            score += 10;
        else
            score -= 10;
    }
    // 3) Cost-sensitive: lower-tier models could be chosen for long prompts (not implemented here)
    // Add small jitter for tie-breaking
    score += Math.random() * 2;
    // clamp
    if (score < 0)
        score = 0;
    if (score > 100)
        score = 100;
    return Math.round(score);
}
exports.default = { score };
