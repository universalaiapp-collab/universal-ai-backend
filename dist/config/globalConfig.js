"use strict";
// src/config/globalConfig.ts
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * GLOBAL CONFIG (Day-1 Final)
 * Centralizes all orchestrator + cost + defaults.
 */
const GLOBAL = {
    /**
     * Default model generation parameters
     * Used by orchestrator.service.ts
     */
    modelDefaults: {
        temperature: 0.6,
        maxTokens: 2000,
    },
    /**
     * Orchestrator config:
     * - provider fallback order
     * - circuit breaker thresholds
     */
    orchestrator: {
        fallbackOrder: [
            "openai-primary",
            "gemini",
            "gpt-4o-mini",
            "dev-stub",
        ],
        circuitBreaker: {
            failureThreshold: 5, // fail 5 times → open circuit
            cooldownMs: 60000, // 60 seconds cool-down
        },
    },
    /**
     * Cost model (placeholder pricing for Day-1)
     * Values are “cost per 1K tokens”
     */
    cost: {
        costPer1KTokens: {
            "openai-primary": 0.03, // example $0.03
            gemini: 0.02, // example
            "gpt-4o-mini": 0.005, // example
            "dev-stub": 0, // always free
        },
    },
};
exports.default = GLOBAL;
